'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  SearchX,
} from 'lucide-react'
import type { Product } from '@/types'
import { useProducts } from '@/hooks/useProducts'
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

export interface ProductsTableProps {
  initialProducts: Product[]
}

/**
 * Format numeric value to Indonesian Rupiah (e.g. "Rp 12.500")
 */
function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * TableSkeleton component rendering 5 placeholder loading rows
 */
function TableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          {/* Produk */}
          <TableCell>
            <div className="space-y-1.5 py-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>

          {/* Kategori (hidden on mobile) */}
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>

          {/* Harga (hidden on mobile) */}
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-4 w-20" />
          </TableCell>

          {/* Unit */}
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>

          {/* Status */}
          <TableCell>
            <Skeleton className="h-5 w-14 rounded-full" />
          </TableCell>

          {/* Aksi */}
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function ProductsTable({ initialProducts }: ProductsTableProps) {
  const router = useRouter()
  const {
    products,
    isLoading,
    search,
    category,
    setSearch,
    setCategory,
    deleteProduct,
  } = useProducts(initialProducts)

  // Handle product deletion with user confirmation
  const handleDelete = async (product: Product) => {
    const isConfirmed = window.confirm(
      `Hapus produk ${product.name}? Stok produk ini juga akan dihapus.`
    )
    if (isConfirmed) {
      await deleteProduct(product.id)
    }
  }

  const hasFilterActive = Boolean(search.trim() || category)

  return (
    <div className="space-y-4">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input (full width mobile, max-w-sm desktop) */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Cari nama atau SKU produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Right Controls: Category Filter + Tambah Produk Button */}
        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
          <Select
            value={category || 'all'}
            onValueChange={(val) => setCategory(val === 'all' ? '' : val)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="Makanan">Makanan</SelectItem>
              <SelectItem value="Minuman">Minuman</SelectItem>
              <SelectItem value="Kebersihan">Kebersihan</SelectItem>
              <SelectItem value="Snack">Snack</SelectItem>
              <SelectItem value="Lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => router.push('/products/new')}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Produk</span>
          </Button>
        </div>
      </div>

      {/* Products Table Card Container */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%] min-w-[180px]">Produk</TableHead>
              <TableHead className="hidden sm:table-cell">Kategori</TableHead>
              <TableHead className="hidden sm:table-cell">Harga</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  {/* 1. Produk: Name + SKU */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {product.sku}
                      </p>
                    </div>
                  </TableCell>

                  {/* 2. Kategori (hidden on mobile) */}
                  <TableCell className="hidden sm:table-cell">
                    {product.category ? (
                      <Badge variant="outline" className="font-normal text-xs">
                        {product.category}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* 3. Harga (hidden on mobile) */}
                  <TableCell className="hidden sm:table-cell font-medium text-foreground">
                    {formatRupiah(product.price)}
                  </TableCell>

                  {/* 4. Unit */}
                  <TableCell className="text-sm text-foreground">
                    {product.unit || '-'}
                  </TableCell>

                  {/* 5. Status */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300 font-medium text-xs"
                    >
                      Aktif
                    </Badge>
                  </TableCell>

                  {/* 6. Aksi */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => router.push(`/products/${product.id}/edit`)}
                        title="Edit Produk"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(product)}
                        className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                        title="Hapus Produk"
                        aria-label={`Hapus ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600 dark:hover:text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : hasFilterActive ? (
              /* Empty state (no search / filter results) */
              <TableRow>
                <TableCell colSpan={6} className="h-72 text-center">
                  <div className="flex flex-col items-center justify-center p-6 space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <SearchX className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold text-foreground">
                        Produk tidak ditemukan
                      </h4>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Coba ubah kata kunci pencarian atau reset filter.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch('')
                        setCategory('')
                      }}
                      className="mt-2"
                    >
                      Reset Filter
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              /* Empty state (no products in the database at all) */
              <TableRow>
                <TableCell colSpan={6} className="h-72 text-center">
                  <div className="flex flex-col items-center justify-center p-6 space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold text-foreground">
                        Belum ada produk
                      </h4>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Mulai tambahkan produk untuk melacak stok di gudang kamu.
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push('/products/new')}
                      size="sm"
                      className="mt-2 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Produk Pertama
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ProductsTable
