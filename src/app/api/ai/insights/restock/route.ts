import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gemini, AI_MODELS, TOKEN_LIMITS, isAIConfigured } from '@/lib/ai'
import { getStockSummary, getStockTrends } from '@/lib/ai/data-fetcher'
import { buildStockContext, buildTrendContext } from '@/lib/ai/context-builder'
import {
  sanitizeForAI,
  validateContextSize,
  truncateContext,
} from '@/lib/ai/sanitize'
import {
  buildRestockPrompt,
} from '@/lib/ai/prompts'
import type { RestockInsight, InsightResponse } from '@/types'

/**
 * GET /api/ai/insights/restock
 * Generates AI-powered restock recommendations based on real-time stock levels,
 * cross-warehouse availability, and 30-day consumption trends.
 */
export async function GET(_request: Request) {
  try {
    // 1. Get authenticated user (return 401 if unauthenticated)
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check if AI service is configured (return 503 if not)
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI tidak dikonfigurasi', configured: false },
        { status: 503 }
      )
    }

    // 3. Fetch stock summary and 30-day trends
    const summary = await getStockSummary(user.id)
    const trends = await getStockTrends(user.id, 30)

    // 4. Build context
    const stockCtx = buildStockContext(summary)
    const trendCtx = buildTrendContext(trends)
    const fullContext = `${stockCtx}\n\n${trendCtx}`

    // 5. Sanitize and validate context size
    const cleanContext = sanitizeForAI(fullContext)
    const { isValid, estimatedTokens } = validateContextSize(cleanContext)
    const finalContext = isValid ? cleanContext : truncateContext(cleanContext)

    // 6. Build prompt
    const prompt = buildRestockPrompt(finalContext)

    // 7. Call AI API
    // Attempt PRIMARY model (gemini-2.5-flash), with automatic fallback to FALLBACK model (gemini-3.1-flash-lite-preview)
    // if daily quota (429) or service issues occur.
    let response
    let modelUsed: string = AI_MODELS.FAST

    try {
      response = await gemini.models.generateContent({
        model: modelUsed,
        contents: prompt,
        config: {
          maxOutputTokens: TOKEN_LIMITS.MAX_RESPONSE,
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      })
    } catch (primaryErr) {
      console.warn(
        `Primary Gemini model (${modelUsed}) failed, falling back to ${AI_MODELS.FALLBACK}:`,
        primaryErr instanceof Error ? primaryErr.message : primaryErr
      )
      modelUsed = AI_MODELS.FALLBACK

      try {
        response = await gemini.models.generateContent({
          model: modelUsed,
          contents: prompt,
          config: {
            maxOutputTokens: TOKEN_LIMITS.MAX_RESPONSE,
            responseMimeType: 'application/json',
          },
        })
      } catch (fallbackErr) {
        console.error('Gemini generateContent fallback failed:', fallbackErr)
        const isQuota =
          fallbackErr instanceof Error &&
          (fallbackErr.message.includes('429') ||
            fallbackErr.message.includes('quota') ||
            fallbackErr.message.includes('RESOURCE_EXHAUSTED'))

        if (isQuota) {
          return NextResponse.json(
            {
              error:
                'Kuota harian Gemini API (Free Tier: 20 request/hari) telah habis. Harap perbarui GEMINI_API_KEY di .env.local atau tunggu reset kuota harian.',
            },
            { status: 429 }
          )
        }

        return NextResponse.json(
          { error: 'AI service tidak tersedia saat ini' },
          { status: 500 }
        )
      }
    }

    // 8. Parse response
    const rawText = response?.text?.trim() || ''
    // Strip accidental markdown fences if returned
    const cleanedJsonText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let parsedResult: RestockInsight
    try {
      parsedResult = JSON.parse(cleanedJsonText)
    } catch (parseError) {
      console.error(
        'Failed to parse AI response JSON:',
        parseError,
        'Raw text:',
        rawText
      )
      return NextResponse.json(
        { error: 'AI menghasilkan format yang tidak valid' },
        { status: 500 }
      )
    }

    // Validate that result contains recommendations array
    if (!parsedResult || !Array.isArray(parsedResult.recommendations)) {
      console.error('Invalid AI response structure:', parsedResult)
      return NextResponse.json(
        { error: 'AI menghasilkan format yang tidak valid' },
        { status: 500 }
      )
    }

    // 9. Return success response with metadata
    return NextResponse.json<InsightResponse<RestockInsight>>({
      success: true,
      data: parsedResult,
      meta: {
        model: modelUsed,
        context_tokens: estimatedTokens,
        input_tokens: response.usageMetadata?.promptTokenCount ?? estimatedTokens,
        output_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
    })
  } catch (error) {
    console.error('Unhandled error in /api/ai/insights/restock:', error)
    const message =
      error instanceof Error ? error.message : 'AI service tidak tersedia'
    return NextResponse.json(
      { error: message || 'AI service tidak tersedia' },
      { status: 500 }
    )
  }
}

