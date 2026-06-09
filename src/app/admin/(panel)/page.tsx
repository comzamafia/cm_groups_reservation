import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "@/components/admin/StatusSelect";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: leadsTotal }, { count: leadsNew }, { count: resvTotal }, recent] =
    await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "new"),
      supabase.from("reservations").select("*", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("id, name, email, party_size, requested_date, status, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const recentLeads = (recent.data ?? []) as Lead[];

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-sub">Event inquiries and bookings at a glance.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num">{leadsNew ?? 0}</div>
          <div className="stat-label">New leads awaiting reply</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{leadsTotal ?? 0}</div>
          <div className="stat-label">Total leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{resvTotal ?? 0}</div>
          <div className="stat-label">Reservations</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Recent inquiries</h2>
          <Link href="/admin/leads" className="btn-ghost" style={{ padding: "8px 16px" }}>
            View all
          </Link>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Requested date</th>
                <th>Guests</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 && (
                <tr>
                  <td colSpan={4} className="tbl-empty">
                    No inquiries yet. They&apos;ll appear here as guests submit the form.
                  </td>
                </tr>
              )}
              {recentLeads.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.name}
                    <br />
                    <span className="muted" style={{ fontSize: "0.82rem" }}>
                      {l.email}
                    </span>
                  </td>
                  <td className="muted">{l.requested_date ?? "—"}</td>
                  <td className="muted">{l.party_size ?? "—"}</td>
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
