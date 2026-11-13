# 📦 Warehouse AI Powered

> **Enterprise-Grade Multi-Warehouse Management System with AI-Driven Restock Analytics**

Aplikasi sistem manajemen gudang modern (*Warehouse Management System*) berbasis **Next.js 16**, **Supabase (PostgreSQL)**, dan **Google Gemini AI**. Dirancang untuk mengelola inventaris lintas gudang secara real-time serta memberikan rekomendasi pengadaan ulang (*restock*) dan transfer stok antar-gudang secara otomatis menggunakan kecerdasan buatan.

---

## 🚀 Live Demo & Akses Recruiter

Aplikasi telah di-deploy secara publik dan siap diuji langsung:

- **🌐 Live URL:** [https://warehouse-ai-powered.vercel.app/](https://warehouse-ai-powered.vercel.app/)
- **🔑 Akun Demo (Telah Terisi Data Lengkap):**
  - **Email:** `akundemo@gmail.com`
  - **Password:** `demolahkak`

> 💡 **Tips untuk Recruiter:** Di halaman login, Anda cukup mengklik tombol **"Gunakan Akun Demo"** untuk mengisi email dan password secara otomatis dalam 1 klik tanpa perlu mengetik manual.

---

## ✨ Fitur Utama (Key Features)

### 1. 🤖 AI-Powered Restock Insights (Google Gemini AI)
- **Deteksi Kritis & Stok Habis Otomatis:** Menganalisis kondisi stok real-time untuk mendeteksi barang habis ($0$ unit) dan kritis ($\le 20$ unit).
- **Kuantitas Reorder Dinamis:** Menghitung saran jumlah pemesanan ulang (*reorder quantity*) berbasis formula laju pengeluaran harian dan buffer 30 hari:
  $$\text{Reorder Qty} = \lceil (\text{Laju Pengeluaran/Hari} \times 30) - \text{Sisa Stok} \rceil$$
- **Rekomendasi Transfer Antar Gudang:** Jika stok di suatu gudang menipis tetapi gudang lain memiliki surplus, AI secara cerdas menyarankan transfer internal sebelum mengajukan Purchase Order baru ke supplier.
- **Safety Guard & Auto-Cascade:** Dilengkapi sistem *fallback* otomatis antar-model Gemini (`gemini-2.5-flash` $\to$ `gemini-3.1-flash-lite-preview`) serta perlindungan kuota agar penguji/recruiter selalu mendapatkan respons yang mulus dan bebas error.

### 2. 🏢 Manajemen Multi-Gudang (Multi-Warehouse)
- Pemantauan kapasitas maksimal dan persentase utilitas setiap gudang (Status: *Aman*, *Padat*, *Kritis*).
- Visibilitas stok terpusat di seluruh lokasi gudang fisik (Pusat Jakarta, Distribusi Tangerang, Hub Bekasi).

### 3. 📦 Manajemen Produk & Mutasi Stok Real-Time
- Manajemen katalog SKU produk, satuan unit, kategori barang, dan harga.
- Pencatatan riwayat transaksi mutasi stok (*Stock In*, *Stock Out*, *Adjustment*) yang mendasari analisis pergerakan tren 30 hari terakhir.

### 4. 🛡️ Keamanan Berlapis (Defense in Depth)
- **Lapisan 1 (Network Edge):** Next.js Proxy/Middleware memverifikasi keaslian sesi dengan `supabase.auth.getUser()` (anti-spoofing) dan memblokir request tidak terautentikasi sebelum menyentuh komputasi server.
- **Lapisan 2 (Application Scoping):** Setiap query backend secara eksplisit membatasi lingkup data berdasarkan `user_id`.
- **Lapisan 3 (PostgreSQL RLS):** *Row Level Security* di level database memastikan isolasi data antar-pengguna terjamin 100%.
- **Data Sanitization:** Masking data sensitif (PII) seperti email, UUID, dan nomor telepon sebelum dikirim ke prompt LLM.

---

## 🛠️ Tech Stack

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router, Server Components, Partial Prerendering, Turbopack |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict Type Safety di seluruh lapisan data & API |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) | Desain antarmuka responsif, modern, dan accessible |
| **Icons** | [Lucide React](https://lucide.dev/) | Konsistensi icon modern |
| **Database & Auth** | [Supabase](https://supabase.com/) | PostgreSQL, Supabase Auth SSR, Row Level Security (RLS) |
| **AI Engine** | [Google Gemini API](https://ai.google.dev/) | `@google/genai` SDK (`gemini-2.5-flash` & `gemini-3.1-flash-lite-preview`) |
| **Deployment** | [Vercel](https://vercel.com/) | Edge Network, Serverless Functions, Continuous Deployment |

---

## 🏛️ Arsitektur Sistem

```
┌────────────────────────────────────────────────────────┐
│                   Pengguna / Browser                   │
└──────────────────────────┬─────────────────────────────┘
                           │ Request
                           ▼
┌────────────────────────────────────────────────────────┐
│           Next.js Edge Middleware (src/proxy.ts)        │
│   - Route Matcher (Bypass Static Assets)               │
│   - Session Verification (supabase.auth.getUser)       │
│   - Auto Refresh Token (getAll / setAll cookies)       │
└──────────────┬──────────────────────────┬──────────────┘
               │ (Unauthenticated)        │ (Authorized)
               ▼                          ▼
       Redirect ke /login        ┌───────────────────────────────────┐
                                 │   Next.js App Router (Server Cmp) │
                                 │   - Dashboard, Products, Stock    │
                                 └──────────────┬────────────────────┘
                                                │
                      ┌─────────────────────────┴────────────────────────┐
                      ▼                                                  ▼
     ┌───────────────────────────────────┐              ┌──────────────────────────────────┐
     │      Database Supabase (Postgres) │              │    AI Analytics Service Engine   │
     │  - Row Level Security (RLS)       │              │  - Context Builder & Sanitizer   │
     │  - Tables: products, warehouses,  │              │  - Prompt with Strict Hierarchy  │
     │    stock, stock_history           │              │  - Google Gemini API (Flash)     │
     └───────────────────────────────────┘              │  - Quota Safety Guard / Fallback │
                                                        └──────────────────────────────────┘
```

---

## 💻 Panduan Instalasi Lokal (Local Development)

Jika Anda ingin menjalankan proyek ini di lingkungan lokal:

### 1. Clone Repository
```bash
git clone https://github.com/daudsutanssyah/Warehouse-AI-Powered.git
cd Warehouse-AI-Powered
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin template konfigurasi dan sesuaikan nilai API keys Anda:
```bash
cp .env.example .env.local
```

Isi file `.env.local` dengan kredensial berikut:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Eksekusi Data Seeder (Opsional)
Untuk mengisi akun demo dengan data gudang, produk FMCG, dan mutasi stok secara instan:
```bash
npm run seed:demo
```

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 📊 Kualitas & Benchmarking AI

Untuk memastikan hasil analisis restock selalu akurat, proyek ini menyertakan *baseline regression dataset* di [`src/lib/ai/test-outputs/`](./src/lib/ai/test-outputs/):

- **`good-restock-response.json`**: Standar emas (*gold standard*) dengan prioritas ketat, perhitungan buffer matematis, dan alasan spesifik.
- **`bad-restock-response.json`**: Contoh *anti-pattern* (stok 0 berstatus medium, kuantitas seragam 50 unit) sebagai parameter evaluasi kualitas prompt.
- **`empty-healthy-response.json`**: Kasus uji saat seluruh stok dalam kondisi aman.
- **`cross-warehouse-response.json`**: Kasus uji mutasi transfer antar-gudang saat kapasitas gudang tujuan penuh.

---

## 👨‍💻 Author

Dibuat dengan dedikasi tinggi untuk rekayasa perangkat lunak modern dan integrasi kecerdasan buatan praktis.

- **GitHub:** [@daudsutanssyah](https://github.com/daudsutanssyah)
- **Repository:** [Warehouse-AI-Powered](https://github.com/daudsutanssyah/Warehouse-AI-Powered)
- **Live Demo:** [https://warehouse-ai-powered.vercel.app/](https://warehouse-ai-powered.vercel.app/)
