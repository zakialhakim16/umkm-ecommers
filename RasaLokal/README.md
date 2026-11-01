# Aplikasi RasaLokal

Aplikasi Expo/React Native untuk ekosistem RasaLokal. Satu source menghasilkan tiga aplikasi terpisah untuk pembeli, pemilik UMKM, dan driver; semuanya memakai Supabase dan state pesanan yang sama.

## Tiga aplikasi, satu ekosistem

```bash
npm run start:consumer  # RasaLokal untuk pembeli
npm run start:merchant  # RasaLokal Mitra untuk pemilik UMKM
npm run start:driver    # RasaLokal Driver untuk pengantaran
```

Masing-masing varian memakai Metro terpisah agar bundle tidak tertukar: consumer `8081`, Mitra `8082`, dan Driver `8083`. Hentikan server lama dengan `Ctrl+C`, jalankan satu varian, lalu scan QR baru yang dicetak oleh perintah tersebut.

| Varian | Identifier production | Entry flow |
|---|---|---|
| consumer | `id.rasalokal.consumer` | `/(tabs)` |
| merchant | `id.rasalokal.mitra` | `/seller` |
| driver | `id.rasalokal.driver` | `/driver` |

Preview build:

```bash
npx eas-cli@latest build --profile consumer-preview
npx eas-cli@latest build --profile merchant-preview
npx eas-cli@latest build --profile driver-preview
```

Production build tersedia melalui `npm run build:consumer`, `npm run build:merchant`, dan `npm run build:driver`. Ketiga aplikasi memiliki scheme berbeda sehingga dapat dipasang bersamaan.

Role bersifat multi-value melalui `user_roles`; tim toko memakai `store_memberships`. Timeline `order_events` dan `platform_outbox` menjadi fondasi notifikasi serta observability. Authorization tetap ditegakkan di RLS/RPC, bukan hanya router aplikasi.

## Persiapan

```bash
npm install
cp .env.example .env.local
```

Isi konfigurasi publik Supabase pada `.env.local`. Jangan commit kredensial atau service role key.

## Menjalankan

Gunakan salah satu perintah varian di atas. `npm start` tetap menjalankan varian dari `EXPO_PUBLIC_APP_VARIANT` pada `.env.local` dan default-nya adalah `consumer`.

## Struktur source

- `src/app`: layar dan layout Expo Router.
- `src/components`: komponen UI lintas layar.
- `src/hooks`: hooks aplikasi.
- `src/lib`: akses data, penyimpanan, pembayaran, akun, dan pengantaran.
- `src/constants`: tema dan data konstan.
- `assets`: ikon serta aset build yang direferensikan `app.json`.
- `supabase`: migrasi database dan Edge Functions.
- `scripts`: pengujian dan utilitas pengembangan.

## Validasi

```bash
npm run lint
npx tsc --noEmit
```

Dokumentasi driver tersedia di folder `docs`. Detail arsitektur keseluruhan dan dashboard admin tersedia pada README di root repositori.
