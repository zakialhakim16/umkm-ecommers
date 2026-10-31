import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
export function StatCard({ label, value, trend, icon: Icon, tone = "orange" }: { label: string; value: string; trend: string; icon: LucideIcon; tone?: string }) {
  const down = trend.startsWith("-");
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={21}/></div><span>{label}</span><strong>{value}</strong><small className={down ? "down" : "up"}>{down ? <ArrowDownRight/> : <ArrowUpRight/>}{trend} <em>vs minggu lalu</em></small></article>;
}
