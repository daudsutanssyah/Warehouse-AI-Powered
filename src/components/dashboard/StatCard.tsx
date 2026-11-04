import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: { value: number; isPositive: boolean }
}

export default function StatCard({ title, description, value, icon, trend }: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {trend && (
            <span className={`mb-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardContent>
    </Card>
  )
}
