import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { FilterSelect } from "@/components/admin/FilterSelect";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

function fmtDate(d: string | null) {
  if (!d) return "—";
  try {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data } = await query;
  const leads = (data ?? []) as Lead[];

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Leads</h1>
          <p className="admin-sub">Event inquiries captured from the website.</p>
        </div>
        <div className="filters">
          <FilterSelect
            param="status"
            value={status ?? ""}
            options={STATUS_OPTIONS}
            allLabel="All statuses"
          />
        </div>
      </div>

      <div className="panel">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Contact</th>
                <th>Requested</th>
                <th>Guests</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="tbl-empty">
                    No leads{status ? ` with status “${status}”` : ""} yet.
                  </td>
                </tr>
              )}
              {leads.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td className="muted" style={{ fontSize: "0.84rem" }}>
                    <a href={`mailto:${l.email}`}>{l.email}</a>
                    {l.phone && (
                      <>
                        <br />
                        <a href={`tel:${l.phone}`}>{l.phone}</a>
                      </>
                    )}
                  </td>
                  <td className="muted">{fmtDate(l.requested_date)}</td>
                  <td className="muted">{l.party_size ?? "—"}</td>
                  <td
                    className="muted"
                    style={{ maxWidth: 280, fontSize: "0.82rem", whiteSpace: "pre-wrap" }}
                  >
                    {l.requirements ?? "—"}
                  </td>
                  <td>
                    <StatusSelect kind="lead" id={l.id} value={l.status} />
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
