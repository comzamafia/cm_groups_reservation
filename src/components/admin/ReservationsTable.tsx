"use client";

import { useState } from "react";
import { Icon } from "@/components/events/Icon";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { ReservationModal, type EditableReservation } from "@/components/admin/ReservationModal";

export type ResvRow = {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  party_size: number;
  space_id: string | null;
  space_name: string | null;
  date: string;
  time: string;
  status: string;
  total_min_spend: number | null;
  notes: string | null;
};

export function ReservationsTable({
  rows, spaces, month,
}: {
  rows: ResvRow[];
  spaces: { id: string; name: string }[];
  month: string;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditableReservation | null>(null);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (r: ResvRow) => {
    setEditing({
      id: r.id,
      guest_name: r.guest_name,
      guest_phone: r.guest_phone ?? "",
      guest_email: r.guest_email ?? "",
      party_size: r.party_size,
      space_id: r.space_id ?? (spaces[0]?.id ?? ""),
      date: r.date,
      time: String(r.time).slice(0, 5),
      status: r.status,
      notes: r.notes ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Agenda — {rows.length} booking{rows.length === 1 ? "" : "s"} in {month}</h2>
        <button type="button" className="btn-gold" style={{ padding: "9px 16px" }} onClick={openNew}>
          <Icon name="Plus" size={16} /> New reservation
        </button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>When</th>
              <th>Guest &amp; contact</th>
              <th>Party</th>
              <th>Space</th>
              <th>Min&nbsp;spend</th>
              <th>Notes</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="tbl-empty">No reservations in {month}. Click “New reservation” to add one.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.date}
                  <br />
                  <span className="muted">{String(r.time).slice(0, 5)}</span>
                </td>
                <td>
                  <strong>{r.guest_name}</strong>
                  {r.guest_phone && (
                    <div><a href={`tel:${r.guest_phone}`} className="resv-tel"><Icon name="Phone" size={12} /> {r.guest_phone}</a></div>
                  )}
                  {r.guest_email && (
                    <div className="muted" style={{ fontSize: "0.78rem" }}>{r.guest_email}</div>
                  )}
                </td>
                <td className="muted">{r.party_size}</td>
                <td className="muted">{r.space_name ?? "—"}</td>
                <td style={{ color: "var(--gold-lite)", fontWeight: 600 }}>
                  {r.total_min_spend ? `$${Number(r.total_min_spend).toLocaleString()}` : "—"}
                </td>
                <td className="muted" style={{ maxWidth: 200, fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>
                  {r.notes ?? "—"}
                </td>
                <td><StatusSelect kind="reservation" id={r.id} value={r.status} /></td>
                <td>
                  <button type="button" className="icon-btn" onClick={() => openEdit(r)} aria-label="Edit reservation">
                    <Icon name="Pencil" size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReservationModal open={open} onClose={() => setOpen(false)} spaces={spaces} editing={editing} />
    </div>
  );
}
