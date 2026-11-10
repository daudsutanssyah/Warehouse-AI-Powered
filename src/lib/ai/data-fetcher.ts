import { createClient } from '@/lib/supabase/server'
import type { Product, Warehouse } from '@/types'

export interface OtherWarehouseStock {
  warehouse_name: string
  quantity: number
}

export interface StockItemSummary {
  product_id?: string
  product_name: string
  sku: string
  warehouse_name: string
  quantity: number
  unit: string
  other_warehouses?: OtherWarehouseStock[]
}

export interface WarehouseUtilizationSummary {
  warehouse_id?: string
  warehouse_name: string
  location?: string | null
  capacity: number
  total_stock: number
  utilization_percent: number
  status?: 'AMAN' | 'PADAT' | 'KRITIS'
}

export interface StockSummary {
  total_products: number
  total_warehouses: number
  total_units: number
  low_stock_items: StockItemSummary[]
  out_of_stock_items: StockItemSummary[]
  warehouse_utilization: WarehouseUtilizationSummary[]
}

export interface StockTrend {
  product_id?: string
  product_name: string
  sku?: string
  warehouse_name: string
  total_in: number
  total_out: number
  current_quantity: number
  avg_daily_out: number
  days_until_empty: number | null
  other_warehouses?: OtherWarehouseStock[]
}

export interface CapacityAlert {
  warehouse_name: string
  location: string | null
  capacity: number
  total_stock: number
  utilization_percent: number
}

interface RawJoinedStock {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  product:
    | {
        id: string
        name: string
        sku: string
        unit: string | null
        user_id: string
      }
    | {
        id: string
        name: string
        sku: string
        unit: string | null
        user_id: string
      }[]
  warehouse:
    | {
        id: string
        name: string
        location: string | null
        max_capacity: number | null
        user_id: string
      }
    | {
        id: string
        name: string
        location: string | null
        max_capacity: number | null
        user_id: string
      }[]
}

interface RawHistoryRow {
  id: string
  product_id: string
  warehouse_id: string
  quantity_change: number
  quantity_after: number
  transaction_type: string
  created_at: string
  product:
    | {
        id: string
        name: string
        sku: string
        user_id: string
      }
    | {
        id: string
        name: string
        sku: string
        user_id: string
      }[]
  warehouse:
    | {
        name: string
        user_id: string
      }
    | {
        name: string
        user_id: string
      }[]
}

/**
 * Fetches and aggregates high-level warehouse and stock summary metrics for a user.
 * Includes cross-warehouse availability to enable intelligent stock balancing recommendations.
 *
 * @param userId - Supabase auth user ID
 * @returns StockSummary object containing aggregated statistics
 */
