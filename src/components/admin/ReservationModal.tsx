"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createReservation,
  updateReservation,
  deleteReservation,
  type ReservationInput,
} from "@/app/admin/reservation-actions";

export type EditableReservation = ReservationInput & { id: string };

const STATUSES: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "seated", label: "Seated" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

const BLANK: ReservationInput = {
  guest_name: "", guest_phone: "", guest_email: "", party_size: 2,
  space_id: "", date: "", time: "19:00", status: "confirmed", notes: "",
};

export function ReservationModal({
  open, onClose, spaces, editing,
}: {
  open: boolean;
  onClose: () => void;
  spaces: { id: string; name: string }[];
  editing: EditableReservation | null;
}) {
  const router = useRouter();
  const initial: ReservationInput = editing
    ? { ...editing }
    : { ...BLANK, space_id: spaces[0]?.id ?? "" };
  const [form, setForm] = useState<ReservationInput>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Re-seed when the modal opens for a different record.
  const [seedKey, setSeedKey] = useState<string>("");
  const key = editing?.id ?? "new";
  if (open && key !== seedKey) {
    setSeedKey(key);
    setForm(editing ? { ...editing } : { ...BLANK, space_id: spaces[0]?.id ?? "" });
    setError("");
  }

  if (!open) return null;

  const set = (k: keyof ReservationInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: k === "party_size" ? Number(e.target.value) : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = editing
      ? await updateReservation(editing.id, form)
      : await createReservation(form);
    setBusy(false);
    if (res.ok) { onClose(); router.refresh(); }
    else setError(res.error);
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm(`Delete the reservation for ${editing.guest_name}?`)) return;
    setBusy(true); setError("");
    const res = await deleteReservation(editing.id);
    setBusy(false);
    if (res.ok) { onClose(); router.refresh(); }
    else setError(res.error);
  };

  return (
    <div className="modal-overlay" onClick={() => !busy && onClose()}>
      <form className="modal wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3 className="modal-title">{editing ? "Edit reservation" : "New reservation"}</h3>

        {error && <div className="login-error">{error}</div>}

        <div className="form-grid two">
          <label className="field">
            <span className="field-label">Guest name *</span>
            <input value={form.guest_name} onChange={set("guest_name")} placeholder="Somchai Wattana" required />
          </label>
          <label className="field">
            <span className="field-label">Phone (for confirmation)</span>
            <input type="tel" value={form.guest_phone} onChange={set("guest_phone")} placeholder="(905) 000-0000" />
          </label>
        </div>

        <label className="field">
          <span className="field-label">Email</span>
          <input type="email" value={form.guest_email} onChange={set("guest_email")} placeholder="guest@email.com" />
        </label>

        <div className="form-grid three">
          <label className="field">
            <span className="field-label">Date *</span>
            <input type="date" value={form.date} onChange={set("date")} required />
          </label>
          <label className="field">
            <span className="field-label">Time *</span>
            <input type="time" value={form.time} onChange={set("time")} required />
          </label>
          <label className="field">
            <span className="field-label">Guests *</span>
            <input type="number" min={1} value={form.party_size} onChange={set("party_size")} required />
          </label>
        </div>

        <div className="form-grid two">
          <label className="field">
            <span className="field-label">Space *</span>
            <select value={form.space_id} onChange={set("space_id")} required>
              <option value="" disabled>Select…</option>
              {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Status</span>
            <select value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <label className="field">
          <span className="field-label">Notes / special requests</span>
          <textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="Allergies, occasion, seating preference, deposit taken…" />
        </label>

        <p className="bk-muted" style={{ color: "var(--sub-dim)", fontSize: "0.8rem", margin: 0 }}>
          Minimum spend is recalculated automatically from the space, shift and party size.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
          <button type="submit" className="btn-gold" disabled={busy} style={{ flex: 1, minWidth: 160 }}>
            {busy ? "Saving…" : editing ? "Save changes" : "Create reservation"}
          </button>
          {editing && (
            <button type="button" className="icon-btn" onClick={remove} disabled={busy}
              style={{ width: "auto", padding: "0 14px", color: "#e0795b", borderColor: "rgba(224,121,91,.4)" }}>
              Delete
            </button>
          )}
          <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
