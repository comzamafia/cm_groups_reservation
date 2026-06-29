"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TURN_MINUTES = 120; // a table is busy ±2h around a booking's time

const mins = (t: string | null) => {
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + (m || 0);
};

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: staff } = await supabase.from("staff").select("id").eq("id", user.id).maybeSingle();
  return !!staff;
}

export type TableOption = {
  id: string; code: string; section: string; seats: number | null;
  taken: boolean; takenBy: string | null;
};

/** Tables for a reservation's date+time: which are free, which are taken (and by whom). */
export async function getTableOptions(reservationId: string): Promise<{
  ok: boolean; error?: string; party?: number; selected?: string[]; tables?: TableOption[];
}> {
  if (!(await requireStaff())) return { ok: false, error: "Not authorized." };
  const admin = createAdminClient();

  const { data: resv } = await admin
    .from("reservations").select("id, date, time, party_size, location_id").eq("id", reservationId).maybeSingle();
  if (!resv) return { ok: false, error: "Reservation not found." };

  const { data: tables } = await admin
    .from("restaurant_tables")
    .select("id, code, section, seats, sort")
    .eq("location_id", resv.location_id)
    .order("sort");

  // Active bookings the same day (to detect clashes within the turn window).
  const { data: sameDay } = await admin
    .from("reservations")
    .select("id, guest_name, time")
    .eq("date", resv.date)
    .not("status", "in", "(cancelled,no_show)");
  const dayIds = (sameDay ?? []).map((r) => r.id);
  const byId = new Map((sameDay ?? []).map((r) => [r.id, r]));

  const { data: assigns } = dayIds.length
    ? await admin.from("reservation_tables").select("reservation_id, table_id").in("reservation_id", dayIds)
    : { data: [] as { reservation_id: string; table_id: string }[] };

  const here = mins(resv.time);
  const selected: string[] = [];
  const takenBy = new Map<string, string>();
  for (const a of assigns ?? []) {
    if (a.reservation_id === reservationId) { selected.push(a.table_id); continue; }
    const other = byId.get(a.reservation_id);
    if (other && Math.abs(mins(other.time) - here) < TURN_MINUTES) {
      takenBy.set(a.table_id, `${other.guest_name} · ${String(other.time).slice(0, 5)}`);
    }
  }

  const out: TableOption[] = (tables ?? []).map((t) => ({
    id: t.id, code: t.code, section: t.section, seats: t.seats,
    taken: takenBy.has(t.id) && !selected.includes(t.id),
    takenBy: takenBy.get(t.id) ?? null,
  }));

  return { ok: true, party: resv.party_size, selected, tables: out };
}

export async function assignTables(reservationId: string, tableIds: string[]): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireStaff())) return { ok: false, error: "Not authorized." };
  const admin = createAdminClient();

  const { data: resv } = await admin
    .from("reservations").select("id, date, time").eq("id", reservationId).maybeSingle();
  if (!resv) return { ok: false, error: "Reservation not found." };

  // Re-check clashes against other same-day bookings within the turn window.
  if (tableIds.length) {
    const { data: sameDay } = await admin
      .from("reservations").select("id, guest_name, time").eq("date", resv.date).not("status", "in", "(cancelled,no_show)");
    const others = (sameDay ?? []).filter((r) => r.id !== reservationId && Math.abs(mins(r.time) - mins(resv.time)) < TURN_MINUTES);
    if (others.length) {
      const { data: clash } = await admin
        .from("reservation_tables")
        .select("table_id, reservation_id, restaurant_tables(code)")
        .in("reservation_id", others.map((r) => r.id))
        .in("table_id", tableIds);
      if (clash && clash.length) {
        const codes = [...new Set(clash.map((c) => (c.restaurant_tables as unknown as { code: string })?.code).filter(Boolean))];
        return { ok: false, error: `Already taken at this time: ${codes.join(", ")}.` };
      }
    }
  }

  await admin.from("reservation_tables").delete().eq("reservation_id", reservationId);
  if (tableIds.length) {
    const { error } = await admin.from("reservation_tables").insert(tableIds.map((table_id) => ({ reservation_id: reservationId, table_id })));
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/admin/reservations");
  return { ok: true };
}
