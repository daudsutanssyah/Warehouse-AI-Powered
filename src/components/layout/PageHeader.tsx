import React from 'react'
import { typography } from '@/lib/typography'

export interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className={typography.heading.h1}>{title}</h1>
        {description && (
          <p className={typography.body.muted}>{description}</p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2">
          {action}
        </div>
      )}
    </div>
  )
}

export default PageHeader
