"use client";
import { Download, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
export function RefreshButton(){const router=useRouter();return <button className="button subtle" onClick={()=>router.refresh()}><RefreshCw size={16}/> Perbarui data</button>}
export function ReportDownload({rows}:{rows:Record<string,unknown>[]}){function download(){const keys=Object.keys(rows[0]||{});const esc=(v:unknown)=>`"${String(v??"").replaceAll('"','""')}"`;const csv=[keys.join(","),...rows.map(row=>keys.map(k=>esc(row[k])).join(","))].join("\n");const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`laporan-rasalokal-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url)}return <button className="button primary" onClick={download}><Download size={16}/> Unduh laporan</button>}
