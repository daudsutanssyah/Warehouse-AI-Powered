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
export async function GET() {
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

    // 5. Send test prompt to Gemini using AI_MODELS.FAST
    const prompt = `${sanitizedContext}\n\nBerikan satu kalimat ringkasan kondisi warehouse ini.`
    const response = await gemini.models.generateContent({
      model: AI_MODELS.FAST,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a warehouse AI assistant. Answer in Bahasa Indonesia. Be concise.',
      },
    })

    const summaryText = response.text?.trim() || ''

    // 6. Return diagnostic report
    return NextResponse.json({
      status: 'ok',
      model: AI_MODELS.FAST,
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

