// Apply real content (from chiangmai.ca/about + /locations/mississauga) to the
// CMS, and add a 4th bookable zone with pricing. Idempotent.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
const defs = JSON.parse(readFileSync(new URL("../src/content/defaults.json", import.meta.url), "utf8"));

const api = (p, init = {}) => fetch(`${url}/rest/v1/${p}`, {
  ...init,
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) },
});
const get = async (p) => { const r = await api(p); if (!r.ok) throw new Error(`${p}: ${r.status} ${await r.text()}`); return r.json(); };

// ── 1. Real content overrides ──
const CONTENT = {
  brand_sub: "Elevated Thai · Mississauga",
  hero_subtitle: "An elevated Thai dining experience that blends the traditional and the modern — now hosting private dining and group events in Mississauga.",
  hero_stat_1: "Private events for 5+",
  hero_stat_2: "285 Enfield Pl, Mississauga",
  hero_stat_3: "Free covered parking & Wi-Fi",
  story_kicker: "Our Story",
  story_heading: "Elevated Thai dining, since 2018.",
  story_lead: "Established in 2018 in Etobicoke, Chiang Mai rapidly emerged as the epitome of an elevated Thai dining experience — beautifully blending the traditional and the modern. Today we gather groups and host celebrations across the GTA, including our Mississauga room.",
  story_badge_num: "6",
  story_badge_text: "locations across the GTA",
  story_point_1: "Exotic flavours of Thailand, traditional techniques",
  story_point_2: "Menus customizable for your group",
  story_point_3: "Free covered parking & free Wi-Fi",
  story_point_4: "Private events for parties of 5 or more",
  reserve_lead: "Book a table in any of our spaces in seconds, or start an inquiry for a larger private event (parties of 5+) — our team will take it from there.",
  contact_phone: "(416) 257-8424",
  contact_address: "285 Enfield Pl #100, Mississauga, ON L5B 3Y6",
  contact_hours: "Mon–Thu 4–10pm · Fri–Sat 4–11pm · Sun 4–10pm",
  footer_blurb: "An elevated Thai dining experience blending the traditional and the modern. Established in 2018, now across six locations in the Greater Toronto Area.",
  footer_visit_1: "285 Enfield Pl #100",
  footer_visit_2: "Mississauga, ON L5B 3Y6",
  footer_hours_1: "Mon–Thu · 4–10pm",
  footer_hours_2: "Fri–Sat 4–11pm · Sun 4–10pm",
  // 4th landing card
  space4_name: defs.space4_name.value,
  space4_tag: defs.space4_tag.value,
  space4_caps: defs.space4_caps.value,
  space4_desc: defs.space4_desc.value,
  space4_image: defs.space4_image.value,
};

const rows = Object.entries(CONTENT).map(([k, v]) => {
  const d = defs[k];
  if (!d) throw new Error(`Key ${k} missing from defaults.json`);
  return { key: k, grp: d.grp, label: d.label, type: d.type, sort: d.sort, value: v };
});

const upRes = await api("site_content?on_conflict=key", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(rows),
});
if (!upRes.ok) { console.error("content upsert failed:", upRes.status, await upRes.text()); process.exit(1); }
console.log(`✓ applied ${rows.length} real-content fields.`);

// ── 2. Add the 4th bookable zone + pricing ──
const [loc] = await get("locations?slug=eq.mississauga&select=id");
const locId = loc.id;
const ZONE = { name: "The Lanna Terrace", type: "event", seated_cap: 30, standing_cap: 45, base_min_spend: 2500, photo_url: "/assets/lanna-terrace.jpg", sort_order: 4 };

const existing = await get(`spaces?location_id=eq.${locId}&name=eq.${encodeURIComponent(ZONE.name)}&select=id`);
if (existing.length === 0) {
  const r = await api("spaces", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify([{ ...ZONE, location_id: locId, active: true }]) });
  if (!r.ok) { console.error("zone insert failed:", r.status, await r.text()); process.exit(1); }
  console.log("✓ added zone: The Lanna Terrace");
} else {
  console.log("• zone The Lanna Terrace already exists.");
}

// Pricing for the new zone across shifts (idempotent)
const allSpaces = await get(`spaces?location_id=eq.${locId}&name=eq.${encodeURIComponent(ZONE.name)}&select=id,base_min_spend`);
const sp = allSpaces[0];
const shifts = await get(`shifts?location_id=eq.${locId}&select=id,name`);
const sid = (n) => shifts.find((s) => s.name === n)?.id ?? null;
const rules = await get(`pricing_rules?space_id=eq.${sp.id}&select=shift_id,season`);
const has = (shiftId) => rules.some((r) => r.shift_id === shiftId && r.season === null);
const base = Number(sp.base_min_spend ?? 0);
const peak = sid("peak_dinner"), offpeak = sid("off_peak_dinner"), lunch = sid("lunch");
const newRules = [];
if (peak && !has(peak)) newRules.push({ space_id: sp.id, shift_id: peak, party_size_min: 1, party_size_max: 999999, min_spend: Math.max(base * 1.5, 1000), terms: "Minimum spend applies to food & beverage before tax & gratuity.", cancellation_policy: "Free cancellation up to 72h before; 50% thereafter." });
if (offpeak && !has(offpeak)) newRules.push({ space_id: sp.id, shift_id: offpeak, party_size_min: 1, party_size_max: 999999, min_spend: Math.max(base, 800), terms: "Off-peak dinner minimum spend.", cancellation_policy: "Free cancellation up to 48h before." });
if (lunch && !has(lunch)) newRules.push({ space_id: sp.id, shift_id: lunch, party_size_min: 1, party_size_max: 999999, min_spend: Math.max(base * 0.6, 500), terms: "Lunch minimum spend.", cancellation_policy: "Free cancellation up to 24h before." });
if (newRules.length) { await api("pricing_rules", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(newRules) }); }
console.log(`✓ zone pricing: ${newRules.length} rules added.`);
console.log("Done — 4 active zones, real content applied.");
