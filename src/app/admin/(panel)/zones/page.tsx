import { createClient } from "@/lib/supabase/server";
import { AddZoneForm } from "@/components/admin/AddZoneForm";
import { ZoneActions } from "@/components/admin/ZoneActions";

export const dynamic = "force-dynamic";

type Space = {
  id: string;
  name: string;
  type: string;
  seated_cap: number | null;
  standing_cap: number | null;
  base_min_spend: number | null;
  photo_url: string | null;
  active: boolean;
  sort_order: number;
};

export default async function ZonesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("spaces")
    .select("id, name, type, seated_cap, standing_cap, base_min_spend, photo_url, active, sort_order")
    .order("sort_order")
    .order("name");
  const zones = (data ?? []) as Space[];
  const activeCount = zones.filter((z) => z.active).length;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Zones</h1>
          <p className="admin-sub">
            Bookable spaces shown in the public &ldquo;Book a Table&rdquo; flow. Active zones
            appear automatically — add as many as you like.
          </p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 26 }}>
        <div className="panel-head"><h2>Add a zone</h2></div>
        <div style={{ padding: 20 }}>
          <AddZoneForm />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>{activeCount} active · {zones.length} total</h2></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Zone</th>
                <th>Type</th>
                <th>Seated</th>
                <th>Reception</th>
                <th>Base min</th>
                <th style={{ textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 && (
                <tr><td colSpan={7} className="tbl-empty">No zones yet — add one above.</td></tr>
              )}
              {zones.map((z) => (
                <tr key={z.id}>
                  <td>
                    <div
                      className="zone-thumb"
                      style={z.photo_url ? { backgroundImage: `url(${z.photo_url})` } : undefined}
                    />
                  </td>
                  <td>{z.name}</td>
                  <td className="muted">{z.type.replace("_", " ")}</td>
                  <td className="muted">{z.seated_cap ?? "—"}</td>
                  <td className="muted">{z.standing_cap ?? "—"}</td>
                  <td className="muted">${Number(z.base_min_spend ?? 0).toLocaleString()}</td>
                  <td><ZoneActions id={z.id} active={z.active} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
