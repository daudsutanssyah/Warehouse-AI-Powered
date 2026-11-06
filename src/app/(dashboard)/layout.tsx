import React from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'

export const instant = false

export interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Signal request-time rendering
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Guard: Redirect unauthenticated users to login
  if (!user) {
    redirect('/login')
  }

  return (
    <DashboardShell user={{ email: user.email || '', id: user.id }}>
      {children}
    </DashboardShell>
  )
}
