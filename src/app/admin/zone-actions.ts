"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TYPES = ["table", "semi_private", "private", "event"];

/** Uploads an image to the public zone-photos bucket; returns its public URL. */
async function uploadZonePhoto(file: File, zoneName: string): Promise<string> {
  const admin = createAdminClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const slug = zoneName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "zone";
  const path = `zones/${Date.now()}-${slug}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage
    .from("zone-photos")
    .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  return admin.storage.from("zone-photos").getPublicUrl(path).data.publicUrl;
}

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

  // Prefer an uploaded image; otherwise fall back to a pasted URL.
  let photoUrl = str("photo_url");
  const file = formData.get("photo_file");
  if (file && typeof file !== "string" && file.size > 0) {
    try {
      photoUrl = await uploadZonePhoto(file, name);
    } catch (e) {
      return { ok: false, error: `Image upload failed: ${(e as Error).message}` };
    }
  }

  const { error } = await supabase.from("spaces").insert({
    location_id: loc?.id ?? null,
    name,
    type,
    seated_cap: num("seated_cap", null),
    standing_cap: num("standing_cap", null),
    base_min_spend: num("base_min_spend", 0),
    photo_url: photoUrl,
    active: true,
    sort_order: num("sort_order", 0),
  });
  if (error) return { ok: false, error: error.message };

  revalidate();
  return { ok: true };
}

export async function updateZone(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "table");
  if (!name) return { ok: false, error: "Name is required." };
  if (!TYPES.includes(type)) return { ok: false, error: "Invalid type." };

  const num = (k: string, d: number | null) => {
    const v = formData.get(k);
    return v === null || v === "" ? d : Number(v);
  };
  const str = (k: string) => {
    const v = String(formData.get(k) || "").trim();
    return v || null;
  };

  // New upload wins; otherwise keep the URL field (prefilled with the current value).
  let photoUrl = str("photo_url");
  const file = formData.get("photo_file");
  if (file && typeof file !== "string" && file.size > 0) {
    try {
      photoUrl = await uploadZonePhoto(file, name);
    } catch (e) {
      return { ok: false, error: `Image upload failed: ${(e as Error).message}` };
    }
  }

  const { error } = await supabase
    .from("spaces")
    .update({
      name,
      type,
      seated_cap: num("seated_cap", null),
      standing_cap: num("standing_cap", null),
      base_min_spend: num("base_min_spend", 0),
      photo_url: photoUrl,
      sort_order: num("sort_order", 0),
      active: formData.get("active") === "on",
    })
    .eq("id", id);
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
