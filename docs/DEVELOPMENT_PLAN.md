# Development Plan — Chiang Mai Group Party Reservation System

> เอกสารแผนพัฒนา (V1) — อ้างอิง: System Design (5 modules) + Brand Identity Guideline V1.0
> Stack ที่เลือก: **Next.js + Supabase** · เป้าหมายเฟสแรก: **MVP ใช้งานจริงได้** · ทำครบทั้ง 5 modules แบบ phase ต่อเนื่อง

**การตัดสินใจที่ยืนยันแล้ว:**
- ภาษา: **English only** (ยังไม่ทำ i18n ในเฟสนี้)
- Supabase project: `https://zyxmnzeignbvxagzceps.supabase.co`
- ระบบชำระเงิน/มัดจำ (Stripe): **ไว้เฟสหลัง** — ไม่อยู่ในขอบเขต MVP

---

## 1. ภาพรวมสถาปัตยกรรม (Architecture)

| ชั้น | เทคโนโลยี | หน้าที่ |
|------|-----------|---------|
| Frontend | **Next.js 14 (App Router) + TypeScript** | หน้า guest booking (mobile-first) + admin dashboard |
| Styling | **Tailwind CSS** + `brand-tokens.css` | ใช้ design tokens ของแบรนด์ (สี/ฟอนต์/spacing) |
| Backend / DB | **Supabase** (Postgres + Auth + Storage + Realtime) | ข้อมูล, auth พนักงาน, เก็บรูปภาพ space, อัปเดตปฏิทินแบบ realtime |
| Server logic | **Next.js Route Handlers / Server Actions** | pricing engine, availability, lead capture |
| Notifications | **Resend / Supabase Edge Functions** | อีเมลยืนยัน + แจ้งเตือนทีม |
| Deploy | **Vercel** (frontend) + Supabase cloud | CI/CD ผ่าน GitHub |

**หลักการ UX (บังคับทุกหน้า guest):** cream/charcoal palette, brand color เฉพาะปุ่ม/highlight, การ์ดรูปนำ, flow แบบทีละขั้น, mobile-first (ทดสอบที่ 375px). อ้างอิงสกิล `cm-groups-reservation`.

---

## 2. Data Model (ตารางหลักใน Supabase)

```
locations        (id, name, slug, accent_color, address, timezone)
spaces           (id, location_id, name, type[table|semi_private|private|event],
                  seated_cap, standing_cap, photo_url, description, base_min_spend)
shifts           (id, location_id, name[lunch|off_peak_dinner|peak_dinner],
                  start_time, end_time, days_of_week)
pricing_rules    (id, space_id, shift_id, season, party_size_min, party_size_max,
                  min_spend, terms, cancellation_policy)
addons           (id, location_id, name, category[drink|av|corkage|cake], price, description)
reservations     (id, location_id, space_id, shift_id, guest_name, guest_email,
                  guest_phone, party_size, date, time, status, total_min_spend, notes)
reservation_addons (reservation_id, addon_id, qty)
leads            (id, location_id, name, email, phone, requested_date, party_size,
                  requirements, status[new|contacted|won|lost], created_at)
banners          (id, location_id, image_url, headline, link, active, sort_order)
statuses         (id, location_id, label, color, sort_order)  -- custom ops statuses
staff            (id, email, role[admin|manager|host], location_id)  -- via Supabase Auth
```

หมายเหตุ: ใช้ **Row Level Security (RLS)** ของ Supabase แยกสิทธิ์ตาม location/role ของพนักงาน และเปิด public read เฉพาะข้อมูลที่ guest ต้องเห็น (spaces, addons, banners, availability).

---

## 3. แผนแบ่ง Phase (Roadmap)

### Phase 0 — Foundation & Setup  *(สัปดาห์ 1)*
ตั้งโครงให้พร้อมก่อนลงมือฟีเจอร์
- [ ] init Next.js + TypeScript + Tailwind ในรีโป; เชื่อม `brand-tokens.css`
- [ ] สร้างโปรเจกต์ Supabase + ตั้ง schema/ตารางตามข้อ 2 (migration files)
- [ ] ตั้ง env, Supabase client, layout หลัก + ฟอนต์ (Amandine/New Oder/IBM Plex Sans Thai + fallback)
- [ ] seed ข้อมูลตัวอย่าง 1 location หลายๆ space เพื่อใช้พัฒนา
- [ ] ตั้ง Vercel + GitHub Actions (lint/build) → deploy preview
- **Deliverable:** หน้าเปล่ารันได้บน Vercel + DB พร้อม seed

