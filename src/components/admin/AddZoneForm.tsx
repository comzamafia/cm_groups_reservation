"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createZone } from "@/app/admin/zone-actions";

export function AddZoneForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const action = async (formData: FormData) => {
    setBusy(true);
    setError("");
    const res = await createZone(formData);
    setBusy(false);
    if (res.ok) {
      formRef.current?.reset();
      router.refresh();
    } else {
      setError(res.error || "Failed to add zone.");
    }
  };

  return (
    <form ref={formRef} action={action} className="rule-form">
      {error && <div className="login-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}

      <label className="field">
        <span className="field-label">Zone name *</span>
        <input name="name" type="text" required placeholder="The Garden Terrace" />
      </label>
      <label className="field">
        <span className="field-label">Type</span>
        <select name="type" defaultValue="private">
          <option value="table">Table</option>
          <option value="semi_private">Semi-private</option>
          <option value="private">Private</option>
          <option value="event">Event</option>
        </select>
      </label>
      <label className="field">
        <span className="field-label">Sort order</span>
        <input name="sort_order" type="number" defaultValue={0} />
      </label>

      <label className="field">
        <span className="field-label">Seated capacity</span>
        <input name="seated_cap" type="number" min={1} placeholder="24" />
      </label>
      <label className="field">
        <span className="field-label">Reception capacity</span>
        <input name="standing_cap" type="number" min={1} placeholder="40" />
      </label>
      <label className="field">
        <span className="field-label">Base min spend ($)</span>
        <input name="base_min_spend" type="number" min={0} step="50" defaultValue={0} />
      </label>

      <label className="field" style={{ gridColumn: "1 / -1" }}>
        <span className="field-label">Photo URL</span>
        <input name="photo_url" type="text" placeholder="/assets/your-zone.jpg or https://…" />
      </label>

      <button type="submit" className="btn-gold" disabled={busy} style={{ gridColumn: "1 / -1" }}>
        {busy ? "Adding…" : "Add zone"}
      </button>
    </form>
  );
}
