import type {
  StockSummary,
  StockTrend,
  CapacityAlert,
  OtherWarehouseStock,
} from './data-fetcher'

/**
 * Formats cross-warehouse stock balance into a compact comma-separated string.
 */
function formatOtherWarehouses(
  otherWarehouses?: OtherWarehouseStock[]
): string {
  if (!otherWarehouses || otherWarehouses.length === 0) {
    return 'Tidak ada'
  }
  const available = otherWarehouses.filter((w) => w.quantity > 0)
  if (available.length === 0) {
    return 'Gudang lain: 0 unit'
  }
  return available.map((w) => `${w.warehouse_name}: ${w.quantity}`).join(', ')
}

/**
 * Formats overall stock summary data into high-density, AI-readable Markdown tables.
 * Includes cross-warehouse availability to enable intelligent transfer recommendations.
 *
 * @param summary - Aggregated stock summary metrics
 * @returns Formatted summary text block
 */
export function buildStockContext(summary: StockSummary): string {
  const parts: string[] = []

  // 1. Header Ringkas
  parts.push(
    `[RINGKASAN REAL-TIME]: ${summary.total_products} Produk | ${summary.total_warehouses} Gudang | ${summary.total_units} Total Unit Fisik`
  )

  // 2. Utilisasi Kapasitas Semua Gudang
  if (summary.warehouse_utilization && summary.warehouse_utilization.length > 0) {
    parts.push('\n[STATUS KAPASITAS GUDANG]')
    for (const w of summary.warehouse_utilization) {
      const statusLabel =
        w.status ||
        (w.utilization_percent >= 85
          ? 'KRITIS'
          : w.utilization_percent >= 70
          ? 'PADAT'
          : 'AMAN')
      parts.push(
        `- ${w.warehouse_name}: ${w.total_stock}/${w.capacity} unit (${w.utilization_percent}% - ${statusLabel})`
      )
    }
  }

  // 3. Daftar Produk Habis (Stok = 0)
  if (summary.out_of_stock_items.length > 0) {
    parts.push('\n[DAFTAR PRODUK HABIS (STOK = 0)]')
    parts.push(
      '| Produk (SKU) | Lokasi Gudang | Sisa Stok | Stok di Gudang Lain (Peluang Transfer) |'
    )
    parts.push('|---|---|---|---|')

    for (const item of summary.out_of_stock_items.slice(0, 10)) {
      const otherWhText = formatOtherWarehouses(item.other_warehouses)
      parts.push(
        `| ${item.product_name} (${item.sku}) | ${item.warehouse_name} | 0 ${item.unit} (HABIS) | ${otherWhText} |`
      )
    }
  } else {
    parts.push('\n[DAFTAR PRODUK HABIS]: Tidak ada stok habis (semua produk memiliki stok).')
  }

  // 4. Daftar Produk Kritis (Stok Menipis <= 20 Unit)
  const criticalItems = summary.low_stock_items.filter((item) => item.quantity > 0)
  if (criticalItems.length > 0) {
    parts.push('\n[DAFTAR PRODUK KRITIS (STOK MENIPIS <= 20 UNIT)]')
    parts.push(
      '| Produk (SKU) | Lokasi Gudang | Sisa Stok | Stok di Gudang Lain (Peluang Transfer) |'
    )
    parts.push('|---|---|---|---|')

    for (const item of criticalItems.slice(0, 15)) {
      const otherWhText = formatOtherWarehouses(item.other_warehouses)
      parts.push(
        `| ${item.product_name} (${item.sku}) | ${item.warehouse_name} | ${item.quantity} ${item.unit} | ${otherWhText} |`
      )
    }

    if (criticalItems.length > 15) {
      parts.push(`*(...dan ${criticalItems.length - 15} produk kritis lainnya)*`)
    }
  } else {
    parts.push('\n[DAFTAR PRODUK KRITIS]: Tidak ada produk dengan stok kritis (semua stok > 20 unit).')
  }

  return parts.join('\n')
}

/**
 * Formats 30-day stock movement trends, burn rates, and runway projections into a compact Markdown table.
 *
 * @param trends - Array of stock movement trends
 * @returns Formatted trend text block
 */
export function buildTrendContext(trends: StockTrend[]): string {
  const parts: string[] = []
  parts.push('[TREN PERGERAKAN STOK & ESTIMASI WAKTU HABIS (30 HARI TERAKHIR)]')

  const urgentTrends = trends
    .filter((t) => t.days_until_empty !== null)
    .slice(0, 12)

  if (urgentTrends.length === 0) {
    parts.push(
      'Tidak ada produk yang mengalami penurunan stok signifikan (semua laju stok stabil).'
    )
  } else {
    parts.push(
      '| Produk (SKU) | Lokasi Gudang | Sisa Stok | Laju Keluar/Hari | Prediksi Habis | Stok di Gudang Lain |'
    )
    parts.push('|---|---|---|---|---|---|')

    for (const t of urgentTrends) {
      const urgencyNote =
        t.days_until_empty! <= 3
          ? `**${t.days_until_empty} hari (SEGERA HABIS)**`
          : `${t.days_until_empty} hari`

      const otherWhText = formatOtherWarehouses(t.other_warehouses)
      const skuText = t.sku ? ` (${t.sku})` : ''

      parts.push(
        `| ${t.product_name}${skuText} | ${t.warehouse_name} | ${t.current_quantity} unit | ${t.avg_daily_out}/hari | ${urgencyNote} | ${otherWhText} |`
      )
    }
  }

  return parts.join('\n')
}

/**
 * Formats warehouse capacity alert metrics into a high-density table.
 *
 * @param alerts - Array of capacity alerts (> 75% utilization)
 * @returns Formatted capacity text block
 */
export function buildCapacityContext(alerts: CapacityAlert[]): string {
  const parts: string[] = []
  parts.push('[PERINGATAN KAPASITAS GUDANG TINGGI (>75%)]')

  if (alerts.length === 0) {
    parts.push('Semua gudang beroperasi dalam batas kapasitas normal (<= 75%).')
  } else {
    parts.push('| Gudang | Lokasi | Terpakai / Kapasitas | Utilisasi |')
    parts.push('|---|---|---|---|')

    for (const alert of alerts) {
      const loc = alert.location || 'Lokasi tidak disetel'
      parts.push(
        `| ${alert.warehouse_name} | ${loc} | ${alert.total_stock} / ${alert.capacity} unit | **${alert.utilization_percent}%** |`
      )
    }
  }

  return parts.join('\n')
}

/**
 * Assembles a comprehensive, token-efficient, and cross-warehouse aware context string.
 *
 * @param summary - Aggregated stock summary metrics
 * @param trends - Array of stock movement trends
 * @param alerts - Array of capacity alerts
 * @returns Full multi-section context string
 */
export function buildFullContext(
  summary: StockSummary,
  trends: StockTrend[],
  alerts: CapacityAlert[]
): string {
  const currentDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date())

  const header = `Data berikut adalah kondisi inventaris gudang real-time per ${currentDate}:`

  const stockBlock = buildStockContext(summary)
  const trendBlock = buildTrendContext(trends)
  const capacityBlock = buildCapacityContext(alerts)

  return `${header}\n\n${stockBlock}\n\n---\n\n${trendBlock}\n\n---\n\n${capacityBlock}`
}
