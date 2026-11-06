'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook to debounce any value by specified delay (default 300ms).
 *
 * @param value The value to debounce (e.g. search query string)
 * @param delay Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce

