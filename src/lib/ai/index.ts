import { GoogleGenAI } from '@google/genai'

/**
 * Server-only Gemini client configuration and singletons.
 */

export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export const AI_MODELS = {
  FAST: 'gemini-2.5-flash', // for simple, quick tasks
  SMART: 'gemini-2.5-flash', // stable and fast across all tiers
  FALLBACK: 'gemini-3.1-flash-lite-preview', // separate free-tier quota pool
} as const

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS]

export const TOKEN_LIMITS = {
  MAX_CONTEXT: 4000, // max tokens we send as context
  MAX_RESPONSE: 2500, // max tokens for response (ensures full JSON recommendations)
} as const

export function isAIConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY
}
