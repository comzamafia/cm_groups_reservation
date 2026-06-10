// Cleanly (re)set Vercel env vars from .env.local without any BOM/encoding
// artifacts. Removes then re-adds each var for production/preview/development.
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
const ENVS = ["production", "preview", "development"];

function run(args, input) {
  return new Promise((resolve) => {
    const p = spawn("vercel", args, { shell: true });
    if (input !== undefined) {
      p.stdin.write(input, "utf8"); // plain UTF-8, no BOM, no trailing newline
      p.stdin.end();
    }
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => resolve({ code, err }));
  });
}

for (const name of VARS) {
  const value = env[name];
  if (!value) { console.log(`SKIP ${name} (empty in .env.local)`); continue; }
  for (const e of ENVS) {
    await run(["env", "rm", name, e, "--yes"]); // ignore if absent
    const { code } = await run(["env", "add", name, e], value);
    console.log(`${code === 0 ? "✓" : "✗"} ${name} -> ${e} (len ${value.length})`);
  }
}
console.log("Done. Redeploy with: vercel --prod");
