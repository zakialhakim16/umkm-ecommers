"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="center-screen"><span className="error-mark">!</span><h1>Data belum berhasil dimuat</h1><p>Coba lagi atau periksa koneksi Supabase.</p><button className="button primary" onClick={reset}>Coba lagi</button></div>;
}
