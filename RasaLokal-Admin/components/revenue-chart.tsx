"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compact, rupiah } from "@/lib/format";

export function RevenueChart({ data }: { data: { date: string; amount: number; orders: number }[] }) {
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
    <defs><linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef5b2a" stopOpacity={0.3}/><stop offset="100%" stopColor="#ef5b2a" stopOpacity={0}/></linearGradient></defs>
    <CartesianGrid stroke="#e8e4de" vertical={false} strokeDasharray="3 4"/><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8b8984", fontSize: 12 }}/><YAxis tickFormatter={compact} axisLine={false} tickLine={false} tick={{ fill: "#8b8984", fontSize: 12 }}/>
    <Tooltip formatter={(value) => rupiah(Number(value))} contentStyle={{ borderRadius: 12, border: "1px solid #e8e4de", boxShadow: "0 8px 30px #241b1514" }}/><Area type="monotone" dataKey="amount" stroke="#ef5b2a" strokeWidth={3} fill="url(#revenue)" activeDot={{ r: 5, strokeWidth: 3, fill: "white" }}/>
  </AreaChart></ResponsiveContainer></div>;
}
