import React, { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import UserMenu from '@/components/layout/UserMenu'

// TEMPORARY: Minimal dashboard layout placeholder.
// Will be replaced with a full sidebar navigation layout in future updates.

export interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Inner component that reads the session behind a <Suspense> boundary.
 * With cacheComponents enabled, session reads (cookies) must not block
 * the static shell — they stream in at request time instead.
 */
async function DashboardHeader() {
  // Signal that this component runs at request time
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Extra safety check: redirect unauthenticated users to login
  // (proxy already handles this, but this is a fallback)
  if (!user) {
    redirect('/login')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-white px-4 sm:px-6 lg:px-8 dark:bg-card">
      {/* Left side: App Name */}
      <Link
        href="/dashboard"
        className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-500"
      >
        Warehouse AI
      </Link>

      {/* Right side: User Menu */}
      <UserMenu user={{ email: user.email || '', id: user.id }} />
    </header>
  )
}

/**
 * Fallback skeleton shown while the header streams in.
 */
function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-white px-4 sm:px-6 lg:px-8 dark:bg-card">
      <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
    </header>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header with auth-dependent content streams behind Suspense */}
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>

      {/* Main Content Area */}
      <main className="flex-1 bg-gray-50 dark:bg-background">
        {children}
      </main>
    </div>
  )
}
