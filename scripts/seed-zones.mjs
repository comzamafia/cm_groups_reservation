// Ensure the 3 public booking zones exist as spaces (idempotent), and add
// pricing rules for them so the booking flow can price a reservation.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
const api = (p, init = {}) => fetch(`${url}/rest/v1/${p}`, {
  ...init,
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) },
});
const get = async (p) => { const r = await api(p); if (!r.ok) throw new Error(`${p}: ${r.status} ${await r.text()}`); return r.json(); };
const post = async (t, rows) => { const r = await api(t, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(rows) }); if (!r.ok) throw new Error(`insert ${t}: ${r.status} ${await r.text()}`); return r.json(); };

const [loc] = await get("locations?slug=eq.mississauga&select=id");
if (!loc) throw new Error("Run 0002 first — sample location missing.");
const locId = loc.id;

const ZONES = [
  { name: "The Mural Lounge",  type: "private",      seated_cap: 40,  standing_cap: 60,  base_min_spend: 2000, sort_order: 1 },
  { name: "The Curio Library", type: "semi_private", seated_cap: 18,  standing_cap: 28,  base_min_spend: 1500, sort_order: 2 },
  { name: "Main Dining Buyout", type: "event",       seated_cap: 120, standing_cap: 180, base_min_spend: 6000, sort_order: 3 },
];

const existing = await get(`spaces?location_id=eq.${locId}&select=id,name`);
const have = new Set(existing.map((s) => s.name));
const toCreate = ZONES.filter((z) => !have.has(z.name)).map((z) => ({ ...z, location_id: locId, active: true }));
let created = [];
if (toCreate.length > 0) created = await post("spaces", toCreate);
console.log(`✓ zones: ${created.length} created, ${ZONES.length - toCreate.length} already present.`);

// Pricing for the 3 zones across shifts (idempotent).
const allSpaces = await get(`spaces?location_id=eq.${locId}&select=id,name,base_min_spend`);
const zoneSpaces = allSpaces.filter((s) => ZONES.some((z) => z.name === s.name));
const shifts = await get(`shifts?location_id=eq.${locId}&select=id,name`);
const sid = (n) => shifts.find((s) => s.name === n)?.id ?? null;
const rules = await get("pricing_rules?select=space_id,shift_id,season");
const has = (spaceId, shiftId) => rules.some((r) => r.space_id === spaceId && r.shift_id === shiftId && r.season === null);
const peak = sid("peak_dinner"), offpeak = sid("off_peak_dinner"), lunch = sid("lunch");
const newRules = [];
for (const sp of zoneSpaces) {
  const base = Number(sp.base_min_spend ?? 0);
  if (peak && !has(sp.id, peak)) newRules.push({ space_id: sp.id, shift_id: peak, party_size_min: 1, party_size_max: 999999, min_spend: Math.max(base * 1.5, 1000), terms: "Minimum spend applies to food & beverage before tax & gratuity.", cancellation_policy: "Free cancellation up to 72h before; 50% thereafter." });
  if (offpeak && !has(sp.id, offpeak)) newRules.push({ space_id: sp.id, shift_id: offpeak, party_size_min: 1, party_size_max: 999999, min_spend: Math.max(base, 800), terms: "Off-peak dinner minimum spend.", cancellation_policy: "Free cancellation up to 48h before." });
  if (lunch && !has(sp.id, lunch)) newRules.push({ space_id: sp.id, shift_id: lunch, party_size_min: 1, party_size_max: 999999, min_spend: Math.max(base * 0.6, 500), terms: "Lunch minimum spend.", cancellation_policy: "Free cancellation up to 24h before." });
}
if (newRules.length > 0) { await post("pricing_rules", newRules); }
console.log(`✓ pricing: ${newRules.length} zone rules added.`);
console.log("Done. Public booking zones are ready.");
