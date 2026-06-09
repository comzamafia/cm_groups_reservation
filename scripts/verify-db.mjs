// Quick Phase 0 sanity check: load .env.local, hit Supabase with the anon key,
// and confirm the seeded catalog is readable through RLS public-read policies.
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function read(table, select = '*') {
  const res = await fetch(`${url}/rest/v1/${table}?select=${select}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

const locations = await read('locations', 'name,slug');
const spaces = await read('spaces', 'name,type,seated_cap');
const addons = await read('addons', 'name,category,price');

console.log('locations:', locations.length, locations.map((l) => l.slug).join(', '));
console.log('spaces:', spaces.length, spaces.map((s) => `${s.name} (${s.type})`).join(' | '));
console.log('addons:', addons.length, addons.map((a) => a.name).join(' | '));
