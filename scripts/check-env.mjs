import { readFileSync } from "node:fs";
const t = readFileSync(new URL("../.vercel-check.txt", import.meta.url), "utf8");
for (const line of t.split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (!m) continue;
  let v = m[2];
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  const bad = [...v].filter((ch) => ch.charCodeAt(0) > 127).map((ch) => "U+" + ch.charCodeAt(0).toString(16));
  console.log(m[1], "len=" + v.length, bad.length ? "NON-ASCII: " + bad.join(",") : "clean");
}
