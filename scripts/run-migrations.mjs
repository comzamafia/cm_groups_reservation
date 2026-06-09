// Runs the DML migrations (0003 reservations, 0004 pricing) against Supabase via
// the service-role REST API, idempotently. The DDL migration (0005 realtime)
// cannot run through the API — it's reported at the end for the SQL editor.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const api = (path, init = {}) =>
  fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

const get = async (path) => {
  const r = await api(path);
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
};
const insert = async (table, rows) => {
  const r = await api(table, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`insert ${table}: ${r.status} ${await r.text()}`);
};

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// ── Resolve base data ──
const [loc] = await get("locations?slug=eq.mississauga&select=id");
if (!loc) throw new Error("Sample location 'mississauga' not found — run 0002 first.");
const locId = loc.id;

const spaces = await get(`spaces?location_id=eq.${locId}&select=id,name,type,base_min_spend`);
const shifts = await get(`shifts?location_id=eq.${locId}&select=id,name`);
const shiftId = (name) => shifts.find((s) => s.name === name)?.id ?? null;
const pick = (name, type) =>
  spaces.find((s) => s.name === name)?.id ??
  spaces.find((s) => s.type === type)?.id ??
  null;

// ── 0003: sample reservations ──
const existingResv = await get("reservations?select=id&limit=1");
if (existingResv.length > 0) {
  console.log("• 0003 reservations: already present — skipped.");
} else {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const day = (n) => ymd(new Date(first.getFullYear(), first.getMonth(), 1 + n));
  const peak = shiftId("peak_dinner");
  const mural = pick("The Mural Lounge", "private");
  const curio = pick("The Curio Library", "semi_private");
  const main = pick("Main Dining Buyout", "event");

  await insert("reservations", [
    { location_id: locId, space_id: mural, shift_id: peak, guest_name: "Aroon Srisai", guest_email: "aroon@example.com", guest_phone: "9055550111", party_size: 18, date: day(4), time: "19:00", status: "confirmed", total_min_spend: 3000, notes: "Birthday — cake cutting" },
    { location_id: locId, space_id: curio, shift_id: peak, guest_name: "Mei Lin", guest_email: "mei@example.com", guest_phone: "9055550112", party_size: 12, date: day(9), time: "18:30", status: "pending", total_min_spend: 1200, notes: "Board dinner" },
    { location_id: locId, space_id: main, shift_id: peak, guest_name: "Carter & Wong", guest_email: "events@example.com", guest_phone: "9055550113", party_size: 90, date: day(15), time: "18:00", status: "confirmed", total_min_spend: 9000, notes: "Wedding reception" },
    { location_id: locId, space_id: mural, shift_id: peak, guest_name: "Daniel Okafor", guest_email: "daniel@example.com", guest_phone: "9055550114", party_size: 24, date: day(20), time: "19:30", status: "seated", total_min_spend: 3500, notes: "Corporate dinner" },
    { location_id: locId, space_id: curio, shift_id: peak, guest_name: "Priya Nair", guest_email: "priya@example.com", guest_phone: "9055550115", party_size: 16, date: day(24), time: "18:00", status: "completed", total_min_spend: 2000, notes: "Anniversary" },
  ]);
  console.log("✓ 0003 reservations: inserted 5 sample bookings this month.");
}

// ── 0004: pricing rules per space × shift ──
const existingRules = await get("pricing_rules?select=space_id,shift_id,season");
const has = (spaceId, sid) =>
  existingRules.some((r) => r.space_id === spaceId && r.shift_id === sid && r.season === null);

const peak = shiftId("peak_dinner");
const offpeak = shiftId("off_peak_dinner");
const lunch = shiftId("lunch");
const newRules = [];
for (const sp of spaces) {
  const base = Number(sp.base_min_spend ?? 0);
  if (peak && !has(sp.id, peak))
    newRules.push({ space_id: sp.id, shift_id: peak, party_size_min: 1, party_size_max: 999999, min_spend: Math.max(base * 1.5, 1000), terms: "Minimum spend applies to food & beverage before tax & gratuity.", cancellation_policy: "Free cancellation up to 72h before; 50% thereafter." });
  if (offpeak && !has(sp.id, offpeak))
    newRules.push({ space_id: sp.id, shift_id: offpeak, party_size_min: 1, party_size_max: 999999, min_spend: Math.max(base, 800), terms: "Off-peak dinner minimum spend.", cancellation_policy: "Free cancellation up to 48h before." });
  if (lunch && !has(sp.id, lunch))
    newRules.push({ space_id: sp.id, shift_id: lunch, party_size_min: 1, party_size_max: 999999, min_spend: Math.max(base * 0.6, 500), terms: "Lunch minimum spend.", cancellation_policy: "Free cancellation up to 24h before." });
}
if (newRules.length > 0) {
  await insert("pricing_rules", newRules);
  console.log(`✓ 0004 pricing: inserted ${newRules.length} new rules.`);
} else {
  console.log("• 0004 pricing: all rules already present — skipped.");
}

// ── 0005: realtime (DDL — cannot run via REST) ──
console.log("\n⚠ 0005 enable_realtime: DDL cannot be run via the API.");
console.log("  Run it in Supabase SQL Editor, OR enable Realtime for the");
console.log("  'leads' and 'reservations' tables in Database → Replication.");
