import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { Calendar, type CalEvent } from "@/components/admin/Calendar";

export const dynamic = "force-dynamic";

const RESV_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "seated", label: "Seated" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

type Row = {
  id: string;
  guest_name: string;
  party_size: number;
  date: string;
  time: string;
  status: string;
  space: { name: string } | null;
  location: { name: string } | null;
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    venue?: string;
    space?: string;
    status?: string;
  }>;
}) {
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : currentMonth();
  const supabase = await createClient();

  // Month range
  const [yy, mm] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = `${yy}-${String(mm).padStart(2, "0")}-${String(
    new Date(yy, mm, 0).getDate(),
  ).padStart(2, "0")}`;

  const [locsRes, spacesRes, resvRes] = await Promise.all([
    supabase.from("locations").select("id, name").order("name"),
    supabase.from("spaces").select("id, name, location_id").order("name"),
    (() => {
      let q = supabase
        .from("reservations")
        .select(
          "id, guest_name, party_size, date, time, status, space:spaces(name), location:locations(name)",
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
  const rows = (resvRes.data ?? []) as unknown as Row[];

  const events: CalEvent[] = rows.map((r) => ({
    date: r.date,
    label: `${r.guest_name} · ${r.party_size}p`,
  }));

  // Preserve filters in calendar prev/next links
  const baseQuery =
    (sp.venue ? `&venue=${sp.venue}` : "") +
    (sp.space ? `&space=${sp.space}` : "") +
    (sp.status ? `&status=${sp.status}` : "");

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Reservations</h1>
          <p className="admin-sub">Central event calendar — filter by venue, space or status.</p>
        </div>
        <div className="filters">
          <FilterSelect
            param="venue"
            value={sp.venue ?? ""}
            options={locations.map((l) => ({ value: l.id, label: l.name }))}
            allLabel="All venues"
          />
          <FilterSelect
            param="space"
            value={sp.space ?? ""}
            options={spaces.map((s) => ({ value: s.id, label: s.name }))}
            allLabel="All spaces"
          />
          <FilterSelect
            param="status"
            value={sp.status ?? ""}
            options={RESV_STATUS}
            allLabel="All statuses"
          />
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <Calendar month={month} events={events} baseQuery={baseQuery} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Agenda — {rows.length} booking{rows.length === 1 ? "" : "s"} this month</h2>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Guest</th>
                <th>Party</th>
                <th>Space</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="tbl-empty">
                    No reservations match this view for {month}.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="muted">{r.date}</td>
                  <td className="muted">{r.time?.slice(0, 5)}</td>
                  <td>{r.guest_name}</td>
                  <td className="muted">{r.party_size}</td>
                  <td className="muted">{r.space?.name ?? "—"}</td>
                  <td>
                    <StatusSelect kind="reservation" id={r.id} value={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
