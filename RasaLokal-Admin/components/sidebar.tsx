"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Sparkles } from "lucide-react";
import { navItems } from "./icons";

export function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const pathname = usePathname();
  return <>
    {open && <button className="backdrop" onClick={close} aria-label="Tutup menu" />}
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark">R</div><div><strong>RasaLokal</strong><small>COMMAND CENTER</small></div><button className="mobile-close" onClick={close}><ChevronLeft /></button></div>
      <nav>
        <p className="nav-label">OPERASIONAL</p>
        {navItems.slice(0, 7).map(item => <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} close={close} />)}
        <p className="nav-label second">INSIGHT & SISTEM</p>
        {navItems.slice(7).map(item => <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} close={close} />)}
      </nav>
      <div className="sidebar-card"><Sparkles size={18}/><div><strong>RasaLokal Care</strong><p>Semua layanan beroperasi normal.</p></div><span className="live-dot" /></div>
      <div className="sidebar-user"><div className="avatar">AR</div><div><strong>Admin RasaLokal</strong><small>Super Admin</small></div><span>•••</span></div>
    </aside>
  </>;
}

function NavItem({ href, label, icon: Icon, badge, active, close }: (typeof navItems)[number] & { active: boolean; close: () => void }) {
  return <Link href={href} onClick={close} className={active ? "active" : ""}><Icon size={19}/><span>{label}</span>{badge && <b className="nav-badge">{badge}</b>}</Link>;
}
