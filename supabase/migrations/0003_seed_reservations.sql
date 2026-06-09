-- Sample reservations so the admin calendar is demonstrable.
-- Idempotent: skips if any reservations already exist. Dates are relative to
-- today so bookings always land in the current month's calendar view.

do $$
declare
  loc_id uuid;
  sp_mural uuid;
  sp_curio uuid;
  sp_main uuid;
  peak uuid;
begin
  if exists (select 1 from reservations limit 1) then
    raise notice 'Reservations already exist — skipping sample seed.';
    return;
  end if;

  select id into loc_id from locations where slug = 'mississauga';
  if loc_id is null then
    raise notice 'Sample location not found — run 0002 first.';
    return;
  end if;

  select id into sp_mural from spaces where location_id = loc_id and name = 'The Mural Lounge';
  select id into sp_curio from spaces where location_id = loc_id and name = 'The Curio Library';
  select id into sp_main  from spaces where location_id = loc_id and name = 'Main Dining Buyout';
  -- Fall back to seeded room names from 0002 if the design names aren't present.
  if sp_mural is null then select id into sp_mural from spaces where location_id = loc_id and type = 'private' limit 1; end if;
  if sp_curio is null then select id into sp_curio from spaces where location_id = loc_id and type = 'semi_private' limit 1; end if;
  if sp_main is null then select id into sp_main from spaces where location_id = loc_id and type = 'event' limit 1; end if;

  select id into peak from shifts where location_id = loc_id and name = 'peak_dinner' limit 1;

  insert into reservations (location_id, space_id, shift_id, guest_name, guest_email, guest_phone, party_size, date, time, status, total_min_spend, notes) values
    (loc_id, sp_mural, peak, 'Aroon Srisai',   'aroon@example.com',  '9055550111', 18, date_trunc('month', current_date) + interval '4 day',  '19:00', 'confirmed', 3000, 'Birthday — cake cutting'),
    (loc_id, sp_curio, peak, 'Mei Lin',         'mei@example.com',    '9055550112', 12, date_trunc('month', current_date) + interval '9 day',  '18:30', 'pending',   1200, 'Board dinner'),
    (loc_id, sp_main,  peak, 'Carter & Wong',   'events@example.com', '9055550113', 90, date_trunc('month', current_date) + interval '15 day', '18:00', 'confirmed', 9000, 'Wedding reception'),
    (loc_id, sp_mural, peak, 'Daniel Okafor',   'daniel@example.com', '9055550114', 24, date_trunc('month', current_date) + interval '20 day', '19:30', 'seated',    3500, 'Corporate dinner'),
    (loc_id, sp_curio, peak, 'Priya Nair',      'priya@example.com',  '9055550115', 16, date_trunc('month', current_date) + interval '24 day', '18:00', 'completed', 2000, 'Anniversary');
end $$;
