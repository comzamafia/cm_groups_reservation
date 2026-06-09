# Design System: Chiang Mai Thai Dining

> Reference: Brand Identity Guideline Version 1.0 (2024)

## Table of contents
1. Brand concept & philosophy
2. Color palette
3. Typography
4. Logo & layout
5. Visual elements & imagery
6. How to apply this to the reservation system

---

## 1. Brand concept & core philosophy

- **Vision:** Elevate authentic Chiang Mai cuisine fused with a North-American
  dining experience.
- **Inspiration:** "The wisdom of Chiang Mai and Thai style" — expressed through
  Lanna art, Thai elephants, and the Yi Peng (lantern) festival.
- **Tone & voice:**
  - **Inviting** — warm, sincere hospitality.
  - **Contemporary** — modern atmosphere and plating, while respecting traditional
    flavors and technique.
  - **Relaxed** — easy, unhurried atmosphere.
  - **Engaging** — draw interest by telling the story of the dishes and culture.

---

## 2. Color palette

Brand colors have **equal status** and must always be used at **full tone** —
never darken, lighten, or make them transparent.

### Primary colors
| Name | Hex | RGB | Use |
|------|-----|-----|-----|
| Night Purple | `#440E48` | 68/14/72 | Primary — premium, mysterious |
| Yellow / Gold | `#F4A626` | 244/166/38 | Gold accent, contrasts purple |
| Red Brown | `#9F4000` | 159/64/0 | Earthy secondary accent |

### Functional grey tones (UI / text)
| Hex | Note |
|-----|------|
| `#140516` | Near-black deep purple — primary text |
| `#433745` | Dark grey |
| `#726973` | Mid grey |
| `#A19BA2` | Light grey |
| `#D0CDD0` | Very light grey — borders/dividers |

### Location accent colors (per branch)
| Location | Primary | Secondary |
|----------|---------|-----------|
| Sky Mountain | `#1DBA87` (green) | `#09473A` (dark green) |
| Parklawn | `#FABC3A` (yellow) | `#E57037` (orange) |
| Liberty Village | `#835D19` (dark yellow) | — |
| Danforth | `#943B13` (dark orange) | — |

**Application rule for the reservation UI:** background is cream/off-white, body
text is charcoal (`#140516`/`#433745`). Brand primaries (Night Purple, Gold)
appear only on buttons, highlights, badges, and key accents — never as large flat
fills. When a screen is scoped to one branch, use that branch's accent color for
its location-specific highlights.

---

## 3. Typography

Specific faces preserve the Chiang Mai identity:

- **Primary (brand name + headings):** `Amandine` — Light, Regular, Medium, Bold.
- **Secondary (body text):** `New Oder` — Light, Regular, Medium, SemiBold, Bold.
- **Thai text:** `IBM Plex Sans Thai` — Light, Regular, Medium, SemiBold.

**Web fallback guidance:** if Amandine / New Oder are not licensed for web embed,
set a graceful stack — e.g. Amandine → an elegant serif display
(`"Amandine", "Cormorant Garamond", Georgia, serif`); New Oder → a clean sans
(`"New Oder", "Inter", "Helvetica Neue", Arial, sans-serif`). Always include
`IBM Plex Sans Thai` in the body stack so Thai renders correctly.

---

## 4. Logo & layout

- **Logo structure:** a **Symbol** (Lanna-arch / stylized M-C-G mark) plus a
  **Logotype** ("CHIANG MAI" with "THAI DINING" subscript).
- **Clear space:** keep clear space of `1X` around the logo (X = proportion of the
  logo's letterforms) so it stays prominent.
- **Layout:** prioritize clear communication; layouts are flexible and divide space
  proportionally to present content precisely.

---

## 5. Visual elements & imagery

- **Brand pattern:** an applied-Lanna-art pattern usable on both white and purple
  backgrounds. Use sparingly as texture/accents (headers, dividers, empty states).
- **Photography style:**
  - Premium, authentic, fresh.
  - Powerful images that convey effortless premium (understatement).
  - Balance "perfection" with "authenticity."
  - Space/room cards should use large, high-quality, well-lit photography.

---

## 6. Applying this to the reservation system

- Use cream/off-white canvas, charcoal text, brand accents on interactive elements.
- Space cards: big photo top, atomic metadata below ("16 Seated • 20 Standing",
  "Minimum Spend: $2,000–3,000"), one clear primary action.
- Buttons: Night Purple or Gold fill, generous padding, rounded but restrained.
- Use the brand pattern only as subtle texture — never let it compete with food/space
  photography.
- Keep it minimal: whitespace is part of the premium feel.
