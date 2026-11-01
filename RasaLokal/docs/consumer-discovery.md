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
