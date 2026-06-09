# Admin Console — Setup & Usage

The staff console lives at **`/admin`** (e.g. http://localhost:3000/admin).
It lets the events team manage the inquiries (leads) captured from the website
and the reservations on a central calendar.

## 1. Apply the new migrations
In the Supabase SQL editor, run (if you haven't already):
- `supabase/migrations/0003_seed_reservations.sql` — sample bookings so the
  calendar has data this month (idempotent; safe to re-run).

The auth + staff tables already exist from `0001_init_schema.sql`.

## 2. Create a staff login (you do this — keeps passwords in your hands)
1. Supabase dashboard → **Authentication → Users → Add user**.
2. Enter an email + password for the team member. (Toggle "Auto Confirm User"
   so they can sign in immediately.)

## 3. Grant that user staff access
Run the helper script with the email you just created:
```bash
node scripts/grant-staff.mjs you@chiangmai.ca admin
```
Roles: `admin` (default), `manager`, `host`. This links the auth user to a row
in the `staff` table, which the RLS policies use to authorize access.

## 4. Sign in
Go to `/admin/login`, sign in, and you'll land on the dashboard.

---

## What's in the console
- **Dashboard** — counts of new/total leads and reservations, plus the latest
  inquiries with quick status changes.
- **Leads** — every website inquiry; filter by status; change status
  (new → contacted → won/lost). Contact links to email/phone.
- **Reservations** — a month calendar (Module 4) with venue / space / status
  filters and an agenda list; change booking status inline.

## How access is enforced
- `src/middleware.ts` refreshes the Supabase session and redirects
  unauthenticated visitors from `/admin/*` to `/admin/login`.
- The `(panel)` layout additionally requires a `staff` row; signed-in users
  without one see an "ask an administrator" message.
- All reads/writes go through Supabase **RLS** (`is_staff()` policies), so the
  database is the final gatekeeper even if the UI is bypassed.
