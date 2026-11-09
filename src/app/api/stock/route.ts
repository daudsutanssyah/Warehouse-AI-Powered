import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, StockWithDetails, Product, Warehouse } from '@/types'

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
 * GET /api/stock
 * Fetch stock items with joined product and warehouse details.
 * Optional query params: warehouse_id, product_id
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user (401 if not)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<StockWithDetails[]>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouse_id')?.trim() || null
    const productId = searchParams.get('product_id')?.trim() || null

    // 3. Build stock query with inner joins to products and warehouses
    // - Filter by authenticated user ownership
    // - Filter active products and active warehouses
    let query = supabase
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

    // Optional filter: warehouse_id
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId)
    }

    // Optional filter: product_id
    if (productId) {
      query = query.eq('product_id', productId)
    }

    // Order by products.name ascending
    query = query.order('name', { referencedTable: 'products', ascending: true })

    const { data, error } = await query

    if (error) {
      return NextResponse.json<ApiResponse<StockWithDetails[]>>(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // 4. Format and map returned rows to StockWithDetails[]
    const formattedData: StockWithDetails[] = ((data as unknown as RawStockRow[]) || []).map(
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

    // Sort by product name ascending in memory as guarantee
    formattedData.sort((a, b) => {
      const nameA = a.product?.name || ''
      const nameB = b.product?.name || ''
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' })
    })

    return NextResponse.json<ApiResponse<StockWithDetails[]>>({
      success: true,
      data: formattedData,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<StockWithDetails[]>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
