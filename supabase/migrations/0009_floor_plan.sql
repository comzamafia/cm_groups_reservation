-- Interactive floor plan: physical tables digitized from the paper seating map.
-- Staff-only operations view; status is toggled by staff and synced in realtime.

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.locations(id) on delete cascade,
  code text not null,                       -- e.g. "L1", "101", "71"
  section text not null default 'main',     -- lounge | right | booth | window | bar
  shape text not null default 'rect',       -- rect | circle
  x numeric not null default 0,             -- top-left, on a 1000 x 640 canvas
  y numeric not null default 0,
  w numeric not null default 70,
  h numeric not null default 70,
  seats int,
  status text not null default 'available', -- available | reserved | occupied | blocked
  note text,                                -- optional: guest name / party while seated
  sort int not null default 0,
  updated_at timestamptz not null default now(),
  unique (location_id, code)
);

alter table public.restaurant_tables enable row level security;

-- Staff can read and manage the floor plan; the public has no access.
drop policy if exists "staff manage tables" on public.restaurant_tables;
create policy "staff manage tables" on public.restaurant_tables
  for all using (is_staff()) with check (is_staff());

-- Live sync across all staff screens.
alter publication supabase_realtime add table public.restaurant_tables;
