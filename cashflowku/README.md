# Cashflow Ku

Aplikasi pengatur cashflow pribadi (pemasukan, pengeluaran, target tabungan,
alokasi kategori, analisis kebiasaan kecil, dan analisa rencana beli barang),
bisa dipakai di device mana pun karena datanya sinkron lewat Cloudflare
Pages Functions + Workers KV.

## Struktur folder

```
cashflowku/
├─ public/
│  └─ index.html        # seluruh UI & logic frontend (vanilla JS + Tailwind CDN)
├─ functions/
│  └─ api/
│     └─ data.js         # backend: GET/POST data per "Kode Sinkron" ke KV
├─ wrangler.toml          # config untuk dev lokal via wrangler
└─ README.md
```

Tidak ada proses build (tidak pakai bundler/framework), jadi deploy-nya
sangat sederhana: Cloudflare Pages langsung menyajikan folder `public/`
dan menjalankan `functions/` sebagai serverless functions.

## Cara kerja sinkronisasi

- Setiap device menyimpan salinan data di `localStorage` (tetap bisa
  dipakai offline).
- Saat kamu menekan **"Aktifkan Sinkronisasi Antar Device"**, aplikasi
  membuat **Kode Sinkron** acak (contoh: `a1b2c3d4e5f6`).
- Kode ini disimpan di `localStorage` device tersebut, dan dipakai sebagai
  key untuk menyimpan/mengambil data JSON di Workers KV lewat endpoint
  `/api/data?id=KODE`.
- Untuk memakai di device lain: buka app di device itu, klik tombol yang
  sama, lalu **masukkan Kode Sinkron yang sama** (bukan buat baru). Semua
  data otomatis tertarik dari server.
- Setiap perubahan (tambah pemasukan, ubah target, dll) otomatis
  di-push ke server ±0.6 detik setelah kamu berhenti mengetik/klik.

⚠️ Catatan keamanan: skema ini sengaja dibuat simpel (tanpa akun/password)
untuk penggunaan pribadi. Siapa pun yang tahu Kode Sinkronmu bisa membaca/
menimpa datamu — jangan bagikan kode itu ke orang lain. Kalau nanti mau
lebih aman, tinggal tambahkan Cloudflare Access atau autentikasi
sederhana (lihat bagian "Pengembangan lanjutan" di bawah).

## Langkah deploy

### 1. Push ke GitHub

```bash
cd cashflowku
git init
git add .
git commit -m "Initial commit: Cashflow Ku"
git branch -M main
git remote add origin https://github.com/USERNAME/cashflowku.git
git push -u origin main
```

### 2. Buat KV Namespace di Cloudflare

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **KV**.
2. Klik **Create namespace**, beri nama misalnya `cashflowku-data`, lalu **Create**.
3. Catat namespace ID-nya (dipakai nanti kalau mau dev lokal dengan `wrangler`).

### 3. Buat Project Cloudflare Pages dari GitHub

1. Di dashboard Cloudflare: **Workers & Pages** → **Create application** → tab **Pages** → **Connect to Git**.
2. Pilih repo `cashflowku` yang baru kamu push.
3. Build settings:
   - **Framework preset**: `None`
   - **Build command**: (kosongkan)
   - **Build output directory**: `public`
4. Klik **Save and Deploy**.

### 4. Hubungkan KV Namespace ke Project Pages

1. Buka project Pages yang baru dibuat → **Settings** → **Functions** → **KV namespace bindings**.
2. Klik **Add binding**:
   - **Variable name**: `CASHFLOW_KV`
   - **KV namespace**: pilih `cashflowku-data` yang dibuat di langkah 2.
3. Save, lalu trigger **Retry deployment** (atau push commit baru) supaya binding aktif.

### 5. Selesai

Buka URL Pages kamu (misalnya `https://cashflowku.pages.dev`), lalu:
- Klik **Aktifkan Sinkronisasi Antar Device** untuk dapat Kode Sinkron.
- Buka URL yang sama di HP/laptop lain, masukkan kode yang sama → data ikut sinkron.

(Opsional) Kalau punya domain sendiri, tinggal tambahkan **Custom domain**
di Settings project Pages.

## Development lokal (opsional)

```bash
npm install -g wrangler
wrangler login
# isi id KV asli di wrangler.toml, lalu:
wrangler pages dev public --kv CASHFLOW_KV
```

## Pengembangan lanjutan (opsional)

- **Autentikasi**: ganti Kode Sinkron dengan email+password sederhana,
  atau pasang **Cloudflare Access** di depan `/api/*` agar hanya kamu
  yang bisa mengakses.
- **Riwayat/versioning**: simpan snapshot per bulan di KV terpisah
  (`id:2026-09`) supaya ada riwayat historis, bukan cuma state terakhir.
- **Ganti KV ke D1**: kalau datanya makin kompleks (banyak transaksi),
  Cloudflare D1 (SQLite) lebih cocok daripada KV untuk query per kategori/tanggal.
