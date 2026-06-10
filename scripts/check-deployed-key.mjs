// Verify the deployed client bundle inlines a CLEAN anon key (no BOM / non-ASCII).
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const expected = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const base = process.argv[2] || "https://cm-mississaugaevents.vercel.app";

const html = await (await fetch(`${base}/admin/login`)).text();
const chunks = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+?\.js/g)].map((m) => m[0]))];

let cleanFound = false;
let anyKeyish = false;
for (const path of chunks) {
  const js = await (await fetch(base + path)).text();
  if (js.includes("sb_publishable_")) {
    anyKeyish = true;
    if (js.includes(expected)) { cleanFound = true; break; }
  }
}

console.log("chunks scanned:", chunks.length);
console.log("found a publishable key in bundle:", anyKeyish);
console.log("clean key matches verbatim:", cleanFound);
console.log(cleanFound ? "✓ LOGIN SHOULD WORK — key is clean ASCII." : "✗ key not found clean — may still be corrupted.");
