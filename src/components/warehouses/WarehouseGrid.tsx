'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Warehouse, Plus } from 'lucide-react'
import { toast } from 'sonner'

import type { ApiResponse, WarehouseWithUtilization } from '@/types'
import { Button } from '@/components/ui/button'
import WarehouseCard from './WarehouseCard'

export interface WarehouseGridProps {
  initialWarehouses: WarehouseWithUtilization[]
}

export function WarehouseGrid({ initialWarehouses }: WarehouseGridProps) {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<WarehouseWithUtilization[]>(initialWarehouses)

  useEffect(() => {
    setWarehouses(initialWarehouses)
  }, [initialWarehouses])

  const handleEdit = (id: string) => {
    router.push(`/warehouses/${id}/edit`)
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/warehouses/${id}`, {
        method: 'DELETE',
      })
      const json: ApiResponse<never> = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.error || 'Gagal menghapus gudang')
        return
      }

      toast.success(`Gudang "${name}" berhasil dihapus`)
      setWarehouses((prev) => prev.filter((w) => w.id !== id))
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan saat menghapus gudang')
    }
  }

  // Empty state
  if (warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
          <Warehouse className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Belum ada gudang
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Tambahkan gudang pertama untuk mulai melacak stok.
        </p>
        <Button asChild>
          <Link href="/warehouses/new">
            <Plus className="w-4 h-4 mr-2" /> Tambah Gudang Pertama
          </Link>
        </Button>
      </div>
    )
  }

  // Grid layout
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {warehouses.map((warehouse) => (
        <WarehouseCard
          key={warehouse.id}
          warehouse={warehouse}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}

export default WarehouseGrid
