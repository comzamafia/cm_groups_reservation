-- V2 seating: assign reservations to physical tables (many-to-many).
-- A booking can occupy several tables; a table can host different bookings
-- across the day (conflict is checked per time slot in the app layer).

create table if not exists public.reservation_tables (
  reservation_id uuid references public.reservations(id) on delete cascade,
  table_id uuid references public.restaurant_tables(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reservation_id, table_id)
);

create index if not exists idx_reservation_tables_table on public.reservation_tables(table_id);

alter table public.reservation_tables enable row level security;

drop policy if exists "staff manage reservation_tables" on public.reservation_tables;
create policy "staff manage reservation_tables" on public.reservation_tables
  for all using (is_staff()) with check (is_staff());

-- live updates when a booking is seated / moved
alter publication supabase_realtime add table public.reservation_tables;
