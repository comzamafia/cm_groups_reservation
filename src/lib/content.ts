import defaults from "@/content/defaults.json";
import { createClient } from "@/lib/supabase/server";

export type ContentMap = Record<string, string>;
export type ContentDef = { grp: string; label: string; type: "text" | "textarea" | "image"; sort: number; value: string };
export const CONTENT_DEFS = defaults as Record<string, ContentDef>;

/** Default values (used as fallback so the site renders before any DB rows exist). */
export function defaultMap(): ContentMap {
  const m: ContentMap = {};
  for (const [k, v] of Object.entries(CONTENT_DEFS)) m[k] = v.value;
  return m;
}

/** Merge DB overrides over the defaults. Falls back to defaults if the table
 *  isn't set up yet, so the public page never breaks. */
export async function getContent(): Promise<ContentMap> {
  const map = defaultMap();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_content").select("key, value");
    if (!error && data) {
      for (const row of data) {
        if (row.value != null && row.value !== "") map[row.key] = row.value as string;
      }
    }
  } catch {
    /* table missing → defaults */
  }
  return map;
}
