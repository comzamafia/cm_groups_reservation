// Diagnose content propagation: change a key in the DB, check the live page,
// then revert. Tells us if the LANDING (read path) reflects DB changes.
import { readFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
const SITE = "https://cm-mississaugaevents.vercel.app";
const KEY = "hero_eyebrow";
const MARKER = "DIAGMARKER-" + Date.now();

const api = (p, init = {}) => fetch(`${url}/rest/v1/${p}`, {
  ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) },
});

const [cur] = await (await api(`site_content?key=eq.${KEY}&select=value`)).json();
const original = cur?.value ?? "";
console.log(`current ${KEY} = ${JSON.stringify(original)}`);

await api(`site_content?key=eq.${KEY}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ value: MARKER }) });
console.log(`set ${KEY} = ${MARKER}`);

// wait a moment, then fetch the live landing with cache-bust
await new Promise((r) => setTimeout(r, 1500));
const html = await (await fetch(`${SITE}/?cb=${Date.now()}`, { cache: "no-store" })).text();
const shows = html.includes(MARKER);
console.log(`landing reflects new value: ${shows ? "YES ✅ (read path OK)" : "NO ❌ (landing is cached / not refetching)"}`);

// revert
await api(`site_content?key=eq.${KEY}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ value: original }) });
console.log(`reverted ${KEY}.`);
