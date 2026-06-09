// Domain types mirroring the Supabase schema (supabase/migrations/0001_init_schema.sql).
// Kept hand-written for MVP; can later be replaced by generated types
// (`supabase gen types typescript`).

export type SpaceType = 'table' | 'semi_private' | 'private' | 'event';
export type ShiftName = 'lunch' | 'off_peak_dinner' | 'peak_dinner';
export type AddonCategory = 'drink' | 'av' | 'corkage' | 'cake' | 'other';
export type ReservationStatus =
  | 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
export type LeadStatus = 'new' | 'contacted' | 'won' | 'lost';
export type StaffRole = 'admin' | 'manager' | 'host';

export interface Location {
  id: string;
  name: string;
  slug: string;
  accent_color: string | null;
  address: string | null;
  timezone: string;
}

export interface Space {
  id: string;
  location_id: string;
  name: string;
  type: SpaceType;
  seated_cap: number | null;
  standing_cap: number | null;
  photo_url: string | null;
  description: string | null;
  base_min_spend: number;
  active: boolean;
  sort_order: number;
}

export interface Addon {
  id: string;
  location_id: string;
  name: string;
  category: AddonCategory;
  price: number;
  description: string | null;
  active: boolean;
}

export interface Banner {
  id: string;
  location_id: string | null;
  image_url: string | null;
  headline: string | null;
  link: string | null;
  active: boolean;
  sort_order: number;
}

export interface Reservation {
  id: string;
  location_id: string;
  space_id: string | null;
  shift_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  party_size: number;
  date: string;
  time: string;
  status: ReservationStatus;
  total_min_spend: number;
  notes: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  location_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  requested_date: string | null;
  party_size: number | null;
  requirements: string | null;
  status: LeadStatus;
  created_at: string;
}
