"use client";
import { Bell, Menu, Search, Wifi } from "lucide-react";

export function Header({ title, eyebrow, onMenu }: { title: string; eyebrow: string; onMenu: () => void }) {
  return <header className="topbar">
    <button className="menu-button" onClick={onMenu}><Menu /></button>
    <div className="page-identity"><small>{eyebrow}</small><h1>{title}</h1></div>
    <div className="header-actions">
      <label className="global-search"><Search size={18}/><input placeholder="Cari pesanan, UMKM, pengguna…"/><kbd>⌘ K</kbd></label>
      <span className="sync-status"><Wifi size={15}/> Tersinkron</span>
      <button className="icon-button" aria-label="Notifikasi"><Bell size={19}/><i /></button>
    </div>
  </header>;
}
