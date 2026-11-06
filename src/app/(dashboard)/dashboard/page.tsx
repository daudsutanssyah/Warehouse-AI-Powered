import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, User as UserIcon, Mail, Fingerprint, Construction } from 'lucide-react'

// TEMPORARY: Minimal dashboard placeholder page.
// Will be replaced with full metrics, charts, and warehouse AI insight widgets later.

/**
 * Inner component that reads the session behind a <Suspense> boundary.
 * With cacheComponents enabled, cookies/session reads can't be prerendered
 * into the static shell — they must stream in at request time.
 */
async function DashboardContent() {
  // Signal that this component runs at request time
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Guard: Redirect unauthenticated requests to login
  if (!user) {
    redirect('/login')
  }

  // Server action for logging out user session
  async function handleLogout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <PageContainer className="space-y-8">
      {/* Header with Title and Logout Action */}
      <PageHeader
        title="Dashboard"
        description="Pusat kendali dan monitoring inventaris gudang berbasis AI."
        action={
          <form action={handleLogout}>
            <Button variant="outline" size="sm" type="submit" className="gap-2">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              Keluar
            </Button>
          </form>
        }
      />

      {/* Welcome Banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-6 dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Construction className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Selamat datang,{' '}
              <span className="text-primary">{user.email}</span>!
            </h2>
            <p className="text-sm text-muted-foreground">
              Dashboard sedang dalam pembangunan. Fitur monitoring stok dan rekomendasi AI akan segera hadir.
            </p>
          </div>
        </div>
      </div>

      {/* User Information Card */}
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">
                Informasi Akun
              </CardTitle>
            </div>
            <CardDescription>
              Detail sesi pengguna yang saat ini sedang aktif.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-semibold text-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <Fingerprint className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">User ID</p>
                <p className="font-mono text-xs text-foreground break-all">{user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

/**
 * Fallback skeleton while dashboard content loads.
 */
function DashboardSkeleton() {
  return (
    <PageContainer className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="h-48 max-w-xl animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
    </PageContainer>
  )
}

/**
 * Dashboard page — the outer function prerenders as a static shell,
 * while DashboardContent streams in behind the Suspense boundary.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
