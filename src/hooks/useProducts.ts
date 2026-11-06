'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ApiResponse, Product } from '@/types'
import { useDebounce } from './useDebounce'

export interface UseProductsReturn {
  products: Product[]
  isLoading: boolean
  error: string | null
  search: string
  debouncedSearch: string
  category: string
  setSearch: (value: string) => void
  setCategory: (value: string) => void
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>
}

/**
 * Custom hook for managing product data, search & category filtering,
 * and single product operations (delete & refetch).
 *
 * Implements 300ms debounce for search input so API requests are only sent
 * after the user stops typing, preventing excessive requests.
 */
export function useProducts(initialProducts?: Product[]): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>(initialProducts || [])
  const [isLoading, setIsLoading] = useState<boolean>(!initialProducts)
  const [error, setError] = useState<string | null>(null)

  // Raw user inputs
  const [search, setSearch] = useState<string>('')
  const [category, setCategory] = useState<string>('')

  // Debounced search with 300ms delay
  const debouncedSearch = useDebounce<string>(search, 300)

  // Track initial mount so server-provided initialProducts isn't immediately refetched
  const isFirstMount = useRef(true)

  /**
   * Fetch products with the current filter state
   */
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim())
      }
      if (category.trim()) {
        params.append('category', category.trim())
      }

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/products${queryString}`)
      const json: ApiResponse<Product[]> = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Gagal mengambil produk (${res.status})`)
      }

      setProducts(json.data || [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data produk'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, category])

  // Automatically fetch when debouncedSearch or category changes, or on mount if no initialProducts
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      if (initialProducts) {
        return
      }
    }
    fetchProducts()
  }, [fetchProducts, initialProducts])

  /**
   * Soft delete product by ID and refresh product list
   */
  const deleteProduct = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        })
        const json: ApiResponse<never> = await res.json()

        if (!res.ok || !json.success) {
          const errorMsg = json.error || 'Gagal menghapus produk'
          return { success: false, error: errorMsg }
        }

        // Refresh products list after successful deletion
        await fetchProducts()
        return { success: true }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Terjadi kesalahan jaringan saat menghapus produk'
        return { success: false, error: errorMsg }
      }
    },
    [fetchProducts]
  )

  return {
    products,
    isLoading,
    error,
    search,
    debouncedSearch,
    category,
    setSearch,
    setCategory,
    deleteProduct,
    refetch: fetchProducts,
  }
}

export default useProducts
