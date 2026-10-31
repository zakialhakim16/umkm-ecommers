import { BarChart3, ReceiptText, ShoppingBag, TrendingUp, WalletCards } from "lucide-react";
import { Shell } from "@/components/shell";
import { RevenueChart } from "@/components/revenue-chart";
import { getSnapshot } from "@/lib/data";
import { compact, rupiah } from "@/lib/format";
import { ReportDownload } from "@/components/utility-actions";

export default async function Reports() {
  const snapshot = await getSnapshot();
  return <Shell title="Laporan" eyebrow="INSIGHT"><div className="list-intro"><div><h2>Performa bisnis RasaLokal</h2><p>Analisis transaksi, pesanan, dan pendapatan platform.</p></div><ReportDownload rows={snapshot.chart}/></div>
    <section className="report-summary"><article><WalletCards/><span>GMV</span><strong>{rupiah(snapshot.paid_amount)}</strong><small>+12,5% dari periode lalu</small></article><article><ReceiptText/><span>Biaya layanan</span><strong>{rupiah(snapshot.service_fees)}</strong><small>4% rata-rata transaksi</small></article><article><ShoppingBag/><span>Pesanan selesai</span><strong>{compact(snapshot.completed_orders)}</strong><small>87,3% tingkat selesai</small></article><article><TrendingUp/><span>Nilai rata-rata</span><strong>{rupiah(snapshot.paid_amount / snapshot.completed_orders)}</strong><small>Per pesanan selesai</small></article></section>
    <section className="dashboard-grid report-grid"><article className="panel revenue-panel"><div className="panel-head"><div><span className="eyebrow">TREN TRANSAKSI</span><h3>GMV dan pesanan</h3></div><select><option>7 hari terakhir</option><option>30 hari terakhir</option><option>90 hari terakhir</option></select></div><RevenueChart data={snapshot.chart}/></article><article className="panel category-card"><div className="panel-head"><div><span className="eyebrow">KATEGORI</span><h3>Kontribusi penjualan</h3></div><BarChart3/></div>{[["Makanan siap saji",42,"#ef5b2a"],["Kopi & minuman",26,"#2b8a66"],["Camilan",19,"#4b75c4"],["Bahan pangan",13,"#9b6cc1"]].map(([name, value, color]) => <div className="bar-row" key={String(name)}><div><span>{name}</span><strong>{value}%</strong></div><i><b style={{ width: `${value}%`, background: String(color) }}/></i></div>)}</article></section>
  </Shell>;
}
