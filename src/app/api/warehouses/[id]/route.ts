import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Warehouse, WarehouseWithUtilization } from '@/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/warehouses/[id]
 * Fetch single warehouse by ID for the authenticated user,
 * enriched with total_stock and utilization_percent.
 */
export async function GET(
  _request: NextRequest,
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
      return NextResponse.json<ApiResponse<WarehouseWithUtilization>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Fetch single warehouse by id where user_id matches
    const { data: rawWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .or('is_active.eq.true,is_active.is.null')
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json<ApiResponse<WarehouseWithUtilization>>(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!rawWarehouse) {
      return NextResponse.json<ApiResponse<WarehouseWithUtilization>>(
        { success: false, error: 'Gudang tidak ditemukan' },
        { status: 404 }
      )
    }

    const warehouse = rawWarehouse as Warehouse

    // 3. Include total_stock and utilization_percent same as list endpoint
    const { data: stockRecords, error: stockError } = await supabase
      .from('stock')
      .select('quantity')
      .eq('warehouse_id', id)

    if (stockError) {
      return NextResponse.json<ApiResponse<WarehouseWithUtilization>>(
        { success: false, error: stockError.message },
        { status: 500 }
      )
    }

    const total_stock = (stockRecords || []).reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    )

    const capacity = Number(warehouse.max_capacity ?? warehouse.capacity ?? 0)
    const rawUtilization = capacity > 0 ? (total_stock / capacity) * 100 : 0
    const utilization_percent = Math.min(100, Math.round(rawUtilization * 100) / 100)

    const data: WarehouseWithUtilization = {
      ...warehouse,
      capacity,
      total_stock,
      utilization_percent,
    }

    return NextResponse.json<ApiResponse<WarehouseWithUtilization>>({
      success: true,
      data,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<WarehouseWithUtilization>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/warehouses/[id]
 * Update partial warehouse fields where id and user_id match.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<Warehouse>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json<ApiResponse<Warehouse>>(
        { success: false, error: 'Format JSON body tidak valid' },
        { status: 400 }
      )
    }

    // 3. Verify warehouse exists and belongs to user
    const { data: existingWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .or('is_active.eq.true,is_active.is.null')
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json<ApiResponse<Warehouse>>(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!existingWarehouse) {
      return NextResponse.json<ApiResponse<Warehouse>>(
        { success: false, error: 'Gudang tidak ditemukan' },
        { status: 404 }
      )
    }

    // 4. Validate and build updates payload
    const updates: Record<string, any> = {}

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json<ApiResponse<Warehouse>>(
          { success: false, error: 'Nama gudang tidak boleh kosong' },
          { status: 400 }
        )
      }
      updates.name = body.name.trim()
    }

    if (body.location !== undefined) {
      updates.location =
        body.location && typeof body.location === 'string'
          ? body.location.trim()
          : null
    }

    const rawCapacity = body.capacity ?? body.max_capacity
    if (rawCapacity !== undefined) {
      const numCapacity = Number(rawCapacity)
      if (
        isNaN(numCapacity) ||
        !Number.isInteger(numCapacity) ||
        numCapacity <= 0
      ) {
        return NextResponse.json<ApiResponse<Warehouse>>(
          {
            success: false,
            error: 'Kapasitas harus berupa bilangan bulat positif',
          },
          { status: 400 }
        )
      }
      updates.max_capacity = numCapacity
    }

    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse<Warehouse>>(
        { success: false, error: 'Tidak ada data perubahan yang diberikan' },
        { status: 400 }
      )
    }

    // 5. Update warehouse where id AND user_id matches
    const { data: updatedWarehouse, error: updateError } = await supabase
      .from('warehouses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json<ApiResponse<Warehouse>>(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    const result: Warehouse = {
      ...(updatedWarehouse as Warehouse),
      capacity: updatedWarehouse.max_capacity,
    }

    return NextResponse.json<ApiResponse<Warehouse>>({
      success: true,
      data: result,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<Warehouse>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/warehouses/[id]
 * Soft delete warehouse if it has no active stock (quantity > 0).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Check if warehouse exists and belongs to user
    const { data: warehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .or('is_active.eq.true,is_active.is.null')
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!warehouse) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Gudang tidak ditemukan' },
        { status: 404 }
      )
    }

    // 3. Check if warehouse has any active stock (quantity > 0)
    const { data: activeStock, error: stockCheckError } = await supabase
      .from('stock')
      .select('id, quantity')
      .eq('warehouse_id', id)
      .gt('quantity', 0)
      .limit(1)

    if (stockCheckError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: stockCheckError.message },
        { status: 500 }
      )
    }

    if (activeStock && activeStock.length > 0) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error:
            'Gudang masih memiliki stok aktif. Kosongkan stok sebelum menghapus gudang.',
        },
        { status: 400 }
      )
    }

    // 4. If no active stock: soft delete (is_active = false)
    const { error: deleteError } = await supabase
      .from('warehouses')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: deleteError.message },
        { status: 500 }
      )
    }

    // 5. Return success
    return NextResponse.json<ApiResponse<never>>({
      success: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

