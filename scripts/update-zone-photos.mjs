// Give the 3 design zones their photos, and deactivate the legacy 0002 seed
// spaces so the public "Book a Table" modal shows a clean set of zones.
// (Legacy reservations still display in admin via the space-name join.)
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
const patch = async (q, body) => {
  const r = await fetch(`${url}/rest/v1/spaces?${q}`, {
    method: "PATCH",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${q}: ${r.status} ${await r.text()}`);
};

const PHOTOS = {
  "The Mural Lounge": "/assets/mural-booths.jpg",
  "The Curio Library": "/assets/curio-shelf.jpg",
  "Main Dining Buyout": "/assets/bar-dining-room.jpg",
};
for (const [name, photo] of Object.entries(PHOTOS)) {
  await patch(`name=eq.${encodeURIComponent(name)}`, { photo_url: photo });
  console.log(`✓ photo set: ${name}`);
}

const LEGACY = ["Main Dining Table", "Lanna Semi-Private Nook", "Yi Peng Private Room", "The Elephant Hall (Events)"];
const inList = `(${LEGACY.map((n) => `"${n.replace(/"/g, '\\"')}"`).join(",")})`;
await patch(`name=in.${encodeURIComponent(inList)}`, { active: false });
console.log(`✓ deactivated legacy zones: ${LEGACY.length}`);
console.log("Done.");
