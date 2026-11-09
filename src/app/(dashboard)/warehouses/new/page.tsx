import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import WarehouseForm from '@/components/warehouses/WarehouseForm'

export default function NewWarehousePage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Tambah Gudang"
        description="Isi detail gudang baru untuk melacak kapasitas penyimpanan."
        action={
          <Button variant="ghost" asChild>
            <Link href="/warehouses">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </Link>
          </Button>
        }
      />

      <div className="max-w-lg mx-auto">
        <WarehouseForm />
      </div>
    </PageContainer>
  )
}

