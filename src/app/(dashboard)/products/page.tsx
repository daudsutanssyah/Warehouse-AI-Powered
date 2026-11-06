import React from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import ProductsTable from '@/components/products/ProductsTable'
import { Badge } from '@/components/ui/badge'

export const instant = false

export default async function ProductsPage() {
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

  // 2. Fetch initial products directly from Supabase
  const { data: rawProducts } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .or('is_active.eq.true,is_active.is.null')
    .order('created_at', { ascending: false })
    .limit(50)

  const products: Product[] = (rawProducts as Product[]) || []

  // 3. Compute summary statistics
  const totalCount = products.length
  const activeCount = products.filter((p) => p.is_active !== false).length
  const uniqueCategories = new Set(
    products
      .map((p) => p.category)
      .filter((cat): cat is string => Boolean(cat && cat.trim()))
  )
  const categoryCount = uniqueCategories.size

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Produk"
        description="Kelola semua produk yang ada di warehouse kamu."
      />

      {/* Summary Chips Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Total produk */}
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 font-normal text-xs bg-muted/40 border-border text-foreground"
        >
          <span className="text-muted-foreground">Total:</span>
          <strong className="font-semibold text-foreground">{totalCount}</strong>
          <span className="text-muted-foreground">produk</span>
        </Badge>

        {/* Aktif produk */}
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 font-normal text-xs border-green-200 bg-green-50/70 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span className="text-green-600 dark:text-green-400">Aktif:</span>
          <strong className="font-semibold text-green-700 dark:text-green-300">{activeCount}</strong>
          <span className="text-green-600 dark:text-green-400">produk</span>
        </Badge>

        {/* Kategori unik */}
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 font-normal text-xs bg-muted/40 border-border text-foreground"
        >
          <span className="text-muted-foreground">Kategori:</span>
          <strong className="font-semibold text-foreground">{categoryCount}</strong>
          <span className="text-muted-foreground">kategori</span>
        </Badge>
      </div>

      {/* Products Table with Initial Products */}
      <ProductsTable initialProducts={products} />
    </PageContainer>
  )
}
