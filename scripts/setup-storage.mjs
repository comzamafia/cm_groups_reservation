// Create the public 'zone-photos' storage bucket (idempotent).
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;

const res = await fetch(`${url}/storage/v1/bucket`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    id: "zone-photos",
    name: "zone-photos",
    public: true,
    file_size_limit: 5242880, // 5 MB
    allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  }),
});

if (res.ok) {
  console.log("✓ bucket 'zone-photos' created (public).");
} else {
  const body = await res.json().catch(() => ({}));
  if (res.status === 409 || /already exists/i.test(body.message || "")) {
    console.log("• bucket 'zone-photos' already exists — ok.");
  } else {
    console.error("Failed:", res.status, JSON.stringify(body));
    process.exit(1);
  }
}
