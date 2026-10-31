import { AlertTriangle, ArrowRight, Bike, Clock3, ShoppingBag, Store, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { StatCard } from "@/components/stat-card";
import { RevenueChart } from "@/components/revenue-chart";
import { StatusPill } from "@/components/status-pill";
import { getEntities, getSnapshot } from "@/lib/data";
import { RefreshButton } from "@/components/utility-actions";
import { compact, rupiah } from "@/lib/format";

export default async function Dashboard() {
  const [snapshot, orders] = await Promise.all([getSnapshot(), getEntities("orders")]);
  const recent = orders.slice(0, 5);
  return <Shell title="Selamat pagi, Admin"><div className="welcome-row"><div><h2>Ini yang terjadi di RasaLokal hari ini.</h2><p>Ringkasan operasi marketplace · diperbarui dalam WIB</p></div><RefreshButton/></div>
    <section className="stats-grid">
      <StatCard label="Nilai transaksi" value={rupiah(snapshot.paid_amount)} trend="+12,5%" icon={WalletCards}/>
      <StatCard label="Pesanan" value={compact(snapshot.orders)} trend="+8,2%" icon={ShoppingBag} tone="blue"/>
      <StatCard label="UMKM aktif" value={String(snapshot.active_stores)} trend="+4,1%" icon={Store} tone="green"/>
      <StatCard label="Pengguna" value={compact(snapshot.users)} trend="+6,7%" icon={Users} tone="purple"/>
    </section>
    <section className="dashboard-grid">
      <article className="panel revenue-panel"><div className="panel-head"><div><span className="eyebrow">PERFORMA 7 HARI</span><h3>Nilai transaksi</h3></div><select aria-label="Periode"><option>7 hari terakhir</option><option>30 hari terakhir</option></select></div><div className="revenue-number"><strong>{rupiah(snapshot.paid_amount)}</strong><span>+12,5%</span></div><RevenueChart data={snapshot.chart}/></article>
      <article className="panel attention-panel"><div className="panel-head"><div><span className="eyebrow">BUTUH TINDAKAN</span><h3>Antrean operasional</h3></div><AlertTriangle size={20}/></div>
        <Queue href="/transactions" icon={WalletCards} tone="amber" value={snapshot.pending_payments} label="Pembayaran perlu ditinjau" detail="Verifikasi maksimal 2 jam"/>
        <Queue href="/drivers" icon={Bike} tone="blue" value={snapshot.pending_drivers} label="Pendaftaran driver" detail="Menunggu verifikasi dokumen"/>
        <Queue href="/orders" icon={Clock3} tone="red" value={snapshot.ready_orders} label="Pesanan belum dijemput" detail="Siap lebih dari 15 menit"/>
      </article>
    </section>
    <section className="panel table-panel"><div className="panel-head"><div><span className="eyebrow">AKTIVITAS TERBARU</span><h3>Pesanan terkini</h3></div><Link href="/orders" className="text-link">Lihat semua <ArrowRight size={16}/></Link></div><div className="table-scroll"><table><thead><tr><th>ID Pesanan</th><th>Pelanggan</th><th>UMKM</th><th>Total</th><th>Status</th><th>Waktu</th></tr></thead><tbody>{recent.map(row => <tr key={row.id}><td><strong>{row.id}</strong></td><td>{row.name}</td><td>{row.secondary}</td><td>{rupiah(row.amount)}</td><td><StatusPill value={row.status}/></td><td>Hari ini, 10:24</td></tr>)}</tbody></table></div></section>
  </Shell>;
}

function Queue({ href, icon: Icon, tone, value, label, detail }: { href: string; icon: typeof Bike; tone: string; value: number; label: string; detail: string }) {
  return <Link href={href} className="queue-item"><span className={`queue-icon ${tone}`}><Icon size={19}/></span><div><strong>{label}</strong><small>{detail}</small></div><b>{value}</b><ArrowRight size={17}/></Link>;
}
