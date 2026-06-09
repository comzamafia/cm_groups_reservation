"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computePricing } from "@/lib/pricing";

export type ConvertInput = {
  leadId: string;
  spaceId: string;
  date: string;
  time: string;
  partySize: number;
};

export type ConvertResult =
  | { ok: true; minSpend: number }
  | { ok: false; error: string };

/**
 * Convert a captured lead into a confirmed reservation, applying the dynamic
 * pricing engine to set the minimum spend, and marking the lead as "won".
 */
export async function convertLeadToReservation(
  input: ConvertInput,
): Promise<ConvertResult> {
  const supabase = await createClient();

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, name, email, phone, location_id")
    .eq("id", input.leadId)
    .maybeSingle();
  if (leadErr || !lead) return { ok: false, error: "Lead not found." };

  const { data: space } = await supabase
    .from("spaces")
    .select("id, location_id")
    .eq("id", input.spaceId)
    .maybeSingle();
  if (!space) return { ok: false, error: "Space not found." };

  const locationId = lead.location_id ?? space.location_id;

  // Derive the shift from the chosen time (so pricing is shift-aware).
  let shiftId: string | null = null;
  if (locationId) {
    const { data: shifts } = await supabase
      .from("shifts")
      .select("id, start_time, end_time")
      .eq("location_id", locationId);
    const match = (shifts ?? []).find(
      (s) => input.time >= s.start_time.slice(0, 5) && input.time < s.end_time.slice(0, 5),
    );
    shiftId = match?.id ?? null;
  }

  const pricing = await computePricing(supabase, {
    spaceId: input.spaceId,
    shiftId,
    partySize: input.partySize,
    date: input.date,
  });

  const { error: insErr } = await supabase.from("reservations").insert({
    location_id: locationId,
    space_id: input.spaceId,
    shift_id: shiftId,
    guest_name: lead.name,
    guest_email: lead.email,
    guest_phone: lead.phone,
    party_size: input.partySize,
    date: input.date,
    time: input.time,
    status: "confirmed",
    total_min_spend: pricing.minSpend,
    notes: pricing.terms,
  });
  if (insErr) return { ok: false, error: insErr.message };

  await supabase.from("leads").update({ status: "won" }).eq("id", input.leadId);

  revalidatePath("/admin/leads");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  return { ok: true, minSpend: pricing.minSpend };
}
