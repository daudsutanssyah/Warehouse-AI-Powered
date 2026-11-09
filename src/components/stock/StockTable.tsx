'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Package,
  X,
  Warehouse as WarehouseIcon,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import type { StockWithDetails, Warehouse } from '@/types'
import { useStock } from '@/hooks/useStock'
import { formatNumber } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StockUpdateModal } from '@/components/stock/StockUpdateModal'

export interface StockTableProps {
  initialStocks: StockWithDetails[]
  warehouses: Warehouse[]
}

/**
 * Returns status badge based on stock quantity:
 * - 0: Habis (red)
 * - <= 10: Kritis (orange)
 * - <= 50: Rendah (amber)
 * - > 50: Normal (green)
 */
function getStockStatusBadge(quantity: number) {
  if (quantity === 0) {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
      >
        Habis
      </Badge>
    )
  }
  if (quantity <= 10) {
    return (
      <Badge
        variant="outline"
        className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-400"
      >
        Kritis
      </Badge>
    )
  }
  if (quantity <= 50) {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400"
      >
        Rendah
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400"
    >
      Normal
    </Badge>
  )
}

/**
 * Returns text color class for stock quantity:
 * - <= 10: red
 * - <= 50: amber
 * - > 50: default
 */
function getQuantityColorClass(quantity: number) {
  if (quantity <= 10) {
    return 'text-red-600 dark:text-red-400'
  }
  if (quantity <= 50) {
    return 'text-amber-600 dark:text-amber-400'
  }
  return 'text-slate-900 dark:text-slate-100'
}

export function StockTable({ initialStocks, warehouses }: StockTableProps) {
  const {
    stocks,
    isLoading,
    warehouseFilter,
    setWarehouseFilter,
    updateStock,
  } = useStock(initialStocks)

  const [selectedStock, setSelectedStock] = useState<StockWithDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [search, setSearch] = useState<string>('')

  // Client-side search filtering by product name or SKU
  const filteredStocks = useMemo(() => {
    if (!search.trim()) return stocks
    const query = search.toLowerCase().trim()
    return stocks.filter((item) => {
      const name = item.product?.name?.toLowerCase() || ''
      const sku = item.product?.sku?.toLowerCase() || ''
      return name.includes(query) || sku.includes(query)
    })
  }, [stocks, search])

  // Warehouse column is only shown when "Semua Gudang" is selected
  const showWarehouseColumn = !warehouseFilter

  // Get current warehouse display name
  const currentWarehouseObj = warehouses.find((w) => w.id === warehouseFilter)
  const warehouseDisplayName = currentWarehouseObj
    ? currentWarehouseObj.name
    : 'semua gudang'

  const handleUpdate = async (
    stockId: string,
    payload: {
      quantity_change: number
      type: 'in' | 'out' | 'adjustment'
      notes?: string
    }
  ) => {
    const result = await updateStock(stockId, payload)
    if (result.success) {
      toast.success('Stok berhasil diperbarui')
    } else {
      toast.error(result.error || 'Gagal memperbarui stok')
    }
    return result
  }

  return (
    <div className="space-y-4">
      {/* Top Bar: Warehouse Filter (Left) & Search Input (Right) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Warehouse Filter */}
        <div className="w-full sm:w-64">
          <Select
            value={warehouseFilter || 'all'}
            onValueChange={(value) =>
              setWarehouseFilter(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-full bg-white dark:bg-slate-950">
              <div className="flex items-center gap-2 truncate">
                <WarehouseIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Semua Gudang" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Gudang</SelectItem>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Cari nama produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 bg-white dark:bg-slate-950"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Total Count Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <p>
          Menampilkan{' '}
          <span className="font-semibold text-foreground">
            {filteredStocks.length}
          </span>{' '}
          produk di{' '}
          <span className="font-semibold text-foreground">
            {warehouseDisplayName}
          </span>
        </p>
      </div>

      {/* Stock Table Card */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%] min-w-[180px]">Produk</TableHead>
              {showWarehouseColumn && (
                <TableHead className="w-[25%] min-w-[160px]">Gudang</TableHead>
              )}
              <TableHead className="w-[15%]">Stok</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[10%] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // 5 Skeleton rows loading state
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </TableCell>
                  {showWarehouseColumn && (
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-24 ml-auto rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredStocks.length > 0 ? (
              filteredStocks.map((item) => {
                const qty = Number(item.quantity) || 0
                const unit = item.product?.unit || 'unit'

                return (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    {/* 1. Produk: Name + SKU */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground">
                          {item.product?.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.product?.sku}
                        </p>
                      </div>
                    </TableCell>

                    {/* 2. Gudang: Name + Location (Hidden if specific warehouse selected) */}
                    {showWarehouseColumn && (
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground text-sm">
                            {item.warehouse?.name}
                          </p>
                          {item.warehouse?.location ? (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {item.warehouse.location}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              Lokasi belum diatur
                            </p>
                          )}
                        </div>
                      </TableCell>
                    )}

                    {/* 3. Stok: Quantity + Unit */}
                    <TableCell>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`font-semibold font-mono text-sm ${getQuantityColorClass(
                            qty
                          )}`}
                        >
                          {formatNumber(qty)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {unit}
                        </span>
                      </div>
                    </TableCell>

                    {/* 4. Status Stok */}
                    <TableCell>{getStockStatusBadge(qty)}</TableCell>

                    {/* 5. Aksi: Update Stok Button */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStock(item)
                          setIsModalOpen(true)
                        }}
                        className="rounded-lg text-xs font-medium cursor-pointer hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/30"
                      >
                        Update Stok
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              // Empty State
              <TableRow>
                <TableCell
                  colSpan={showWarehouseColumn ? 5 : 4}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-sm text-foreground">
                      {search
                        ? 'Tidak ada produk yang cocok'
                        : 'Belum ada data stok'}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {search
                        ? `Tidak ditemukan hasil pencarian untuk "${search}". Coba kata kunci lain.`
                        : 'Belum ada stok barang yang tercatat pada gudang ini.'}
                    </p>
                    {search && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearch('')}
                        className="mt-2 text-xs"
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Reset Pencarian
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stock Update Modal */}
      <StockUpdateModal
        stock={selectedStock}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdate}
      />
    </div>
  )
}

export default StockTable

