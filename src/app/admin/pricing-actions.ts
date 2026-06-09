"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPricingRule(formData: FormData) {
  const supabase = await createClient();

  const spaceId = String(formData.get("space_id") || "");
  if (!spaceId) return { ok: false, error: "Space is required." };

  const num = (k: string, d: number | null = null) => {
    const v = formData.get(k);
    return v === null || v === "" ? d : Number(v);
  };
  const str = (k: string) => {
    const v = String(formData.get(k) || "").trim();
    return v || null;
  };

  const { error } = await supabase.from("pricing_rules").insert({
    space_id: spaceId,
    shift_id: str("shift_id"),
    season: str("season"),
    party_size_min: num("party_size_min", 1),
    party_size_max: num("party_size_max", 999999),
    min_spend: num("min_spend", 0),
    terms: str("terms"),
    cancellation_policy: str("cancellation_policy"),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/pricing");
  return { ok: true };
}

export async function deletePricingRule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/pricing");
  return { ok: true };
}
