'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import type { Product } from '@/types'
import { productSchema, type ProductFormData, type ProductFormInput } from '@/lib/validations/product'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface ProductFormProps {
  product?: Product
  onSuccess?: () => void
}

const CATEGORY_OPTIONS = [
  'Makanan',
  'Minuman',
  'Kebersihan',
  'Snack',
  'Lainnya',
] as const

const UNIT_OPTIONS = [
  'pcs',
  'kg',
  'gram',
  'liter',
  'ml',
  'dus',
  'karton',
  'lusin',
] as const

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const isEditMode = Boolean(product)

  const form = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      category: product?.category ?? '',
      price: product?.price ?? null,
      unit: product?.unit ?? 'pcs',
      description: product?.description ?? '',
    },
  })

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const url = isEditMode && product ? `/api/products/${product.id}` : '/api/products'
      const method = isEditMode ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.success) {
        const errorMsg: string = json?.error || json?.message || ''
        if (/duplicate|sku/i.test(errorMsg)) {
          setServerError('SKU sudah digunakan produk lain.')
        } else {
          setServerError(errorMsg || 'Terjadi kesalahan. Silakan coba lagi.')
        }
        return
      }

      // Success callback
      if (onSuccess) {
        onSuccess()
      }

      // Success notification
      toast.success(
        isEditMode
          ? 'Produk berhasil diperbarui!'
          : 'Produk berhasil ditambahkan!'
      )

      router.push('/products')
      router.refresh()
    } catch {
      setServerError('Terjadi kesalahan jaringan. Silakan periksa koneksi Anda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xs">
      <CardHeader>
        <CardTitle>
          {isEditMode ? 'Edit Produk' : 'Tambah Produk Baru'}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Perbarui informasi produk.'
            : 'Isi detail produk baru.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Row 1: Nama Produk (Full width on desktop) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>
                      Nama Produk <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Beras Premium Pandan Wangi 5kg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 2: SKU */}
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      SKU <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: MKN-001"
                        className="font-mono uppercase"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      SKU akan otomatis diubah ke huruf kapital
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 2: Kategori */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(val) =>
                        field.onChange(val === 'none' ? '' : val)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Pilih Kategori</SelectItem>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 3: Harga (Rp) */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min={0}
                        value={
                          typeof field.value === 'number' || typeof field.value === 'string'
                            ? field.value
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === '' ? null : val)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 3: Satuan */}
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satuan</FormLabel>
                    <Select
                      value={field.value || 'pcs'}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Satuan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 4: Deskripsi (Full width) */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi produk (opsional)"
                        rows={3}
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <FormMessage />
                      <span className="ml-auto font-mono">
                        {(field.value || '').length} / 500
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Buttons Row (right-aligned, flex gap-3) */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/products')}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : isEditMode ? (
                  'Simpan Perubahan'
                ) : (
                  'Tambah Produk'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default ProductForm
