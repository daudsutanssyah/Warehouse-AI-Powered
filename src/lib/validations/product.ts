import { z } from 'zod'

/**
 * Zod validation schema for product form (create and edit).
 */
export const productSchema = z.object({
  name: z
    .string({ message: 'Nama produk wajib diisi' })
    .min(1, 'Nama produk wajib diisi')
    .min(2, 'Nama produk minimal 2 karakter')
    .max(100, 'Nama produk maksimal 100 karakter'),

  sku: z
    .string({ message: 'SKU wajib diisi' })
    .min(1, 'SKU wajib diisi')
    .min(2, 'SKU minimal 2 karakter')
    .max(50, 'SKU maksimal 50 karakter')
    .transform((val) => val.toUpperCase()),

  category: z.string().optional(),

  price: z.coerce
    .number({ message: 'Harga harus berupa angka positif' })
    .positive('Harga harus berupa angka positif')
    .max(999999999, 'Harga maksimal 999.999.999')
    .nullable()
    .optional(),

  unit: z.string().optional().default('pcs'),

  description: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional(),
})

export type ProductFormData = z.infer<typeof productSchema>
