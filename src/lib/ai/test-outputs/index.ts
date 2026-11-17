import type { RestockInsight, InsightResponse } from '@/types'
import goodResponse from './good-restock-response.json'
import badResponse from './bad-restock-response.json'
import emptyResponse from './empty-healthy-response.json'
import crossWarehouseResponse from './cross-warehouse-response.json'

export type MockVariant = 'good' | 'bad' | 'empty' | 'cross-warehouse'

export const MOCK_RESPONSES: Record<MockVariant, InsightResponse<RestockInsight>> = {
  good: goodResponse as unknown as InsightResponse<RestockInsight>,
  bad: badResponse as unknown as InsightResponse<RestockInsight>,
  empty: emptyResponse as unknown as InsightResponse<RestockInsight>,
  'cross-warehouse': crossWarehouseResponse as unknown as InsightResponse<RestockInsight>,
}

/**
 * Returns a mock AI Restock Insight response without calling Gemini API.
 * Useful for frontend local development, UI component testing, and regression evaluation.
 *
 * @param variant - 'good' | 'bad' | 'empty' | 'cross-warehouse' (default: 'good')
 * @returns Fully typed InsightResponse<RestockInsight>
 */
export function getMockRestockInsight(
  variant: MockVariant = 'good'
): InsightResponse<RestockInsight> {
  const template = MOCK_RESPONSES[variant] || MOCK_RESPONSES.good
  const recommendations = (template.data?.recommendations || []).map((item) => {
    let priority = item.priority
    const qty =
      typeof item.current_quantity === 'number'
        ? item.current_quantity
        : Number(item.current_quantity) || 0
    if (qty <= 5 && variant !== 'bad') {
      priority = 'critical'
    }
    return { ...item, priority }
  })

  return {
    ...template,
    data: {
      ...template.data,
      recommendations,
      generated_at: new Date().toISOString(),
    },
  }
}

export const DEMO_USER_EMAILS = ['akundemo@gmail.com', 'demo@warehouse.ai']

/**
 * Checks whether the given user email belongs to the portfolio demo / recruiter account.
 */
export function isDemoUser(email?: string | null): boolean {
  if (!email) return false
  const lower = email.toLowerCase()
  return DEMO_USER_EMAILS.includes(lower) || lower.includes('demo')
}

export {
  goodResponse,
  badResponse,
  emptyResponse,
  crossWarehouseResponse,
}

