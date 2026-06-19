import { createClient } from "@/lib/supabase/server";
import { FloorPlan, type Table } from "@/components/admin/FloorPlan";

export const dynamic = "force-dynamic";

export default async function FloorPage() {
  const supabase = await createClient();

  const { data: loc } = await supabase
    .from("locations").select("id, name").eq("slug", "mississauga").maybeSingle();

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, code, section, shape, x, y, w, h, seats, status, note")
    .eq("location_id", loc?.id ?? "")
    .order("sort");

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Floor Plan</h1>
          <p className="admin-sub">Live table status — {loc?.name ?? "Mississauga"}. Tap a table to update; changes sync to every screen.</p>
        </div>
      </div>

      {(!tables || tables.length === 0) ? (
        <div className="panel">
          <div className="panel-head"><h2>Not set up yet</h2></div>
          <p className="bk-muted" style={{ padding: "0 18px 18px" }}>
            Run migration <code>0009_floor_plan.sql</code> in Supabase, then seed with{" "}
            <code>node scripts/seed-floor-plan.mjs</code>.
          </p>
        </div>
      ) : (
        <FloorPlan initial={tables as Table[]} locationName={loc?.name ?? "Mississauga"} />
      )}
    </>
  );
}
