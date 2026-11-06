import React from 'react'
import { TableBody, TableRow, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// Row variation data to make skeleton widths realistic
const SKELETON_ROWS = [
  {
    nameWidth: 'w-40',
    skuWidth: 'w-24',
    categoryWidth: 'w-20',
    priceWidth: 'w-24',
    unitWidth: 'w-16',
  },
  {
    nameWidth: 'w-48',
    skuWidth: 'w-20',
    categoryWidth: 'w-16',
    priceWidth: 'w-20',
    unitWidth: 'w-20',
  },
  {
    nameWidth: 'w-32',
    skuWidth: 'w-16',
    categoryWidth: 'w-24',
    priceWidth: 'w-16',
    unitWidth: 'w-16',
  },
  {
    nameWidth: 'w-44',
    skuWidth: 'w-28',
    categoryWidth: 'w-20',
    priceWidth: 'w-24',
    unitWidth: 'w-20',
  },
  {
    nameWidth: 'w-36',
    skuWidth: 'w-20',
    categoryWidth: 'w-16',
    priceWidth: 'w-20',
    unitWidth: 'w-16',
  },
]

/**
 * TableSkeleton component rendering 5 skeleton rows inside Shadcn TableBody.
 * Matches ProductsTable column layout: Produk, Kategori, Harga, Unit, Status, Aksi.
 */
export function TableSkeleton() {
  return (
    <TableBody>
      {SKELETON_ROWS.map((row, index) => (
        <TableRow key={index} className="animate-pulse">
          {/* 1. Produk: two stacked skeletons (Name + SKU) */}
          <TableCell>
            <div className="space-y-1.5 py-1">
              <Skeleton className={`h-4 ${row.nameWidth}`} />
              <Skeleton className={`h-3 ${row.skuWidth}`} />
            </div>
          </TableCell>

          {/* 2. Kategori: single skeleton with varying width (hidden on mobile) */}
          <TableCell className="hidden sm:table-cell">
            <Skeleton className={`h-5 ${row.categoryWidth} rounded-full`} />
          </TableCell>

          {/* 3. Harga: single skeleton with varying width (hidden on mobile) */}
          <TableCell className="hidden sm:table-cell">
            <Skeleton className={`h-4 ${row.priceWidth}`} />
          </TableCell>

          {/* 4. Unit: single skeleton with varying width */}
          <TableCell>
            <Skeleton className={`h-4 ${row.unitWidth}`} />
          </TableCell>

          {/* 5. Status: single skeleton */}
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>

          {/* 6. Aksi: two small round skeletons side by side */}
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}

export default TableSkeleton
