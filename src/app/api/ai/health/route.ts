import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gemini, AI_MODELS, isAIConfigured } from '@/lib/ai'
import { getStockSummary } from '@/lib/ai/data-fetcher'
import { buildStockContext } from '@/lib/ai/context-builder'
import { sanitizeForAI, validateContextSize } from '@/lib/ai/sanitize'

/**
 * Diagnostic health check endpoint for AI integration.
 * Tests Gemini connectivity, context building, and prompt execution.
 * 
 * GET /api/ai/health
 */
export async function GET(_request: Request) {
  try {
    // 1. Check if GEMINI_API_KEY is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        { status: 'error', message: 'API key tidak dikonfigurasi' },
        { status: 500 }
      )
    }

    // 2. Get authenticated user (return 401 if not authenticated)
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. Fetch stock summary for this user
    const summary = await getStockSummary(user.id)

    // 4. Build and sanitize context
    const rawContext = buildStockContext(summary)
    const sanitizedContext = sanitizeForAI(rawContext)
    const { estimatedTokens } = validateContextSize(sanitizedContext)

    // Log context sementara untuk diagnostik
    console.log('=== AI HEALTH CHECK CONTEXT ===\n', sanitizedContext)
    console.log(sanitizedContext)

    // 5. Send test prompt to Gemini with automatic fallback on quota exhaustion
    const prompt = `${sanitizedContext}\n\nBerikan ringkasan eksekutif kondisi warehouse ini (maksimal 2-3 kalimat). WAJIB sebutkan secara spesifik nama setiap produk yang habis dan kritis beserta sisa unit dan lokasinya. DILARANG menggunakan generalisasi seperti "beberapa produk lain". Sertakan rekomendasi transfer jika stok tersedia di gudang lain.`
    let modelUsed: string = AI_MODELS.FAST
    let response

    try {
      response = await gemini.models.generateContent({
        model: modelUsed,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert warehouse AI assistant. Answer in Bahasa Indonesia. Be direct, concise, and explicitly name all affected products instead of grouping them vaguely.',
        },
      })
    } catch {
      modelUsed = AI_MODELS.FALLBACK
      response = await gemini.models.generateContent({
        model: modelUsed,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert warehouse AI assistant. Answer in Bahasa Indonesia. Be direct, concise, and explicitly name all affected products instead of grouping them vaguely.',
        },
      })
    }

    const summaryText = response.text?.trim() || ''

    // 6. Return diagnostic report
    return NextResponse.json({
      status: 'ok',
      model: modelUsed,
      context_tokens: estimatedTokens,
      summary: summaryText,
      data_preview: {
        total_products: summary.total_products,
        total_warehouses: summary.total_warehouses,
        total_units: summary.total_units,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    )
  }
}

