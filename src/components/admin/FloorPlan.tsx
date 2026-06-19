"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Table = {
  id: string;
  code: string;
  section: string;
  shape: "rect" | "circle";
  x: number; y: number; w: number; h: number;
  seats: number | null;
  status: string;
  note: string | null;
};

type Status = "available" | "reserved" | "occupied" | "blocked";

const STATUS: Record<Status, { label: string; fill: string; stroke: string; text: string }> = {
  available: { label: "Available", fill: "#1f3d2e", stroke: "#3fae73", text: "#cdeede" },
  reserved:  { label: "Reserved",  fill: "#3d3414", stroke: "#d4af37", text: "#f3e2a8" },
  occupied:  { label: "Occupied",  fill: "#3f1d18", stroke: "#d4654f", text: "#f6cabe" },
  blocked:   { label: "Blocked",   fill: "#2a2622", stroke: "#5a5249", text: "#9a9388" },
};
const ORDER: Status[] = ["available", "reserved", "occupied", "blocked"];

export function FloorPlan({ initial, locationName }: { initial: Table[]; locationName: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [tables, setTables] = useState<Table[]>(initial);
  const [selId, setSelId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  // Live sync: reflect any status/note change made on another staff screen.
  useEffect(() => {
    const ch = supabase
      .channel("floor-plan")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "restaurant_tables" }, (payload) => {
        const row = payload.new as Table;
        setTables((prev) => prev.map((t) => (t.id === row.id ? { ...t, status: row.status, note: row.note } : t)));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase]);

  const selected = tables.find((t) => t.id === selId) ?? null;

  const apply = async (id: string, patch: { status?: Status; note?: string | null }) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))); // optimistic
    await supabase.from("restaurant_tables").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const openTable = (t: Table) => { setSelId(t.id); setNoteDraft(t.note ?? ""); };

  const counts = useMemo(() => {
    const c = { available: 0, reserved: 0, occupied: 0, blocked: 0 } as Record<Status, number>;
    for (const t of tables) c[(t.status as Status) in c ? (t.status as Status) : "available"]++;
    return c;
  }, [tables]);

  return (
    <div className="fp-wrap">
      {/* Legend + live counts */}
      <div className="fp-legend">
        {ORDER.map((s) => (
          <span className="fp-leg" key={s}>
            <i style={{ background: STATUS[s].stroke }} /> {STATUS[s].label}
            <b>{counts[s]}</b>
          </span>
        ))}
        <span className="fp-leg-hint">Tap a table to change its status — updates sync live to all screens.</span>
      </div>

      <div className="fp-canvas">
        <svg viewBox="0 0 1000 640" className="fp-svg" role="img" aria-label={`${locationName} floor plan`}>
          {/* room outline */}
          <rect x="6" y="6" width="988" height="628" rx="10" className="fp-room" />

          {/* fixed labels */}
          <text x="592" y="150" className="fp-label fp-brand" textAnchor="middle">CHIANG MAI</text>
          <text x="592" y="205" className="fp-label fp-bar" textAnchor="middle">BAR</text>
          <text x="978" y="400" className="fp-label fp-edge" textAnchor="middle" transform="rotate(90 978 400)">ENTRANCE</text>
          <text x="26" y="470" className="fp-label fp-edge" textAnchor="middle" transform="rotate(-90 26 470)">washrooms</text>

          {tables.map((t) => {
            const st = STATUS[(t.status as Status) in STATUS ? (t.status as Status) : "available"];
            const isSel = t.id === selId;
            const cx = t.x + t.w / 2;
            const cy = t.y + t.h / 2;
            return (
              <g key={t.id} className="fp-table" onClick={() => openTable(t)} style={{ cursor: "pointer" }}>
                {t.shape === "circle" ? (
                  <circle cx={cx} cy={cy} r={t.w / 2} fill={st.fill} stroke={isSel ? "#fff" : st.stroke} strokeWidth={isSel ? 3 : 2} />
                ) : (
                  <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={6} fill={st.fill} stroke={isSel ? "#fff" : st.stroke} strokeWidth={isSel ? 3 : 2} />
                )}
                <text x={cx} y={cy} className="fp-code" fill={st.text} textAnchor="middle" dominantBaseline="central"
                  fontSize={t.w < 50 ? 13 : 15}>
                  {t.code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Status picker */}
      {selected && (
        <div className="fp-picker-overlay" onClick={() => setSelId(null)}>
          <div className="fp-picker" onClick={(e) => e.stopPropagation()}>
            <div className="fp-picker-head">
              <strong>Table {selected.code}</strong>
              <span className="muted">{selected.seats ? `${selected.seats} seats · ` : ""}{selected.section}</span>
            </div>
            <div className="fp-status-row">
              {ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`fp-status-btn ${selected.status === s ? "on" : ""}`}
                  style={{ borderColor: STATUS[s].stroke, color: STATUS[s].stroke }}
                  onClick={() => apply(selected.id, { status: s })}
                >
                  {STATUS[s].label}
                </button>
              ))}
            </div>
            <label className="fp-note">
              <span className="field-label">Guest / note (optional)</span>
              <input
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="e.g. Khun Som · 4 pax · 7:00"
                onBlur={() => { if (noteDraft !== (selected.note ?? "")) apply(selected.id, { note: noteDraft || null }); }}
              />
            </label>
            <button type="button" className="btn-outline" onClick={() => setSelId(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
