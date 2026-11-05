import React from 'react'
import { Warehouse, Package, Sparkles, ShieldCheck } from 'lucide-react'

export interface AuthLayoutProps {
  children: React.ReactNode
}

/**
 * Server Component: Split layout for authentication pages (Login & Register).
 * Left: Blue gradient hero panel with branding and AI features (desktop only).
 * Right: Centered authentication form container.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left side: Hero branding panel (hidden on mobile, visible on md+) */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 px-10 py-16 md:flex md:w-1/2 lg:w-1/2">
        {/* Subtle decorative grid overlay pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Ambient background glow circles */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />

        {/* Centered content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* App Logo */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 shadow-xl shadow-blue-900/30 ring-1 ring-white/30 backdrop-blur-md">
            <Warehouse className="h-10 w-10 text-white" />
          </div>

          {/* App Name */}
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Warehouse AI
          </h1>

          {/* Tagline */}
          <p className="mt-3 max-w-sm text-base text-blue-100 sm:text-lg">
            Kelola gudang lebih cerdas dengan AI
          </p>

          {/* Feature Highlights */}
          <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
            {[
              {
                icon: Package,
                text: 'Pelacakan stok akurat & real-time',
              },
              {
                icon: Sparkles,
                text: 'Prediksi anomali & restock berbasis AI',
              },
              {
                icon: ShieldCheck,
                text: 'Sinkronisasi multi-gudang terpusat',
              },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-left text-sm text-white shadow-xs ring-1 ring-white/15 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Form container (full width on mobile, half on desktop) */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-16">
        {/* Mobile-only logo header */}
        <div className="mb-8 flex flex-col items-center text-center md:hidden">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-md">
            <Warehouse className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-neutral-900">
            Warehouse AI
          </span>
          <p className="mt-1 text-sm text-neutral-500">
            Kelola gudang lebih cerdas dengan AI
          </p>
        </div>

        {/* Centered form wrapper */}
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
