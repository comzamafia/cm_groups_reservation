"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { computePricing } from "@/lib/pricing";
import { SLOTS, ZONE_NAMES } from "@/lib/slots";

const DEAD = ["cancelled", "no_show"];
const VALID_SLOTS: string[] = SLOTS.map((s) => s.value);

export type Zone = {
  id: string;
  name: string;
  seated: number | null;
  reception: number | null;
};

export type Availability = {
  zones: Zone[];
  /** Taken slots as `${zoneId}|${HH:MM}`. */
  taken: string[];
};

/** Zones + which (zone, slot) pairs are already booked for a given date. */
export async function getAvailability(date: string): Promise<Availability> {
  const supabase = createAdminClient();

  const { data: spaces } = await supabase
    .from("spaces")
    .select("id, name, seated_cap, standing_cap")
    .in("name", ZONE_NAMES as unknown as string[]);

  const zones: Zone[] = (ZONE_NAMES as unknown as string[])
    .map((name) => {
      const s = (spaces ?? []).find((x) => x.name === name);
      return s
        ? { id: s.id, name: s.name, seated: s.seated_cap, reception: s.standing_cap }
        : null;
    })
    .filter((z): z is Zone => z !== null);

  const ids = zones.map((z) => z.id);
  let taken: string[] = [];
  if (ids.length > 0 && date) {
    const { data: resv } = await supabase
      .from("reservations")
      .select("space_id, time, status")
      .eq("date", date)
      .in("space_id", ids);
    taken = (resv ?? [])
      .filter((r) => !DEAD.includes(r.status))
      .map((r) => `${r.space_id}|${String(r.time).slice(0, 5)}`);
  }

  return { zones, taken };
}

export type BookingInput = {
  zoneId: string;
  date: string;
  time: string;
  partySize: number;
  first: string;
  last: string;
  phone: string;
  email: string;
  occasion?: string;
  request?: string;
};

export type BookingResult =
  | { ok: true; minSpend: number }
  | { ok: false; error: string };

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  // Basic server-side validation (never trust the client).
  if (!VALID_SLOTS.includes(input.time)) return { ok: false, error: "Invalid time slot." };
  if (!input.date) return { ok: false, error: "Please choose a date." };
  if (!input.first.trim() || !input.last.trim()) return { ok: false, error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return { ok: false, error: "Enter a valid email." };
  if (input.phone.replace(/[^0-9]/g, "").length < 10) return { ok: false, error: "Enter a valid phone number." };
  if (!(input.partySize >= 1)) return { ok: false, error: "Select a party size." };

  const supabase = createAdminClient();

  const { data: space } = await supabase
    .from("spaces")
    .select("id, location_id, standing_cap")
    .eq("id", input.zoneId)
    .maybeSingle();
  if (!space) return { ok: false, error: "That zone is unavailable." };

  if (space.standing_cap && input.partySize > space.standing_cap) {
    return { ok: false, error: `That zone seats up to ${space.standing_cap}. Please email us for larger parties.` };
  }

  // Re-check the slot is still free (guards against a race since the modal loaded).
  const { data: clash } = await supabase
    .from("reservations")
    .select("id, status")
    .eq("space_id", input.zoneId)
    .eq("date", input.date)
    .eq("time", input.time);
  if ((clash ?? []).some((r) => !DEAD.includes(r.status))) {
    return { ok: false, error: "Sorry — that time was just booked. Please pick another slot." };
  }

  // Derive shift from the chosen time so pricing is shift-aware.
  let shiftId: string | null = null;
  if (space.location_id) {
    const { data: shifts } = await supabase
      .from("shifts")
      .select("id, start_time, end_time")
      .eq("location_id", space.location_id);
    const match = (shifts ?? []).find(
      (s) => input.time >= String(s.start_time).slice(0, 5) && input.time < String(s.end_time).slice(0, 5),
    );
    shiftId = match?.id ?? null;
  }

  const pricing = await computePricing(supabase, {
    spaceId: input.zoneId,
    shiftId,
    partySize: input.partySize,
    date: input.date,
  });

  const noteParts = [
    input.occasion && `Occasion: ${input.occasion}`,
    input.request && `Request: ${input.request}`,
    pricing.terms,
  ].filter(Boolean);

  const { error } = await supabase.from("reservations").insert({
    location_id: space.location_id,
    space_id: input.zoneId,
    shift_id: shiftId,
    guest_name: `${input.first} ${input.last}`.trim(),
    guest_email: input.email.trim(),
    guest_phone: input.phone.trim(),
    party_size: input.partySize,
    date: input.date,
    time: input.time,
    status: "confirmed",
    total_min_spend: pricing.minSpend,
    notes: noteParts.join(" · ") || null,
  });
  if (error) {
    // Unique-index violation (if 0007 applied) also lands here as a race.
    if (error.code === "23505") {
      return { ok: false, error: "Sorry — that time was just booked. Please pick another slot." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  return { ok: true, minSpend: pricing.minSpend };
}
