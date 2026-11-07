'use client'

import React from 'react'
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Package,
  Pencil,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import type { WarehouseWithUtilization, UtilizationStatus } from '@/types'
import { getUtilizationStatus } from '@/types'
import { formatNumber } from '@/lib/utils'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export interface WarehouseCardProps {
  warehouse: WarehouseWithUtilization
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
}

const statusConfig: Record<
  UtilizationStatus,
  {
    label: string
    textColor: string
    progressColor: string
    badgeClass: string
  }
> = {
  safe: {
    label: 'Aman',
    textColor: 'text-green-600 dark:text-green-400',
    progressColor: 'bg-green-600 dark:bg-green-500',
    badgeClass:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300',
  },
  warning: {
    label: 'Perhatian',
    textColor: 'text-amber-600 dark:text-amber-400',
    progressColor: 'bg-amber-500 dark:bg-amber-400',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  danger: {
    label: 'Hampir Penuh',
    textColor: 'text-orange-600 dark:text-orange-400',
    progressColor: 'bg-orange-500 dark:bg-orange-400',
    badgeClass:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
  },
  critical: {
    label: 'Kritis',
    textColor: 'text-red-600 dark:text-red-400',
    progressColor: 'bg-red-600 dark:bg-red-500',
    badgeClass:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
  },
}

export function WarehouseCard({ warehouse, onEdit, onDelete }: WarehouseCardProps) {
  const status = getUtilizationStatus(warehouse.utilization_percent)
  const config = statusConfig[status]
  const capacity = Number(warehouse.capacity ?? warehouse.max_capacity ?? 0)

  const handleDelete = () => {
    const isConfirmed = window.confirm(
      `Hapus gudang ${warehouse.name}? Gudang hanya bisa dihapus jika tidak ada stok aktif.`
    )
    if (isConfirmed) {
      onDelete(warehouse.id, warehouse.name)
    }
  }

  return (
    <Card className="rounded-2xl border bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header Section */}
      <CardHeader className="p-5 pb-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          {/* Top Row: Warehouse icon (blue) + warehouse name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <WarehouseIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
              {warehouse.name}
            </h3>
          </div>

          {/* Dropdown Menu (Three dots) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu pilihan</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={() => onEdit(warehouse.id)}
                className="cursor-pointer gap-2"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span>Hapus</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Location badge below name (rendered only if location exists) */}
        {warehouse.location && (
          <div className="flex items-center">
            <Badge
              variant="outline"
              className="text-xs font-normal text-muted-foreground gap-1 px-2 py-0.5 max-w-full truncate"
            >
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{warehouse.location}</span>
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-5">
        {/* Stats Row (two items side by side) */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
          {/* Total Stok */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span>Total Stok</span>
            </div>
            <p className="font-semibold text-sm sm:text-base text-foreground">
              {formatNumber(warehouse.total_stock)}{' '}
              <span className="text-xs font-normal text-muted-foreground">unit</span>
            </p>
          </div>

          {/* Kapasitas */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <WarehouseIcon className="h-3.5 w-3.5 shrink-0" />
              <span>Kapasitas</span>
            </div>
            <p className="font-semibold text-sm sm:text-base text-foreground">
              {formatNumber(capacity)}{' '}
              <span className="text-xs font-normal text-muted-foreground">unit</span>
            </p>
          </div>
        </div>

        {/* Capacity Bar Section */}
        <div className="space-y-2">
          {/* Label row: Kapasitas Terpakai + percentage number */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground font-medium">Kapasitas Terpakai</span>
            <span className={`font-bold ${config.textColor}`}>
              {warehouse.utilization_percent}%
            </span>
          </div>

          {/* Progress bar */}
          <Progress
            value={warehouse.utilization_percent}
            className="h-2 bg-muted"
            indicatorClassName={config.progressColor}
          />

          {/* Status badge below bar */}
          <div className="flex justify-end pt-1">
            <Badge
              variant="outline"
              className={`text-xs font-medium px-2 py-0.5 ${config.badgeClass}`}
            >
              {config.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default WarehouseCard
