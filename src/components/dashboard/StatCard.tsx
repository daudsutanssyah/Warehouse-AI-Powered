import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

/**
 * Server Component: Stat card with prominent value, icon badge, trend indicator, and hover shadow.
 */
export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('transition-shadow duration-200 hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                trend.isPositive
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
              )}
            >
              {trend.isPositive ? '+' : '-'}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default StatCard
