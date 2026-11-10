/**
 * Data Sanitization & Token Management for AI Context.
 * Ensures sensitive user information is masked and context stays within LLM token limits.
 */

export interface ContextValidationResult {
  isValid: boolean
  estimatedTokens: number
  message?: string
}

// Regex patterns for sensitive data detection
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const UUID_REGEX = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g
const PHONE_REGEX = /(?:(?:\+|00)\d{1,3}[-.\s]?)?(?:\(?0\d{1,4}\)?|\d{2,4})[-.\s]?\d{3,4}[-.\s]?\d{3,5}\b/g
const TOKEN_REGEX = /\b[a-zA-Z0-9_-]{21,}\b/g

/**
 * Sanitizes input text by removing or masking sensitive information
 * (emails, phone numbers, UUIDs, and API tokens) before sending to AI APIs.
 *
 * @param text - Raw context or prompt text
 * @returns Cleaned text with sensitive values replaced by placeholders
 */
export function sanitizeForAI(text: string): string {
  if (!text) return ''

  return (
    text
      // 1. Remove emails
      .replace(EMAIL_REGEX, '[email]')
      // 2. Remove UUIDs
      .replace(UUID_REGEX, '[id]')
      // 3. Remove phone numbers
      .replace(PHONE_REGEX, '[phone]')
      // 4. Remove API keys / tokens (alphanumeric > 20 chars without spaces)
      .replace(TOKEN_REGEX, '[token]')
  )
}

/**
 * Truncates text so it fits within the specified token budget.
 * Uses a standard rough estimate where 1 token ≈ 4 characters.
 *
 * @param text - The text to truncate
 * @param maxTokens - Maximum allowed tokens (default: 3000)
 * @returns Truncated text within the token budget
 */
export function truncateContext(text: string, maxTokens: number = 3000): string {
  if (!text) return ''

  const maxChars = maxTokens * 4
  const suffix = '...[data dipotong]'

  if (text.length > maxChars) {
    const cutLength = Math.max(0, maxChars - suffix.length)
    return text.slice(0, cutLength) + suffix
  }

  return text
}

/**
 * Validates whether the context size is within the allowed safe threshold.
 * Warns and marks invalid if token estimation exceeds 4000 tokens.
 *
 * @param text - Context text to validate
 * @returns Object with validity status, estimated token count, and optional message
 */
export function validateContextSize(text: string): ContextValidationResult {
  if (!text) {
    return { isValid: true, estimatedTokens: 0 }
  }

  // Rough estimation: 1 token ≈ 4 characters
  const estimatedTokens = Math.ceil(text.length / 4)

  if (estimatedTokens > 4000) {
    return {
      isValid: false,
      estimatedTokens,
      message: 'Konteks terlalu besar, data akan dipotong',
    }
  }

  return {
    isValid: true,
    estimatedTokens,
  }
}

