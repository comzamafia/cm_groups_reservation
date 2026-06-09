// Link an existing Supabase Auth user to a staff profile so they can access /admin.
//
// Usage:  node scripts/grant-staff.mjs <email> [role]
//   role defaults to "admin" (admin | manager | host)
//
// Prereq: create the user first in Supabase → Authentication → Add user
// (so account/password creation stays in your hands, not the script's).
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
const service = env.SUPABASE_SERVICE_ROLE_KEY;

const email = process.argv[2];
const role = process.argv[3] || "admin";
if (!email) {
  console.error("Usage: node scripts/grant-staff.mjs <email> [admin|manager|host]");
  process.exit(1);
}

const admin = (path, init = {}) =>
  fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

// 1. Find the auth user by email (GoTrue admin API).
const usersRes = await admin(
  `/auth/v1/admin/users?per_page=200`,
);
if (!usersRes.ok) {
  console.error("Failed to list users:", usersRes.status, await usersRes.text());
  process.exit(1);
}
const { users } = await usersRes.json();
const user = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(
    `No auth user found for ${email}. Create them in Supabase → Authentication → Add user first.`,
  );
  process.exit(1);
}

// 2. Resolve the default location (mississauga) to attach.
const locRes = await admin(`/rest/v1/locations?slug=eq.mississauga&select=id`);
const locs = locRes.ok ? await locRes.json() : [];
const location_id = locs[0]?.id ?? null;

// 3. Upsert the staff row.
const upsertRes = await admin(`/rest/v1/staff?on_conflict=id`, {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify({ id: user.id, email: user.email, role, location_id }),
});

if (!upsertRes.ok) {
  console.error("Failed to grant staff:", upsertRes.status, await upsertRes.text());
  process.exit(1);
}
console.log(`✓ Granted ${role} access to ${user.email} (location: ${location_id ?? "none"})`);
