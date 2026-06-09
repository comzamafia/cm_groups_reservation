"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTENT_DEFS } from "@/lib/content";

async function uploadImage(file: File, key: string): Promise<string> {
  const admin = createAdminClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `site/${key}-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage
    .from("zone-photos")
    .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: true });
  if (error) throw new Error(error.message);
  return admin.storage.from("zone-photos").getPublicUrl(path).data.publicUrl;
}

export async function saveContent(formData: FormData) {
  const supabase = await createClient();

  const rows: {
    key: string; grp: string; label: string; type: string; sort: number; value: string | null;
  }[] = [];

  for (const [key, def] of Object.entries(CONTENT_DEFS)) {
    let value: string | null;
    if (def.type === "image") {
      const file = formData.get(`file__${key}`);
      if (file && typeof file !== "string" && file.size > 0) {
        try {
          value = await uploadImage(file, key);
        } catch (e) {
          return { ok: false, error: `Image upload failed for "${def.label}": ${(e as Error).message}` };
        }
      } else {
        const url = formData.get(key);
        value = url == null ? null : String(url);
      }
    } else {
      const v = formData.get(key);
      value = v == null ? null : String(v);
    }
    rows.push({ key, grp: def.grp, label: def.label, type: def.type, sort: def.sort, value });
  }

  const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/admin/content");
  return { ok: true };
}
