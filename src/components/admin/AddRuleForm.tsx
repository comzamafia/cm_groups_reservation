"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPricingRule } from "@/app/admin/pricing-actions";

type Opt = { id: string; name: string };

export function AddRuleForm({ spaces, shifts }: { spaces: Opt[]; shifts: Opt[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const action = async (formData: FormData) => {
    setBusy(true);
    setError("");
    const res = await createPricingRule(formData);
    setBusy(false);
    if (res.ok) {
      formRef.current?.reset();
      router.refresh();
    } else {
      setError(res.error || "Failed to add rule.");
    }
  };

  return (
    <form ref={formRef} action={action} className="rule-form">
      {error && <div className="login-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}

      <label className="field">
        <span className="field-label">Space *</span>
        <select name="space_id" required defaultValue="">
          <option value="" disabled>Select…</option>
          {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Shift</span>
        <select name="shift_id" defaultValue="">
          <option value="">Any</option>
          {shifts.map((s) => <option key={s.id} value={s.id}>{s.name.replace("_", " ")}</option>)}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Season</span>
        <select name="season" defaultValue="">
          <option value="">Any</option>
          <option value="spring">Spring</option>
          <option value="summer">Summer</option>
          <option value="fall">Fall</option>
          <option value="winter">Winter</option>
          <option value="holiday">Holiday</option>
        </select>
      </label>

      <label className="field">
        <span className="field-label">Party min</span>
        <input name="party_size_min" type="number" min={1} defaultValue={1} />
      </label>

      <label className="field">
        <span className="field-label">Party max</span>
        <input name="party_size_max" type="number" min={1} defaultValue={999999} />
      </label>

      <label className="field">
        <span className="field-label">Min spend ($) *</span>
        <input name="min_spend" type="number" min={0} step="50" defaultValue={0} required />
      </label>

      <label className="field" style={{ gridColumn: "1 / -1" }}>
        <span className="field-label">Terms</span>
        <input name="terms" type="text" placeholder="Minimum spend applies to food & beverage before tax." />
      </label>

      <label className="field" style={{ gridColumn: "1 / -1" }}>
        <span className="field-label">Cancellation policy</span>
        <input name="cancellation_policy" type="text" placeholder="Free cancellation up to 72h before." />
      </label>

      <button type="submit" className="btn-gold" disabled={busy} style={{ gridColumn: "1 / -1" }}>
        {busy ? "Adding…" : "Add pricing rule"}
      </button>
    </form>
  );
}
