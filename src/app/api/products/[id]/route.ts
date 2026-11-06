import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Product } from '@/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/products/[id]
 * Fetch a single product by ID for the authenticated user.
 */
export async function GET(
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
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Fetch single product by id WHERE user_id matches and is_active = true
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    // 3. Return 404 if not found or doesn't belong to user
    if (!product) {
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // 4. Return product
    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: product as Product,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<Product>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/products/[id]
 * Update partial fields of a product belonging to the authenticated user.
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

    // 3. Verify product exists and belongs to user
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!existingProduct) {
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // 4. Build updates payload for provided fields
    const updates: Partial<{
      name: string
      sku: string
      category: string | null
      price: number | null
      unit: string | null
      description: string | null
    }> = {}

    // Name validation
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json<ApiResponse<Product>>(
          { success: false, error: 'Nama produk tidak boleh kosong' },
          { status: 400 }
        )
      }
      updates.name = body.name.trim()
    }

    // SKU validation & conflict check
    if (body.sku !== undefined) {
      if (typeof body.sku !== 'string' || !body.sku.trim()) {
        return NextResponse.json<ApiResponse<Product>>(
          { success: false, error: 'SKU produk tidak boleh kosong' },
          { status: 400 }
        )
      }
      const trimmedSku = body.sku.trim()

      if (trimmedSku !== existingProduct.sku) {
        const { data: duplicateSku, error: skuError } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', user.id)
          .eq('sku', trimmedSku)
          .neq('id', id)
          .maybeSingle()

        if (skuError) {
          return NextResponse.json<ApiResponse<Product>>(
            { success: false, error: skuError.message },
            { status: 500 }
          )
        }

        if (duplicateSku) {
          return NextResponse.json<ApiResponse<Product>>(
            { success: false, error: `SKU "${trimmedSku}" sudah digunakan oleh produk lain` },
            { status: 409 }
          )
        }
      }
      updates.sku = trimmedSku
    }

    // Category
    if (body.category !== undefined) {
      updates.category = body.category ? String(body.category).trim() : null
    }

    // Price validation
    if (body.price !== undefined) {
      if (body.price === null || body.price === '') {
        updates.price = null
      } else {
        const numPrice = Number(body.price)
        if (isNaN(numPrice) || numPrice < 0) {
          return NextResponse.json<ApiResponse<Product>>(
            { success: false, error: 'Harga harus berupa angka valid non-negatif' },
            { status: 400 }
          )
        }
        updates.price = numPrice
      }
    }

    // Unit
    if (body.unit !== undefined) {
      updates.unit = body.unit ? String(body.unit).trim() : null
    }

    // Description
    if (body.description !== undefined) {
      updates.description = body.description ? String(body.description).trim() : null
    }

    // If nothing changed, return existing product
    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse<Product>>({
        success: true,
        data: existingProduct as Product,
      })
    }

    // 5. Update product in database
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json<ApiResponse<Product>>(
          { success: false, error: 'SKU sudah digunakan oleh produk lain' },
          { status: 409 }
        )
      }
      return NextResponse.json<ApiResponse<Product>>(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: updatedProduct as Product,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json<ApiResponse<Product>>(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[id]
 * Soft delete a product (is_active = false) belonging to the authenticated user.
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

    // 2. Soft delete: set is_active = false WHERE id AND user_id matches
    const { data: deletedProduct, error: deleteError } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select('id')
      .maybeSingle()

    if (deleteError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: deleteError.message },
        { status: 500 }
      )
    }

    // 3. Return 404 if not found or already deleted
    if (!deletedProduct) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // 4. Return success
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

