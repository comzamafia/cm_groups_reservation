-- Hard guarantee against double-booking a zone/date/time. The booking server
-- action also re-checks before inserting, but this index closes the race window
-- at the database level. Active statuses only (a cancelled slot can be re-booked).
--
-- DDL — run this in the Supabase SQL editor (cannot be applied via the REST API).

create unique index if not exists uniq_active_reservation_slot
  on reservations (space_id, date, time)
  where status not in ('cancelled', 'no_show');
