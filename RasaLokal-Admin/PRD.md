# PRD — RasaLokal Command Center 2.0

## 1. Ringkasan produk

RasaLokal Command Center adalah pusat operasi marketplace untuk tim internal. Produk menyatukan pengawasan UMKM, katalog, pesanan, pembayaran, pengguna, driver, laporan, dan jejak audit yang sebelumnya tersebar. Referensi mentalnya adalah pola kerja Seller Center/marketplace operations: antrean berbasis urgensi, status yang konsisten, tindakan kontekstual, dan laporan yang dapat direkonsiliasi—bukan salinan visual produk tertentu.

### Masalah

- Tim admin sulit melihat masalah paling mendesak tanpa membuka setiap modul.
- Siklus pelanggan → seller → driver → pembayaran perlu satu sumber kebenaran.
- Moderasi dan tindakan finansial harus dapat dipertanggungjawabkan.
- Dashboard lama statis dan terlalu banyak memindahkan logika keamanan ke browser.

### Sasaran

1. Admin memahami kesehatan operasi dalam kurang dari 30 detik.
2. Antrean pembayaran, driver, dan pesanan terlambat dapat diselesaikan dari satu alur.
3. Semua perubahan sensitif divalidasi database dan dicatat di audit log.
4. Data aplikasi pelanggan, seller, driver, dan admin konsisten melalui Supabase yang sama.

### Non-sasaran MVP

- ERP akuntansi lengkap, payroll driver, iklan berbayar, dispute center otomatis, dan multi-country tax.
- Mengganti aplikasi Expo RasaLokal atau mengubah kontrak database yang sudah berjalan.

## 2. Pengguna dan akses

| Peran | Kebutuhan | Akses MVP |
|---|---|---|
| Super Admin | Kendali penuh dan konfigurasi | Semua modul dan tindakan |
| Operations | Pesanan, seller, driver | Baca dan tindakan operasional |
| Finance | Rekonsiliasi pembayaran | Transaksi, laporan, ekspor |
| Trust & Safety | Moderasi | UMKM, produk, pengguna, audit |

MVP memakai `marketplace_admins.active` sebagai gerbang. RBAC granular adalah fase berikutnya dan perlu tabel role/permission, bukan metadata pengguna.

## 3. Informasi dan alur utama

```text
Command Center
├── Pesanan: tinjau → detail → dispatch driver → pantau selesai
├── Transaksi: tinjau pembayaran → konfirmasi → audit
├── UMKM: verifikasi/monitor → suspend/pulihkan
├── Produk: kurasi → blokir/pulihkan
├── Driver: verifikasi → aktifkan → pantau kapasitas
├── Pengguna: pencarian dan identifikasi peran
├── Laporan: GMV, biaya layanan, pesanan, kategori → ekspor
└── Audit: aktor → aksi → target → waktu
```

## 4. Persyaratan fungsional

### P0 — wajib produksi

- Login email/password Supabase dan pemeriksaan keanggotaan admin.
- Command Center: KPI, grafik 7/30/90 hari, antrean operasional, aktivitas terbaru.
- Daftar dengan pencarian, filter status, pagination server-side, empty/loading/error state.
- Detail pesanan termasuk item, biaya, status pembayaran, tujuan, dan driver.
- Konfirmasi pembayaran manual hanya untuk status/metode yang valid.
- Aktivasi driver dan penugasan driver untuk pesanan yang memenuhi syarat.
- Suspend UMKM dan blokir produk, termasuk pencegahan checkout di database.
- Ekspor CSV dengan periode maksimal 366 hari dan batas 10.000 baris.
- Audit immutable untuk semua tindakan sensitif.

### P1 — pasca MVP

- RBAC granular dan approval dua orang untuk tindakan finansial.
- Bulk action dengan preview dan idempotency key.
- SLA timer, alert escalation, saved filters, internal notes, dan dispute workflow.
- Live updates via Supabase Realtime dan notifikasi terarah.

## 5. Arsitektur

