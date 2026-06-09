-- Seed sample data for development (one location, several spaces, shifts, addons, banner).
-- Safe to run after 0001_init_schema.sql.

do $$
declare
  loc_id uuid;
  lunch_id uuid;
  offpeak_id uuid;
  peak_id uuid;
  sp_private uuid;
begin
  insert into locations (name, slug, accent_color, address)
  values ('Chiang Mai — Mississauga', 'mississauga', '#FABC3A', 'Mississauga, ON')
  returning id into loc_id;

  insert into shifts (location_id, name, start_time, end_time)
  values (loc_id, 'lunch', '11:30', '15:00') returning id into lunch_id;
  insert into shifts (location_id, name, start_time, end_time)
  values (loc_id, 'off_peak_dinner', '15:00', '18:00') returning id into offpeak_id;
  insert into shifts (location_id, name, start_time, end_time)
  values (loc_id, 'peak_dinner', '18:00', '22:30') returning id into peak_id;

  insert into spaces (location_id, name, type, seated_cap, standing_cap, base_min_spend, description, sort_order)
  values
    (loc_id, 'Main Dining Table', 'table', 8, 0, 0, 'Standard table seating in the main hall.', 1),
    (loc_id, 'Lanna Semi-Private Nook', 'semi_private', 12, 16, 800, 'Semi-private corner with Lanna-pattern screen.', 2),
    (loc_id, 'Yi Peng Private Room', 'private', 16, 20, 2000, 'Private room inspired by the lantern festival.', 3),
    (loc_id, 'The Elephant Hall (Events)', 'event', 60, 100, 6000, 'Full event hall for large group parties.', 4)
  ;
  select id into sp_private from spaces where location_id = loc_id and type = 'private' limit 1;

  insert into addons (location_id, name, category, price, description)
  values
    (loc_id, 'House Drink Package', 'drink', 35, 'Per-person beverage package.'),
    (loc_id, 'Premium AV Setup', 'av', 150, 'Projector, screen, and mic.'),
    (loc_id, 'Corkage (per bottle)', 'corkage', 25, 'Bring your own wine.'),
    (loc_id, 'Cake-Cutting Service', 'cake', 30, 'Plating and serving of your cake.')
  ;

  insert into pricing_rules (space_id, shift_id, party_size_min, party_size_max, min_spend, terms, cancellation_policy)
  values
    (sp_private, peak_id, 1, 20, 3000, 'Minimum spend applies to food & beverage before tax.', 'Free cancellation up to 72h before.'),
    (sp_private, offpeak_id, 1, 20, 2000, 'Off-peak dinner minimum spend.', 'Free cancellation up to 48h before.')
  ;

  insert into banners (location_id, headline, link, sort_order)
  values (loc_id, 'Host your private event at Chiang Mai', '#spaces', 1);
end $$;
