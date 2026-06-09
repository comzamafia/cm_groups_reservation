"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus, ReservationStatus } from "@/lib/types";

const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "won", "lost"];
const RESERVATION_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
  "no_show",
];

export async function updateLeadStatus(id: string, status: string) {
  if (!LEAD_STATUSES.includes(status as LeadStatus)) {
    return { ok: false, error: "Invalid status" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateReservationStatus(id: string, status: string) {
  if (!RESERVATION_STATUSES.includes(status as ReservationStatus)) {
    return { ok: false, error: "Invalid status" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  return { ok: true };
}
