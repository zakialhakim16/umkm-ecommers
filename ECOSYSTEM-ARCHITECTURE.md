# Arsitektur Ekosistem RasaLokal

## Keputusan

RasaLokal ditargetkan menjadi empat produk klien dengan satu platform backend:

| Produk | Pengguna | Platform | Fokus |
|---|---|---|---|
| RasaLokal | Pembeli | Expo Android/iOS/Web | discovery, cart, checkout, payment, tracking |
| RasaLokal Mitra | Pemilik UMKM & staf | Expo Android/iOS/Web | toko, katalog, order fulfilment, laporan |
| RasaLokal Driver | Mitra pengiriman | Expo Android/iOS | job queue, navigation, proof, background location |
| RasaLokal Command Center | Pemilik platform | Next.js web | moderation, finance, dispatch, audit, platform health |

Semua produk menggunakan satu Supabase project sebagai source of truth. Pemisahan aplikasi tidak berarti memisahkan database.

## Mengapa dipisah

### Pembeli

- Bundle kecil, onboarding sederhana, tanpa permission background location.
- Navigasi berorientasi discovery dan conversion.
- Rilis tidak tertahan fitur operasional driver/seller.

### Mitra

- Navigasi task-first: pesanan baru, SLA penerimaan, stok, produk, laporan.
- Notifikasi, badge, dan offline queue berbeda dari pembeli.
- Mendukung pemilik dan staf toko tanpa memberikan akses platform-admin.

### Driver

- Membutuhkan background location, foreground service Android, dan lifecycle tugas khusus.
- Mode online/offline, job acceptance, pickup proof, delivery proof, emergency/support.
- Permission dan disclosure lokasinya harus terisolasi dari aplikasi pembeli.

### Command Center

- Web desktop untuk operasi padat data, rekonsiliasi, moderasi, dispatch, dan audit.
- Tidak memakai service-role key di browser; tindakan melalui RPC terproteksi.

## Struktur monorepo target

```text
umkm-ecommers/
├── apps/
│   ├── consumer/          # Expo — pembeli
│   ├── merchant/          # Expo — pemilik/staf UMKM
│   ├── driver/            # Expo — mitra pengiriman
│   └── admin/             # Next.js — pemilik platform
├── packages/
│   ├── api/               # typed Supabase repositories + DTO
│   ├── auth/              # session, role gate, account linking
│   ├── domain/            # order/payment/delivery state machine
│   ├── design-system/     # tokens + komponen dasar, bukan screen
│   ├── observability/     # error reporting, analytics, audit events
│   └── config/            # eslint, tsconfig, environment contracts
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── tests/
│   └── seed.sql
└── package.json           # npm workspaces
```

Setiap app memiliki `app.config.ts`, `eas.json`, bundle identifier, icon, splash, channel update, dan release cadence sendiri.

## Identitas dan role

Satu manusia memakai satu akun Supabase. Role bukan field tunggal pada profil karena satu pengguna dapat menjadi customer sekaligus seller atau driver.

```text
auth.users
  └── profiles
      ├── user_roles (customer | seller_owner | seller_staff | driver | platform_admin)
      ├── store_memberships (store_id, role, status)
      ├── driver_profiles (verification_status, availability)
      └── marketplace_admins (active, permission scope)
```

Authorization tidak bergantung pada aplikasi mana yang dipasang. Setiap request tetap diperiksa oleh RLS/RPC. Custom claims boleh dipakai sebagai cache permission, tetapi database membership tetap sumber kebenaran.

## Boundary dan ownership

| Domain | Owner write | Pembaca |
|---|---|---|
| Profile customer | user | user, support terbatas |
| Store & catalog | seller member | public, admin |
| Order | state-machine RPC | buyer, seller terkait, driver terkait, admin |
| Payment | payment function/webhook | buyer terkait, finance admin |
| Driver position | assigned driver | buyer/seller terkait dalam jendela tugas, dispatch admin |
| Moderation | platform admin RPC | seller terkait, public result |
| Audit | database/function | authorized platform admin only |

Client tidak boleh mengubah status order secara bebas. Semua transisi memakai command RPC yang memeriksa aktor, status sebelumnya, idempotency key, dan menulis event/audit.

## State machine pesanan

```text
pending_payment
  ├── payment_failed
  └── confirmed
       └── merchant_accepted
            └── preparing
                 └── ready_for_pickup
                      └── driver_assigned
                           └── driver_going_to_merchant
                                └── driver_arrived_merchant
                                     └── picked_up
                                          └── driver_going_to_customer
                                               └── driver_arrived
                                                    └── delivered
                                                         └── completed
```

Cancellation/rejection adalah transisi eksplisit dengan reason code, actor, timestamp, dan refund disposition.

## Event dan realtime

