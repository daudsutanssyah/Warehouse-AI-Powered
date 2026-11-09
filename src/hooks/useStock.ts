'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ApiResponse, StockWithDetails } from '@/types'

export interface UpdateStockPayload {
  quantity_change: number
  type: 'in' | 'out' | 'adjustment'
  notes?: string
}

export interface UseStockReturn {
  stocks: StockWithDetails[]
  isLoading: boolean
  error: string | null
  warehouseFilter: string
  setWarehouseFilter: (warehouseId: string) => void
  updateStock: (
    stockId: string,
    payload: UpdateStockPayload
  ) => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>
}

/**
 * Custom hook for stock management.
 * Provides fetching, warehouse filtering, and updating stock quantity.
 */
export function useStock(initialStocks?: StockWithDetails[]): UseStockReturn {
  const [stocks, setStocks] = useState<StockWithDetails[]>(initialStocks || [])
  const [isLoading, setIsLoading] = useState<boolean>(!initialStocks)
  const [error, setError] = useState<string | null>(null)
  const [warehouseFilter, setWarehouseFilter] = useState<string>('')

  // Track initial mount so server-provided initialStocks isn't immediately refetched unless filter changes
  const isFirstMount = useRef(true)

  /**
   * Fetch stocks with current warehouse filter
   */
  const fetchStock = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (warehouseFilter.trim()) {
        params.append('warehouse_id', warehouseFilter.trim())
      }

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/stock${queryString}`)
      const json: ApiResponse<StockWithDetails[]> = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Gagal memuat data stok (${res.status})`)
      }

      setStocks(json.data || [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data stok'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [warehouseFilter])

  // Automatically fetch on mount or when warehouseFilter changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      if (initialStocks && initialStocks.length > 0 && !warehouseFilter) {
        return
      }
    }
    fetchStock()
  }, [fetchStock, initialStocks, warehouseFilter])

  /**
   * Update stock quantity via PATCH /api/stock/[stockId]
   * Automatically refreshes stocks list on success.
   */
  const updateStock = useCallback(
    async (
      stockId: string,
      payload: UpdateStockPayload
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/stock/${stockId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const json: ApiResponse<unknown> = await res.json()

        if (!res.ok || !json.success) {
          const errorMsg = json.error || 'Gagal memperbarui stok'
          return { success: false, error: errorMsg }
        }

        // Refresh stock list on success
        await fetchStock()
        return { success: true }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan jaringan saat memperbarui stok'
        return { success: false, error: message }
      }
    },
    [fetchStock]
  )

  return {
    stocks,
    isLoading,
    error,
    warehouseFilter,
    setWarehouseFilter,
    updateStock,
    refetch: fetchStock,
  }
}

export default useStock

