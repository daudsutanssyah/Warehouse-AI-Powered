import React from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import {
  Package,
  Warehouse,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStockSummary } from '@/lib/ai/data-fetcher'
import { formatNumber } from '@/lib/utils'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/dashboard/StatCard'
import { RestockInsightCard } from '@/components/dashboard/RestockInsightCard'

export const instant = false

export default async function DashboardPage() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch real-time warehouse & inventory summary for authenticated user
  const summary = await getStockSummary(user.id)

  return (
    <PageContainer className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Selamat datang kembali. Ini ringkasan warehouse kamu hari ini."
      />

      {/* 4 Stat Cards in Responsive Grid (2 cols mobile, 4 cols desktop) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Produk */}
        <StatCard
          title="Total Produk"
          value={formatNumber(summary.total_products)}
          description="produk terdaftar"
          icon={<Package className="h-5 w-5" />}
        />

        {/* Total Gudang */}
        <StatCard
          title="Total Gudang"
          value={formatNumber(summary.total_warehouses)}
          description="gudang aktif"
          icon={<Warehouse className="h-5 w-5" />}
        />

        {/* Item Stok Rendah */}
        <StatCard
          title="Item Stok Rendah"
          value={formatNumber(summary.total_low_stock ?? summary.low_stock_items.length)}
          description="perlu perhatian"
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
        />

        {/* Total Stok */}
        <StatCard
          title="Total Stok"
          value={formatNumber(summary.total_units)}
          description="unit di semua gudang"
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      {/* AI Restock Insights */}
      <RestockInsightCard />
    </PageContainer>
  )
}
