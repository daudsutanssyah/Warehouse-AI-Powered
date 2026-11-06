'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  MAIN_NAV_ITEMS,
  BOTTOM_NAV_ITEMS,
  type NavItem,
} from '@/components/layout/Sidebar'

export interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()

  const isItemActive = (item: NavItem) => {
    if (item.href === '/dashboard' || item.exact) {
      return pathname === '/dashboard'
    }
    return pathname === item.href || pathname.startsWith(item.href)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        className="w-72 bg-blue-950 p-0 text-white border-r border-blue-900 gap-0 sm:max-w-none [&_[data-slot=sheet-close]_button]:text-blue-300 [&_[data-slot=sheet-close]_button]:hover:bg-blue-900 [&_[data-slot=sheet-close]_button]:hover:text-white"
      >
        {/* Radix Accessible Header (Screen reader only) */}
        <SheetHeader className="sr-only">
          <SheetTitle>Menu Navigasi</SheetTitle>
          <SheetDescription>Menu navigasi utama aplikasi Warehouse AI</SheetDescription>
        </SheetHeader>

        {/* App Logo / Name at top */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-blue-900 px-6 pr-12">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-900/60 text-blue-400">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="truncate text-base font-bold text-white transition-colors hover:text-blue-200"
            >
              Warehouse AI
            </Link>
            <span className="text-xs text-blue-400">Powered by Claude AI</span>
          </div>
        </div>

        {/* Main Nav Items (flex-1) */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-blue-400">
            MENU UTAMA
          </div>
          <nav className="space-y-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = isItemActive(item)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
                    active
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-blue-200 hover:bg-blue-900 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section (separated by divider) */}
        <div className="border-t border-blue-900 px-4 py-4">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-blue-400">
            LAINNYA
          </div>
          <nav className="space-y-1">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = isItemActive(item)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
                    active
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-blue-200 hover:bg-blue-900 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileNav

