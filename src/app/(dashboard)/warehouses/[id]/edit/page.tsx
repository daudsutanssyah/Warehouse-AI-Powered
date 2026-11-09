import React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { connection } from 'next/server'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import type { Warehouse } from '@/types'
import { Button } from '@/components/ui/button'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import WarehouseForm from '@/components/warehouses/WarehouseForm'

export const instant = false

interface EditWarehousePageProps {
  params: Promise<{ id: string }>
}

export default async function EditWarehousePage({
  params,
}: EditWarehousePageProps) {
  // Opt out of prerendering and render at request time
  await connection()

  const { id } = await params
  const supabase = await createClient()

  // 1. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch single warehouse by id where user_id matches
  const { data: rawWarehouse, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .or('is_active.eq.true,is_active.is.null')
    .single()

  // 3. Return 404 if not found or error
  if (error || !rawWarehouse) {
    notFound()
  }

  const warehouse: Warehouse = {
    ...(rawWarehouse as Warehouse),
    capacity: rawWarehouse.max_capacity,
  }

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Edit Gudang"
        description={warehouse.name}
        action={
          <Button variant="ghost" asChild>
            <Link href="/warehouses">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </Link>
          </Button>
        }
      />

      {/* Warehouse Form in constrained width container */}
      <div className="max-w-lg mx-auto">
        <WarehouseForm warehouse={warehouse} />
      </div>
    </PageContainer>
  )
}

