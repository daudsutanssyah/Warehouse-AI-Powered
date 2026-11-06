import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a numeric value to Indonesian Rupiah (e.g. 12500 -> "Rp 12.500").
 * Returns '-' if the amount is null or undefined.
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '-'
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a number with Indonesian thousand separators (e.g. 12840 -> "12.840").
 * Returns '0' if the number is null or undefined.
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) {
    return '0'
  }
  return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * Truncate a text string and append '...' if it exceeds the maximum length.
 * Example: truncateText("Indomie Goreng Special", 15) -> "Indomie Goreng..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text || ''
  }
  return text.slice(0, maxLength).trimEnd() + '...'
}
