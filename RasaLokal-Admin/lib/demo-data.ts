import type { EntityKind, EntityRow, Snapshot } from "./types";

export const snapshot: Snapshot = {
  stores: 184, active_stores: 171, users: 12842, orders: 1486,
  paid_amount: 186420000, service_fees: 7456800, completed_orders: 1298,
  pending_drivers: 12, pending_payments: 18, ready_orders: 7,
  updated_at: new Date().toISOString(),
  chart: [
    ["26 Okt", 18200000, 142], ["27 Okt", 21600000, 178], ["28 Okt", 19800000, 161],
    ["29 Okt", 28400000, 224], ["30 Okt", 25100000, 198], ["31 Okt", 33200000, 267], ["1 Nov", 39620000, 316]
  ].map(([date, amount, orders]) => ({ date: String(date), amount: Number(amount), orders: Number(orders) }))
};

const now = new Date().toISOString();
const rows: Record<EntityKind, EntityRow[]> = {
  stores: [
    { id: "st-001", name: "Dapur Bu Sari", secondary: "Sari Wulandari", email: "sari@example.id", status: "open", products: 28, orders: 842, created_at: now },
    { id: "st-002", name: "Kopi Lereng", secondary: "Agus Pratama", email: "agus@example.id", status: "open", products: 16, orders: 519, created_at: now },
    { id: "st-003", name: "Jajanan Nusa", secondary: "Rini Kusuma", email: "rini@example.id", status: "suspended", products: 12, orders: 174, created_at: now }
  ],
  products: [
    { id: "pr-001", name: "Rendang Daging 250gr", secondary: "Dapur Bu Sari", status: "available", amount: 68000, created_at: now },
    { id: "pr-002", name: "Kopi Arabika Gayo", secondary: "Kopi Lereng", status: "available", amount: 89000, created_at: now },
    { id: "pr-003", name: "Keripik Balado", secondary: "Jajanan Nusa", status: "blocked", amount: 24000, created_at: now }
  ],
  users: [
    { id: "us-001", name: "Nadia Putri", secondary: "0812••••4421", email: "nadia@example.id", status: "customer", created_at: now },
    { id: "us-002", name: "Agus Pratama", secondary: "0813••••1102", email: "agus@example.id", status: "seller", created_at: now },
    { id: "us-003", name: "Bima Aji", secondary: "0857••••9940", email: "bima@example.id", status: "driver", created_at: now }
  ],
  orders: [
    { id: "RL-10482", name: "Nadia Putri", secondary: "Dapur Bu Sari", status: "ready_for_pickup", amount: 92000, payment_method: "wallet", payment_status: "success", created_at: now },
    { id: "RL-10481", name: "Bagas Yudha", secondary: "Kopi Lereng", status: "preparing", amount: 117000, payment_method: "cod", payment_status: "pending", created_at: now },
    { id: "RL-10480", name: "Laras Dewi", secondary: "Jajanan Nusa", status: "driver_assigned", amount: 48000, payment_method: "bank", payment_status: "success", driver_name: "Bima Aji", created_at: now }
  ],
  transactions: [
    { id: "TRX-88421", name: "RL-10482", secondary: "DANA", status: "success", amount: 92000, payment_method: "wallet", payment_status: "success", created_at: now },
    { id: "TRX-88420", name: "RL-10479", secondary: "Transfer bank", status: "processing", amount: 156000, payment_method: "bank", payment_status: "processing", created_at: now },
    { id: "TRX-88419", name: "RL-10478", secondary: "COD", status: "pending", amount: 74000, payment_method: "cod", payment_status: "pending", created_at: now }
  ],
  drivers: [
    { id: "dr-001", name: "Bima Aji", secondary: "Honda Vario · B 3210 KJ", email: "bima@example.id", status: "busy", created_at: now },
    { id: "dr-002", name: "Yoga Ramadhan", secondary: "Yamaha NMax · B 8821 RM", email: "yoga@example.id", status: "active", created_at: now },
    { id: "dr-003", name: "Sinta Maharani", secondary: "Honda Beat · B 4211 MA", email: "sinta@example.id", status: "pending", created_at: now }
  ],
  audit: [
    { id: "au-001", name: "payment_confirm", secondary: "admin@rasalokal.id", status: "payment_confirm", created_at: now },
    { id: "au-002", name: "driver_active", secondary: "admin@rasalokal.id", status: "driver_active", created_at: now },
    { id: "au-003", name: "product_blocked", secondary: "ops@rasalokal.id", status: "product_blocked", created_at: now }
  ]
};

export function demoRows(kind: EntityKind) { return rows[kind]; }
