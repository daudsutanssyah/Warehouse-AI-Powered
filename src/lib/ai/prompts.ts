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
 * 3. Strict Precedence Decision Tree:
 *    - 'critical': Stock is 0 OR projected to run out within < 5 days. Never demoted.
 *    - 'high': Current stock 1-10 units OR projected to run out in 5-14 days.
 *    - 'medium': Current stock 11-20 units OR projected to run out in 15-30 days.
 * 4. Deterministic Reorder Quantity: Formula Math.ceil((Daily Burn Rate * 30 days) - Current Stock) to avoid flat fallback defaults.
 * 5. Grounded Reason Pattern: Enforces template [Status & Sisa] + [Proyeksi Hari] + [Aksi Transfer/Reorder].
 * 6. Few-Shot In-Context Learning: Concrete examples for stockouts, transfer opportunities, and un-trended items.
 * 7. Strict Pure-JSON Contract: Explicitly forbids markdown fences (` ```json `) to guarantee zero-overhead parsing.
 *
 * @param context - Real-time sanitized inventory context text
 * @returns Fully composed prompt string ready for LLM inference
 */
export function buildRestockPrompt(context: string): string {
  return `Kamu adalah AI Senior Supply Chain & Warehouse Analyst. Tugasmu adalah menganalisis data inventaris gudang dan menghasilkan rekomendasi restock yang sangat akurat, matematis, dan actionable.

KONDISI INVENTARIS WAREHOUSE REAL-TIME:
${context}

ATURAN ANALISIS & LOGIKA KEPUTUSAN (STRICT HIERARCHY):

1. ATURAN PRIORITAS (Ikuti urutan prioritas dari atas ke bawah, JANGAN turunkan level jika syarat terpenuhi):
   - "critical": WAJIB jika sisa stok = 0 ATAU proyeksi habis < 5 hari. Tidak boleh ada stok 0 yang berstatus selain 'critical'.
   - "high": Sisa stok 1 s/d 10 unit ATAU proyeksi habis antara 5 s/d 14 hari.
   - "medium": Sisa stok 11 s/d 20 unit ATAU proyeksi habis antara 15 s/d 30 hari.
   - Abaikan produk yang memiliki stok > 20 unit dengan proyeksi habis > 30 hari.

2. ATURAN PERHITUNGAN REORDER QUANTITY ("suggested_reorder_qty"):
   - Jika tersedia data "Laju Keluar/Hari":
     Formula = Math.ceil((Laju Keluar/Hari * 30 hari buffer) - Sisa Stok Saat Ini).
     Contoh: Laju 4.0/hari, sisa stok 10 -> (4.0 * 30) - 10 = 110 unit.
   - Jika sisa stok = 0 dan ada laju keluar:
     Formula = Math.ceil(Laju Keluar/Hari * 30 hari buffer).
   - HANYA jika data pengeluaran/tren sama sekali TIDAK ADA (0 unit keluar):
     Gunakan default 50 unit untuk barang umum (atau sesuaikan dengan unit produk).

3. ATURAN PENULISAN "reason" (Maksimal 100 karakter):
   DILARANG menulis alasan klise seperti "Stok menipis, perlu restock".
   WAJIB mengikuti pola spesifik ini:
   Pola: "[Sisa Unit/Habis] (habis dalam X hari). [Saran Transfer jika gudang lain ada stok / Peringatan Gudang Penuh / Reorder Supplier]."

CONTOH REKOMENDASI YANG DIHARAPKAN (FEW-SHOT EXAMPLES):
- Contoh 1 (Stok Habis Total):
  "reason": "Stok 0 habis total (0 hari). Gudang Tangerang penuh, stok gudang lain kosong."
  "priority": "critical", "suggested_reorder_qty": 120
- Contoh 2 (Stok Kritis + Opsi Transfer Antar Gudang):
  "reason": "Sisa 12 pouch (habis 4 hari). Rekomendasi transfer 40 unit dari Gudang Jakarta (stok 85)."
  "priority": "critical", "suggested_reorder_qty": 78
- Contoh 3 (Stok Menipis Tanpa Tren):
  "reason": "Sisa 15 kg mendekati batas minimum 20 unit tanpa riwayat tren pengeluaran."
  "priority": "medium", "suggested_reorder_qty": 50

FORMAT OUTPUT WAJIB:
Balas HANYA dengan JSON valid, tanpa teks pengantar, tanpa markdown/backticks (\`\`\`json).

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
      "reason": "string (maksimal 100 karakter)"
    }
  ],
  "summary": "string (1-2 kalimat ringkasan situasi gudang dan tindakan prioritas utama)",
  "generated_at": "${new Date().toISOString()}"
}

Jika semua stok aman (tidak ada produk <= 20 unit atau proyeksi <= 30 hari), kembalikan:
{
  "recommendations": [],
  "summary": "Semua stok dalam kondisi aman dan mencukupi kebutuhan operasional.",
  "generated_at": "${new Date().toISOString()}"
}`
}
