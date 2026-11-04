import { Badge } from '@/components/ui/badge'
import type { InsightItem } from '@/types'

type Priority = InsightItem['priority']

const config: Record<Priority, { label: string; className: string }> = {
  critical: {
    label: 'Kritis',
    className: 'bg-priority-critical text-priority-critical-foreground hover:bg-priority-critical',
  },
  high: {
    label: 'Tinggi',
    className: 'bg-priority-high text-priority-high-foreground hover:bg-priority-high',
  },
  medium: {
    label: 'Sedang',
    className: 'bg-priority-medium text-priority-medium-foreground hover:bg-priority-medium',
  },
  low: {
    label: 'Rendah',
    className: 'bg-priority-low text-priority-low-foreground hover:bg-priority-low',
  },
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = config[priority]

  return (
    <Badge className={`gap-1.5 ${className}`}>
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
