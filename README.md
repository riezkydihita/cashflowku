# Cashflow Ku

Aplikasi pengatur cashflow pribadi (pemasukan, pengeluaran, target tabungan,
alokasi kategori, analisis kebiasaan kecil, dan analisa rencana beli barang),
bisa dipakai di device mana pun karena datanya sinkron lewat **Cloudflare
Workers + Workers KV**.

## Struktur folder

```
cashflowku/
├─ public/
│  └─ index.html        # seluruh UI & logic frontend (vanilla JS + Tailwind CDN)
├─ src/
│  └─ index.js           # Worker: serve file statis + handle /api/data
├─ wrangler.jsonc         # konfigurasi Worker (assets + KV binding)
└─ README.md
```

Tidak ada proses build (tidak pakai bundler/framework). Saat kamu connect
repo ini ke Cloudflare lewat "Connect to Git", Cloudflare otomatis mendeteksi
ini sebagai project statis + Worker, dan menjalankan `npx wrangler deploy`
sebagai deploy command (ini normal, bukan error).

## Cara kerja sinkronisasi

Sama seperti sebelumnya: setiap device punya **Kode Sinkron** yang
disimpan di `localStorage`, dipakai sebagai key untuk baca/tulis data JSON
ke Workers KV lewat `/api/data?id=KODE`. Masukkan kode yang sama di device
lain untuk menyamakan data.

⚠️ Catatan keamanan: tanpa akun/password, siapa pun yang tahu Kode
Sinkronmu bisa membaca/menimpa datamu — jangan bagikan kode itu.

## Langkah deploy

### 1. Buat KV Namespace di Cloudflare

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **KV**.
2. **Create namespace**, beri nama `cashflowku-data` → **Create**.
3. **Salin ID namespace-nya** (bentuknya string panjang acak).

### 2. Masukkan ID KV ke wrangler.jsonc

Buka file `wrangler.jsonc`, ganti `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`
dengan ID asli dari langkah 1:

```jsonc
"kv_namespaces": [
  { "binding": "CASHFLOW_KV", "id": "ID_ASLI_KAMU_DI_SINI" }
]
```

Simpan filenya.

### 3. Push ke GitHub

```bash
cd cashflowku
git add .
git commit -m "Ganti ke struktur Workers static assets"
git push
```

(Kalau repo belum pernah di-push sama sekali, jalankan dulu `git init`,
`git branch -M main`, `git remote add origin https://github.com/USERNAME/cashflowku.git`
sebelum `git push -u origin main`.)

### 4. Cek project Cloudflare kamu

Karena repo sudah terhubung ke project `cashflowku` di Cloudflare, push di
atas otomatis memicu deployment baru. Buka **Workers & Pages → cashflowku →
Deployments**, tunggu sampai statusnya selesai (bukan "Initializing" terus).

Kalau ada baris **Root directory** yang isinya bukan `/`, ubah dulu di
**Settings → Build** jadi `/` (kosong/root), karena semua file (`public/`,
`src/`, `wrangler.jsonc`) ada di root repo.

### 5. Selesai

Buka URL project kamu (klik tombol **Visit** di halaman deployment), lalu:
- Klik **Aktifkan Sinkronisasi Antar Device** untuk dapat Kode Sinkron.
- Buka URL yang sama di HP/laptop lain, masukkan kode yang sama → data ikut sinkron.

## Development lokal (opsional)

```bash
npm install -g wrangler
wrangler login
wrangler dev
```

## Pengembangan lanjutan (opsional)

- **Autentikasi**: ganti Kode Sinkron dengan email+password, atau pasang
  **Cloudflare Access** di depan `/api/*`.
- **Riwayat/versioning**: simpan snapshot per bulan di KV terpisah
  (`id:2026-09`) untuk riwayat historis.
- **Ganti KV ke D1**: kalau datanya makin kompleks (banyak transaksi),
  Cloudflare D1 (SQLite) lebih cocok untuk query per kategori/tanggal.
