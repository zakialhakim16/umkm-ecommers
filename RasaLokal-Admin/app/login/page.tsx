"use client";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter(); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(form: FormData) {
    const supabase = createClient();
    if (!supabase) { router.push("/dashboard"); return; }
    setLoading(true); setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (authError) { setError("Email atau kata sandi tidak sesuai."); setLoading(false); return; }
    const { data } = await supabase.rpc("is_marketplace_admin");
    if (!data) { await supabase.auth.signOut(); setError("Akun ini belum memiliki akses admin."); setLoading(false); return; }
    router.replace("/dashboard"); router.refresh();
  }
  return <main className="login-page"><section className="login-story"><div className="brand light"><div className="brand-mark">R</div><div><strong>RasaLokal</strong><small>COMMAND CENTER</small></div></div><div className="story-copy"><span className="story-chip"><ShieldCheck/> OPERASIONAL TERPUSAT</span><h1>Satu kendali untuk<br/><em>rasa dari seluruh nusantara.</em></h1><p>Pantau UMKM, pesanan, pembayaran, dan pengiriman dalam satu ruang kerja yang aman.</p></div><div className="story-stats"><div><strong>184</strong><span>UMKM tumbuh bersama</span></div><div><strong>12,8K</strong><span>Pengguna aktif</span></div><div><strong>98,7%</strong><span>Layanan stabil</span></div></div></section><section className="login-form-wrap"><form action={submit} className="login-form"><div className="mobile-brand"><div className="brand-mark">R</div><strong>RasaLokal</strong></div><span className="eyebrow">SELAMAT DATANG KEMBALI</span><h2>Masuk ke Command Center</h2><p>Gunakan akun admin yang telah diverifikasi.</p>{error && <div className="form-error">{error}</div>}<label>Email admin<div className="input-icon"><Mail/><input name="email" type="email" placeholder="admin@rasalokal.id" required/></div></label><label>Kata sandi<div className="input-icon"><LockKeyhole/><input name="password" type={show ? "text" : "password"} placeholder="Masukkan kata sandi" required/><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff/> : <Eye/>}</button></div></label><button className="button primary login-button" disabled={loading}>{loading ? "Memverifikasi…" : "Masuk ke dashboard"}<ArrowRight/></button><button type="button" className="demo-link" onClick={() => router.push("/dashboard")}>Lihat demo tanpa akun</button><footer><ShieldCheck/> Dilindungi oleh autentikasi dan Row Level Security</footer></form></section></main>;
}
