-- Chiang Mai Group Party Reservation System — initial schema
-- Phase 0. Run in the Supabase SQL editor or via `supabase db push`.

-- Extensions
create extension if not exists "pgcrypto";

-- =========================================================
-- Enums
-- =========================================================
create type space_type as enum ('table', 'semi_private', 'private', 'event');
create type shift_name as enum ('lunch', 'off_peak_dinner', 'peak_dinner');
create type addon_category as enum ('drink', 'av', 'corkage', 'cake', 'other');
create type reservation_status as enum ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');
create type lead_status as enum ('new', 'contacted', 'won', 'lost');
create type staff_role as enum ('admin', 'manager', 'host');

-- =========================================================
-- Core tables
-- =========================================================
create table locations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  accent_color  text,                -- per-branch accent (e.g. #1DBA87)
  address       text,
  timezone      text not null default 'America/Toronto',
  created_at    timestamptz not null default now()
);

create table spaces (
  id             uuid primary key default gen_random_uuid(),
  location_id    uuid not null references locations(id) on delete cascade,
  name           text not null,
  type           space_type not null,
  seated_cap     int,
  standing_cap   int,
  photo_url      text,
  description    text,
  base_min_spend numeric(10,2) default 0,
  active         boolean not null default true,
  sort_order     int default 0,
  created_at     timestamptz not null default now()
);

create table shifts (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references locations(id) on delete cascade,
  name         shift_name not null,
  start_time   time not null,
  end_time     time not null,
  days_of_week int[] not null default '{0,1,2,3,4,5,6}'  -- 0=Sun .. 6=Sat
);

create table pricing_rules (
  id                  uuid primary key default gen_random_uuid(),
  space_id            uuid not null references spaces(id) on delete cascade,
  shift_id            uuid references shifts(id) on delete set null,
  season              text,            -- e.g. 'holiday', 'summer', null = any
  party_size_min      int default 1,
  party_size_max      int default 9999,
  min_spend           numeric(10,2) not null default 0,
  terms               text,
  cancellation_policy text,
  created_at          timestamptz not null default now()
);

create table addons (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references locations(id) on delete cascade,
  name         text not null,
  category     addon_category not null,
  price        numeric(10,2) not null default 0,
  description  text,
  active       boolean not null default true
);

create table statuses (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references locations(id) on delete cascade,
  label        text not null,
  color        text,
  sort_order   int default 0
);

create table reservations (
  id              uuid primary key default gen_random_uuid(),
  location_id     uuid not null references locations(id) on delete cascade,
  space_id        uuid references spaces(id) on delete set null,
  shift_id        uuid references shifts(id) on delete set null,
  guest_name      text not null,
  guest_email     text not null,
  guest_phone     text,
  party_size      int not null,
  date            date not null,
  time            time not null,
  status          reservation_status not null default 'pending',
  total_min_spend numeric(10,2) default 0,
  notes           text,
  created_at      timestamptz not null default now()
);

create table reservation_addons (
  reservation_id uuid not null references reservations(id) on delete cascade,
  addon_id       uuid not null references addons(id) on delete cascade,
  qty            int not null default 1,
  primary key (reservation_id, addon_id)
);

create table leads (
  id             uuid primary key default gen_random_uuid(),
  location_id    uuid references locations(id) on delete set null,
  name           text not null,
  email          text not null,
  phone          text,
  requested_date date,
  party_size     int,
  requirements   text,
  status         lead_status not null default 'new',
  created_at     timestamptz not null default now()
);

create table banners (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid references locations(id) on delete cascade,
  image_url    text,
  headline     text,
  link         text,
  active       boolean not null default true,
  sort_order   int default 0
);

-- Staff profile linked to Supabase Auth users
create table staff (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  role         staff_role not null default 'host',
  location_id  uuid references locations(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- =========================================================
-- Indexes
-- =========================================================
create index idx_spaces_location on spaces(location_id);
create index idx_reservations_location_date on reservations(location_id, date);
create index idx_reservations_space_date on reservations(space_id, date);
create index idx_leads_location_status on leads(location_id, status);
create index idx_pricing_rules_space on pricing_rules(space_id);

-- =========================================================
-- Row Level Security (RLS)
-- Public (guest) can READ catalog + availability; only staff write.
-- =========================================================
alter table locations enable row level security;
alter table spaces enable row level security;
alter table shifts enable row level security;
alter table pricing_rules enable row level security;
alter table addons enable row level security;
alter table banners enable row level security;
alter table reservations enable row level security;
alter table reservation_addons enable row level security;
alter table leads enable row level security;
alter table statuses enable row level security;
alter table staff enable row level security;

-- Helper: is the current user staff?
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where id = auth.uid());
$$;

-- Public read on guest-facing catalog
create policy "public read locations" on locations for select using (true);
create policy "public read spaces"    on spaces    for select using (active);
create policy "public read shifts"    on shifts    for select using (true);
create policy "public read pricing"   on pricing_rules for select using (true);
create policy "public read addons"    on addons    for select using (active);
create policy "public read banners"   on banners   for select using (active);

-- Guests may create reservations and leads (insert only)
create policy "guest create reservation" on reservations for insert with check (true);
create policy "guest create resv addons" on reservation_addons for insert with check (true);
create policy "guest create lead"        on leads for insert with check (true);

-- Staff full access
create policy "staff all locations"   on locations   for all using (is_staff()) with check (is_staff());
create policy "staff all spaces"      on spaces      for all using (is_staff()) with check (is_staff());
create policy "staff all shifts"      on shifts      for all using (is_staff()) with check (is_staff());
create policy "staff all pricing"     on pricing_rules for all using (is_staff()) with check (is_staff());
create policy "staff all addons"      on addons      for all using (is_staff()) with check (is_staff());
create policy "staff all banners"     on banners     for all using (is_staff()) with check (is_staff());
create policy "staff all statuses"    on statuses    for all using (is_staff()) with check (is_staff());
create policy "staff read reservations"  on reservations for select using (is_staff());
create policy "staff update reservations" on reservations for update using (is_staff()) with check (is_staff());
create policy "staff manage resv addons" on reservation_addons for select using (is_staff());
create policy "staff all leads"       on leads       for all using (is_staff()) with check (is_staff());
create policy "staff read self"       on staff       for select using (id = auth.uid() or is_staff());
