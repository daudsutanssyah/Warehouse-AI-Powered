import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Stock } from '@/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

export type StockTransactionType = 'in' | 'out' | 'adjustment'

export interface UpdateStockPayload {
  quantity_change: number
  type: StockTransactionType
  notes?: string
}

export interface StockHistoryEntry {
  id?: string
  stock_id: string
  product_id: string
  warehouse_id: string
  user_id: string
  quantity_before: number
  quantity_after: number
  quantity_change: number
  type: StockTransactionType
  transaction_type?: string
  notes: string | null
  created_at: string
}

export interface UpdateStockResponseData {
  stock: Stock
  history_entry: StockHistoryEntry
}

/**
 * PATCH /api/stock/[id]
 * Updates stock quantity and records a transaction entry in stock_history.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Get authenticated user (401 if not authenticated)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<UpdateStockResponseData>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    let body: UpdateStockPayload
    try {
      body = await request.json()
    } catch {
      return NextResponse.json<ApiResponse<UpdateStockResponseData>>(
        { success: false, error: 'Format JSON body tidak valid' },
        { status: 400 }
      )
    }

    const { quantity_change, type, notes } = body

    if (
      typeof quantity_change !== 'number' ||
      isNaN(quantity_change) ||
      !Number.isFinite(quantity_change)
    ) {
      return NextResponse.json<ApiResponse<UpdateStockResponseData>>(
        {
          success: false,
          error: 'Jumlah perubahan stok (quantity_change) harus berupa angka valid',
        },
        { status: 400 }
      )
    }

    if (!type || !['in', 'out', 'adjustment'].includes(type)) {
      return NextResponse.json<ApiResponse<UpdateStockResponseData>>(
        {
          success: false,
          error: "Tipe transaksi harus 'in', 'out', atau 'adjustment'",
        },
        { status: 400 }
      )
    }

    // Normalize quantity_change according to type
    // positive for in, negative for out, signed for adjustment
    let actualChange = quantity_change
    if (type === 'out' && actualChange > 0) {
      actualChange = -actualChange
    } else if (type === 'in' && actualChange < 0) {
      actualChange = Math.abs(actualChange)
    }

    // 3. Fetch current stock record and verify user ownership via product / warehouse
    const { data: stockRecord, error: stockFetchError } = await supabase
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
          name
        ),
        warehouse:warehouses!inner (
          id,
          user_id,
          name
        )
      `
      )
      .eq('id', id)
      .eq('product.user_id', user.id)
      .maybeSingle()

    if (stockFetchError) {
      return NextResponse.json<ApiResponse<UpdateStockResponseData>>(
        { success: false, error: stockFetchError.message },
        { status: 500 }
      )
    }

    if (!stockRecord) {
      return NextResponse.json<ApiResponse<UpdateStockResponseData>>(
        { success: false, error: 'Data stok tidak ditemukan' },
        { status: 404 }
      )
    }

    // 4. Calculate new quantity: current + quantity_change
    const currentQuantity = Number(stockRecord.quantity) || 0
    const newQuantity = currentQuantity + actualChange

    // 5. If new quantity < 0: return 400 error
    if (newQuantity < 0) {
      return NextResponse.json<ApiResponse<UpdateStockResponseData>>(
        {
          success: false,
          error: `Stok tidak cukup. Stok saat ini: ${currentQuantity} unit.`,
        },
        { status: 400 }
      )
    }

    // 6. Update stock.quantity = new_quantity
    const { data: updatedStock, error: updateError } = await supabase
      .from('stock')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stockRecord.id)
      .select('id, product_id, warehouse_id, quantity, updated_at')
      .single()

    if (updateError || !updatedStock) {
      return NextResponse.json<ApiResponse<UpdateStockResponseData>>(
        {
          success: false,
          error: updateError?.message || 'Gagal memperbarui stok',
        },
        { status: 500 }
      )
    }

    // 7. Insert into stock_history table
    const { data: insertedHistory, error: historyError } = await supabase
      .from('stock_history')
      .insert({
        product_id: stockRecord.product_id,
        warehouse_id: stockRecord.warehouse_id,
        quantity_change: actualChange,
        quantity_after: newQuantity,
        transaction_type: type,
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (historyError) {
      return NextResponse.json<ApiResponse<UpdateStockResponseData>>(
        {
          success: false,
          error: historyError.message,
        },
        { status: 500 }
      )
    }

    // 8. Return success response with stock and history_entry
    const historyEntry: StockHistoryEntry = {
      id: insertedHistory?.id,
      stock_id: stockRecord.id,
      product_id: stockRecord.product_id,
      warehouse_id: stockRecord.warehouse_id,
      user_id: user.id,
      quantity_before: currentQuantity,
      quantity_after: newQuantity,
      quantity_change: actualChange,
      type,
      transaction_type: type,
      notes: notes?.trim() || null,
      created_at: insertedHistory?.created_at || new Date().toISOString(),
    }

    return NextResponse.json<ApiResponse<UpdateStockResponseData>>({
      success: true,
      data: {
        stock: updatedStock as Stock,
        history_entry: historyEntry,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<UpdateStockResponseData>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

