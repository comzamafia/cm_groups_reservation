"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TYPES = ["table", "semi_private", "private", "event"];

function revalidate() {
  revalidatePath("/admin/zones");
  revalidatePath("/admin/pricing");
  revalidatePath("/admin/reservations");
}

export async function createZone(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "table");
  if (!name) return { ok: false, error: "Name is required." };
  if (!TYPES.includes(type)) return { ok: false, error: "Invalid type." };

  // Attach to the first location (single-venue MVP).
  const { data: loc } = await supabase
    .from("locations")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const num = (k: string, d: number | null) => {
    const v = formData.get(k);
    return v === null || v === "" ? d : Number(v);
  };
  const str = (k: string) => {
    const v = String(formData.get(k) || "").trim();
    return v || null;
  };

  const { error } = await supabase.from("spaces").insert({
    location_id: loc?.id ?? null,
    name,
    type,
    seated_cap: num("seated_cap", null),
    standing_cap: num("standing_cap", null),
    base_min_spend: num("base_min_spend", 0),
    photo_url: str("photo_url"),
    active: true,
    sort_order: num("sort_order", 0),
  });
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}

export async function setZoneActive(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("spaces").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteZone(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("spaces").delete().eq("id", id);
  if (error) {
    // Likely has reservations referencing it (FK set null) — fall back to hiding.
    return { ok: false, error: error.message };
  }
  revalidate();
  return { ok: true };
}
