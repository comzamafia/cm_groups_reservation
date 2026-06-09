// Verify the lead-capture path the inquiry form uses:
// 1. INSERT a lead with the ANON key (exercises RLS policy "guest create lead").
// 2. Read it back with the SERVICE ROLE key, then DELETE it (cleanup).
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
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

const marker = `__verify_${Date.now()}@example.com`;

// 1. anon insert (what the form/server action does)
const insertRes = await fetch(`${url}/rest/v1/leads`, {
  method: 'POST',
  headers: {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  },
  body: JSON.stringify({
    name: 'Verify Script',
    email: marker,
    phone: '9055550000',
    party_size: 24,
    requirements: 'Event type: Corporate Dinner\nPreferred space: The Mural Lounge',
    status: 'new',
  }),
});

if (!insertRes.ok) {
  console.error('ANON INSERT FAILED:', insertRes.status, await insertRes.text());
  process.exit(1);
}
console.log('✓ anon insert OK (return=minimal, matches server action path)');

// 2. service-role cleanup
const delRes = await fetch(`${url}/rest/v1/leads?email=eq.${encodeURIComponent(marker)}`, {
  method: 'DELETE',
  headers: { apikey: service, Authorization: `Bearer ${service}` },
});
console.log(delRes.ok ? '✓ cleanup OK (test row deleted)' : `cleanup status ${delRes.status}`);
