import { labelize } from "@/lib/format";
export function StatusPill({ value }: { value: string }) {
  const positive = ["open", "available", "active", "success", "completed", "delivered"];
  const danger = ["suspended", "blocked", "failed", "cancelled", "rejected"];
  const tone = positive.includes(value) ? "positive" : danger.includes(value) ? "danger" : ["pending", "processing", "review", "ready_for_pickup"].includes(value) ? "warning" : "neutral";
  return <span className={`status ${tone}`}><i />{labelize(value)}</span>;
}