export async function getStockSummary(userId: string): Promise<StockSummary> {
  if (!userId) {
    return {
      total_products: 0,
      total_warehouses: 0,
      total_units: 0,
      low_stock_items: [],
      out_of_stock_items: [],
      warehouse_utilization: [],
    }
  }

  const supabase = await createClient()

  // 1. Fetch total count of active products
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .or('is_active.eq.true,is_active.is.null')

  // 2. Fetch active warehouses
  const { data: rawWarehouses } = await supabase
    .from('warehouses')
    .select('id, name, location, max_capacity')
    .eq('user_id', userId)
    .or('is_active.eq.true,is_active.is.null')
    .order('name', { ascending: true })

  const warehouses = rawWarehouses || []

  // 3. Fetch all active stock entries with product and warehouse inner joins
  const { data: rawStocks } = await supabase
    .from('stock')
    .select(
      `
      id,
      product_id,
      warehouse_id,
      quantity,
      product:products!inner (
        id,
        name,
        sku,
        unit,
        user_id
      ),
      warehouse:warehouses!inner (
        id,
        name,
        location,
        max_capacity,
        user_id
      )
    `
    )
    .eq('product.user_id', userId)
    .eq('warehouse.user_id', userId)
    .or('is_active.eq.true,is_active.is.null', { referencedTable: 'products' })
    .or('is_active.eq.true,is_active.is.null', { referencedTable: 'warehouses' })

  const stocks = (rawStocks as unknown as RawJoinedStock[]) || []

  // Build stock by product map for cross-warehouse lookup
  const stocksByProduct: Record<
    string,
    Array<{ warehouse_id: string; warehouse_name: string; quantity: number }>
  > = {}

  let totalUnits = 0
  const stockByWarehouse: Record<string, number> = {}

  for (const item of stocks) {
    const rawWh = Array.isArray(item.warehouse) ? item.warehouse[0] : item.warehouse
    const qty = Number(item.quantity) || 0

    totalUnits += qty
    stockByWarehouse[item.warehouse_id] =
      (stockByWarehouse[item.warehouse_id] || 0) + qty

    if (!stocksByProduct[item.product_id]) {
      stocksByProduct[item.product_id] = []
    }
    stocksByProduct[item.product_id].push({
      warehouse_id: item.warehouse_id,
      warehouse_name: rawWh?.name || 'Gudang',
      quantity: qty,
    })
  }

  const normalizedItems: StockItemSummary[] = []

  for (const item of stocks) {
    const rawProd = Array.isArray(item.product) ? item.product[0] : item.product
    const rawWh = Array.isArray(item.warehouse) ? item.warehouse[0] : item.warehouse
    const qty = Number(item.quantity) || 0

    const otherWh = (stocksByProduct[item.product_id] || [])
      .filter((w) => w.warehouse_id !== item.warehouse_id)
      .map((w) => ({
        warehouse_name: w.warehouse_name,
        quantity: w.quantity,
      }))

    normalizedItems.push({
      product_id: item.product_id,
      product_name: rawProd?.name || 'Produk Tanpa Nama',
      sku: rawProd?.sku || '-',
      warehouse_name: rawWh?.name || 'Gudang',
      quantity: qty,
      unit: rawProd?.unit || 'unit',
      other_warehouses: otherWh,
    })
  }

  // Low stock items: quantity <= 20, ordered by quantity ascending, limit 20
  const lowStockItems = normalizedItems
    .filter((item) => item.quantity <= 20)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 20)

  // Out of stock items: quantity = 0, limit 10
  const outOfStockItems = normalizedItems
    .filter((item) => item.quantity === 0)
    .slice(0, 10)

  // Warehouse utilization summary for all warehouses
  const warehouseUtilization: WarehouseUtilizationSummary[] = warehouses.map((wh) => {
    const totalStock = stockByWarehouse[wh.id] || 0
    const capacity = Number(wh.max_capacity) || 0
    const rawPercent = capacity > 0 ? (totalStock / capacity) * 100 : 0
    const utilizationPercent = Math.min(100, Math.round(rawPercent * 10) / 10)
    const status: 'AMAN' | 'PADAT' | 'KRITIS' =
      utilizationPercent >= 85
        ? 'KRITIS'
        : utilizationPercent >= 70
        ? 'PADAT'
        : 'AMAN'

    return {
      warehouse_id: wh.id,
      warehouse_name: wh.name,
      location: wh.location || null,
      capacity,
      total_stock: totalStock,
      utilization_percent: utilizationPercent,
      status,
    }
  })

  return {
    total_products: productCount || 0,
    total_warehouses: warehouses.length,
    total_units: totalUnits,
    low_stock_items: lowStockItems,
    out_of_stock_items: outOfStockItems,
    warehouse_utilization: warehouseUtilization,
  }
}

/**
 * Fetches transaction history for the past N days to calculate stock movement trends,
 * daily run rates, and projected stock exhaustion timelines (days until empty).
 * Enriched with cross-warehouse stock balance for transfer opportunity detection.
 *
 * @param userId - Supabase auth user ID
 * @param days - Number of past days to analyze (default: 30)
 * @returns Array of StockTrend sorted by days_until_empty ascending (nulls last)
 */
