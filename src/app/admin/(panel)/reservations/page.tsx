import { createClient } from "@/lib/supabase/server";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { Calendar, type CalEvent } from "@/components/admin/Calendar";
import { ReservationsTable, type ResvRow } from "@/components/admin/ReservationsTable";

export const dynamic = "force-dynamic";

const RESV_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "seated", label: "Seated" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

type RawRow = {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  party_size: number;
  space_id: string | null;
  date: string;
  time: string;
  status: string;
  total_min_spend: number | null;
  notes: string | null;
  space: { name: string } | null;
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; venue?: string; space?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : currentMonth();
  const supabase = await createClient();

  const [yy, mm] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = `${yy}-${String(mm).padStart(2, "0")}-${String(new Date(yy, mm, 0).getDate()).padStart(2, "0")}`;

  const [locsRes, spacesRes, resvRes] = await Promise.all([
    supabase.from("locations").select("id, name").order("name"),
    supabase.from("spaces").select("id, name, location_id").eq("active", true).order("sort_order").order("name"),
    (() => {
      let q = supabase
        .from("reservations")
        .select(
          "id, guest_name, guest_phone, guest_email, party_size, space_id, date, time, status, total_min_spend, notes, space:spaces(name)",
        )
        .gte("date", start)
        .lte("date", end)
        .order("date")
        .order("time");
      if (sp.venue) q = q.eq("location_id", sp.venue);
      if (sp.space) q = q.eq("space_id", sp.space);
      if (sp.status) q = q.eq("status", sp.status);
      return q;
    })(),
  ]);

  const locations = locsRes.data ?? [];
  const spaces = spacesRes.data ?? [];
  const raw = (resvRes.data ?? []) as unknown as RawRow[];

  // Tables assigned to each booking (V2 seating).
  const resIds = raw.map((r) => r.id);
  const { data: assignRows } = resIds.length
    ? await supabase.from("reservation_tables").select("reservation_id, restaurant_tables(code)").in("reservation_id", resIds)
    : { data: [] as { reservation_id: string; restaurant_tables: { code: string } | null }[] };
  const assignedMap = new Map<string, string[]>();
  for (const a of assignRows ?? []) {
    const code = (a.restaurant_tables as unknown as { code: string } | null)?.code;
    if (!code) continue;
    const arr = assignedMap.get(a.reservation_id) ?? [];
    arr.push(code);
    assignedMap.set(a.reservation_id, arr);
  }

  const rows: ResvRow[] = raw.map((r) => ({
    id: r.id,
    guest_name: r.guest_name,
    guest_phone: r.guest_phone,
    guest_email: r.guest_email,
    party_size: r.party_size,
    space_id: r.space_id,
    space_name: r.space?.name ?? null,
    date: r.date,
    time: r.time,
    status: r.status,
    total_min_spend: r.total_min_spend,
    notes: r.notes,
    assigned: (assignedMap.get(r.id) ?? []).sort(),
  }));

  const events: CalEvent[] = rows.map((r) => ({
    date: r.date,
    label: `${r.guest_name} · ${r.party_size}p`,
  }));

  const baseQuery =
    (sp.venue ? `&venue=${sp.venue}` : "") +
    (sp.space ? `&space=${sp.space}` : "") +
    (sp.status ? `&status=${sp.status}` : "");

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Reservations</h1>
          <p className="admin-sub">Add, edit and confirm bookings — full guest details for call-backs.</p>
        </div>
        <div className="filters">
          <FilterSelect param="venue" value={sp.venue ?? ""} options={locations.map((l) => ({ value: l.id, label: l.name }))} allLabel="All venues" />
          <FilterSelect param="space" value={sp.space ?? ""} options={spaces.map((s) => ({ value: s.id, label: s.name }))} allLabel="All spaces" />
          <FilterSelect param="status" value={sp.status ?? ""} options={RESV_STATUS} allLabel="All statuses" />
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <Calendar month={month} events={events} baseQuery={baseQuery} />
      </div>

      <ReservationsTable rows={rows} spaces={spaces.map((s) => ({ id: s.id, name: s.name }))} month={month} />
    </>
  );
}
