'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import type { Warehouse } from '@/types'
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

export const warehouseSchema = z.object({
  name: z
    .string({ message: 'Nama gudang wajib diisi' })
    .min(1, 'Nama gudang wajib diisi')
    .min(2, 'Nama gudang minimal 2 karakter')
    .max(100, 'Nama gudang maksimal 100 karakter'),
  location: z
    .string()
    .max(200, 'Lokasi maksimal 200 karakter')
    .optional()
    .or(z.literal('')),
  capacity: z.coerce
    .number({ message: 'Kapasitas harus berupa angka positif' })
    .int('Kapasitas harus berupa bilangan bulat')
    .positive('Kapasitas harus berupa angka positif')
    .min(1, 'Kapasitas minimal 1 unit'),
  description: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
})

export type WarehouseFormInput = z.input<typeof warehouseSchema>
export type WarehouseFormData = z.infer<typeof warehouseSchema>

export interface WarehouseFormProps {
  warehouse?: Warehouse
}

export function WarehouseForm({ warehouse }: WarehouseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const isEditMode = Boolean(warehouse)

  const form = useForm<WarehouseFormInput, unknown, WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: warehouse?.name ?? '',
      location: warehouse?.location ?? '',
      capacity: warehouse
        ? (warehouse.capacity ?? warehouse.max_capacity)
        : ('' as any),
      description: '',
    },
  })

  const onSubmit = async (data: WarehouseFormData) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const url =
        isEditMode && warehouse
          ? `/api/warehouses/${warehouse.id}`
          : '/api/warehouses'
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
        setServerError(
          json?.error || json?.message || 'Terjadi kesalahan. Silakan coba lagi.'
        )
        return
      }

      toast.success(
        isEditMode
          ? 'Gudang berhasil diperbarui!'
          : 'Gudang berhasil ditambahkan!'
      )
      router.push('/warehouses')
      router.refresh()
    } catch {
      setServerError('Terjadi kesalahan jaringan. Silakan periksa koneksi Anda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xs">
      <CardHeader>
        <CardTitle>
          {isEditMode ? 'Edit Gudang' : 'Tambah Gudang Baru'}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Perbarui informasi gudang penyimpanan.'
            : 'Isi detail gudang baru untuk melacak kapasitas.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* 1. Nama Gudang (required) */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nama Gudang <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Gudang Jakarta Utara"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Lokasi */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jl. Raya No. 1, Jakarta Utara"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Kapasitas (unit) */}
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kapasitas (unit) <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Contoh: 1000"
                      min={1}
                      value={
                        typeof field.value === 'number' ||
                        typeof field.value === 'string'
                          ? field.value
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val === '' ? '' : val)
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Jumlah maksimum unit yang bisa disimpan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. Deskripsi */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi gudang (opsional)"
                      rows={3}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Server Error Alert */}
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Buttons Row */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/warehouses')}
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
                  'Tambah Gudang'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default WarehouseForm
