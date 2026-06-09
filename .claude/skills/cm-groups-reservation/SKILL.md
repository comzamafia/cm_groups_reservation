---
name: cm-groups-reservation
description: >-
  Design system, brand identity, and feature spec for the Chiang Mai Thai Dining
  "Group Party & Events" reservation system (this cm_groups_reservation repo).
  Use this skill whenever you are building, styling, or reviewing ANY part of this
  project — booking pages, reservation flows, event/space cards, the operations
  calendar, the analytics dashboard, pricing/policy logic, or lead-capture forms.
  Trigger it even when the request doesn't say "Chiang Mai" or "design system":
  any UI work, component, color, font, copy, or feature in this repo must follow
  these brand and module rules. If you're about to pick a color, font, layout
  pattern, or implement one of the five reservation modules, consult this skill first.
---

# Chiang Mai Thai Dining — Group Party Reservation System

This skill is the source of truth for building the **Group Party & Events**
reservation system for **Chiang Mai Thai Dining** (Mississauga and sister
locations). It exists so every screen looks like it belongs to the same premium
Lanna-inspired brand, and so the five product modules are implemented to spec
instead of being reinvented each time.

Read this whole file before starting work. Pull in the reference files below when
you need the full detail.

## What we're building (product in one paragraph)

A reservation engine that turns ordinary table bookings into high-value event
revenue. Guests get a **sleek, elegant, minimal** booking experience; staff get a
**zero-chaos** back-of-house engine (central calendar, dynamic pricing, lead
capture, analytics). The guest-facing flow is **mobile-first** — most discovery
and booking happens on phones.

## The five core modules

Implement features against these modules. Full detail in
`references/system-design.md` — read it before building any module.

1. **Smart Booking & Upselling Flow** — show event/private spaces next to standard
   tables; dynamically upsell add-ons (drink packages, AV, corkage, cake-cutting)
   when a private space is chosen; promotional banners atop the booking page.
2. **Fallback & Lead Capture** — "never miss a booking." Auto-surface alternative
   spaces when tables are full, show next availability, cross-promote sister
   venues, and capture an inquiry/lead form when nothing fits.
3. **Dynamic Pricing & Policy Engine** — minimum spends and terms that vary by day,
   shift, season, space type, and party size; show guests only the terms that
   apply to their booking.
4. **Centralized Event Calendar** — staff dashboard filterable by venue, space,
   status, and Day/Week/Month view; custom statuses + smart notifications.
5. **Analytics & Reporting** — event-revenue dashboard, demand trends by
   day/time/season, top-performing spaces and shifts.

## Brand identity — the non-negotiables

Full brand spec (every hex value, font weight, photography rule) lives in
`references/design-system.md`. The essentials you must internalize:

- **Feel:** Inviting, Contemporary, Relaxed, Engaging. Premium but understated —
  Lanna craft (Chiang Mai art, elephants, Yi Peng lanterns) meets contemporary
  North-American dining.
- **Brand colors are used full-tone only.** Never darken, lighten, or make brand
  colors transparent.
  - Night Purple `#440E48` (primary, premium/mysterious)
  - Yellow/Gold `#F4A626`
  - Red Brown `#9F4000`
- **Functional greys** for UI/text: `#140516`, `#433745`, `#726973`, `#A19BA2`, `#D0CDD0`.
- **Location accent colors** (use per branch): Sky Mountain `#1DBA87`/`#09473A`,
  Parklawn `#FABC3A`/`#E57037`, Liberty Village `#835D19`, Danforth `#943B13`.
- **Typography:** Headings/brand → `Amandine`; body → `New Oder`;
  Thai text → `IBM Plex Sans Thai`. Define safe web fallbacks (serif display for
  Amandine, clean sans for New Oder) when those faces aren't licensed for web.

## UX/UI rules (apply to every guest-facing screen)

These come straight from the design guideline. They are *why* the product feels
premium — don't shortcut them.

1. **Minimalist palette & type.** Off-white / cream background, dark charcoal text.
   Reserve brand color (Night Purple, Gold) strictly for buttons, highlights, and
   accents — not large fills. Generous whitespace.
2. **Card-based spaces.** Present each private space as a clean card: one large
   high-quality image + atomic metadata ("16 Seated • 20 Standing",
   "Minimum Spend: $2,000–3,000"). No clutter.
3. **Progressive disclosure.** Break booking into bite-sized steps —
   Guests → Date → Time → Space → Add-ons → Confirmation. Never one long form.
4. **Mobile-first responsiveness.** Design for the phone viewport first; 100% of the
   guest flow must work cleanly on mobile. Tap targets ≥ 44px.

## Starter design tokens

A ready-to-use CSS variables file is at `assets/brand-tokens.css`. Import it (or
mirror it into your framework's theme config) so colors, fonts, and spacing stay
consistent. Don't hardcode hex values in components — reference the tokens.

## Working checklist

Before you finish any UI task on this repo, confirm:

- [ ] Background is cream/off-white, text is charcoal, brand color only on accents
- [ ] Brand colors used full-tone (no opacity/tint hacks)
- [ ] Correct fonts (Amandine / New Oder / IBM Plex Sans Thai) with fallbacks
- [ ] Spaces shown as image-led cards with atomic metadata
- [ ] Multi-step flow, not a wall of fields
- [ ] Looks and works correctly at a 375px mobile width
- [ ] Feature behavior matches the relevant module in `references/system-design.md`

## Reference files

- `references/design-system.md` — complete Chiang Mai brand identity (colors,
  typography, logo, imagery, tone). Read when styling anything.
- `references/system-design.md` — full spec of all five reservation modules. Read
  before implementing or changing a feature.
- `assets/brand-tokens.css` — drop-in CSS custom properties for colors/fonts/spacing.
