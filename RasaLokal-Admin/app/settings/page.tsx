import { BellRing, Database, KeyRound, LockKeyhole, UserRound } from "lucide-react";
import { Shell } from "@/components/shell";
import { AccountActions } from "@/components/account-actions";

export default function Settings() {
  return <Shell title="Pengaturan" eyebrow="SISTEM"><div className="settings-layout"><aside className="settings-nav"><button className="active"><UserRound/>Profil admin</button><button><BellRing/>Notifikasi</button><button><LockKeyhole/>Akses & keamanan</button><button><Database/>Integrasi data</button></aside><section className="panel settings-card"><div className="panel-head"><div><span className="eyebrow">AKUN</span><h3>Profil admin pusat</h3><p>Identitas operator pemilik platform.</p></div></div><div className="profile-upload"><div className="avatar large">AR</div><div><strong>Admin RasaLokal</strong><small>Akses diverifikasi melalui marketplace_admins</small></div></div><div className="form-grid"><label>Nama tampilan<input defaultValue="Admin RasaLokal" readOnly/></label><label>Peran<input defaultValue="Pemilik Platform / Super Admin" disabled/></label></div><hr/><div className="security-note"><KeyRound/><div><strong>Otorisasi dikelola melalui Supabase</strong><p>Hak admin diverifikasi ulang oleh database untuk setiap operasi sensitif.</p></div></div><div className="form-actions"><AccountActions/></div></section></div></Shell>;
}
