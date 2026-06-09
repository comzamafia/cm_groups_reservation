# Deploying to Vercel

The repo is on GitHub and is a standard Next.js 15 app, so Vercel needs no
special config. Deploy via the GitHub integration (recommended):

## 1. Import the repo
1. Go to https://vercel.com/new
2. Sign in with GitHub and select **comzamafia/cm_groups_reservation**.
3. Framework preset: **Next.js** (auto-detected). Leave build & output settings
   at defaults (`next build`).

## 2. Set environment variables
In the import screen (or Project → Settings → Environment Variables), add — for
**Production** (and Preview):

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zyxmnzeignbvxagzceps.supabase.co` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(from your `.env.local`)* | public |
| `SUPABASE_SERVICE_ROLE_KEY` | *(from your `.env.local`)* | **secret** — server only |
| `RESEND_API_KEY` | *(optional, leave blank for now)* | email later |

The values are exactly what you already have in `.env.local`. Never commit them.

## 3. Deploy
Click **Deploy**. Vercel builds and gives you a `*.vercel.app` URL. Every push to
`main` auto-deploys; pull requests get preview URLs.

## 4. Point Supabase at the domain (auth redirect)
Supabase → Authentication → URL Configuration → add your Vercel URL to
**Site URL / Redirect URLs** (so the staff `/admin` login redirects work in prod).

## 5. Custom domain (optional)
Project → Settings → Domains → add your domain and follow the DNS steps.

---

## Alternative: deploy from the CLI
If you prefer the terminal:
```bash
npm i -g vercel
vercel login          # opens the browser to authenticate (your account)
vercel link           # link this folder to a Vercel project
vercel env add NEXT_PUBLIC_SUPABASE_URL production      # repeat per variable
vercel --prod         # build & deploy
```
The `vercel login` step is interactive and must be run by you (it authenticates
your Vercel account).

## Notes
- Server Actions, middleware (Edge) and the service-role booking actions all run
  on Vercel without changes.
- Images: public assets ship in `/public`; zone/site images come from the
  Supabase public Storage bucket (external URLs) — no `next/image` domain config
  needed since the app uses CSS background images.
