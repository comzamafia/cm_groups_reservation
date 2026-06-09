-- The 3 public booking zones used by the "Book a Table" flow.
-- Idempotent. (scripts/seed-zones.mjs applies the same data via the API.)

do $$
declare loc_id uuid;
begin
  select id into loc_id from locations where slug = 'mississauga';
  if loc_id is null then raise notice 'Run 0002 first.'; return; end if;

  insert into spaces (location_id, name, type, seated_cap, standing_cap, base_min_spend, active, sort_order)
  select loc_id, v.name, v.type::space_type, v.seated, v.standing, v.minspend, true, v.sort
  from (values
    ('The Mural Lounge',  'private',      40,  60,  2000, 1),
    ('The Curio Library', 'semi_private', 18,  28,  1500, 2),
    ('Main Dining Buyout','event',        120, 180, 6000, 3)
  ) as v(name, type, seated, standing, minspend, sort)
  where not exists (
    select 1 from spaces s where s.location_id = loc_id and s.name = v.name
  );
end $$;
