'use client'

// DEVELOPMENT ONLY: This page is used to preview design system tokens and components.
// Please remove or disable this route before deploying to production.

import React from 'react'
import { Package, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/dashboard/StatCard'
import PriorityBadge from '@/components/dashboard/PriorityBadge'
import { typography } from '@/lib/typography'

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className={typography.heading.h2}>{title}</h2>
        {description && <p className={typography.body.muted}>{description}</p>}
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-xs">{children}</div>
    </section>
  )
}

export default function DesignPreviewPage() {
  const buttonVariants = ['default', 'secondary', 'outline', 'ghost', 'destructive'] as const

  return (
    <PageContainer className="space-y-12 py-10">
      <PageHeader
        title="Design System Preview"
        description="Visual testing page for warehouse AI design tokens, components, and priority states. (Dev only)"
      />

      {/* 1. Colors */}
      <Section
        title="1. Colors"
        description="Custom theme colors and priority status tokens for warehouse alerts."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            {
              name: 'Primary Blue',
              bgClass: 'bg-primary',
              textClass: 'text-primary-foreground',
              token: 'bg-primary',
            },
            {
              name: 'Critical (Red)',
              bgClass: 'bg-priority-critical',
              textClass: 'text-white',
              token: 'bg-priority-critical',
            },
            {
              name: 'High (Orange)',
              bgClass: 'bg-priority-high',
              textClass: 'text-white',
              token: 'bg-priority-high',
            },
            {
              name: 'Medium (Yellow)',
              bgClass: 'bg-priority-medium',
              textClass: 'text-neutral-950',
              token: 'bg-priority-medium',
            },
            {
              name: 'Low (Green)',
              bgClass: 'bg-priority-low',
              textClass: 'text-white',
              token: 'bg-priority-low',
            },
          ].map(({ name, bgClass, textClass, token }) => (
            <div
              key={name}
              className={`flex h-28 flex-col justify-between rounded-xl p-3 shadow-xs ${bgClass} ${textClass}`}
            >
              <span className="text-sm font-semibold">{name}</span>
              <span className="font-mono text-xs opacity-90">{token}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 2. Typography */}
      <Section
        title="2. Typography"
        description="Consistent font styles configured in src/lib/typography.ts."
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted-foreground">typography.heading.h1</span>
            <h1 className={typography.heading.h1}>Heading H1 — Warehouse Dashboard</h1>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted-foreground">typography.heading.h2</span>
            <h2 className={typography.heading.h2}>Heading H2 — Section Title</h2>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted-foreground">typography.heading.h3</span>
            <h3 className={typography.heading.h3}>Heading H3 — Card Title</h3>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted-foreground">typography.body.default</span>
            <p className={typography.body.default}>
              Body Default — Standar teks paragraf untuk informasi umum gudang dan deskripsi stok barang.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted-foreground">typography.body.sm</span>
            <p className={typography.body.sm}>
              Body Small — Teks ringkas untuk catatan tambahan, metadata tabel, dan spesifikasi produk.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted-foreground">typography.body.muted</span>
            <p className={typography.body.muted}>
              Body Muted — Terakhir disinkronkan 5 menit lalu melalui Gemini AI model.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted-foreground">typography.label.default</span>
            <p className={typography.label.default}>Label Default — Nama Lokasi Rak Gudang</p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted-foreground">typography.label.sm</span>
            <p className={typography.label.sm}>Label Small — SKU-ID #WMS-94021</p>
          </div>
        </div>
      </Section>

      {/* 3. Buttons */}
      <Section
        title="3. Buttons"
        description="Shadcn Button in all variants across default and small sizes."
      >
        <div className="space-y-4">
          <div>
            <span className="mb-2 block text-xs font-medium text-muted-foreground">Default Size</span>
            <div className="flex flex-wrap gap-3">
              {buttonVariants.map((variant) => (
                <Button key={`default-${variant}`} variant={variant}>
                  {variant}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-xs font-medium text-muted-foreground">Small Size (size="sm")</span>
            <div className="flex flex-wrap gap-3">
              {buttonVariants.map((variant) => (
                <Button key={`sm-${variant}`} variant={variant} size="sm">
                  {variant} sm
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 4. Cards */}
      <Section
        title="4. Cards"
        description="StatCard component demonstrating metrics and trend percentages."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Produk"
            value="248"
            description="di 3 gudang"
            icon={<Package className="h-5 w-5" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Stok Menipis"
            value="14"
            description="perlu restock segera"
            icon={<Package className="h-5 w-5" />}
            trend={{ value: 5, isPositive: false }}
          />
          <StatCard
            title="Kapasitas Gudang"
            value="82%"
            description="3.280 dari 4.000 slot pallet"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>
      </Section>

      {/* 5. Badges */}
      <Section
        title="5. Badges"
        description="PriorityBadge in all 4 priority levels with custom color styling."
      >
        <div className="flex flex-wrap items-center gap-3">
          <PriorityBadge priority="critical" />
          <PriorityBadge priority="high" />
          <PriorityBadge priority="medium" />
          <PriorityBadge priority="low" />
        </div>
      </Section>

      {/* 6. Shadcn Components */}
      <Section
        title="6. Shadcn Components"
        description="Visual demonstration of core Shadcn UI controls (Badge, Input, Label, Select)."
      >
        <div className="space-y-6">
          <div>
            <span className="mb-2 block text-xs font-medium text-muted-foreground">Badge Variants</span>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>

          <div className="grid max-w-md gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="preview-product-name">Product Name (Label & Input)</Label>
              <Input
                id="preview-product-name"
                placeholder="Contoh: Barcode Scanner Honeywell..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preview-warehouse-select">Warehouse Location (Select)</Label>
              <Select defaultValue="jkt-01">
                <SelectTrigger id="preview-warehouse-select">
                  <SelectValue placeholder="Pilih gudang..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jkt-01">Gudang Utama Jakarta</SelectItem>
                  <SelectItem value="sby-02">Hub Logistik Surabaya</SelectItem>
                  <SelectItem value="bdg-03">Depo Transit Bandung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Section>
    </PageContainer>
  )
}
