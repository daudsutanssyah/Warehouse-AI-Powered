import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import ProductForm from '@/components/products/ProductForm'

export default function NewProductPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Tambah Produk Baru"
        description="Isi detail produk yang ingin kamu tambahkan ke warehouse."
        action={
          <Button variant="ghost" asChild>
            <Link href="/products">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </Link>
          </Button>
        }
      />

      <div className="max-w-3xl mx-auto">
        <ProductForm />
      </div>
    </PageContainer>
  )
}
