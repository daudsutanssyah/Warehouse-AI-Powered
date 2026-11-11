/**
 * AI Prompt Templates for Warehouse Inventory Management.
 * Provides structured prompts to extract deterministic, actionable insights from Gemini models.
 */

export type RestockPriority = 'critical' | 'high' | 'medium'

export interface RestockRecommendationItem {
  product_name: string
  sku: string
  warehouse_name: string
  current_quantity: number
  unit: string
  priority: RestockPriority
  suggested_reorder_qty: number
  reason: string
}

export interface RestockRecommendationResponse {
  recommendations: RestockRecommendationItem[]
  summary: string
  generated_at: string
}

/**
 * Prompt Engineering Strategy for Restock Recommendations:
 * 
 * 1. Role & Persona Anchoring: Positions Gemini as a seasoned warehouse supply chain analyst focusing on pragmatic actions.
 * 2. Grounded Real-Time Context: Injects real-time stock balances, warehouse utilization, and 30-day consumption trends.
 * 3. Objective Prioritization Rules:
 *    - 'critical': Stock is 0 or projected to run out within 5 days.
 *    - 'high': Stock projected to run out within 5-14 days.
 *    - 'medium': Stock projected to run out within 14-30 days.
 * 4. Algorithmic Reorder Quantity: Directs Gemini to calculate reorder quantities using daily burn rate with a 30-day buffer (or 50 units safe default).
 * 5. Strict Pure-JSON Contract: Explicitly forbids markdown fences (` ```json `) to guarantee zero-overhead parsing by upstream API handlers.
 *
 * @param context - Real-time sanitized inventory context text
 * @returns Fully composed prompt string ready for LLM inference
 */
export function buildRestockPrompt(context: string): string {
  return `Kamu adalah AI analis warehouse. Tugasmu menganalisis data stok dan memberikan rekomendasi restock yang spesifik dan actionable.

KONDISI INVENTARIS WAREHOUSE REAL-TIME:
${context}

PETUNJUK ANALISIS & ATURAN RESTOCK:
1. Identifikasi produk yang membutuhkan restock (kuantitas <= 20 unit atau berdasarkan laju tren pengeluaran stok).
2. Tentukan tingkat prioritas secara akurat:
   - "critical": Stok habis (qty = 0) ATAU diproyeksikan habis dalam < 5 hari.
   - "high": Stok diproyeksikan habis dalam 5 sampai 14 hari.
   - "medium": Stok diproyeksikan habis dalam 14 sampai 30 hari.
3. Hitung saran kuantitas restock ("suggested_reorder_qty"):
   - Gunakan formula perkiraan buffer 30 hari: (rata-rata pengeluaran harian * 30 hari buffer). Bulatkan ke atas ke bilangan bulat terdekat.
   - Jika tidak tersedia data tren harian: gunakan nilai default minimum 50 unit sebagai batas stok aman.
   - Pertimbangkan ketersediaan stok di gudang lain jika tercantum sebagai catatan pada alasan ("reason").
4. Maksimum berikan 10 item rekomendasi terbaik, diurutkan dari prioritas paling mendesak (critical -> high -> medium).
5. Fokus HANYA pada produk yang memerlukan tindakan restock segera. Abaikan produk yang kondisi stoknya sehat/aman.
6. Kolom "reason" wajib ditulis dalam Bahasa Indonesia yang ringkas dan padat (maksimal 100 karakter).

FORMAT OUTPUT WAJIB:
Balas HANYA dengan format raw JSON valid. DILARANG menambahkan kalimat pembuka, teks penutup, penjelasan di luar JSON, maupun format markdown/backticks (JANGAN gunakan \`\`\` atau \`\`\`json).

Skema JSON yang diwajibkan:
{
  "recommendations": [
    {
      "product_name": "string (nama produk)",
      "sku": "string (kode SKU produk)",
      "warehouse_name": "string (nama gudang terkait)",
      "current_quantity": 0,
      "unit": "string (misal: pcs, box, kg)",
      "priority": "critical | high | medium",
      "suggested_reorder_qty": 0,
      "reason": "string (alasan ringkas, maks 100 karakter)"
    }
  ],
  "summary": "string (1-2 kalimat ringkasan eksekutif dalam Bahasa Indonesia)",
  "generated_at": "${new Date().toISOString()}"
}

Jika seluruh stok berada dalam kondisi aman dan tidak ada produk yang membutuhkan restock, kembalikan format:
{
  "recommendations": [],
  "summary": "Semua stok dalam kondisi aman.",
  "generated_at": "${new Date().toISOString()}"
}`
}

