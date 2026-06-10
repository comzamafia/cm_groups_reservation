"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computePricing } from "@/lib/pricing";

const STATUSES = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"];

export type ReservationInput = {
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  party_size: number;
  space_id: string;
  date: string;
  time: string;
  status: string;
  notes: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Confirm the caller is signed-in staff before any mutation. */
async function requireStaff(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: staff } = await supabase.from("staff").select("id").eq("id", user.id).maybeSingle();
  return !!staff;
}

function validate(input: ReservationInput): string | null {
  if (!input.guest_name.trim()) return "Guest name is required.";
  if (!input.space_id) return "Please select a space.";
  if (!input.date) return "Please choose a date.";
  if (!input.time) return "Please choose a time.";
  if (!(input.party_size >= 1)) return "Party size must be at least 1.";
  if (!STATUSES.includes(input.status)) return "Invalid status.";
  return null;
}

async function priceFor(admin: ReturnType<typeof createAdminClient>, input: ReservationInput) {
  const { data: space } = await admin
    .from("spaces").select("id, location_id").eq("id", input.space_id).maybeSingle();
  const locationId = space?.location_id ?? null;

  let shiftId: string | null = null;
  if (locationId) {
    const { data: shifts } = await admin
      .from("shifts").select("id, start_time, end_time").eq("location_id", locationId);
    const t = input.time.slice(0, 5);
    const m = (shifts ?? []).find(
      (s) => t >= String(s.start_time).slice(0, 5) && t < String(s.end_time).slice(0, 5),
    );
    shiftId = m?.id ?? null;
  }

  const pricing = await computePricing(admin, {
    spaceId: input.space_id, shiftId, partySize: input.party_size, date: input.date,
  });
  return { locationId, shiftId, minSpend: pricing.minSpend };
}

export async function createReservation(input: ReservationInput): Promise<ActionResult> {
  if (!(await requireStaff())) return { ok: false, error: "Not authorized." };
  const v = validate(input); if (v) return { ok: false, error: v };

  const admin = createAdminClient();
  const { locationId, shiftId, minSpend } = await priceFor(admin, input);

  const { error } = await admin.from("reservations").insert({
    location_id: locationId,
    space_id: input.space_id,
    shift_id: shiftId,
    guest_name: input.guest_name.trim(),
    guest_email: input.guest_email.trim() || null,
    guest_phone: input.guest_phone.trim() || null,
    party_size: input.party_size,
    date: input.date,
    time: input.time,
    status: input.status,
    total_min_spend: minSpend,
    notes: input.notes.trim() || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That space is already booked at this date & time." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateReservation(id: string, input: ReservationInput): Promise<ActionResult> {
  if (!(await requireStaff())) return { ok: false, error: "Not authorized." };
  const v = validate(input); if (v) return { ok: false, error: v };

  const admin = createAdminClient();
  const { locationId, shiftId, minSpend } = await priceFor(admin, input);

  const { error } = await admin.from("reservations").update({
    location_id: locationId,
    space_id: input.space_id,
    shift_id: shiftId,
    guest_name: input.guest_name.trim(),
    guest_email: input.guest_email.trim() || null,
    guest_phone: input.guest_phone.trim() || null,
    party_size: input.party_size,
    date: input.date,
    time: input.time,
    status: input.status,
    total_min_spend: minSpend,
    notes: input.notes.trim() || null,
  }).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That space is already booked at this date & time." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteReservation(id: string): Promise<ActionResult> {
  if (!(await requireStaff())) return { ok: false, error: "Not authorized." };
  const admin = createAdminClient();
  const { error } = await admin.from("reservations").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  return { ok: true };
}