```text
Browser
  └── Next.js App Router
      ├── Server Components / Route Handlers
      ├── Supabase SSR cookie session
      └── DAL (DTO + validation)
             ↓ authenticated JWT
Supabase
  ├── Auth
  ├── RPC admin_* (security definer + require_marketplace_admin)
  ├── RLS / moderation guards
  └── admin_audit_log
             ↑ shared source of truth
Expo app: customer · seller · driver
```

Prinsip: anon/publishable key boleh berada di browser; service-role key tidak boleh. Otorisasi aman dijalankan sedekat mungkin dengan data. Route guard hanya memperbaiki UX, bukan menjadi garis pertahanan utama.

## 6. Model dan kontrak data

Implementasi memakai RPC yang sudah tersedia dalam `20261031020000_marketplace_admin.sql`:

- `is_marketplace_admin()`
- `admin_dashboard_snapshot(start, end)`
- `admin_list_entities(kind, search, status, offset, limit, start, end)`
- `admin_perform_action(action, id, value)`

Nilai uang disimpan sebagai integer rupiah. Semua batas periode bisnis mengikuti `Asia/Jakarta`. Status UI harus memetakan enum database, bukan membuat status baru di client.

## 7. Keamanan dan privasi

- Cookie session SSR, HTTPS, CSP produksi, `X-Frame-Options`, dan `nosniff`.
- RPC memeriksa admin untuk setiap baca lintas pengguna dan mutasi.
- Tidak pernah menampilkan kata sandi, token, atau full payment credential.
- PII diminimalkan pada daftar; detail hanya ketika diperlukan.
- Mutasi sensitif dicatat dengan actor, action, target, value, timestamp.
- Rate limit login dan ekspor diterapkan di perimeter deployment.

## 8. UX dan desain

- Nuansa “local craft meets operations”: arang hangat, coral, off-white; padat tetapi tenang.
- Desktop-first untuk tim operasi, tetap usable pada tablet/ponsel.
- Sidebar stabil, global search, status berwarna + label (warna bukan satu-satunya sinyal).
- Antrean menggunakan urgensi dan SLA, bukan sekadar angka agregat.
- Seluruh aksi destruktif memerlukan dialog konfirmasi dan alasan pada fase produksi.

## 9. SLO dan metrik keberhasilan

- p75 LCP < 2,5 detik; interaksi filter < 200 ms setelah data tersedia.
- 99,9% keberhasilan RPC baca; semua mutasi idempotent atau aman diulang.
- Median waktu review pembayaran < 15 menit.
- Pesanan siap jemput tanpa driver > 15 menit turun 50%.
- 100% mutasi admin sensitif memiliki audit record.

## 10. Rencana rilis

1. **Foundation:** Next.js shell, design system, Supabase SSR, demo mode.
2. **Read operations:** dashboard dan seluruh list memakai RPC nyata.
3. **Actions:** detail, konfirmasi, moderasi, dispatch + confirmation dialog.
4. **Hardening:** RBAC, CSP nonce, rate limiting, E2E, accessibility, observability.
5. **Pilot:** shadow mode dengan 2–3 operator; cocokkan laporan dengan database.
6. **Go-live:** runbook, rollback, alerting, dan review audit harian.

## 11. Acceptance criteria MVP

- Akun non-admin ditolak meskipun telah login.
- Tidak ada service-role key dalam bundle browser.
- KPI dan tabel cocok dengan query database pada periode WIB yang sama.
- Filter/pagination tidak mengunduh seluruh dataset.
- Konfirmasi pembayaran ganda tidak menghasilkan perubahan ganda.
- Suspend/blokir mencegah checkout baru.
- UI berfungsi di lebar 360, 768, 1280, dan 1440 px; navigasi keyboard dan focus state tersedia.

## 12. Risiko

| Risiko | Mitigasi |
|---|---|
| RPC terlalu luas | DTO, allowlist kind/action, test SQL, least privilege |
| Status antar aplikasi berbeda | satu enum/domain mapping dan contract tests |
| Salah konfirmasi pembayaran | eligibility check DB, confirmation, audit, dual approval P1 |
| Data PII terekspos | masking list, detail on-demand, log redaction |
| Dashboard mahal | agregasi terindeks, pagination, cache non-user-specific terukur |

