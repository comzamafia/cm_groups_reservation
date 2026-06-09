import { createClient } from "@/lib/supabase/server";
import { AddRuleForm } from "@/components/admin/AddRuleForm";
import { DeleteRuleButton } from "@/components/admin/DeleteRuleButton";

export const dynamic = "force-dynamic";

type Rule = {
  id: string;
  season: string | null;
  party_size_min: number;
  party_size_max: number;
  min_spend: number;
  terms: string | null;
  cancellation_policy: string | null;
  space: { name: string } | null;
  shift: { name: string } | null;
};

export default async function PricingPage() {
  const supabase = await createClient();

  const [rulesRes, spacesRes, shiftsRes] = await Promise.all([
    supabase
      .from("pricing_rules")
      .select(
        "id, season, party_size_min, party_size_max, min_spend, terms, cancellation_policy, space:spaces(name), shift:shifts(name)",
      )
      .order("min_spend", { ascending: false }),
    supabase.from("spaces").select("id, name").eq("active", true).order("name"),
    supabase.from("shifts").select("id, name").order("start_time"),
  ]);

  const rules = (rulesRes.data ?? []) as unknown as Rule[];
  const spaces = spacesRes.data ?? [];
  const shifts = shiftsRes.data ?? [];

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Pricing &amp; Policy</h1>
          <p className="admin-sub">
            Dynamic minimum spends by space, shift, season and party size (Module 3).
          </p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 26 }}>
        <div className="panel-head"><h2>Add a rule</h2></div>
        <div style={{ padding: 20 }}>
          <AddRuleForm spaces={spaces} shifts={shifts} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>{rules.length} pricing rule{rules.length === 1 ? "" : "s"}</h2></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Space</th>
                <th>Shift</th>
                <th>Season</th>
                <th>Party size</th>
                <th>Min spend</th>
                <th>Terms</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 && (
                <tr><td colSpan={7} className="tbl-empty">No pricing rules yet — add one above.</td></tr>
              )}
              {rules.map((r) => (
                <tr key={r.id}>
                  <td>{r.space?.name ?? "—"}</td>
                  <td className="muted">{r.shift?.name?.replace("_", " ") ?? "Any"}</td>
                  <td className="muted">{r.season ?? "Any"}</td>
                  <td className="muted">
                    {r.party_size_min}–{r.party_size_max >= 999999 ? "∞" : r.party_size_max}
                  </td>
                  <td style={{ color: "var(--gold-lite)", fontWeight: 600 }}>
                    ${Number(r.min_spend).toLocaleString()}
                  </td>
                  <td className="muted" style={{ maxWidth: 260, fontSize: "0.82rem" }}>
                    {r.terms ?? "—"}
                    {r.cancellation_policy && (
                      <div style={{ color: "var(--sub-dim)", marginTop: 3 }}>{r.cancellation_policy}</div>
                    )}
                  </td>
                  <td><DeleteRuleButton id={r.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
