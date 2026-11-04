// TODO: Remove this page before production

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
import PriorityBadge from '@/components/dashboard/PriorityBadge'
import StatCard from '@/components/dashboard/StatCard'
import { typography } from '@/lib/typography'
import { Package } from 'lucide-react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className={typography.heading.h2}>{title}</h2>
      <div className="rounded-lg border p-6">{children}</div>
    </section>
  )
}

export default function DesignPreviewPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-6 py-10">
      <div>
        <h1 className={typography.heading.h1}>Design System Preview</h1>
        <p className={typography.body.muted}>Development only — remove before production.</p>
      </div>

      {/* 1. Colors */}
      <Section title="Colors">
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Primary', bg: 'bg-primary', text: 'text-primary-foreground' },
            { label: 'Critical', bg: 'bg-priority-critical', text: 'text-priority-critical-foreground' },
            { label: 'High', bg: 'bg-priority-high', text: 'text-priority-high-foreground' },
            { label: 'Medium', bg: 'bg-priority-medium', text: 'text-priority-medium-foreground' },
            { label: 'Low', bg: 'bg-priority-low', text: 'text-priority-low-foreground' },
          ].map(({ label, bg, text }) => (
            <div key={label} className={`flex h-20 w-32 items-center justify-center rounded-lg ${bg}`}>
              <span className={`text-sm font-medium ${text}`}>{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 2. Typography */}
      <Section title="Typography">
        <div className="space-y-4">
          <p className="text-5xl font-extrabold tracking-tight">Heading H1 — text-5xl</p>
          <p className="text-3xl font-bold tracking-tight">Heading H2 — text-3xl</p>
          <p className="text-xl font-semibold tracking-tight">Heading H3 — text-xl</p>
          <p className="text-base leading-7">Body Default — text-base</p>
          <p className="text-sm leading-6">Body Small — text-sm</p>
          <p className="text-sm leading-6 text-muted-foreground">Body Muted — text-sm muted</p>
          <p className="text-sm font-medium leading-none">Label Default — text-sm medium</p>
          <p className="text-xs font-medium leading-none">Label Small — text-xs medium</p>
        </div>
      </Section>

      {/* 3. Buttons */}
      <Section title="Buttons">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {(['default', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((v) => (
              <Button key={v} variant={v}>{v}</Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {(['default', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((v) => (
              <Button key={v} variant={v} size="sm">{v} sm</Button>
            ))}
          </div>
        </div>
      </Section>

      {/* 4. Cards */}
      <Section title="Cards">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title="Total Produk"
            value="248"
            description="di 3 gudang"
            icon={<Package size={18} />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Stok Menipis"
            value="14"
            description="perlu restock segera"
            icon={<Package size={18} />}
            trend={{ value: 5, isPositive: false }}
          />
        </div>
      </Section>

      {/* 5. Badges */}
      <Section title="Priority Badges">
        <div className="flex flex-wrap gap-3">
          <PriorityBadge priority="critical" />
          <PriorityBadge priority="high" />
          <PriorityBadge priority="medium" />
          <PriorityBadge priority="low" />
        </div>
      </Section>

      {/* 6. Shadcn Components */}
      <Section title="Shadcn Components">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          <div className="grid max-w-sm gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="preview-input">Label</Label>
              <Input id="preview-input" placeholder="Input placeholder..." />
            </div>
            <div className="space-y-1.5">
              <Label>Select</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih opsi..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Opsi A</SelectItem>
                  <SelectItem value="b">Opsi B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
