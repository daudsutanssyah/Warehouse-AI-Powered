import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Plus } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import type { Warehouse, WarehouseWithUtilization } from '@/types'
import { formatNumber } from '@/lib/utils'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import WarehouseGrid from '@/components/warehouses/WarehouseGrid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const instant = false

export default async function WarehousesPage() {
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

  // 2. Query warehouses where user_id = user.id AND is_active = true
  const { data: rawWarehouses } = await supabase
    .from('warehouses')
    .select('*')
    .eq('user_id', user.id)
    .or('is_active.eq.true,is_active.is.null')
    .order('created_at', { ascending: true })

  const rawList = (rawWarehouses || []) as Warehouse[]

  // 3. For each warehouse, calculate total_stock by summing stock.quantity
  let warehouses: WarehouseWithUtilization[] = []

  if (rawList.length > 0) {
    const warehouseIds = rawList.map((w) => w.id)
    const { data: stockRecords } = await supabase
      .from('stock')
      .select('warehouse_id, quantity')
      .in('warehouse_id', warehouseIds)

    const stockMap: Record<string, number> = {}
    for (const record of stockRecords || []) {
      const q = Number(record.quantity) || 0
      stockMap[record.warehouse_id] = (stockMap[record.warehouse_id] || 0) + q
    }

    warehouses = rawList.map((w) => {
      const total_stock = stockMap[w.id] || 0
      const capacity = Number(w.max_capacity ?? w.capacity ?? 0)
      const rawUtilization = capacity > 0 ? (total_stock / capacity) * 100 : 0
      const utilization_percent = Math.min(100, Math.round(rawUtilization * 100) / 100)

      return {
        ...w,
        capacity,
        total_stock,
        utilization_percent,
      }
    })
  }

  // 4. Calculate summary statistics
  const totalCount = warehouses.length
  const totalCapacity = warehouses.reduce(
    (sum, w) => sum + Number(w.capacity ?? w.max_capacity ?? 0),
    0
  )
  const avgUtilization =
    totalCount > 0
      ? Math.round(
          (warehouses.reduce((sum, w) => sum + w.utilization_percent, 0) /
            totalCount) *
            10
        ) / 10
      : 0

  return (
    <PageContainer className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Gudang"
        description="Kelola gudang dan pantau kapasitas penyimpanan."
        action={
          <Button asChild>
            <Link href="/warehouses/new">
              <Plus className="w-4 h-4 mr-2" /> Tambah Gudang
            </Link>
          </Button>
        }
      />

      {/* Summary Chips Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Total Gudang */}
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 font-normal text-xs bg-muted/40 border-border text-foreground"
        >
          <span className="text-muted-foreground">Total Gudang:</span>
          <strong className="font-semibold text-foreground">{totalCount}</strong>
        </Badge>

        {/* Total Kapasitas */}
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 font-normal text-xs bg-muted/40 border-border text-foreground"
        >
          <span className="text-muted-foreground">Total Kapasitas:</span>
          <strong className="font-semibold text-foreground">
            {formatNumber(totalCapacity)}
          </strong>
          <span className="text-muted-foreground">unit</span>
        </Badge>

        {/* Rata-rata Utilisasi */}
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 font-normal text-xs bg-muted/40 border-border text-foreground"
        >
          <span className="text-muted-foreground">Rata-rata Utilisasi:</span>
          <strong className="font-semibold text-foreground">
            {avgUtilization}%
          </strong>
        </Badge>
      </div>

      {/* Warehouses Grid or Empty State */}
      <WarehouseGrid initialWarehouses={warehouses} />
    </PageContainer>
  )
}
