"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
const CANVAS_W = 1000, CANVAS_H = 640, GRID = 5;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const snap = (v: number) => Math.round(v / GRID) * GRID;

export function FloorPlan({ initial, locationId, locationName }: { initial: Table[]; locationId: string; locationName: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [tables, setTables] = useState<Table[]>(initial);
  const [selId, setSelId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [edit, setEdit] = useState(false);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"main" | "bar">("main");

  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; w: number; h: number; moved: boolean; lastX: number; lastY: number } | null>(null);

  // Live sync: insert/update/delete from any staff screen.
  useEffect(() => {
    const ch = supabase
      .channel("floor-plan")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as { id: string };
          setTables((prev) => prev.filter((t) => t.id !== old.id));
          return;
        }
        const row = payload.new as Table;
        setTables((prev) => (prev.some((t) => t.id === row.id)
          ? prev.map((t) => (t.id === row.id ? { ...t, ...row } : t))
          : [...prev, row]));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase]);

  const selected = tables.find((t) => t.id === selId) ?? null;
  const visible = useMemo(
    () => tables.filter((t) => (view === "bar" ? t.section === "bar" : t.section !== "bar")),
    [tables, view],
  );

  const patch = async (id: string, p: Partial<Table>) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));
    await supabase.from("restaurant_tables").update({ ...p, updated_at: new Date().toISOString() }).eq("id", id);
  };

  // ── Drag to move (edit mode) ──
  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  const onMove = (e: PointerEvent) => {
    const d = drag.current; if (!d) return;
    const { x, y } = toSvg(e.clientX, e.clientY);
    const nx = clamp(x - d.dx, 0, CANVAS_W - d.w);
    const ny = clamp(y - d.dy, 0, CANVAS_H - d.h);
    d.moved = true; d.lastX = nx; d.lastY = ny;
    setTables((prev) => prev.map((t) => (t.id === d.id ? { ...t, x: nx, y: ny } : t)));
  };
  const onUp = () => {
    const d = drag.current;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      patch(d.id, { x: snap(d.lastX), y: snap(d.lastY) });
    } else {
      // a tap (no movement) selects for editing
      setSelId(d.id);
    }
  };
  const startDrag = (e: React.PointerEvent, t: Table) => {
    e.preventDefault();
    const { x, y } = toSvg(e.clientX, e.clientY);
    drag.current = { id: t.id, dx: x - t.x, dy: y - t.y, w: t.w, h: t.h, moved: false, lastX: t.x, lastY: t.y };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const openStatus = (t: Table) => { setSelId(t.id); setNoteDraft(t.note ?? ""); };

  const addTable = async (code: string, shape: "rect" | "circle", section: string, seats: number) => {
    const w = shape === "circle" ? 72 : 80;
    const row = { location_id: locationId, code, section, shape, x: 460, y: 290, w, h: shape === "circle" ? 72 : 78, seats, status: "available", sort: tables.length };
    const { data, error } = await supabase.from("restaurant_tables").insert(row).select().single();
    setAdding(false);
    if (error) { alert(error.message); return; }
    setTables((prev) => (prev.some((t) => t.id === data.id) ? prev : [...prev, data as Table]));
    setEdit(true);
    setSelId(data.id);
  };

  const removeTable = async (id: string) => {
    if (!confirm("Delete this table?")) return;
    setTables((prev) => prev.filter((t) => t.id !== id));
    setSelId(null);
    await supabase.from("restaurant_tables").delete().eq("id", id);
  };

  const counts = useMemo(() => {
    const c = { available: 0, reserved: 0, occupied: 0, blocked: 0 } as Record<Status, number>;
    for (const t of visible) c[(t.status as Status) in c ? (t.status as Status) : "available"]++;
    return c;
  }, [visible]);

  return (
    <div className="fp-wrap">
      <div className="fp-tabs">
        <button type="button" className={view === "main" ? "on" : ""} onClick={() => { setView("main"); setSelId(null); }}>Main</button>
        <button type="button" className={view === "bar" ? "on" : ""} onClick={() => { setView("bar"); setSelId(null); }}>Bar</button>
      </div>
      <div className="fp-legend">
        {ORDER.map((s) => (
          <span className="fp-leg" key={s}>
            <i style={{ background: STATUS[s].stroke }} /> {STATUS[s].label}<b>{counts[s]}</b>
          </span>
        ))}
        <div className="fp-tools">
          {edit && <button type="button" className="btn-outline fp-mini" onClick={() => { setAdding(true); setSelId(null); }}>+ Add table</button>}
          <button type="button" className={`fp-mini ${edit ? "btn-gold" : "btn-outline"}`} onClick={() => { setEdit((v) => !v); setSelId(null); setAdding(false); }}>
            {edit ? "✓ Done editing" : "✎ Edit layout"}
          </button>
        </div>
      </div>
      <p className="fp-leg-hint">
        {edit ? "Drag tables to move · tap a table to edit its details · changes save automatically." : "Tap a table to change its status — updates sync live to all screens."}
      </p>

      <div className="fp-canvas">
        <svg ref={svgRef} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} className={`fp-svg ${edit ? "editing" : ""}`} role="img" aria-label={`${locationName} floor plan`}>
          {edit && (
            <defs>
              <pattern id="fpgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
              </pattern>
            </defs>
          )}
          <rect x="6" y="6" width="988" height="628" rx="10" className="fp-room" />
          {edit && <rect x="6" y="6" width="988" height="628" rx="10" fill="url(#fpgrid)" />}

          {view === "main" ? (
            <>
              <text x="592" y="150" className="fp-label fp-brand" textAnchor="middle">CHIANG MAI</text>
              <text x="592" y="205" className="fp-label fp-bar" textAnchor="middle">BAR</text>
              <text x="978" y="400" className="fp-label fp-edge" textAnchor="middle" transform="rotate(90 978 400)">ENTRANCE</text>
              <text x="26" y="470" className="fp-label fp-edge" textAnchor="middle" transform="rotate(-90 26 470)">washrooms</text>
            </>
          ) : (
            <>
              <rect x="300" y="130" width="400" height="72" rx="36" className="fp-bar-counter" />
              <text x="500" y="173" className="fp-label fp-bar" textAnchor="middle">BAR</text>
            </>
          )}

          {visible.map((t) => {
            const st = STATUS[(t.status as Status) in STATUS ? (t.status as Status) : "available"];
            const isSel = t.id === selId;
            const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
            return (
              <g
                key={t.id}
                className="fp-table"
                style={{ cursor: edit ? "grab" : "pointer" }}
                onPointerDown={edit ? (e) => startDrag(e, t) : undefined}
                onClick={!edit ? () => openStatus(t) : undefined}
              >
                {t.shape === "circle"
                  ? <circle cx={cx} cy={cy} r={t.w / 2} fill={st.fill} stroke={isSel ? "#fff" : st.stroke} strokeWidth={isSel ? 3 : 2} />
                  : <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={6} fill={st.fill} stroke={isSel ? "#fff" : st.stroke} strokeWidth={isSel ? 3 : 2} />}
                <text x={cx} y={cy} className="fp-code" fill={st.text} textAnchor="middle" dominantBaseline="central" fontSize={t.w < 50 ? 13 : 15}>{t.code}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Add-table form */}
      {adding && <AddForm defaultSection={view === "bar" ? "bar" : "main"} onCancel={() => setAdding(false)} onAdd={addTable} />}

      {/* Status picker (normal) or properties editor (edit mode) */}
      {selected && !adding && (
        <div className="fp-picker-overlay" onClick={() => setSelId(null)}>
          <div className="fp-picker" onClick={(e) => e.stopPropagation()}>
            {edit ? (
              <>
                <div className="fp-picker-head"><strong>Edit table</strong><span className="muted">drag on the map to position</span></div>
                <div className="fp-grid2">
                  <label className="fp-note"><span className="field-label">Code</span>
                    <input value={selected.code} onChange={(e) => patch(selected.id, { code: e.target.value })} /></label>
                  <label className="fp-note"><span className="field-label">Seats</span>
                    <input type="number" min={1} value={selected.seats ?? ""} onChange={(e) => patch(selected.id, { seats: e.target.value ? Number(e.target.value) : null })} /></label>
                </div>
                <div className="fp-grid2">
                  <label className="fp-note"><span className="field-label">Shape</span>
                    <select value={selected.shape} onChange={(e) => patch(selected.id, { shape: e.target.value as "rect" | "circle" })}>
                      <option value="rect">Rectangle</option><option value="circle">Circle</option>
                    </select></label>
                  <label className="fp-note"><span className="field-label">Section</span>
                    <input value={selected.section} onChange={(e) => patch(selected.id, { section: e.target.value })} /></label>
                </div>
                <div className="fp-grid2">
                  <label className="fp-note"><span className="field-label">Width</span>
                    <input type="number" min={20} value={selected.w} onChange={(e) => patch(selected.id, { w: Number(e.target.value) || selected.w })} /></label>
                  <label className="fp-note"><span className="field-label">Height</span>
                    <input type="number" min={20} value={selected.h} onChange={(e) => patch(selected.id, { h: Number(e.target.value) || selected.h })} /></label>
                </div>
                <div className="fp-grid2">
                  <button type="button" className="btn-danger" onClick={() => removeTable(selected.id)}>Delete table</button>
                  <button type="button" className="btn-outline" onClick={() => setSelId(null)}>Done</button>
                </div>
              </>
            ) : (
              <>
                <div className="fp-picker-head">
                  <strong>Table {selected.code}</strong>
                  <span className="muted">{selected.seats ? `${selected.seats} seats · ` : ""}{selected.section}</span>
                </div>
                <div className="fp-status-row">
                  {ORDER.map((s) => (
                    <button key={s} type="button" className={`fp-status-btn ${selected.status === s ? "on" : ""}`}
                      style={{ borderColor: STATUS[s].stroke, color: STATUS[s].stroke }}
                      onClick={() => patch(selected.id, { status: s })}>{STATUS[s].label}</button>
                  ))}
                </div>
                <label className="fp-note"><span className="field-label">Guest / note (optional)</span>
                  <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="e.g. Khun Som · 4 pax · 7:00"
                    onBlur={() => { if (noteDraft !== (selected.note ?? "")) patch(selected.id, { note: noteDraft || null }); }} /></label>
                <button type="button" className="btn-outline" onClick={() => setSelId(null)}>Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddForm({ defaultSection, onCancel, onAdd }: { defaultSection: string; onCancel: () => void; onAdd: (code: string, shape: "rect" | "circle", section: string, seats: number) => void }) {
  const [code, setCode] = useState("");
  const [shape, setShape] = useState<"rect" | "circle">(defaultSection === "bar" ? "circle" : "rect");
  const [section, setSection] = useState(defaultSection);
  const [seats, setSeats] = useState(defaultSection === "bar" ? 1 : 4);
  return (
    <div className="fp-picker-overlay" onClick={onCancel}>
      <form className="fp-picker" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (code.trim()) onAdd(code.trim(), shape, section.trim() || "main", seats); }}>
        <div className="fp-picker-head"><strong>Add a table</strong><span className="muted">place it by dragging after</span></div>
        <div className="fp-grid2">
          <label className="fp-note"><span className="field-label">Code *</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. L7" required /></label>
          <label className="fp-note"><span className="field-label">Seats</span><input type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value))} /></label>
        </div>
        <div className="fp-grid2">
          <label className="fp-note"><span className="field-label">Shape</span>
            <select value={shape} onChange={(e) => setShape(e.target.value as "rect" | "circle")}><option value="rect">Rectangle</option><option value="circle">Circle</option></select></label>
          <label className="fp-note"><span className="field-label">Section</span><input value={section} onChange={(e) => setSection(e.target.value)} /></label>
        </div>
        <div className="fp-grid2">
          <button type="submit" className="btn-gold">Add table</button>
          <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
