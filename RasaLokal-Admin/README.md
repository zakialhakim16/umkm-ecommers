# RasaLokal Admin — Next.js Command Center

Admin panel baru berbasis Next.js App Router, TypeScript, Supabase SSR, dan RPC admin yang sudah dipakai aplikasi RasaLokal. UI dapat dibuka dalam mode demo tanpa kredensial; koneksi produksi memakai proyek Supabase yang sama dengan aplikasi Expo.

## Jalankan lokal

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3001`. Halaman login berada di `/login`; tombol **Lihat demo tanpa akun** membuka dataset lokal yang aman.

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
ADMIN_DEMO_MODE=true
```

Gunakan hanya anon/publishable key. Jangan pernah menaruh service-role key di proyek ini.

## Mengaktifkan admin

Jalankan seluruh migrasi `../RasaLokal/supabase/migrations` pada proyek Supabase. Setelah akun dibuat dan email dikonfirmasi, pemilik proyek dapat mengaktifkan admin:

```sql
insert into public.marketplace_admins(user_id, active)
select id, true from auth.users where lower(email) = lower('admin@contoh.id')
on conflict (user_id) do update set active = true;
```

## Perintah

```bash
npm run dev        # development port 3001
npm run typecheck  # pemeriksaan TypeScript
npm run lint       # ESLint
npm run build      # production build
npm start          # production port 3001
```

## Struktur

- `app/` — route, layout, halaman, dan global style.
- `components/` — shell, navigasi, tabel, grafik, status.
- `lib/supabase/` — browser/server clients.
- `lib/demo-data.ts` — data presentasi yang terpisah dari data nyata.
- `PRD.md` — product requirements, arsitektur, keamanan, dan roadmap.

## Status integrasi

Server DAL terhubung ke `admin_dashboard_snapshot` dan `admin_list_entities`. Mutasi melalui `admin_perform_action` aktif untuk moderasi UMKM/produk, verifikasi pembayaran, aktivasi driver, dan dispatch driver; seluruhnya dikonfirmasi di UI serta dicatat pada audit log. Dengan `ADMIN_DEMO_MODE=true`, UI jatuh kembali ke dataset aman dan mutasi tidak menulis data. Untuk produksi, set `ADMIN_DEMO_MODE=false`; seluruh route data mewajibkan sesi dan keanggotaan admin.