### Phase 1 — Module 1: Smart Booking & Upselling  *(สัปดาห์ 2–3)*
หัวใจของ MVP — guest จองได้จริง
- [ ] หน้า landing/booking: banner ด้านบน + แสดง space เป็นการ์ด (รูปใหญ่ + metadata "16 Seated • 20 Standing", min spend)
- [ ] Flow ทีละขั้น: Guests → Date → Time → Space → Add-ons → Confirmation
- [ ] แสดง table ปกติ + private/event space บนหน้าจอเดียว (integrated view)
- [ ] Smart upsell: เลือก private space แล้วเสนอ add-ons (drink/AV/corkage/cake) แบบ dynamic
- [ ] บันทึก reservation ลง DB + ส่งอีเมลยืนยัน (Resend)
- **Deliverable:** จองครบ flow + ได้อีเมลยืนยัน + เห็นใน DB

### Phase 2 — Module 4: Centralized Event Calendar (Admin)  *(สัปดาห์ 4–5)*
ให้ทีมหลังบ้านจัดการได้
- [ ] Auth พนักงาน (Supabase Auth) + RLS ตาม role/location
- [ ] ปฏิทินกลาง: filter ตาม venue / space / status; view Day/Week/Month
- [ ] จัดการ reservation: เปลี่ยนสถานะ (custom statuses), แก้ไข, ดูรายละเอียด
- [ ] Realtime update (Supabase Realtime) เมื่อมี booking ใหม่
- [ ] Smart notification ให้ทีมเมื่อต้องดำเนินการ
- **Deliverable:** ทีมล็อกอินดู/จัดการ booking ได้ครบ

### Phase 3 — Module 3: Dynamic Pricing & Policy Engine  *(สัปดาห์ 6)*
- [ ] pricing engine: คำนวณ min spend จาก day/shift/season/space/party size
- [ ] แสดงเฉพาะ terms + cancellation policy ที่ตรงกับเงื่อนไขการจองนั้น
- [ ] admin UI สำหรับตั้ง/แก้ pricing_rules
- **Deliverable:** ราคา/เงื่อนไขปรับอัตโนมัติตามบริบทการจอง

### Phase 4 — Module 2: Fallback & Lead Capture  *(สัปดาห์ 7)*
- [ ] เมื่อเต็ม: auto-surface space ทางเลือก + แสดงวัน/เวลาว่างถัดไป
- [ ] cross-promotion: แสดง availability ของสาขาพี่น้อง
- [ ] ฟอร์ม inquiry/lead เก็บลง `leads` ส่งให้ทีมขาย
- **Deliverable:** "Never miss a booking" — ไม่มีทางตันสำหรับ guest

### Phase 5 — Module 5: Analytics & Reporting  *(สัปดาห์ 8)*
- [ ] dashboard: event revenue + booking mix
- [ ] demand trend ตาม day/time/season (กราฟ)
- [ ] top-performing spaces & shifts
- **Deliverable:** ผู้บริหารดูภาพรวมและตัดสินใจได้

### Phase 6 — Hardening & Launch  *(สัปดาห์ 9)*
- [ ] รองรับหลาย location เต็มรูปแบบ, ทดสอบ mobile (375px) ทุกหน้า
- [ ] ทดสอบ end-to-end, accessibility, performance
- [ ] เอกสารใช้งานสำหรับทีม + go-live
- **Deliverable:** ระบบพร้อมใช้งานจริง

---

## 4. ลำดับ Dependency ที่สำคัญ
1. Phase 0 ต้องเสร็จก่อนทุกอย่าง (schema + setup)
2. Module 1 (จอง) มาก่อน Module 4 (จัดการสิ่งที่จองมา)
3. Pricing (M3) เสริมเข้า flow จองของ M1 ได้ภายหลัง
4. Analytics (M5) ต้องมีข้อมูล booking จริงจาก M1/M4 ก่อนถึงจะมีความหมาย

---

## 5. ขั้นถัดไป (รอยืนยันก่อนลงมือ)
ถ้าโอเคกับแผนนี้ ผมจะเริ่ม **Phase 0** ให้ทันที:
1. init โครง Next.js + Tailwind + Supabase client ในรีโป
2. เขียน migration สร้างตารางทั้งหมด
3. seed ข้อมูล 1 location ตัวอย่าง

**สิ่งที่อยากให้คุณช่วยเตรียม/ตัดสินใจก่อน Phase 0:**
- ต้องการให้รองรับ **2 ภาษา (ไทย/อังกฤษ)** ตั้งแต่แรกไหม หรือเริ่มภาษาเดียวก่อน?
- มี Supabase project อยู่แล้ว หรือให้ผมแนะนำขั้นตอนสร้างใหม่?
- ระบบชำระเงิน/มัดจำ (เช่น Stripe) อยู่ในขอบเขต MVP ไหม หรือไว้เฟสหลัง?
