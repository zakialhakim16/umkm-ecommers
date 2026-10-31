import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { demoRows, snapshot as demoSnapshot } from "./demo-data";
import type { EntityKind, EntityRow, Snapshot } from "./types";

const demoMode = process.env.ADMIN_DEMO_MODE !== "false";

async function authorizedClient() {
  const client = await createClient();
  if (!client) return null;
  const { data: { user } } = await client.auth.getUser();
  if (!user) { if (!demoMode) redirect("/login"); return null; }
  const { data: isAdmin } = await client.rpc("is_marketplace_admin");
  if (!isAdmin) { if (!demoMode) redirect("/login?reason=forbidden"); return null; }
  return client;
}

export async function getSnapshot(): Promise<Snapshot> {
  const client = await authorizedClient();
  if (!client) return demoSnapshot;
  const end = new Date(); const start = new Date(end); start.setDate(start.getDate() - 6);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const { data, error } = await client.rpc("admin_dashboard_snapshot", { p_start: iso(start), p_end: iso(end) });
  if (error || !data) { if (demoMode) return demoSnapshot; throw error; }
  return data as Snapshot;
}

export async function getEntities(kind: EntityKind): Promise<EntityRow[]> {
  const client = await authorizedClient();
  if (!client) return demoRows(kind);
  const { data, error } = await client.rpc("admin_list_entities", {
    p_kind: kind, p_search: "", p_status: "", p_offset: 0, p_limit: 50, p_start: null, p_end: null
  });
  if (error || !data) { if (demoMode) return demoRows(kind); throw error; }
  return (data as { rows: EntityRow[] }).rows;
}
