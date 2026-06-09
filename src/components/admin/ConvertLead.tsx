"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { convertLeadToReservation } from "@/app/admin/lead-actions";

type SpaceOpt = { id: string; name: string };

export function ConvertLead({
  leadId,
  leadStatus,
  defaultDate,
  defaultParty,
  spaces,
}: {
  leadId: string;
  leadStatus: string;
  defaultDate: string | null;
  defaultParty: number | null;
  spaces: SpaceOpt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate ?? "");
  const [time, setTime] = useState("19:00");
  const [party, setParty] = useState(String(defaultParty ?? 2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (leadStatus === "won") {
    return <span className="muted" style={{ fontSize: "0.8rem" }}>Booked</span>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await convertLeadToReservation({
      leadId,
      spaceId,
      date,
      time,
      partySize: Number(party),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  };

  return (
    <>
      <button type="button" className="btn-ghost" style={{ padding: "7px 14px", fontSize: "0.8rem" }} onClick={() => setOpen(true)}>
        Convert
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !busy && setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3 className="modal-title">Convert to reservation</h3>
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: -6 }}>
              The minimum spend is calculated automatically from the pricing rules.
            </p>

            {error && <div className="login-error">{error}</div>}

            <label className="field">
              <span className="field-label">Space</span>
              <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} required>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            <div className="form-grid three">
              <label className="field">
                <span className="field-label">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label className="field">
                <span className="field-label">Time</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </label>
              <label className="field">
                <span className="field-label">Guests</span>
                <input type="number" min={2} value={party} onChange={(e) => setParty(e.target.value)} required />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button type="submit" className="btn-gold" style={{ flex: 1 }} disabled={busy}>
                {busy ? "Creating…" : "Create reservation"}
              </button>
              <button type="button" className="btn-outline" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
