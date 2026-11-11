# AI Output Baselines & Mock Fixtures

Folder ini menyimpan kumpulan contoh (*baseline dataset*) respons AI dari Gemini API untuk fitur **Rekomendasi Restock**.

## 🎯 Tujuan
1. **Regression Benchmark**: Menjadi acuan kualitas output saat melakukan iterasi atau perubahan prompt. Jika kualitas rekomendasi menurun setelah prompt diubah, Anda dapat membandingkannya dengan file di sini.
2. **Local Mocking (Zero Quota)**: Digunakan untuk mock respons AI saat development lokal atau unit testing tanpa perlu melakukan request ke Gemini API (menghemat kuota Free Tier).

---

## 📁 Daftar File

| File | Deskripsi | Kegunaan |
| :--- | :--- | :--- |
| **`good-restock-response.json`** | Output ideal dengan prioritas akurat, kuantitas matematis, dan alasan spesifik. | Baseline emas (*gold standard*) & mock default. |
| **`bad-restock-response.json`** | Contoh output rusak/terdegradasi (prioritas tertahan 'medium', qty flat 50, alasan klise). | Pengingat anti-pattern (*what to avoid*). |
| **`empty-healthy-response.json`** | Kasus stok aman di mana tidak ada barang yang perlu di-restock. | Testing UI Empty State (*CheckCircle* icon). |
| **`cross-warehouse-response.json`** | Kasus multi-gudang kompleks dengan rekomendasi transfer internal. | Testing skenario transfer antar gudang. |
| **`index.ts`** | Helper TypeScript untuk mengimpor mock response secara instan. | Digunakan di endpoint/komponen untuk mock dev. |

---

## 📋 Rubrik Evaluasi Output AI (Kualitas Baik vs Buruk)

| Kriteria | ✅ Output Baik (`good-restock-response.json`) | ❌ Output Buruk (`bad-restock-response.json`) |
| :--- | :--- | :--- |
| **Priority** | Stok 0 atau habis $< 5$ hari **wajib** `critical`. Bertingkat jelas (`critical` -> `high` -> `medium`). | Stok 0 diberi label `medium`. Semua item berprioritas sama. |
| **Reorder Qty** | Berdasarkan formula $\lceil (\text{Laju Keluar} \times 30) - \text{Sisa Stok} \rceil$. Kuantitas variatif dan realistis. | Angka flat seragam (selalu 50) terlepas dari laju tren. |
| **Reason** | Spesifik: Menyebutkan sisa unit, estimasi hari, dan opsi transfer gudang lain. | Klise dan generik: *"Stok menipis dan perlu restock segera"*. |
| **Summary** | Menyebutkan produk penting yang paling kritis dan langkah tindakan spesifik. | Generalisasi samar: *"Beberapa produk di gudang berstatus menipis"*. |

---

## 💻 Cara Menggunakan Mock Saat Development

Jika kuota Gemini habis atau ingin bekerja secara offline, Anda dapat menggunakan helper di `src/app/api/ai/insights/restock/route.ts`:

```typescript
import { getMockRestockInsight } from '@/lib/ai/test-outputs'

// Cukup ganti pemanggilan gemini dengan:
if (process.env.USE_AI_MOCK === 'true') {
  return NextResponse.json(getMockRestockInsight('good'))
}
```

