export type EntityKind = "stores" | "products" | "users" | "orders" | "transactions" | "drivers" | "audit";

export type EntityRow = {
  id: string;
  name: string;
  secondary?: string;
  email?: string;
  status: string;
  amount?: number;
  created_at: string;
  products?: number;
  orders?: number;
  payment_method?: string;
  payment_status?: string;
  phone?: string;
  address?: string;
  driver_name?: string;
  items?: { name: string; quantity: number; price: number; variant?: string }[];
  subtotal?: number;
  shipping_fee?: number;
  service_fee?: number;
  discount_amount?: number;
  is_suspended?: boolean;
  is_blocked?: boolean;
  active?: boolean;
};

export type Snapshot = {
  stores: number;
  active_stores: number;
  users: number;
  orders: number;
  paid_amount: number;
  service_fees: number;
  completed_orders: number;
  pending_drivers: number;
  pending_payments: number;
  ready_orders: number;
  updated_at: string;
  chart: { date: string; amount: number; orders: number }[];
};
