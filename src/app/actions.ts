"use server";

import { createClient } from "@/lib/supabase/server";

export type LeadInput = {
  first: string;
  last: string;
  email: string;
  phone: string;
  date: string;
  guests: string;
  type: string;
  space: string;
  notes: string;
};

export type LeadResult = { ok: true } | { ok: false; error: string };

/**
 * Module 2 — Lead Capture. Persists an event inquiry into the `leads` table.
 * RLS allows anonymous inserts (policy "guest create lead"), so the anon
 * server client is sufficient here.
 */
export async function submitLead(input: LeadInput): Promise<LeadResult> {
  const supabase = await createClient();

  // Associate the lead with the seeded location when available.
  const { data: loc } = await supabase
    .from("locations")
    .select("id")
    .eq("slug", "mississauga")
    .maybeSingle();

  const requirements = [
    input.type && `Event type: ${input.type}`,
    input.space && `Preferred space: ${input.space}`,
    input.notes && `Notes: ${input.notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await supabase.from("leads").insert({
    location_id: loc?.id ?? null,
    name: `${input.first} ${input.last}`.trim(),
    email: input.email.trim(),
    phone: input.phone.trim() || null,
    requested_date: input.date || null,
    party_size: input.guests ? Number(input.guests) : null,
    requirements: requirements || null,
    status: "new",
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
