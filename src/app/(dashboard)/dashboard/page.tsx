import React from 'react'
import {
  Package,
  Warehouse,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/dashboard/StatCard'
import { RestockInsightCard } from '@/components/dashboard/RestockInsightCard'

export default function DashboardPage() {
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
          value="0"
          description="produk terdaftar"
          icon={<Package className="h-5 w-5" />}
        />

        {/* Total Gudang */}
        <StatCard
          title="Total Gudang"
          value="0"
          description="gudang aktif"
          icon={<Warehouse className="h-5 w-5" />}
        />

        {/* Item Stok Rendah */}
        <StatCard
          title="Item Stok Rendah"
          value="0"
          description="perlu perhatian"
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
        />

        {/* Total Stok */}
        <StatCard
          title="Total Stok"
          value="0"
          description="unit di semua gudang"
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      {/* AI Restock Insights */}
      <RestockInsightCard />
    </PageContainer>
  )
}
