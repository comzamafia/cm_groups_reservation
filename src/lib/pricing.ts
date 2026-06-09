import type { SupabaseClient } from "@supabase/supabase-js";

export type PricingResult = {
  minSpend: number;
  terms: string | null;
  cancellationPolicy: string | null;
  source: "rule" | "base";
};

/**
 * Module 3 — Dynamic Pricing & Policy Engine.
 *
 * Resolves the minimum spend + applicable terms for a booking from the
 * `pricing_rules` table, matching on space, shift, party size and (optionally)
 * season. When several rules match we take the highest minimum spend — the
 * intent is to protect revenue — and fall back to the space's base_min_spend
 * when no rule applies.
 */
export async function computePricing(
  supabase: SupabaseClient,
  args: {
    spaceId: string;
    shiftId?: string | null;
    partySize: number;
    date?: string | null;
  },
): Promise<PricingResult> {
  const season = args.date ? seasonForDate(args.date) : null;

  const { data: rules } = await supabase
    .from("pricing_rules")
    .select("shift_id, season, party_size_min, party_size_max, min_spend, terms, cancellation_policy")
    .eq("space_id", args.spaceId);

  const candidates = (rules ?? []).filter((r) => {
    const sizeOk =
      args.partySize >= (r.party_size_min ?? 1) &&
      args.partySize <= (r.party_size_max ?? 999999);
    const shiftOk = !r.shift_id || r.shift_id === args.shiftId;
    const seasonOk = !r.season || r.season === season;
    return sizeOk && shiftOk && seasonOk;
  });

  if (candidates.length > 0) {
    // Most specific wins on ties; otherwise highest min spend.
    const best = candidates.reduce((a, b) => {
      const aScore = specificity(a);
      const bScore = specificity(b);
      if (bScore !== aScore) return bScore > aScore ? b : a;
      return (b.min_spend ?? 0) > (a.min_spend ?? 0) ? b : a;
    });
    return {
      minSpend: Number(best.min_spend ?? 0),
      terms: best.terms ?? null,
      cancellationPolicy: best.cancellation_policy ?? null,
      source: "rule",
    };
  }

  const { data: space } = await supabase
    .from("spaces")
    .select("base_min_spend")
    .eq("id", args.spaceId)
    .maybeSingle();

  return {
    minSpend: Number(space?.base_min_spend ?? 0),
    terms: null,
    cancellationPolicy: null,
    source: "base",
  };
}

function specificity(r: { shift_id: string | null; season: string | null }): number {
  return (r.shift_id ? 1 : 0) + (r.season ? 1 : 0);
}

/** Coarse season buckets used for seasonal pricing (Northern hemisphere). */
export function seasonForDate(date: string): string {
  const m = Number(date.slice(5, 7));
  if (m === 12) return "holiday";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 9 && m <= 11) return "fall";
  return "winter";
}
