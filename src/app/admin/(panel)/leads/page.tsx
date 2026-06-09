import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { ConvertLead } from "@/components/admin/ConvertLead";
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

  const [{ data }, spacesRes] = await Promise.all([
    query,
    supabase.from("spaces").select("id, name").eq("active", true).order("name"),
  ]);
  const leads = (data ?? []) as Lead[];
  const spaces = spacesRes.data ?? [];

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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="tbl-empty">
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
                  <td>
                    <ConvertLead
                      leadId={l.id}
                      leadStatus={l.status}
                      defaultDate={l.requested_date}
                      defaultParty={l.party_size}
                      spaces={spaces}
                    />
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
