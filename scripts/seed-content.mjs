// Seed default site_content rows (idempotent — won't overwrite edited values).
// Run AFTER applying 0008_site_content.sql in the SQL editor.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;

const defs = JSON.parse(readFileSync(new URL("../src/content/defaults.json", import.meta.url), "utf8"));
const rows = Object.entries(defs).map(([k, d]) => ({
  key: k, grp: d.grp, label: d.label, type: d.type, sort: d.sort, value: d.value,
}));

// Insert, ignoring rows that already exist (preserve any edits already made).
const res = await fetch(`${url}/rest/v1/site_content?on_conflict=key`, {
  method: "POST",
  headers: {
    apikey: key, Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "resolution=ignore-duplicates,return=minimal",
  },
  body: JSON.stringify(rows),
});

if (res.ok) {
  console.log(`✓ seeded ${rows.length} content rows (existing rows left untouched).`);
} else {
  const t = await res.text();
  if (/relation .*site_content.* does not exist/i.test(t)) {
    console.error("Table missing — run supabase/migrations/0008_site_content.sql first.");
  } else {
    console.error("Failed:", res.status, t);
  }
  process.exit(1);
}
