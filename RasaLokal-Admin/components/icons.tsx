import { LayoutDashboard, ShoppingBag, Store, Package, Users, WalletCards, Bike, BarChart3, Settings, ShieldCheck } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/orders", label: "Pesanan", icon: ShoppingBag, badge: "7" },
  { href: "/stores", label: "UMKM", icon: Store },
  { href: "/products", label: "Produk", icon: Package },
  { href: "/users", label: "Pengguna", icon: Users },
  { href: "/transactions", label: "Transaksi", icon: WalletCards, badge: "18" },
  { href: "/drivers", label: "Driver", icon: Bike, badge: "12" },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/audit", label: "Audit & Aktivitas", icon: ShieldCheck },
  { href: "/settings", label: "Pengaturan", icon: Settings }
];
