import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Warehouse, WarehouseWithUtilization } from '@/types'

/**
 * GET /api/warehouses
 * Fetch all active warehouses for the authenticated user,
 * enriched with current stock sum and utilization percentage.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user (401 if not authenticated)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<WarehouseWithUtilization[]>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Query warehouses where user_id = user.id AND is_active = true, ordered by created_at ascending
    const { data: rawWarehouses, error: whError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('user_id', user.id)
      .or('is_active.eq.true,is_active.is.null')
      .order('created_at', { ascending: true })

    if (whError) {
      return NextResponse.json<ApiResponse<WarehouseWithUtilization[]>>(
        { success: false, error: whError.message },
        { status: 500 }
      )
    }

    const warehouses = (rawWarehouses || []) as Warehouse[]

    if (warehouses.length === 0) {
      return NextResponse.json<ApiResponse<WarehouseWithUtilization[]>>({
        success: true,
        data: [],
      })
    }

    // 3. Calculate current stock utilization: sum stock.quantity where warehouse_id = warehouse.id
    const warehouseIds = warehouses.map((w) => w.id)
    const { data: stockRecords, error: stockError } = await supabase
      .from('stock')
      .select('warehouse_id, quantity')
      .in('warehouse_id', warehouseIds)

    if (stockError) {
      return NextResponse.json<ApiResponse<WarehouseWithUtilization[]>>(
        { success: false, error: stockError.message },
        { status: 500 }
      )
    }

    // Aggregate total stock quantity per warehouse
    const stockMap: Record<string, number> = {}
    for (const record of stockRecords || []) {
      const q = Number(record.quantity) || 0
      stockMap[record.warehouse_id] = (stockMap[record.warehouse_id] || 0) + q
    }

    // Map each warehouse to WarehouseWithUtilization
    const data: WarehouseWithUtilization[] = warehouses.map((warehouse) => {
      const total_stock = stockMap[warehouse.id] || 0
      const capacity = Number(warehouse.max_capacity ?? warehouse.capacity ?? 0)

      // Calculate utilization_percent = (total_stock / capacity) * 100, capped at 100
      const rawUtilization = capacity > 0 ? (total_stock / capacity) * 100 : 0
      const utilization_percent = Math.min(100, Math.round(rawUtilization * 100) / 100)

      return {
        ...warehouse,
        capacity,
        total_stock,
        utilization_percent,
      }
    })

    return NextResponse.json<ApiResponse<WarehouseWithUtilization[]>>({
      success: true,
      data,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<WarehouseWithUtilization[]>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/warehouses
 * Create a new warehouse for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user (401 if not authenticated)
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

    // 2. Parse request body: { name, location, capacity, description }
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json<ApiResponse<Warehouse>>(
        { success: false, error: 'Format JSON tidak valid' },
        { status: 400 }
      )
    }

    const { name, location, capacity, max_capacity } = body ?? {}

    // 3. Validate name: required and non-empty string
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json<ApiResponse<Warehouse>>(
        { success: false, error: 'Nama gudang wajib diisi' },
        { status: 400 }
      )
    }

    // 4. Validate capacity: must be a positive integer
    const rawCapacity = capacity ?? max_capacity
    const numCapacity = Number(rawCapacity)

    if (
      rawCapacity === undefined ||
      rawCapacity === null ||
      rawCapacity === '' ||
      isNaN(numCapacity) ||
      !Number.isInteger(numCapacity) ||
      numCapacity <= 0
    ) {
      return NextResponse.json<ApiResponse<Warehouse>>(
        {
          success: false,
          error: 'Kapasitas gudang harus berupa bilangan bulat positif',
        },
        { status: 400 }
      )
    }

    // 5. Insert into warehouses table with user_id
    const insertPayload = {
      user_id: user.id,
      name: name.trim(),
      location: location && typeof location === 'string' ? location.trim() : null,
      max_capacity: numCapacity,
      is_active: true,
    }

    const { data: insertedWarehouse, error: insertError } = await supabase
      .from('warehouses')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json<ApiResponse<Warehouse>>(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    const result: Warehouse = {
      ...(insertedWarehouse as Warehouse),
      capacity: numCapacity,
    }

    return NextResponse.json<ApiResponse<Warehouse>>(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<Warehouse>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
