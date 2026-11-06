import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types'
import { Button } from '@/components/ui/button'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import ProductForm from '@/components/products/ProductForm'

export const instant = false

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  // Opt out of prerendering and render at request time
  await connection()

  const { id } = await params
  const supabase = await createClient()

  // 1. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // 2. Fetch single product by id for this user
  const { data: rawProduct, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .or('is_active.eq.true,is_active.is.null')
    .single()

  // 3. Return 404 if not found or error
  if (error || !rawProduct) {
    notFound()
  }

  const product = rawProduct as Product

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Edit Produk"
        description={'Memperbarui informasi untuk ' + product.name}
        action={
          <Button variant="ghost" asChild>
            <Link href="/products">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </Link>
          </Button>
        }
      />

      {/* Product Form in constrained width container */}
      <div className="max-w-3xl mx-auto">
        <ProductForm product={product} />
      </div>
    </PageContainer>
  )
}
