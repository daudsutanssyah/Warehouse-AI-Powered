'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ClipboardList,
  MessageSquare,
  Settings,
  Bot,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Produk',
    href: '/products',
    icon: Package,
  },
  {
    label: 'Gudang',
    href: '/warehouses',
    icon: Warehouse,
  },
  {
    label: 'Manajemen Stok',
    href: '/stock',
    icon: ClipboardList,
  },
  {
    label: 'AI Chat',
    href: '/chat',
    icon: MessageSquare,
  },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    label: 'Pengaturan',
    href: '/settings',
    icon: Settings,
  },
]

export interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  const isItemActive = (item: NavItem) => {
    if (item.href === '/dashboard' || item.exact) {
      return pathname === '/dashboard'
    }
    return pathname === item.href || pathname.startsWith(item.href)
  }

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col bg-blue-950 text-white',
        className
      )}
    >
      {/* App Logo / Name at top */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-blue-900 px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-900/60 text-blue-400">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <Link
            href="/dashboard"
            className="truncate text-base font-bold text-white transition-colors hover:text-blue-200"
          >
            Warehouse AI
          </Link>
          <span className="text-xs text-blue-400">Powered by Gemini AI</span>
        </div>
      </div>

      {/* Main Nav (flex-1) */}
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
    </aside>
  )
}

export default Sidebar

