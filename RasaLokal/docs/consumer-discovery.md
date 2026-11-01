# Consumer discovery — RasaLokal

## Tampilan dan alur

Beranda memakai identitas krem, jingga, dan hijau RasaLokal. Referensi pola katalog food delivery diterapkan melalui header alamat, pencarian, pintasan dua baris, koleksi menu horizontal, kartu kampanye, dan daftar resto.

- **Beranda**: alamat pengiriman, jumlah item keranjang, notifikasi, kategori, favorit, pesanan, menu maksimal Rp25.000 dari resto buka, dan riwayat menu lokal.
- **Jelajah**: pencarian nama resto/menu, pengurutan pilihan lokal/harga/jarak, filter kategori/harga/status buka/radius, reset, serta muat lebih banyak.
- **Resto** (`/store?id=…`): foto, alamat, status buka, seluruh menu, kategori, pencarian dalam resto, tautan detail produk, dan ringkasan keranjang resto.
- **Produk**: tautan kembali ke seluruh menu resto, pencatatan riwayat, favorit, dan tombol keranjang dengan keadaan sedang menyimpan.

Filter modal memakai draft: menutup modal membatalkan perubahan; menekan **Tampilkan pilihan** menerapkan seluruh pilihan sekaligus. Filter harga dan kategori harus cocok dengan menu yang sama. Resto tanpa koordinat tidak dimasukkan ke pencarian radius. Jarak ditandai sebagai jarak garis lurus, bukan estimasi perjalanan.

## Data dan batas cakupan

Katalog memakai `loadPublicProducts` dan `loadPublicStores` yang sudah terhubung ke Supabase. Harga pada kartu dan detail mengikuti `products.price`, sesuai perhitungan keranjang/checkout saat ini. Harga promo/varian memerlukan penyelarasan kontrak checkout sebelum ditampilkan sebagai harga transaksi.

Jumlah terjual, rating agregat, ETA, flash-sale, dan subsidi ongkir belum memiliki kontrak discovery yang tervalidasi, sehingga tidak ditampilkan sebagai metrik. Halaman ini tidak mengubah pembayaran atau backend pemenuhan pesanan.

Riwayat yang dilihat hanya menyimpan maksimal 12 ID produk publik di perangkat melalui AsyncStorage. Pengguna dapat menghapusnya. Data akun tidak disimpan bersama riwayat ini.

## Struktur

- `components/FoodDiscoveryScreen.tsx`: layar Beranda dan Jelajah.
- `components/FoodCards.tsx`: kartu menu/resto dan fallback foto.
- `components/FoodFilterSheet.tsx`: formulir filter.
- `hooks/useFoodDiscovery.ts`: pemuatan katalog dan data opsional, refresh, proteksi respons request yang sudah tidak aktif.
- `lib/discovery.ts`: pencarian, filter, pengurutan, dan pembatasan riwayat.
- `lib/recentProducts.ts`: penyimpanan riwayat perangkat.

## Verifikasi

```sh
npm run lint -- --no-cache
npx tsc --noEmit
node scripts/discovery.test.cjs
```

Uji browser dilakukan dengan katalog fixture yang diintersep, tanpa membuat pesanan di database. Cakupan: pencarian, filter gabungan, reset, navigasi resto/produk, riwayat/hapus, katalog kosong, kegagalan koneksi/coba lagi, dan tidak ada overflow halaman pada lebar 320/390/768/1280 piksel. Pengujian perangkat native tetap diperlukan sebelum rilis Android/iOS.

## Layar sambutan sebelum login

`src/app/index.tsx` sekarang menampilkan sambutan interaktif bagi pengunjung yang belum masuk. Maskot asli **Si Rasa**, mangkuk koki dari bentuk native, tersedia di `components/WelcomeMascot.tsx`. Gerakannya mencakup melayang ringan, kedipan, lambaian tangan, dan respons ketika diketuk. Tidak membutuhkan unduhan gambar atau paket animasi tambahan.

Tiga cerita pembuka disesuaikan untuk consumer/mitra/driver. Tombol **Mulai sekarang** membuka pendaftaran; **Sudah punya akun? Masuk** membuka login dengan `returnTo` sesuai varian. Sesi tersimpan yang lolos verifikasi menampilkan tombol **Lanjutkan dengan akun tersimpan**, tanpa otomatis meninggalkan sambutan. Akses tamu ke home dihapus. Tautan pemulihan kata sandi tetap diarahkan ke layar reset.

Animasi berhenti saat layar kehilangan fokus atau aplikasi berpindah ke background. Preferensi reduce motion dibaca sebelum animasi dimulai dan perubahan preferensi saat aplikasi aktif langsung diterapkan. Di layar pendek konten tetap dapat digulir.

Uji awal browser mencakup perubahan transform animasi, respons maskot, pergantian cerita, reduce motion dinamis, navigasi daftar/masuk, dan routing pemulihan. Tampilan diperiksa pada 320×568, 390×844, dan 1280×900. Uji unit pemulihan dijalankan kembali karena perubahan menyentuh entry route.

### Ketahanan layar sambutan dan autentikasi

- Tombol daftar dan masuk selalu tersedia; pemeriksaan sesi tidak menutupi tombol.
- `components/RequireSession.tsx` melindungi seluruh tab consumer, termasuk akses langsung lewat URL. Home beserta request datanya baru dipasang setelah `getUser` memverifikasi sesi ke Supabase. Sesi kosong/tidak valid kembali ke sambutan, sedangkan koneksi gagal menyediakan retry. Event logout membatalkan pemeriksaan yang tertunda dan menutup akses tab.
- `lib/welcomeSession.ts` membatasi pemeriksaan sesi ke 3,5 detik. Kesalahan/timeout menyediakan opsi coba lagi tanpa menghapus kredensial. Pembacaan yang terlambat tidak menavigasikan pengguna setelah timeout atau setelah memilih tindakan.
- `components/WelcomeGlyph.tsx` menggambar ikon penting dari bentuk native, sehingga tidak bergantung pada pemuatan font simbol. Digunakan pada sambutan dan logo formulir login.
- Halaman login tidak memuat profil/katalog terlebih dahulu. Halaman favorit tetap memuat katalog yang diperlukan.
- Konten tidak lagi memakai margin otomatis yang menciptakan ruang kosong besar sebelum tombol. Jarak antarkomponen tetap terukur; layar pendek dapat digulir dan target sentuh minimal 44 piksel.

Regresi: `node scripts/welcome-session.test.cjs` memeriksa sesi valid, tamu, kedaluwarsa, error, timeout, pembatalan, dan respons terlambat. Browser diuji dengan seluruh sumber eksternal diblokir serta refresh token yang sengaja ditahan; tombol login, pesan kesalahan password, retry, dan pencegahan redirect terlambat berhasil. Tidak ada transaksi atau akun sungguhan dibuat dalam pengujian tersebut.
