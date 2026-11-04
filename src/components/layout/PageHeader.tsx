import { typography } from '@/lib/typography'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className={typography.heading.h1}>{title}</h1>
        {description && <p className={typography.body.muted}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
