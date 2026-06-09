// Fixed booking rounds for every zone. Stored as 24h "HH:MM"; shown as 12h.
export const SLOTS = [
  { value: "16:00", label: "4:00 PM" },
  { value: "16:30", label: "4:30 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "18:30", label: "6:30 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "20:30", label: "8:30 PM" },
] as const;

// The three public booking zones (must match the seeded space names).
export const ZONE_NAMES = [
  "The Mural Lounge",
  "The Curio Library",
  "Main Dining Buyout",
] as const;

export function slotLabel(value: string): string {
  return SLOTS.find((s) => s.value === value)?.label ?? value;
}
