'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface FormFields {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {}
  if (!fields.fullName.trim()) {
    errors.fullName = 'Nama lengkap wajib diisi'
  }
  if (!fields.email.trim()) {
    errors.email = 'Email wajib diisi'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Format email tidak valid'
  }
  if (!fields.password) {
    errors.password = 'Password wajib diisi'
  } else if (fields.password.length < 8) {
    errors.password = 'Password minimal 8 karakter'
  }
  if (!fields.confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password wajib diisi'
  } else if (fields.confirmPassword !== fields.password) {
    errors.confirmPassword = 'Password tidak cocok'
  }
  return errors
}

function getErrorMessage(message: string): string {
  if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('user already exists')) {
    return 'Email ini sudah terdaftar'
  }
  return 'Terjadi kesalahan. Silakan coba lagi.'
}

export default function RegisterPage() {
  const router = useRouter()
  const [fields, setFields] = useState<FormFields>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate(fields)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: fields.email,
      password: fields.password,
      options: {
        data: {
          full_name: fields.fullName,
        },
      },
    })
    setLoading(false)

    if (error) {
      setServerError(getErrorMessage(error.message))
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  return (
    <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-md">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Buat Akun Baru
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mulai kelola gudang dengan AI
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 ring-1 ring-green-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span>Akun berhasil dibuat! Silakan login.</span>
        </div>
      )}

      {/* Error Alert Box */}
      {serverError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            value={fields.fullName}
            onChange={handleChange}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="text-xs text-red-600">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            value={fields.email}
            onChange={handleChange}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Minimal 8 karakter"
            value={fields.password}
            onChange={handleChange}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Ulangi password"
            value={fields.confirmPassword}
            onChange={handleChange}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="mt-2 w-full gap-2"
          disabled={loading || success}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Mendaftar...' : 'Daftar'}
        </Button>
      </form>

      {/* Footer Link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login di sini
        </Link>
      </p>
    </div>
  )
}
