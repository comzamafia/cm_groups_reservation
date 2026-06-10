"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateZone } from "@/app/admin/zone-actions";
import { Icon } from "@/components/events/Icon";

export type EditableZone = {
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

export function EditZoneButton({ zone }: { zone: EditableZone }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const action = async (formData: FormData) => {
    setBusy(true);
    setError("");
    const res = await updateZone(zone.id, formData);
    setBusy(false);
    if (res.ok) { setOpen(false); router.refresh(); }
    else setError(res.error || "Failed to save.");
  };

  return (
    <>
      <button type="button" className="icon-btn edit" onClick={() => setOpen(true)} aria-label="Edit zone">
        <Icon name="Pencil" size={15} />
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !busy && setOpen(false)}>
          <form className="modal wide" onClick={(e) => e.stopPropagation()} action={action}>
            <h3 className="modal-title">Edit zone</h3>
            {error && <div className="login-error">{error}</div>}

            <div className="form-grid two">
              <label className="field">
                <span className="field-label">Zone name *</span>
                <input name="name" defaultValue={zone.name} required />
              </label>
              <label className="field">
                <span className="field-label">Type</span>
                <select name="type" defaultValue={zone.type}>
                  <option value="table">Table</option>
                  <option value="semi_private">Semi-private</option>
                  <option value="private">Private</option>
                  <option value="event">Event</option>
                </select>
              </label>
            </div>

            <div className="form-grid three">
              <label className="field">
                <span className="field-label">Seated</span>
                <input name="seated_cap" type="number" min={1} defaultValue={zone.seated_cap ?? ""} />
              </label>
              <label className="field">
                <span className="field-label">Reception</span>
                <input name="standing_cap" type="number" min={1} defaultValue={zone.standing_cap ?? ""} />
              </label>
              <label className="field">
                <span className="field-label">Base min ($)</span>
                <input name="base_min_spend" type="number" min={0} step="50" defaultValue={zone.base_min_spend ?? 0} />
              </label>
            </div>

            <label className="field">
              <span className="field-label">Sort order</span>
              <input name="sort_order" type="number" defaultValue={zone.sort_order ?? 0} />
            </label>

            <div className="field">
              <span className="field-label">Photo</span>
              <div className="content-img">
                <div className="content-img-preview" style={zone.photo_url ? { backgroundImage: `url(${zone.photo_url})` } : undefined} />
                <div className="content-img-controls">
                  <input type="file" name="photo_file" accept="image/jpeg,image/png,image/webp,image/avif" />
                  <input name="photo_url" type="text" defaultValue={zone.photo_url ?? ""} placeholder="image URL" />
                </div>
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <input type="checkbox" name="active" defaultChecked={zone.active} />
              <span className="field-label" style={{ margin: 0 }}>Active — shown in the public booking flow</span>
            </label>

            <div className="modal-actions">
              <button type="submit" className="btn-gold" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
              <button type="button" className="btn-outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
