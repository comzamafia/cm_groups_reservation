# Public Booking — Book a Table

The landing page no longer carries a full inline form. Instead the hero and the
"Reserve Your Evening" section expose two buttons:

- **Book a Table** → opens an OpenTable-style modal (`BookingModal`) with live
  per-zone time slots and instant confirmation.
- **Book an Event** → opens the inquiry form (`EventInquiryModal`) that writes a
  lead for large parties / full buyouts.

## Zones & slots
Three zones — **The Mural Lounge**, **The Curio Library**, **Main Dining Buyout** —
each offer six rounds: **4:00, 4:30, 6:00, 6:30, 8:00, 8:30 PM**.

A slot is **taken** when a non-cancelled reservation exists for that
`(zone, date, time)`. Taken slots render greyed-out and disabled, so a later guest
cannot pick them. Availability is re-fetched whenever the date changes.

## How it stays correct (no RLS changes)
- Public read of reservations is blocked by RLS, so availability and booking go
  through **Server Actions** (`src/app/book-actions.ts`) that use a **service-role**
  client (`src/lib/supabase/admin.ts`) — server-only, never shipped to the browser.
- `createBooking` re-checks the slot is free, validates input, derives the shift,
  prices the booking via the pricing engine, and inserts a `confirmed`
  reservation (which then appears in the admin calendar and fires a realtime toast).

## Managing zones (admin)
`/admin/zones` lists every space and lets staff **add unlimited zones** (name,
type, capacities, base min spend, photo), activate/deactivate, or delete. Any
**active** zone appears in the public booking modal automatically — each with its
photo shown above the name.

Photos can be **uploaded** (stored in the public `zone-photos` Storage bucket via
a server action using the service-role client) or supplied as a URL.

## Setup
1. Seed the zones + their pricing (idempotent):
   ```bash
   node scripts/seed-zones.mjs
   ```
   (Or run `supabase/migrations/0006_public_zones.sql` in the SQL editor.)
1b. Create the photo storage bucket (idempotent):
   ```bash
   node scripts/setup-storage.mjs
   ```
2. **Recommended:** apply the anti-double-booking index in the SQL editor:
   `supabase/migrations/0007_prevent_double_booking.sql`.
   The action guards races on its own, but this index is the hard guarantee.

That's it — open the site, click **Book a Table**, and booked slots will be
disabled for everyone after you.