export async function getStockTrends(
  userId: string,
  days: number = 30
): Promise<StockTrend[]> {
  if (!userId) {
    return []
  }

  const safeDays = Math.max(1, days)
  const cutoffDate = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString()
  const supabase = await createClient()

  // Fetch stock_history for past N days joined with products and warehouses
  const { data: rawHistory } = await supabase
    .from('stock_history')
    .select(
      `
      id,
      product_id,
      warehouse_id,
      quantity_change,
      quantity_after,
      transaction_type,
      created_at,
      product:products!inner (
        id,
        name,
        sku,
        user_id
      ),
      warehouse:warehouses!inner (
        name,
        user_id
      )
    `
    )
    .eq('product.user_id', userId)
    .eq('warehouse.user_id', userId)
    .gte('created_at', cutoffDate)
    .order('created_at', { ascending: false })

  const history = (rawHistory as unknown as RawHistoryRow[]) || []

  // Fetch current stock across all warehouses for cross-warehouse visibility
  const { data: rawCurrentStocks } = await supabase
    .from('stock')
    .select(
      `
      product_id,
      warehouse_id,
      quantity,
      warehouse:warehouses!inner (
        name,
        user_id
      )
    `
    )
    .eq('warehouse.user_id', userId)

  const currentStockMap: Record<
    string,
    Array<{ warehouse_id: string; warehouse_name: string; quantity: number }>
  > = {}

  for (const s of rawCurrentStocks || []) {
    const rawWh = Array.isArray(s.warehouse) ? s.warehouse[0] : s.warehouse
    if (!currentStockMap[s.product_id]) {
      currentStockMap[s.product_id] = []
    }
    currentStockMap[s.product_id].push({
      warehouse_id: s.warehouse_id,
      warehouse_name: rawWh?.name || 'Gudang',
      quantity: Number(s.quantity) || 0,
    })
  }

  // Group by product_id + warehouse_id
  interface GroupAcc {
    product_id: string
    product_name: string
    sku: string
    warehouse_id: string
    warehouse_name: string
    total_in: number
    total_out: number
    current_quantity: number
    hasCurrentQuantity: boolean
  }

  const groups: Record<string, GroupAcc> = {}

  for (const entry of history) {
    const key = `${entry.product_id}_${entry.warehouse_id}`
    const rawProd = Array.isArray(entry.product) ? entry.product[0] : entry.product
    const rawWh = Array.isArray(entry.warehouse) ? entry.warehouse[0] : entry.warehouse

    if (!groups[key]) {
      groups[key] = {
        product_id: entry.product_id,
        product_name: rawProd?.name || 'Produk',
        sku: rawProd?.sku || '-',
        warehouse_id: entry.warehouse_id,
        warehouse_name: rawWh?.name || 'Gudang',
        total_in: 0,
        total_out: 0,
        current_quantity: Number(entry.quantity_after) || 0,
        hasCurrentQuantity: true,
      }
    }

    const change = Number(entry.quantity_change) || 0
    const type = (entry.transaction_type || '').toLowerCase()

    if (type === 'in') {
      groups[key].total_in += Math.abs(change)
    } else if (type === 'out') {
      groups[key].total_out += Math.abs(change)
    }
  }

  // Calculate metrics and filter items where total_in > 0 OR total_out > 0
  const trends: StockTrend[] = []

  for (const group of Object.values(groups)) {
    if (group.total_in === 0 && group.total_out === 0) {
      continue
    }

    const avgDailyOut = Math.round((group.total_out / safeDays) * 100) / 100
    const daysUntilEmpty =
      avgDailyOut > 0
        ? Math.round((group.current_quantity / avgDailyOut) * 10) / 10
        : null

    const otherWh = (currentStockMap[group.product_id] || [])
      .filter((w) => w.warehouse_id !== group.warehouse_id)
      .map((w) => ({
        warehouse_name: w.warehouse_name,
        quantity: w.quantity,
      }))

    trends.push({
      product_id: group.product_id,
      product_name: group.product_name,
      sku: group.sku,
      warehouse_name: group.warehouse_name,
      total_in: group.total_in,
      total_out: group.total_out,
      current_quantity: group.current_quantity,
      avg_daily_out: avgDailyOut,
      days_until_empty: daysUntilEmpty,
      other_warehouses: otherWh,
    })
  }

  // Order by days_until_empty asc nulls last, limit 30
  trends.sort((a, b) => {
    if (a.days_until_empty === null && b.days_until_empty === null) return 0
    if (a.days_until_empty === null) return 1
    if (b.days_until_empty === null) return -1
    return a.days_until_empty - b.days_until_empty
  })

  return trends.slice(0, 30)
}

/**
 * Identifies warehouses operating near or beyond capacity (> 75% utilization).
 * Useful for alerting and proactive inventory rebalancing.
 *
 * @param userId - Supabase auth user ID
 * @returns Array of CapacityAlert sorted by utilization_percent descending
 */
export async function getWarehouseCapacityAlert(
  userId: string
): Promise<CapacityAlert[]> {
  if (!userId) {
    return []
  }

  const supabase = await createClient()

  // 1. Fetch active warehouses
  const { data: rawWarehouses } = await supabase
    .from('warehouses')
    .select('id, name, location, max_capacity')
    .eq('user_id', userId)
    .or('is_active.eq.true,is_active.is.null')

  const warehouses = rawWarehouses || []
  if (warehouses.length === 0) {
    return []
  }

  const warehouseIds = warehouses.map((w) => w.id)

  // 2. Fetch stock quantities for these warehouses
  const { data: stockRecords } = await supabase
    .from('stock')
    .select('warehouse_id, quantity')
    .in('warehouse_id', warehouseIds)

  const stockMap: Record<string, number> = {}
  for (const record of stockRecords || []) {
    const q = Number(record.quantity) || 0
    stockMap[record.warehouse_id] = (stockMap[record.warehouse_id] || 0) + q
  }

  // 3. Filter warehouses where utilization > 75%
  const alerts: CapacityAlert[] = []

  for (const wh of warehouses) {
    const capacity = Number(wh.max_capacity) || 0
    const totalStock = stockMap[wh.id] || 0
    const rawUtilization = capacity > 0 ? (totalStock / capacity) * 100 : 0
    const utilizationPercent = Math.round(rawUtilization * 10) / 10

    if (utilizationPercent > 75) {
      alerts.push({
        warehouse_name: wh.name,
        location: wh.location || null,
        capacity,
        total_stock: totalStock,
        utilization_percent: utilizationPercent,
      })
    }
  }

  // Order by utilization_percent descending
  alerts.sort((a, b) => b.utilization_percent - a.utilization_percent)

  return alerts
}
