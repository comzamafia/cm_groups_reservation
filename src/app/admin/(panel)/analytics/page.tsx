import { createClient } from "@/lib/supabase/server";
import { Bars, type BarItem } from "@/components/admin/Bars";

export const dynamic = "force-dynamic";

type Row = {
  date: string;
  party_size: number;
  status: string;
  total_min_spend: number | null;
  space: { name: string } | null;
  shift: { name: string } | null;
};

const REALIZED = new Set(["confirmed", "seated", "completed"]);
const DEAD = new Set(["cancelled", "no_show"]);
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const usd = (v: number) => `$${Math.round(v).toLocaleString()}`;

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reservations")
    .select("date, party_size, status, total_min_spend, space:spaces(name), shift:shifts(name)");
  const rows = (data ?? []) as unknown as Row[];

  const active = rows.filter((r) => !DEAD.has(r.status));
  const realizedRevenue = rows
    .filter((r) => REALIZED.has(r.status))
    .reduce((s, r) => s + Number(r.total_min_spend ?? 0), 0);
  const avgParty =
    active.length > 0
      ? Math.round(active.reduce((s, r) => s + (r.party_size ?? 0), 0) / active.length)
      : 0;

  // Booking mix by status
  const byStatus = new Map<string, number>();
  for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
  const statusBars: BarItem[] = [...byStatus.entries()]
    .map(([label, value]) => ({ label: label.replace("_", " "), value }))
    .sort((a, b) => b.value - a.value);

  // Top spaces by realized revenue
  const spaceAgg = new Map<string, { count: number; rev: number }>();
  for (const r of rows) {
    const name = r.space?.name ?? "Unassigned";
    const cur = spaceAgg.get(name) ?? { count: 0, rev: 0 };
    cur.count += 1;
    if (REALIZED.has(r.status)) cur.rev += Number(r.total_min_spend ?? 0);
    spaceAgg.set(name, cur);
  }
  const spaceBars: BarItem[] = [...spaceAgg.entries()]
    .map(([label, v]) => ({ label, value: v.rev, sub: `${v.count} booking${v.count === 1 ? "" : "s"}` }))
    .sort((a, b) => b.value - a.value);

  // Shifts
  const shiftAgg = new Map<string, number>();
  for (const r of rows) {
    const name = r.shift?.name?.replace("_", " ") ?? "Unscheduled";
    shiftAgg.set(name, (shiftAgg.get(name) ?? 0) + 1);
  }
  const shiftBars: BarItem[] = [...shiftAgg.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Demand by day of week
  const dow = new Array(7).fill(0);
  for (const r of active) {
    const [y, m, d] = r.date.split("-").map(Number);
    dow[new Date(y, m - 1, d).getDay()] += 1;
  }
  const dowBars: BarItem[] = DOW.map((label, i) => ({ label, value: dow[i] }));

  // Trend by month (last 6 months present in data)
  const monthAgg = new Map<string, { count: number; rev: number }>();
  for (const r of rows) {
    const key = r.date.slice(0, 7);
    const cur = monthAgg.get(key) ?? { count: 0, rev: 0 };
    cur.count += 1;
    if (REALIZED.has(r.status)) cur.rev += Number(r.total_min_spend ?? 0);
    monthAgg.set(key, cur);
  }
  const monthBars: BarItem[] = [...monthAgg.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([key, v]) => ({ label: monthLabel(key), value: v.rev, sub: `${v.count} bk` }));

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Analytics</h1>
          <p className="admin-sub">Revenue, booking mix and demand trends (Module 5).</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num">{usd(realizedRevenue)}</div>
          <div className="stat-label">Realized min-spend revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{rows.length}</div>
          <div className="stat-label">Total bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{active.length}</div>
          <div className="stat-label">Active (excl. cancelled)</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{avgParty}</div>
          <div className="stat-label">Avg party size</div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-head"><h2>Top-performing spaces</h2></div>
          <div style={{ padding: 18 }}>
            <Bars items={spaceBars} format={usd} empty="No bookings yet." />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h2>Revenue trend by month</h2></div>
          <div style={{ padding: 18 }}>
            <Bars items={monthBars} format={usd} empty="No bookings yet." />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h2>Booking mix by status</h2></div>
          <div style={{ padding: 18 }}>
            <Bars items={statusBars} empty="No bookings yet." />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h2>Bookings by shift</h2></div>
          <div style={{ padding: 18 }}>
            <Bars items={shiftBars} empty="No bookings yet." />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-head"><h2>Demand by day of week</h2></div>
          <div style={{ padding: 18 }}>
            <Bars items={dowBars} empty="No bookings yet." />
          </div>
        </div>
      </div>
    </>
  );
}
