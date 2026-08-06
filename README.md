# Sistem Keuangan Madrasah

Aplikasi Manajemen Keuangan Madrasah modern berbasis React, TypeScript, Express, dan PostgreSQL (Drizzle ORM). Aplikasi ini dirancang untuk mempermudah pengelolaan RAPBM (Rencana Anggaran Penerimaan & Belanja Madrasah), Buku Kas Umum, Penggajian/Bisyaroh Guru & Staf, Pembayaran Syahriyah Santri, serta pencetakan laporan PDF dan ekspor Excel.

---

## 📋 Prasyarat Sistem (Prerequisites)

Sebelum memulai, pastikan perangkat Anda telah terinstal:

- **Node.js**: versi 18.x atau lebih baru ([Unduh Node.js](https://nodejs.org/))
- **npm** (termasuk saat menginstal Node.js) atau **bun** / **yarn** / **pnpm**
- **PostgreSQL Database**:
  - PostgreSQL Lokal (misal via PostgreSQL App / Docker) OR
  - Database Cloud Service (seperti [Neon Tech](https://neon.tech), [Supabase](https://supabase.com), atau GCP Cloud SQL)

---

## 🚀 Langkah-Langkah Instalasi

### 1. Clone atau Unduh Repository
Unduh atau clone proyek ini ke komputer lokal Anda:
```bash
git clone <URL_REPOSITORY_ANDA>
cd sistem-keuangan-madrasah
```

### 2. Instal Dependensi Proyek
Jalankan perintah berikut di terminal untuk memasang seluruh paket dependensi:
```bash
npm install
```

---

## ⚙️ Konfigurasi Environment (`.env`)

Buat file `.env` pada direktori utama proyek dengan menyalin dari `.env.example`:

```bash
cp .env.example .env
```

Buka file `.env` dan atur variabel konfigurasi sesuai kebutuhan Anda:

```env
# URL Aplikasi
APP_URL="http://localhost:3000"

# Kunci API Gemini (Opsional: Untuk fitur analisis AI)
GEMINI_API_KEY="your_gemini_api_key_here"

# Database PostgreSQL (Direkomendasikan menggunakan DATABASE_URL)
DATABASE_URL="postgresql://user:password@localhost:5432/madrasah_db?sslmode=disable"

# Atau gunakan parameter PostgreSQL terpisah jika tidak menggunakan DATABASE_URL:
SQL_HOST="localhost"
SQL_PORT=5432
SQL_USER="postgres"
SQL_PASSWORD="password_anda"
SQL_DB_NAME="madrasah_db"
SQL_SSL="false"

# Port Server (Default: 3000)
PORT=3000
```

> **Catatan:** Jika menggunakan database cloud seperti Neon DB, gunakan string koneksi SSL pada `DATABASE_URL` (misal: `sslmode=require`).

---

## 🗄️ Persiapan & Migrasi Database

Aplikasi menggunakan **Drizzle ORM** untuk pengelolaan skema database.

### 1. Dorong Skema ke Database (Migration)
Untuk membuat semua tabel yang dibutuhkan (`rapbm`, `transactions`, `payrolls`, `student_payments`, `settings`, dll.) langsung ke database Anda, jalankan:

```bash
npm run db:push
```

### 2. Membuka Drizzle Studio (Opsional)
Jika Anda ingin melihat dan mengelola data tabel secara visual via browser:

```bash
npm run db:studio
```

---

## 💻 Menjalankan Aplikasi

### Mode Pengembangan (Development)
Jalankan perintah berikut untuk memulai dev server dengan fitur *hot reload*:

```bash
npm run dev
```
Buka browser Anda dan akses: **`http://localhost:3000`**

---

### Mode Produksi (Production)
Untuk membangun paket produksi yang dioptimalkan:

1. **Build Aplikasi:**
   ```bash
   npm run build
   ```
2. **Jalankan Server Produksi:**
   ```bash
   npm run start
   ```

Aplikasi akan berjalan pada port yang telah dikonfigurasi (`http://localhost:3000`).

---

## 🛠️ Perintah-Perintah Utama (Available Scripts)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan aplikasi dalam mode development |
| `npm run build` | Melakukan kompilasi frontend (Vite) dan backend (esbuild) ke direktori `dist/` |
| `npm run start` | Menjalankan hasil build produksi dari `dist/server.cjs` |
| `npm run db:push` | Mendorong perubahan skema Drizzle ORM ke database PostgreSQL |
| `npm run db:studio` | Membuka antarmuka Drizzle Studio di browser |
| `npm run lint` | Memeriksa ketersediaan tipe TypeScript (`tsc --noEmit`) |

---

## ✨ Fitur Utama Aplikasi

1. **RAPBM (Rencana Anggaran Penerimaan & Belanja Madrasah):**
   - Pencatatan target penerimaan dan alokasi anggaran pengeluaran.
   - Sinkronisasi realisasi keuangan otomatis dengan Buku Kas Umum.
2. **Buku Kas Umum (Kas & Arus Kas):**
   - Transaksi masuk (Penerimaan) & keluar (Pengeluaran).
   - Penyesuaian uraian otomatis dengan item RAPBM.
3. **Penggajian & Bisyaroh Guru/Staf:**
   - Perhitungan gaji pokok, tunjangan, dan insentif.
   - Cetak slip gaji PDF resmi.
4. **Pembayaran Syahriyah Santri:**
   - Pencatatan pembayaran SPP/Syahriyah, IMDA, IMNI, dll.
   - Cetak kuitansi dan rekap pembayaran.
5. **Ekspor & Cetak Laporan:**
   - Cetak Laporan RAPBM, Buku Kas, dan Slip Gaji dalam format PDF & Excel.
6. **Kalender Hijriyah & Jawa:**
   - Penanggalan otomatis terintegrasi tanggal Hijriyah dan pasaran Jawa.

---

## 📄 Lisensi

Aplikasi dikembangkan khusus untuk Manajemen Keuangan Madrasah.
