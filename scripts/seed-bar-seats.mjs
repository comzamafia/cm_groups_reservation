// Add 13 bar stools (B1–B13) in a half-circle "smile" arc around the BAR,
// left → right, evenly spaced. Canvas is 1000 x 640. Idempotent.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
const api = (p, init = {}) => fetch(`${url}/rest/v1/${p}`, {
  ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) },
});

const [loc] = await (await api("locations?slug=eq.mississauga&select=id")).json();
if (!loc) { console.error("Mississauga location not found."); process.exit(1); }

// On the dedicated "Bar" tab the seats wrap around a central counter
// (counter rect is x300..700, y130..202). Horseshoe: ends rise beside the
// counter, dipping below it. x even from xL..xR, y lowest at centre (cx).
const N = 13, D = 44, xL = 130, xR = 870, cx = 500, halfW = 370, yTop = 160, depth = 250;
const rows = [];
for (let i = 0; i < N; i++) {
  const cxi = xL + (i * (xR - xL)) / (N - 1);
  const t = (cxi - cx) / halfW;
  const cyi = yTop + depth * (1 - t * t);
  rows.push({
    location_id: loc.id,
    code: `B${i + 1}`,
    section: "bar",
    shape: "circle",
    x: Math.round(cxi - D / 2),
    y: Math.round(cyi - D / 2),
    w: D, h: D,
    seats: 1,
    status: "available",
    sort: 100 + i,
  });
}

const res = await api("restaurant_tables?on_conflict=location_id,code", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(rows),
});
if (!res.ok) { console.error("seed failed:", res.status, await res.text()); process.exit(1); }
console.log(`✓ added ${rows.length} bar seats (B1–B13) in a half-circle around the bar.`);
