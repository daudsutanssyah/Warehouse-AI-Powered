import React from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { StockWithDetails, Warehouse, Product } from '@/types'
import { formatNumber } from '@/lib/utils'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import { StockTable } from '@/components/stock/StockTable'
import { Badge } from '@/components/ui/badge'

export const instant = false

interface RawStockRow {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  updated_at: string
  product: Product | Product[]
  warehouse: Warehouse | Warehouse[]
}

/**
 * Server component for Stock Management page (/stock).
 * Fetches initial stocks with product/warehouse details and warehouses list for filtering.
 */
export default async function StockPage() {
  // Opt out of prerendering and render at request time
  await connection()

  const supabase = await createClient()

  // 1. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch warehouses list for filter dropdown
  const { data: rawWarehouses } = await supabase
    .from('warehouses')
    .select('*')
    .eq('user_id', user.id)
    .or('is_active.eq.true,is_active.is.null')
    .order('name', { ascending: true })

  const warehouses: Warehouse[] = ((rawWarehouses || []) as Warehouse[]).map((w) => ({
    ...w,
    capacity: w.capacity ?? w.max_capacity ?? 0,
    max_capacity: w.max_capacity ?? w.capacity ?? 0,
  }))

  // 3. Fetch initial stock with details (products + warehouses inner join)
  const { data: rawStocks } = await supabase
    .from('stock')
    .select(
      `
      id,
      product_id,
      warehouse_id,
      quantity,
      updated_at,
      product:products!inner (
        id,
        user_id,
        name,
        sku,
        category,
        price,
        unit,
        description,
        is_active,
        created_at,
        updated_at
      ),
      warehouse:warehouses!inner (
        id,
        user_id,
        name,
        location,
        max_capacity,
        is_active,
        created_at,
        updated_at
      )
    `
    )
    .eq('product.user_id', user.id)
    .eq('warehouse.user_id', user.id)
    .or('is_active.eq.true,is_active.is.null', { referencedTable: 'products' })
    .or('is_active.eq.true,is_active.is.null', { referencedTable: 'warehouses' })

  const stocks: StockWithDetails[] = ((rawStocks as unknown as RawStockRow[]) || []).map(
    (row) => {
      const rawProduct = Array.isArray(row.product) ? row.product[0] : row.product
      const rawWarehouse = Array.isArray(row.warehouse) ? row.warehouse[0] : row.warehouse

      const product: Product = {
        ...rawProduct,
        unit: rawProduct?.unit ?? 'pcs',
      }

      const warehouse: Warehouse = {
        ...rawWarehouse,
        capacity: rawWarehouse?.capacity ?? rawWarehouse?.max_capacity ?? 0,
        max_capacity: rawWarehouse?.max_capacity ?? rawWarehouse?.capacity ?? 0,
      }

      return {
        id: row.id,
        product_id: row.product_id,
        warehouse_id: row.warehouse_id,
        quantity: Number(row.quantity) || 0,
        updated_at: row.updated_at,
        product,
        warehouse,
      }
    }
  )

  // Sort by product name ascending
  stocks.sort((a, b) => {
    const nameA = a.product?.name || ''
    const nameB = b.product?.name || ''
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' })
  })

  // 4. Compute summary statistics
  const uniqueProductIds = new Set(stocks.map((s) => s.product_id))
  const totalSku = uniqueProductIds.size
  const totalUnits = stocks.reduce((sum, s) => sum + s.quantity, 0)
  const criticalCount = stocks.filter((s) => s.quantity <= 10).length
  const outOfStockCount = stocks.filter((s) => s.quantity === 0).length

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Manajemen Stok"
        description="Pantau dan update stok produk di setiap gudang."
      />

      {/* Summary Row (4 stat chips) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Total SKU */}
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 font-normal text-xs bg-muted/40 border-border text-foreground"
        >
          <span className="text-muted-foreground">Total SKU:</span>
          <strong className="font-semibold text-foreground">{totalSku}</strong>
          <span className="text-muted-foreground">SKU</span>
        </Badge>

        {/* Total Unit */}
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 font-normal text-xs bg-muted/40 border-border text-foreground"
        >
          <span className="text-muted-foreground">Total Unit:</span>
          <strong className="font-semibold text-foreground">
            {formatNumber(totalUnits)}
          </strong>
          <span className="text-muted-foreground">unit</span>
        </Badge>

        {/* Stok Kritis */}
        <Badge
          variant="outline"
          className={`gap-1.5 px-3 py-1 font-normal text-xs transition-colors ${
            criticalCount > 0
              ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-400'
              : 'bg-muted/40 border-border text-foreground'
          }`}
        >
          <span
            className={
              criticalCount > 0
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-muted-foreground'
            }
          >
            Stok Kritis:
          </span>
          <strong className="font-semibold">{criticalCount}</strong>
          <span
            className={
              criticalCount > 0
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-muted-foreground'
            }
          >
            item
          </span>
        </Badge>

        {/* Stok Habis */}
        <Badge
          variant="outline"
          className={`gap-1.5 px-3 py-1 font-normal text-xs transition-colors ${
            outOfStockCount > 0
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400'
              : 'bg-muted/40 border-border text-foreground'
          }`}
        >
          <span
            className={
              outOfStockCount > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
            }
          >
            Stok Habis:
          </span>
          <strong className="font-semibold">{outOfStockCount}</strong>
          <span
            className={
              outOfStockCount > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
            }
          >
            item
          </span>
        </Badge>
      </div>

      {/* Stock Management Table */}
      <StockTable initialStocks={stocks} warehouses={warehouses} />
    </PageContainer>
  )
}
