import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type Priority = 'critical' | 'high' | 'medium' | 'low'

export interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

const config: Record<Priority, { label: string; className: string }> = {
  critical: {
    label: 'Kritis',
    className: 'bg-priority-critical text-white hover:bg-priority-critical border-transparent',
  },
  high: {
    label: 'Tinggi',
    className: 'bg-priority-high text-white hover:bg-priority-high border-transparent',
  },
  medium: {
    label: 'Sedang',
    className: 'bg-priority-medium text-neutral-950 hover:bg-priority-medium border-transparent font-semibold',
  },
  low: {
    label: 'Rendah',
    className: 'bg-priority-low text-white hover:bg-priority-low border-transparent',
  },
}

/**
 * Server Component: Priority badge for AI insights with color coding and pulsing critical indicator.
 */
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const { label, className: priorityClassName } = config[priority]

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium',
        priorityClassName,
        className
      )}
    >
      {priority === 'critical' && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      )}
      {label}
    </Badge>
  )
}

export default PriorityBadge