- Database adalah sumber kebenaran; Realtime hanya mekanisme invalidasi/refresh UI.
- `order_events` menyimpan timeline append-only.
- Outbox table menjamin event penting dapat dikirim ulang.
- Edge Function mengirim push notification dengan idempotency key.
- Aplikasi tetap melakukan refetch saat foreground untuk menangani event yang terlewat.
- Admin dashboard memakai snapshot/RPC agregat, bukan subscription ke seluruh tabel.

## Notifikasi

| Event | Buyer | Seller | Driver | Admin |
|---|---|---|---|---|
| Order dibuat | konfirmasi | order baru | — | metric |
| Merchant menerima | status | SLA | — | — |
| Siap dijemput | status | reminder | job offer/assignment | dispatch exception |
| Driver tiba | live status | pickup alert | task | — |
| Pembayaran gagal | action required | — | — | finance queue |
| Moderation | — | notice + appeal | — | audit |

Remote push membutuhkan development/production build; Android modern tidak mendukung remote push melalui Expo Go. Deep link membawa pengguna langsung ke order/task yang benar.

## Driver location

- Tracking hanya dimulai setelah driver menerima tugas dan berhenti ketika order selesai/dibatalkan.
- Background task didefinisikan di module scope dan diregistrasikan sebelum router.
- Location samples dibatasi frekuensinya, di-batch, dan memiliki TTL/retention.
- Buyer hanya dapat membaca lokasi driver untuk order aktif miliknya.
- Permission screen menjelaskan tujuan, durasi, dan cara menghentikan tracking.
- Driver app membutuhkan development build karena permission/background behavior harus diuji pada perangkat nyata.

## Design system

Design system bersama hanya mencakup token dan primitives:

- color, typography, spacing, elevation, radius, motion;
- button, input, sheet, toast, skeleton, empty/error state;
- accessibility semantics dan reduced-motion behavior.

Screen dan navigation tidak dibagi lintas app karena mental model buyer, seller, dan driver berbeda. Consumer bersifat discovery-led; merchant queue-led; driver map/task-led; admin data-dense.

## Observability

- Correlation ID dari client → RPC/function → audit/event.
- Error reporting dipisah per app dan release channel.
- Funnel buyer: discovery → product → cart → checkout → paid.
- Seller SLA: accept time, preparation time, rejection rate, stock failures.
- Driver SLA: offer acceptance, pickup ETA, completion, GPS freshness.
- Platform SLO: auth, checkout, payment webhook, dispatch, notification delivery.

PII, access token, alamat lengkap, dan credential pembayaran tidak boleh masuk log.

## Release dan environment

Setiap app mempunyai environment `development`, `preview`, dan `production`, dengan Application ID/Bundle ID unik. Contoh:

```text
id.rasalokal.consumer
id.rasalokal.mitra
id.rasalokal.driver
```

Development/preview suffix menggunakan `.dev` dan `.preview`. EAS Update channel tidak boleh silang antar-app atau antar-environment.

## Tahapan migrasi tanpa downtime

### Fase 0 — hardening kontrak

- Bekukan status/order contract dan buat contract tests.
- Tambah `user_roles`, `store_memberships`, `order_events`, outbox, dan idempotency.
- Pastikan seluruh write sensitif melalui RPC.

### Fase 1 — workspace dan shared packages

- Jadikan repo npm workspaces.
- Pindahkan Supabase repository, types, design tokens, dan state machine ke packages.
- Aplikasi lama tetap dapat dirilis selama migrasi.

### Fase 2 — ekstraksi Driver

- Ekstrak driver terlebih dahulu karena permission dan lifecycle paling berbeda.
- Pilot internal, background-location soak test, battery test, offline/reconnect test.
- Setelah stabil, sembunyikan route driver dari consumer melalui remote feature flag.

### Fase 3 — ekstraksi Mitra

- Ekstrak seller routes dan tambah staff membership.
- Parallel run dengan seller lama sampai event/order reconciliation cocok.
- Redirect seller lama ke app Mitra setelah adopsi memenuhi target.

### Fase 4 — consumer cleanup

- Hapus bundle seller/driver dari consumer.
- Fokus pada discovery, checkout conversion, loyalty, review, support.

### Fase 5 — platform maturity

- Notification service, observability, dispute/refund, promotions, settlement, fraud rules.
- RBAC granular dan dual approval untuk tindakan finansial admin.

## Quality gates

- Unit test state machine dan money arithmetic.
- SQL tests untuk RLS setiap role.
- Contract tests RPC dan Edge Functions.
- E2E per persona pada preview environment.
- Realtime reconnect/offline tests.
- Background location battery and kill-process tests.
- Accessibility: screen reader, text scaling, contrast, reduced motion.
- Release rollback dan migration rollback/runbook.

## Yang tidak dilakukan

- Tidak membuat database berbeda per app.
- Tidak menaruh role hanya di `user_metadata`.
- Tidak mengandalkan menu tersembunyi sebagai authorization.
- Tidak melakukan big-bang rewrite.
- Tidak membagi semua komponen screen lintas app.
- Tidak mengaktifkan background tracking sepanjang hari.

