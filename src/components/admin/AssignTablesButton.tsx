"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/events/Icon";
import { getTableOptions, assignTables, type TableOption } from "@/app/admin/seating-actions";

export function AssignTablesButton({
  reservationId, assigned, partySize,
}: {
  reservationId: string;
  assigned: string[];
  partySize: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [party, setParty] = useState(partySize);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());

  const openModal = async () => {
    setOpen(true); setLoading(true); setError("");
    const res = await getTableOptions(reservationId);
    setLoading(false);
    if (!res.ok) { setError(res.error || "Failed to load tables."); return; }
    setParty(res.party ?? partySize);
    setTables(res.tables ?? []);
    setSel(new Set(res.selected ?? []));
  };

  const toggle = (t: TableOption) => {
    if (t.taken) return;
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
      return next;
    });
  };

  const save = async () => {
    setBusy(true); setError("");
    const res = await assignTables(reservationId, [...sel]);
    setBusy(false);
    if (res.ok) { setOpen(false); router.refresh(); }
    else setError(res.error || "Failed to save.");
  };

  const seatsSel = tables.filter((t) => sel.has(t.id)).reduce((s, t) => s + (t.seats ?? 0), 0);
  const sections = [...new Set(tables.map((t) => t.section))];

  return (
    <>
      <button type="button" className="assign-btn" onClick={openModal}>
        {assigned.length ? assigned.join(", ") : <span className="assign-empty"><Icon name="Plus" size={12} /> Assign</span>}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !busy && setOpen(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Assign tables</h3>
            <p className="bk-muted" style={{ margin: "-6px 0 0", fontSize: "0.85rem", color: "var(--sub)" }}>
              Party of {party}. {seatsSel > 0 && <>Selected seats: <strong style={{ color: seatsSel >= party ? "#3fae73" : "#e0b24f" }}>{seatsSel}</strong></>}
            </p>
            {error && <div className="login-error">{error}</div>}

            {loading ? (
              <p className="bk-muted">Loading tables…</p>
            ) : (
              <div className="assign-sections">
                {sections.map((sec) => (
                  <div key={sec} className="assign-section">
                    <div className="assign-section-name">{sec}</div>
                    <div className="assign-grid">
                      {tables.filter((t) => t.section === sec).map((t) => {
                        const on = sel.has(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            className={`assign-chip ${on ? "on" : ""} ${t.taken ? "taken" : ""}`}
                            disabled={t.taken}
                            title={t.taken ? `Taken by ${t.takenBy}` : t.seats ? `${t.seats} seats` : ""}
                            onClick={() => toggle(t)}
                          >
                            {t.code}{t.seats ? <small> · {t.seats}</small> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-gold" onClick={save} disabled={busy || loading}>
                {busy ? "Saving…" : `Save (${sel.size})`}
              </button>
              <button type="button" className="btn-outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
