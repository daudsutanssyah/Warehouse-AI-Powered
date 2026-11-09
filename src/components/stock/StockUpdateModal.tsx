'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Warehouse,
  Package,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type { StockWithDetails } from '@/types'
import { formatNumber } from '@/lib/utils'

export type StockUpdateType = 'in' | 'out' | 'adjustment'

export interface StockUpdateModalProps {
  stock: StockWithDetails | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (
    stockId: string,
    payload: {
      quantity_change: number
      type: StockUpdateType
      notes?: string
    }
  ) => Promise<{ success: boolean; error?: string }>
}

export function StockUpdateModal({
  stock,
  isOpen,
  onClose,
  onUpdate,
}: StockUpdateModalProps) {
  const [type, setType] = useState<StockUpdateType>('in')
  const [quantity, setQuantity] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // Reset state whenever modal is opened or stock changes
  useEffect(() => {
    if (isOpen) {
      setType('in')
      setQuantity('')
      setNotes('')
      setValidationError(null)
      setServerError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, stock])

  if (!stock) return null

  const currentQty = Number(stock.quantity) || 0
  const unit = stock.product?.unit || 'unit'
  const parsedQty = parseInt(quantity, 10)
  const isQtyValid = !isNaN(parsedQty) && Number.isInteger(Number(quantity))

  // Compute preview values
  let previewText = ''
  let isDangerPreview = false

  if (!isQtyValid || quantity === '') {
    previewText = `Stok saat ini: ${formatNumber(currentQty)} ${unit}`
  } else if (type === 'in') {
    const newQty = currentQty + parsedQty
    previewText = `Stok: ${formatNumber(currentQty)} → ${formatNumber(currentQty)} + ${formatNumber(parsedQty)} = ${formatNumber(newQty)} ${unit}`
  } else if (type === 'out') {
    const newQty = currentQty - parsedQty
    previewText = `Stok: ${formatNumber(currentQty)} → ${formatNumber(currentQty)} - ${formatNumber(parsedQty)} = ${formatNumber(newQty)} ${unit}`
    if (newQty <= 0) {
      isDangerPreview = true
    }
  } else if (type === 'adjustment') {
    previewText = `Stok: ${formatNumber(currentQty)} → ${formatNumber(parsedQty)} ${unit}`
    if (parsedQty === 0) {
      isDangerPreview = true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setServerError(null)

    if (!quantity.trim()) {
      setValidationError('Jumlah stok wajib diisi')
      return
    }

    const num = Number(quantity)
    if (!Number.isInteger(num)) {
      setValidationError('Jumlah harus berupa bilangan bulat')
      return
    }

    if (type === 'adjustment') {
      if (num < 0) {
        setValidationError('Jumlah akhir stok tidak boleh bernilai negatif')
        return
      }
    } else {
      if (num <= 0) {
        setValidationError('Jumlah harus berupa angka positif (minimal 1)')
        return
      }
    }

    if (type === 'out' && num > currentQty) {
      setValidationError(
        `Stok tidak cukup. Jumlah keluar melebihi stok saat ini (${formatNumber(currentQty)} ${unit})`
      )
      return
    }

    // Calculate quantity_change for payload
    let quantityChange: number
    if (type === 'in') {
      quantityChange = num
    } else if (type === 'out') {
      quantityChange = -num
    } else {
      // adjustment: delta between new absolute value and current quantity
      quantityChange = num - currentQty
    }

    setIsSubmitting(true)
    try {
      const res = await onUpdate(stock.id, {
        quantity_change: quantityChange,
        type,
        notes: notes.trim() || undefined,
      })

      if (res.success) {
        onClose()
      } else {
        setServerError(res.error || 'Gagal memperbarui stok')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
      setServerError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Update Stok — {stock.product?.name}
          </DialogTitle>
        </DialogHeader>

        {/* Info row: Warehouse name & Current quantity */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Warehouse className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {stock.warehouse?.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Package className="h-4 w-4 text-slate-500" />
            <span className="text-slate-500">Saat ini:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatNumber(currentQty)} {unit}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Type selector (3 buttons styled as toggle group) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tipe Transaksi
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Stok Masuk */}
              <button
                type="button"
                onClick={() => {
                  setType('in')
                  setValidationError(null)
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
                  type === 'in'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-emerald-950/20'
                }`}
              >
                <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" />
                <span>Stok Masuk</span>
              </button>

              {/* Stok Keluar */}
              <button
                type="button"
                onClick={() => {
                  setType('out')
                  setValidationError(null)
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
                  type === 'out'
                    ? 'border-red-600 bg-red-600 text-white shadow-sm shadow-red-600/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50/50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-red-950/20'
                }`}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 shrink-0" />
                <span>Stok Keluar</span>
              </button>

              {/* Adjustment */}
              <button
                type="button"
                onClick={() => {
                  setType('adjustment')
                  setValidationError(null)
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
                  type === 'adjustment'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-blue-950/20'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                <span>Adjustment</span>
              </button>
            </div>
          </div>

          {/* Quantity input */}
          <div className="space-y-1.5">
            <Label htmlFor="stock-quantity" className="text-sm font-medium">
              {type === 'in'
                ? 'Jumlah Masuk'
                : type === 'out'
                ? 'Jumlah Keluar'
                : 'Jumlah Akhir'}
            </Label>
            <div className="relative">
              <Input
                id="stock-quantity"
                type="number"
                min={type === 'adjustment' ? 0 : 1}
                step="1"
                placeholder={type === 'adjustment' ? '0' : '1'}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value)
                  setValidationError(null)
                  setServerError(null)
                }}
                className="pr-14"
                disabled={isSubmitting}
                autoFocus
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                {unit}
              </span>
            </div>
            {type === 'adjustment' && (
              <p className="text-xs text-slate-500">
                Masukkan jumlah stok yang seharusnya ada
              </p>
            )}
          </div>

          {/* Notes input */}
          <div className="space-y-1.5">
            <Label htmlFor="stock-notes" className="text-sm font-medium">
              Catatan (opsional)
            </Label>
            <Textarea
              id="stock-notes"
              rows={2}
              placeholder="Catatan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>

          {/* Preview row */}
          <div
            className={`rounded-xl border px-3.5 py-2.5 text-xs transition-colors ${
              isDangerPreview
                ? 'border-red-200 bg-red-50/70 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400'
                : 'border-slate-200/80 bg-slate-50/70 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'
            }`}
          >
            <span className="font-medium text-slate-500 dark:text-slate-400 mr-1.5">
              Dampak:
            </span>
            <span
              className={
                isDangerPreview
                  ? 'font-semibold text-red-600 dark:text-red-400'
                  : 'font-semibold text-slate-900 dark:text-slate-100'
              }
            >
              {previewText}
            </span>
          </div>

          {/* Validation or Server Error */}
          {(validationError || serverError) && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationError || serverError}</span>
            </div>
          )}

          {/* Actions */}
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default StockUpdateModal

