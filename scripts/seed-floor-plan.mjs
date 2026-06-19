// Seed the physical tables from the Chiang Mai (Mississauga) paper floor plan.
// Coordinates are on a 1000 x 640 canvas matching the printed layout.
// Idempotent: upserts on (location_id, code).
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
const locationId = loc.id;

// shape: rect|circle. x,y = top-left; circle uses w as diameter.
const T = [];
const rect = (code, section, x, y, w, h, seats) => T.push({ code, section, shape: "rect", x, y, w, h, seats });
const circ = (code, section, x, y, d, seats) => T.push({ code, section, shape: "circle", x, y, w: d, h: d, seats });

// ── Top-left booths & lounge ──
circ("101", "booth", 70, 55, 76, 6);
rect("L14", "lounge", 185, 60, 70, 70, 4);
rect("L15", "lounge", 270, 60, 70, 70, 4);
circ("102", "booth", 400, 55, 76, 6);

// ── Top-right window tables 71–76 ──
["76", "75", "74", "73", "72", "71"].forEach((c, i) => rect(c, "window", 720 + i * 45, 55, 38, 110, 2));

// ── Left wall ──
rect("L12", "lounge", 55, 235, 64, 120, 4);
rect("L11", "lounge", 55, 375, 64, 95, 4);

// ── Center-left L grid (L4 L5 L6 / L3 L2 L1) ──
rect("L4", "lounge", 185, 290, 80, 78, 4);
rect("L5", "lounge", 275, 290, 80, 78, 4);
rect("L6", "lounge", 365, 290, 80, 78, 4);
rect("L3", "lounge", 185, 378, 80, 78, 4);
rect("L2", "lounge", 275, 378, 80, 78, 4);
rect("L1", "lounge", 365, 378, 80, 78, 4);

// ── Center booth 103 ──
circ("103", "booth", 470, 330, 72, 6);

// ── Center-right booth 104 + R grid (R3 R4 / R2 R1) ──
circ("104", "booth", 600, 330, 72, 6);
rect("R3", "right", 695, 300, 78, 70, 4);
rect("R4", "right", 783, 300, 78, 70, 4);
rect("R2", "right", 695, 378, 78, 70, 4);
rect("R1", "right", 783, 378, 78, 70, 4);

// ── Bottom-left window 97 96 | 95 94 93 92 91 ──
rect("97", "window", 150, 505, 38, 110, 2);
rect("96", "window", 192, 505, 38, 110, 2);
["95", "94", "93", "92", "91"].forEach((c, i) => rect(c, "window", 265 + i * 42, 505, 38, 110, 2));

// ── Bottom-right window 87 86 85 84 83 | 82 81 ──
["87", "86", "85", "84", "83"].forEach((c, i) => rect(c, "window", 560 + i * 42, 505, 38, 110, 2));
rect("82", "window", 812, 505, 38, 110, 2);
rect("81", "window", 854, 505, 38, 110, 2);

const rows = T.map((t, i) => ({ ...t, location_id: locationId, status: "available", sort: i }));

const res = await api("restaurant_tables?on_conflict=location_id,code", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(rows),
});
if (!res.ok) { console.error("seed failed:", res.status, await res.text()); process.exit(1); }
console.log(`✓ seeded ${rows.length} tables for Mississauga floor plan.`);
