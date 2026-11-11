'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { RestockInsight, RestockItem } from '@/types'
import { formatNumber } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PriorityBadge } from '@/components/dashboard/PriorityBadge'

/**
 * Formats a Date into a human-readable Indonesian relative time string.
 */
function formatTimeAgo(date: Date | null): string {
  if (!date) return ''
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60))
  if (diffInMinutes < 1) return 'Baru saja'
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`
  const hours = Math.floor(diffInMinutes / 60)
  return `${hours} jam lalu`
}

/**
 * AI-powered Restock Insight Card component for the dashboard.
 * Fetches and displays prioritized reorder recommendations.
 */
export function RestockInsightCard() {
  const [data, setData] = useState<RestockInsight | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [showAll, setShowAll] = useState<boolean>(false)

  const fetchInsight = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/insights/restock')
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat rekomendasi restock')
      }

      setData(json.data)
      setLastRefreshed(new Date())
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memuat rekomendasi'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInsight()
  }, [fetchInsight])

  const recommendations: RestockItem[] = data?.recommendations || []
  const displayedRecommendations = showAll
    ? recommendations
    : recommendations.slice(0, 5)

  return (
    <Card className="rounded-2xl border bg-card shadow-xs transition-shadow hover:shadow-md">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold text-foreground">
            Rekomendasi Restock
          </CardTitle>
        </div>

        <div className="flex items-center gap-2">
          {lastRefreshed && !isLoading && (
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(lastRefreshed)}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInsight}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Refresh rekomendasi"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`}
            />
          </Button>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-4">
        {/* Loading state: 3 skeleton rows */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-1.5 text-right">
                  <Skeleton className="h-4 w-24 ml-auto" />
                  <Skeleton className="h-3 w-32 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-2">
              <span className="text-xs">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInsight}
                className="h-7 px-2.5 text-xs font-medium cursor-pointer"
              >
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty state: all stocks healthy */}
        {!isLoading && !error && data && recommendations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-semibold text-foreground">
              Semua stok aman
            </h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {data.summary || 'Tidak ada produk yang membutuhkan restock saat ini.'}
            </p>
          </div>
        )}

        {/* Recommendations list */}
        {!isLoading && !error && data && recommendations.length > 0 && (
          <div className="space-y-3">
            {/* Summary text */}
            {data.summary && (
              <p className="text-xs italic text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/40">
                &ldquo;{data.summary}&rdquo;
              </p>
            )}

            {/* Recommendation items */}
            <div className="space-y-2">
              {displayedRecommendations.map((item, index) => {
                const isOutOfStock = item.current_quantity === 0
                const isVeryLow = item.current_quantity <= 10
                const stockColorClass = isOutOfStock
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : isVeryLow
                  ? 'text-orange-600 dark:text-orange-400 font-medium'
                  : 'text-muted-foreground'

                const truncatedReason =
                  item.reason.length > 80
                    ? `${item.reason.slice(0, 80)}...`
                    : item.reason

                return (
                  <div
                    key={`${item.sku}-${item.warehouse_name}-${index}`}
                    className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Left: Priority Badge & Product Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="pt-0.5 shrink-0">
                        <PriorityBadge priority={item.priority} />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{item.sku}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {item.warehouse_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quantities & Reason */}
                    <div className="flex flex-col sm:items-end justify-center shrink-0 space-y-0.5 pt-1 sm:pt-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={stockColorClass}>
                          {isOutOfStock
                            ? 'Habis (0)'
                            : `${formatNumber(item.current_quantity)} ${item.unit}`}
                        </span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          → Reorder {formatNumber(item.suggested_reorder_qty)}{' '}
                          {item.unit}
                        </span>
                      </div>
                      <p
                        className="text-[11px] italic text-muted-foreground line-clamp-1 max-w-xs sm:text-right cursor-help"
                        title={item.reason}
                      >
                        {truncatedReason}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Toggle show all if more than 5 */}
            {recommendations.length > 5 && (
              <div className="pt-1 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 h-8 gap-1 cursor-pointer"
                >
                  {showAll ? (
                    <>
                      Tampilkan lebih sedikit <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Lihat {recommendations.length - 5} lainnya{' '}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="pt-0 pb-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 mt-1 pt-3">
        <div className="flex items-center gap-1.5">
          <span>Dianalisis oleh Gemini AI</span>
        </div>
      </CardFooter>
    </Card>
  )
}

export default RestockInsightCard

