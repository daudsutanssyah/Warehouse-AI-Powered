import React from 'react'
import Link from 'next/link'
import {
  Package,
  Warehouse,
  AlertTriangle,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/dashboard/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

      {/* AI Insights Placeholder Card */}
      <Card className="border-2 border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 shadow-xs dark:bg-blue-950/60 dark:text-blue-400">
            <Sparkles className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>

          <h3 className="text-lg font-semibold text-foreground sm:text-xl">
            AI Insight Dashboard
          </h3>

          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            AI insight akan muncul di sini setelah kamu menambahkan data produk dan gudang.
          </p>

          <div className="mt-6">
            <Button asChild className="gap-2">
              <Link href="/products">
                <Package className="h-4 w-4" />
                Tambah Produk Pertama
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
