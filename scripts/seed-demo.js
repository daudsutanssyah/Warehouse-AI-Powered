const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read environment variables from .env.local
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach((line) => {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan di .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEMO_EMAIL = 'akundemo@gmail.com';
const DEMO_PASSWORD = 'demolahkak';

async function seed() {
  console.log(`\n🚀 Memulai Seeder untuk Akun Demo: ${DEMO_EMAIL}...`);

  // 2. Sign In or Sign Up
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (authError) {
    console.log(`Info login gagal (${authError.message}), mencoba mendaftarkan akun baru...`);
    const signUpRes = await supabase.auth.signUp({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (signUpRes.error) {
      console.error('Gagal membuat/login akun demo:', signUpRes.error.message);
      process.exit(1);
    }
    authData = signUpRes.data;
  }

  const user = authData?.user;
  if (!user) {
    console.error('Error: Tidak berhasil mengautentikasi user demo.');
    process.exit(1);
  }

  const userId = user.id;
  console.log(`✅ Berhasil login sebagai akun demo (User ID: ${userId})`);

  // 3. Clean up existing data for this user
  console.log('🧹 Membersihkan data lama akun demo...');
  // Delete stock_history first (via linked stocks)
  const { data: existingStocks } = await supabase
    .from('stock')
    .select('id, warehouse_id, product_id')
    .eq('warehouse.user_id', userId);

  if (existingStocks && existingStocks.length > 0) {
    const stockIds = existingStocks.map((s) => s.id);
    await supabase.from('stock_history').delete().in('stock_id', stockIds);
  }

  // Delete stock
  const { data: existingWarehouses } = await supabase
    .from('warehouses')
    .select('id')
    .eq('user_id', userId);

  if (existingWarehouses && existingWarehouses.length > 0) {
    const whIds = existingWarehouses.map((w) => w.id);
    await supabase.from('stock').delete().in('warehouse_id', whIds);
  }

  // Delete products & warehouses
  await supabase.from('products').delete().eq('user_id', userId);
  await supabase.from('warehouses').delete().eq('user_id', userId);
  console.log('✅ Pembersihan selesai.');

  // 4. Seed 3 Warehouses
  console.log('🏢 Menambahkan 3 Gudang Strategis...');
  const warehouseInputs = [
    {
      user_id: userId,
      name: 'Gudang Pusat Jakarta',
      location: 'Jakarta Barat (Hub Utama)',
      max_capacity: 5000,
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Gudang Distribusi Tangerang',
      location: 'Tangerang (Kawasan Industri)',
      max_capacity: 2500,
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Hub Logistik Bekasi',
      location: 'Bekasi Timur',
      max_capacity: 1500,
      is_active: true,
    },
  ];

  const { data: createdWarehouses, error: whError } = await supabase
    .from('warehouses')
    .insert(warehouseInputs)
    .select();

  if (whError || !createdWarehouses) {
    console.error('Gagal menambahkan gudang:', whError);
    process.exit(1);
  }

  const whJakarta = createdWarehouses.find((w) => w.name.includes('Jakarta'));
  const whTangerang = createdWarehouses.find((w) => w.name.includes('Tangerang'));
  const whBekasi = createdWarehouses.find((w) => w.name.includes('Bekasi'));

  console.log(`✅ 3 Gudang berhasil dibuat:`);
  createdWarehouses.forEach((w) => console.log(`   - ${w.name} (Kapasitas: ${w.max_capacity} unit)`));

  // 5. Seed 12 FMCG / Sembako Products
  console.log('\n📦 Menambahkan 12 Produk FMCG & Sembako...');
  const productInputs = [
    {
      user_id: userId,
      name: 'Beras Premium Pandan Wangi 5kg',
      sku: 'BRS-PW-001',
      category: 'Beras & Biji-bijian',
      price: 78000,
      unit: 'kg',
      description: 'Beras aromatik pandan wangi kualitas super',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Minyak Goreng Sawit 2L',
      sku: 'MYK-SW-002',
      category: 'Minyak Goreng',
      price: 34000,
      unit: 'pouch',
      description: 'Minyak kelapa sawit murni kemasan pouch 2 liter',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Gula Pasir Kristal Putih 1kg',
      sku: 'GL-KP-003',
      category: 'Bahan Pokok',
      price: 17500,
      unit: 'kg',
      description: 'Gula tebu murni kristal putih kemasan 1 kg',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Tepung Terigu Serbaguna 1kg',
      sku: 'TPG-TR-004',
      category: 'Tepung & Olahan',
      price: 13000,
      unit: 'kg',
      description: 'Tepung terigu protein sedang untuk aneka olahan',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Kecap Manis Botol 600ml',
      sku: 'KCP-MN-005',
      category: 'Bumbu Dapur',
      price: 24000,
      unit: 'botol',
      description: 'Kecap manis kedelai hitam kental rasa mantap',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Kopi Bubuk Robusta 250g',
      sku: 'KP-RB-006',
      category: 'Minuman',
      price: 28000,
      unit: 'pack',
      description: 'Kopi robusta sangrai aroma tajam khas Nusantara',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Susu UHT Full Cream 1L',
      sku: 'SSU-UHT-007',
      category: 'Produk Susu',
      price: 19500,
      unit: 'karton',
      description: 'Susu cair segar UHT full cream tinggi kalsium',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Mie Instan Goreng Spesial (Dus)',
      sku: 'MIE-GR-008',
      category: 'Makanan Instan',
      price: 115000,
      unit: 'dus',
      description: 'Mie goreng instan isi 40 bungkus per dus',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Sarden Saus Tomat 425g',
      sku: 'SRD-TM-009',
      category: 'Makanan Kaleng',
      price: 22000,
      unit: 'kaleng',
      description: 'Ikan sarden segar dalam saus tomat gurih',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Garam Dapur Beriodium 500g',
      sku: 'GRM-IO-010',
      category: 'Bumbu Dapur',
      price: 6500,
      unit: 'bungkus',
      description: 'Garam dapur halus beryodium standar SNI',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Teh Celup Melati (Isi 25)',
      sku: 'TEH-ML-011',
      category: 'Minuman',
      price: 8500,
      unit: 'kotak',
      description: 'Teh celup wangi melati alami isi 25 sachet',
      is_active: true,
    },
    {
      user_id: userId,
      name: 'Deterjen Bubuk Konsentrat 1.8kg',
      sku: 'DET-BK-012',
      category: 'Perawatan Rumah',
      price: 42000,
      unit: 'bag',
      description: 'Deterjen konsentrat penghilang noda membandel',
      is_active: true,
    },
  ];

  const { data: createdProducts, error: prodError } = await supabase
    .from('products')
    .insert(productInputs)
    .select();

  if (prodError || !createdProducts) {
    console.error('Gagal menambahkan produk:', prodError);
    process.exit(1);
  }

  console.log(`✅ 12 Produk berhasil dibuat.`);

  // Map products by SKU
  const prodMap = {};
  createdProducts.forEach((p) => {
    prodMap[p.sku] = p;
  });

  // 6. Seed Stock Records (Skenario Menarik: Habis 0, Menipis Kritis <= 20, dan Sehat)
  console.log('\n📊 Menyiapkan Skenario Inventaris Real-Time...');
  
  // Stock distributions [product_sku, warehouse_id, quantity]
  const stockDistributions = [
    // 🔴 1. Beras Pandan Wangi -> HABIS TOTAL (0 unit di semua gudang!)
    { sku: 'BRS-PW-001', whId: whTangerang.id, qty: 0 },
    { sku: 'BRS-PW-001', whId: whBekasi.id, qty: 0 },
    { sku: 'BRS-PW-001', whId: whJakarta.id, qty: 0 },

    // 🟠 2. Minyak Goreng -> KRITIS DI BEKASI (12 pouch), SURPLUS DI JAKARTA (120 pouch) -> Peluang Transfer AI
    { sku: 'MYK-SW-002', whId: whBekasi.id, qty: 12 },
    { sku: 'MYK-SW-002', whId: whJakarta.id, qty: 120 },
    { sku: 'MYK-SW-002', whId: whTangerang.id, qty: 45 },

    // 🟠 3. Gula Pasir -> KRITIS DI TANGERANG (18 kg), SURPLUS DI JAKARTA (250 kg)
    { sku: 'GL-KP-003', whId: whTangerang.id, qty: 18 },
    { sku: 'GL-KP-003', whId: whJakarta.id, qty: 250 },
    { sku: 'GL-KP-003', whId: whBekasi.id, qty: 80 },

    // 🟠 4. Kecap Manis -> KRITIS DI TANGERANG (8 botol), MENIPIS DI BEKASI (15 botol)
    { sku: 'KCP-MN-005', whId: whTangerang.id, qty: 8 },
    { sku: 'KCP-MN-005', whId: whBekasi.id, qty: 15 },
    { sku: 'KCP-MN-005', whId: whJakarta.id, qty: 95 },

    // 🟢 5. Tepung Terigu (Stok Sehat)
    { sku: 'TPG-TR-004', whId: whJakarta.id, qty: 400 },
    { sku: 'TPG-TR-004', whId: whTangerang.id, qty: 150 },
    { sku: 'TPG-TR-004', whId: whBekasi.id, qty: 110 },

    // 🟢 6. Kopi Bubuk (Stok Sehat)
    { sku: 'KP-RB-006', whId: whJakarta.id, qty: 160 },
    { sku: 'KP-RB-006', whId: whTangerang.id, qty: 85 },
    { sku: 'KP-RB-006', whId: whBekasi.id, qty: 55 },

    // 🟢 7. Susu UHT (Stok Sehat)
    { sku: 'SSU-UHT-007', whId: whJakarta.id, qty: 250 },
    { sku: 'SSU-UHT-007', whId: whTangerang.id, qty: 80 },
    { sku: 'SSU-UHT-007', whId: whBekasi.id, qty: 65 },

    // 🟢 8. Mie Instan Dus (Stok Sehat)
    { sku: 'MIE-GR-008', whId: whJakarta.id, qty: 350 },
    { sku: 'MIE-GR-008', whId: whTangerang.id, qty: 180 },
    { sku: 'MIE-GR-008', whId: whBekasi.id, qty: 120 },

    // 🟢 9. Sarden Kaleng (Stok Sehat)
    { sku: 'SRD-TM-009', whId: whJakarta.id, qty: 180 },
    { sku: 'SRD-TM-009', whId: whTangerang.id, qty: 110 },
    { sku: 'SRD-TM-009', whId: whBekasi.id, qty: 75 },

    // 🟢 10. Garam Dapur (Stok Sehat)
    { sku: 'GRM-IO-010', whId: whJakarta.id, qty: 450 },
    { sku: 'GRM-IO-010', whId: whTangerang.id, qty: 210 },
    { sku: 'GRM-IO-010', whId: whBekasi.id, qty: 130 },

    // 🟢 11. Teh Celup (Stok Sehat)
    { sku: 'TEH-ML-011', whId: whJakarta.id, qty: 310 },
    { sku: 'TEH-ML-011', whId: whTangerang.id, qty: 140 },
    { sku: 'TEH-ML-011', whId: whBekasi.id, qty: 85 },

    // 🟢 12. Deterjen Bubuk (Stok Sehat)
    { sku: 'DET-BK-012', whId: whJakarta.id, qty: 220 },
    { sku: 'DET-BK-012', whId: whTangerang.id, qty: 130 },
    { sku: 'DET-BK-012', whId: whBekasi.id, qty: 90 },
  ];

  const stockRows = stockDistributions.map((s) => ({
    product_id: prodMap[s.sku].id,
    warehouse_id: s.whId,
    quantity: s.qty,
    updated_at: new Date().toISOString(),
  }));

  const { data: createdStocks, error: stockErr } = await supabase
    .from('stock')
    .insert(stockRows)
    .select();

  if (stockErr || !createdStocks) {
    console.error('Gagal menambahkan stok:', stockErr);
    process.exit(1);
  }

  console.log(`✅ ${createdStocks.length} Baris Stok berhasil disimpan.`);

  // 7. Seed Stock History (Mutasi Stok 30 Hari Terakhir untuk Data Tren AI)
  console.log('\n📈 Membuat Riwayat Mutasi Stok (30 Hari Terakhir) untuk Analisis AI...');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const historyEntries = [
    // Beras Pandan Wangi di Tangerang: Laju keluar 4 unit/hari, habis ke 0 unit
    {
      product_id: prodMap['BRS-PW-001'].id,
      warehouse_id: whTangerang.id,
      quantity_change: 200,
      quantity_after: 200,
      transaction_type: 'in',
      notes: 'Penerimaan stok awal dari distributor Beras',
      created_at: new Date(now - 25 * dayMs).toISOString(),
    },
    {
      product_id: prodMap['BRS-PW-001'].id,
      warehouse_id: whTangerang.id,
      quantity_change: -120,
      quantity_after: 80,
      transaction_type: 'out',
      notes: 'Pengiriman pesanan retail grosir',
      created_at: new Date(now - 14 * dayMs).toISOString(),
    },
    {
      product_id: prodMap['BRS-PW-001'].id,
      warehouse_id: whTangerang.id,
      quantity_change: -80,
      quantity_after: 0,
      transaction_type: 'out',
      notes: 'Pengiriman pesanan resto & supermarket (Stok habis total)',
      created_at: new Date(now - 2 * dayMs).toISOString(),
    },

    // Minyak Goreng di Bekasi: Laju keluar 3 unit/hari, sisa 12 unit (habis dalam 4 hari)
    {
      product_id: prodMap['MYK-SW-002'].id,
      warehouse_id: whBekasi.id,
      quantity_change: 100,
      quantity_after: 100,
      transaction_type: 'in',
      notes: 'Penerimaan batch minyak goreng sawit',
      created_at: new Date(now - 22 * dayMs).toISOString(),
    },
    {
      product_id: prodMap['MYK-SW-002'].id,
      warehouse_id: whBekasi.id,
      quantity_change: -50,
      quantity_after: 50,
      transaction_type: 'out',
      notes: 'Distribusi ke minimarket Bekasi',
      created_at: new Date(now - 12 * dayMs).toISOString(),
    },
    {
      product_id: prodMap['MYK-SW-002'].id,
      warehouse_id: whBekasi.id,
      quantity_change: -38,
      quantity_after: 12,
      transaction_type: 'out',
      notes: 'Distribusi reguler harian (Stok kritis)',
      created_at: new Date(now - 1 * dayMs).toISOString(),
    },

    // Gula Pasir di Tangerang: Laju keluar 2 unit/hari, sisa 18 kg (habis dalam 9 hari)
    {
      product_id: prodMap['GL-KP-003'].id,
      warehouse_id: whTangerang.id,
      quantity_change: 100,
      quantity_after: 100,
      transaction_type: 'in',
      notes: 'Penerimaan kiriman gula pasir tebu',
      created_at: new Date(now - 28 * dayMs).toISOString(),
    },
    {
      product_id: prodMap['GL-KP-003'].id,
      warehouse_id: whTangerang.id,
      quantity_change: -50,
      quantity_after: 50,
      transaction_type: 'out',
      notes: 'Order toko kue & bakery',
      created_at: new Date(now - 15 * dayMs).toISOString(),
    },
    {
      product_id: prodMap['GL-KP-003'].id,
      warehouse_id: whTangerang.id,
      quantity_change: -32,
      quantity_after: 18,
      transaction_type: 'out',
      notes: 'Penjualan retail horeka (Stok menipis)',
      created_at: new Date(now - 3 * dayMs).toISOString(),
    },

    // Kecap Manis di Tangerang: Sisa 8 botol
    {
      product_id: prodMap['KCP-MN-005'].id,
      warehouse_id: whTangerang.id,
      quantity_change: 50,
      quantity_after: 50,
      transaction_type: 'in',
      notes: 'Restock botol kecap',
      created_at: new Date(now - 20 * dayMs).toISOString(),
    },
    {
      product_id: prodMap['KCP-MN-005'].id,
      warehouse_id: whTangerang.id,
      quantity_change: -42,
      quantity_after: 8,
      transaction_type: 'out',
      notes: 'Distribusi warung & kantin (Stok kritis)',
      created_at: new Date(now - 2 * dayMs).toISOString(),
    },

    // Tepung Terigu di Jakarta: Mutasi sehat
    {
      product_id: prodMap['TPG-TR-004'].id,
      warehouse_id: whJakarta.id,
      quantity_change: 500,
      quantity_after: 500,
      transaction_type: 'in',
      notes: 'Pengiriman kontainer tepung pabrik',
      created_at: new Date(now - 26 * dayMs).toISOString(),
    },
    {
      product_id: prodMap['TPG-TR-004'].id,
      warehouse_id: whJakarta.id,
      quantity_change: -100,
      quantity_after: 400,
      transaction_type: 'out',
      notes: 'Pengiriman pabrik roti Jakarta',
      created_at: new Date(now - 8 * dayMs).toISOString(),
    },
  ];

  const { data: createdHistory, error: historyErr } = await supabase
    .from('stock_history')
    .insert(historyEntries)
    .select();

  if (historyErr) {
    console.error('Peringatan saat insert stock_history:', historyErr.message);
  } else {
    console.log(`✅ ${createdHistory?.length || 0} Riwayat Mutasi Stok berhasil disimpan.`);
  }

  // 8. Final Recap
  console.log('\n=========================================');
  console.log('🎉 DATA SEEDER BERHASIL DITERAPKAN!');
  console.log('=========================================');
  console.log(`Akun Demo      : ${DEMO_EMAIL}`);
  console.log(`Total Gudang   : ${createdWarehouses.length} Gudang`);
  console.log(`Total Produk   : ${createdProducts.length} Produk FMCG/Sembako`);
  console.log(`Skenario Stok  :`);
  console.log(` - 🔴 HABIS TOTAL (0 unit): Beras Premium Pandan Wangi`);
  console.log(` - 🟠 KRITIS (<20 unit)   : Minyak Goreng Sawit (12 pouch di Bekasi), Gula Pasir (18 kg di Tangerang), Kecap Manis (8 botol)`);
  console.log(` - 🟢 SURPLUS TRANSFER   : Minyak Goreng & Gula Pasir tersedia melimpah di Gudang Pusat Jakarta!`);
  console.log('=========================================\n');
}

seed().catch((err) => {
  console.error('Unhandled error saat seeding:', err);
  process.exit(1);
});

