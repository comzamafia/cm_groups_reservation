# Setup — Local Development

## 1. Install dependencies
```bash
npm install
```

## 2. Environment variables
Copy `.env.example` → `.env.local` and fill in the two keys from
**Supabase → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://zyxmnzeignbvxagzceps.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only, keep secret
```

`.env.local` is gitignored — never commit real keys.

## 3. Apply the database schema
Two options:

**A) Supabase SQL editor (simplest):**
1. Open the project → SQL Editor.
2. Paste and run `supabase/migrations/0001_init_schema.sql`.
3. (Optional dev data) paste and run `supabase/migrations/0002_seed_sample.sql`.

**B) Supabase CLI:**
```bash
supabase link --project-ref zyxmnzeignbvxagzceps
supabase db push
```

## 4. Run the dev server
```bash
npm run dev
```
Open http://localhost:3000 — you should see the branded Group Party landing page.

## 5. Deploy (Vercel)
- Import the GitHub repo into Vercel.
- Add the same env vars in the Vercel project settings.
- Vercel auto-builds on push to `main`.

---

## Project structure
```
src/
  app/                  Next.js App Router (pages, layout, global styles)
  lib/
    supabase/client.ts  browser Supabase client (anon key)
    supabase/server.ts  server Supabase client (cookies/auth)
    types.ts            domain types mirroring the DB schema
supabase/migrations/    SQL schema + seed
docs/                   plan + setup docs
.claude/skills/         cm-groups-reservation design skill (brand + module spec)
```
