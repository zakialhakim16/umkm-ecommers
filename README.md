# RasaLokal

RasaLokal adalah platform marketplace UMKM yang terdiri dari aplikasi utama lintas platform dan dashboard administrasi web.

## Struktur repositori

```text
.
├── RasaLokal/          # Aplikasi Expo untuk pembeli, penjual, dan driver
│   ├── assets/         # Ikon dan aset aplikasi yang digunakan saat build
│   ├── docs/           # Dokumentasi alur operasional
│   ├── scripts/        # Pemeriksaan dan utilitas pengembangan
│   ├── src/
│   │   ├── app/        # Route dan layar Expo Router
│   │   ├── components/ # Komponen UI yang dapat digunakan kembali
│   │   ├── constants/  # Tema dan data konstan
│   │   ├── hooks/      # React hooks
│   │   └── lib/        # Integrasi dan logika domain
│   └── supabase/       # Migrasi dan Edge Functions
└── RasaLokal-Admin/    # Next.js Command Center untuk tim admin
    ├── app/             # App Router, halaman, dan stylesheet
    ├── components/      # UI shell, tabel, grafik, status
    ├── lib/             # Supabase clients, tipe, adapter data
    └── PRD.md           # Product requirements dan arsitektur
```

Kedua folder aplikasi sengaja ditempatkan berdampingan dan menggunakan proyek Supabase yang sama. Konfigurasi admin disimpan terpisah di `RasaLokal-Admin/.env.local`.

## Menjalankan aplikasi

### Aplikasi utama

```bash
cd RasaLokal
npm install
npm start
```

Salin `.env.example` menjadi `.env.local`, lalu isi konfigurasi publik Supabase sebelum menjalankan fitur yang memakai backend.

### Dashboard admin

```bash
cd RasaLokal-Admin
npm install
npm run dev
```

Dashboard tersedia di `http://localhost:3001`. Lihat `RasaLokal-Admin/README.md` untuk konfigurasi admin dan prosedur aktivasi akun.

## Pemeriksaan kualitas

```bash
cd RasaLokal
npm run lint
npx tsc --noEmit

cd ../RasaLokal-Admin
npm run lint
npm run typecheck
npm run build
```

File desain statis, screenshot, dan prototipe HTML tidak disimpan di root repositori agar source code produksi tetap jelas dan mudah dipelihara.
