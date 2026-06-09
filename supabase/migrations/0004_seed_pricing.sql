-- Dynamic pricing rules for every seeded space across shifts (Module 3).
-- Idempotent: each rule is inserted only if an equivalent one is absent.

do $$
declare
  loc_id uuid;
  sp record;
  peak uuid;
  offpeak uuid;
  lunch uuid;
begin
  select id into loc_id from locations where slug = 'mississauga';
  if loc_id is null then
    raise notice 'Sample location not found — run 0002 first.';
    return;
  end if;

  select id into peak    from shifts where location_id = loc_id and name = 'peak_dinner' limit 1;
  select id into offpeak from shifts where location_id = loc_id and name = 'off_peak_dinner' limit 1;
  select id into lunch   from shifts where location_id = loc_id and name = 'lunch' limit 1;

  for sp in select id, base_min_spend from spaces where location_id = loc_id loop
    -- Peak dinner: highest minimum (protect revenue)
    insert into pricing_rules (space_id, shift_id, party_size_min, party_size_max, min_spend, terms, cancellation_policy)
    select sp.id, peak, 1, 999999, greatest(sp.base_min_spend * 1.5, 1000),
           'Minimum spend applies to food & beverage before tax & gratuity.',
           'Free cancellation up to 72h before; 50% thereafter.'
    where peak is not null
      and not exists (select 1 from pricing_rules where space_id = sp.id and shift_id = peak and season is null);

    -- Off-peak dinner: standard base
    insert into pricing_rules (space_id, shift_id, party_size_min, party_size_max, min_spend, terms, cancellation_policy)
    select sp.id, offpeak, 1, 999999, greatest(sp.base_min_spend, 800),
           'Off-peak dinner minimum spend.',
           'Free cancellation up to 48h before.'
    where offpeak is not null
      and not exists (select 1 from pricing_rules where space_id = sp.id and shift_id = offpeak and season is null);

    -- Lunch: lighter minimum
    insert into pricing_rules (space_id, shift_id, party_size_min, party_size_max, min_spend, terms, cancellation_policy)
    select sp.id, lunch, 1, 999999, greatest(sp.base_min_spend * 0.6, 500),
           'Lunch minimum spend.',
           'Free cancellation up to 24h before.'
    where lunch is not null
      and not exists (select 1 from pricing_rules where space_id = sp.id and shift_id = lunch and season is null);
  end loop;
end $$;
