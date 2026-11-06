'use client'

import React from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import UserMenu from '@/components/layout/UserMenu'

export interface HeaderProps {
  user: {
    email: string
    id: string
  }
  onMobileMenuToggle: () => void
}

export function Header({ user, onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-white px-4 shadow-sm md:px-6 dark:bg-card">
      {/* Left side: Mobile menu toggle and mobile app name */}
      <div className="flex items-center gap-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight text-blue-600 dark:text-blue-500"
        >
          Warehouse AI
        </Link>
      </div>

      {/* Right side: AI Ready badge and User Menu */}
      <div className="flex items-center gap-2 ml-auto md:ml-0 md:gap-4">
        {/* AI Ready indicator badge (Desktop only) */}
        <Badge
          variant="outline"
          className="hidden md:inline-flex items-center gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Ready</span>
        </Badge>

        {/* User Account Menu */}
        <UserMenu user={user} />
      </div>
    </header>
  )
}

export default Header

