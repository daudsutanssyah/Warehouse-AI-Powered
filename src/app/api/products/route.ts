import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Product } from '@/types'

/**
 * GET /api/products
 * Fetch products list with optional search, category, and limit filters.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user (return 401 if not authenticated)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<Product[]>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || null
    const category = searchParams.get('category')?.trim() || null
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 50) : 50

    // 3. Build query:
    // - Always filter by user_id = authenticated user
    // - Always filter is_active = true
    // - Order by created_at descending
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Optional filter: search (name ILIKE '%search%' OR sku ILIKE '%search%')
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    // Optional filter: category = category
    if (category) {
      query = query.eq('category', category)
    }

    // 4. Execute query
    const { data, count, error } = await query

    if (error) {
      return NextResponse.json<ApiResponse<Product[]>>(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // 5. Return formatted response
    return NextResponse.json<ApiResponse<Product[]>>({
      success: true,
      data: (data as Product[]) || [],
      count: count ?? data?.length ?? 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<Product[]>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products
 * Create a new product for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Get authenticated user (return 401 if not authenticated)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request JSON body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: 'Format JSON body tidak valid' },
        { status: 400 }
      )
    }

    const { name, sku, category, price, unit, description } = body ?? {}

    // 3. Validate required fields: name and sku required (return 400 if validation fails)
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: 'Nama produk wajib diisi' },
        { status: 400 }
      )
    }

    if (!sku || typeof sku !== 'string' || !sku.trim()) {
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: 'SKU produk wajib diisi' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()
    const trimmedSku = sku.trim()

    // Validate price if provided
    let parsedPrice: number | null = null
    if (price !== undefined && price !== null && price !== '') {
      const num = Number(price)
      if (isNaN(num) || num < 0) {
        return NextResponse.json<ApiResponse<Product>>(
          { success: false, error: 'Harga harus berupa angka valid non-negatif' },
          { status: 400 }
        )
      }
      parsedPrice = num
    }

    // 4. Check if SKU already exists for this user (Return 409 if SKU exists)
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', user.id)
      .eq('sku', trimmedSku)
      .maybeSingle()

    if (checkError) {
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: checkError.message },
        { status: 500 }
      )
    }

    if (existingProduct) {
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: `SKU "${trimmedSku}" sudah terdaftar untuk akun ini` },
        { status: 409 }
      )
    }

    // 5. Insert into products with user_id
    const newProductData = {
      user_id: user.id,
      name: trimmedName,
      sku: trimmedSku,
      category: category ? String(category).trim() : null,
      price: parsedPrice,
      unit: unit ? String(unit).trim() : null,
      description: description ? String(description).trim() : null,
      is_active: true,
    }

    const { data: insertedProduct, error: insertError } = await supabase
      .from('products')
      .insert(newProductData)
      .select()
      .single()

    if (insertError) {
      // Catch Postgres unique violation if race condition occurs
      if (insertError.code === '23505') {
        return NextResponse.json<ApiResponse<Product>>(
          { success: false, error: `SKU "${trimmedSku}" sudah terdaftar` },
          { status: 409 }
        )
      }

      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    // 6. Return response
    return NextResponse.json<ApiResponse<Product>>(
      {
        success: true,
        data: insertedProduct as Product,
      },
      { status: 201 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<Product>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
