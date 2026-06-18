"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from "./Icon";
import { SLOTS, slotLabel } from "@/lib/slots";
import {
  getAvailability,
  createBooking,
  type Zone,
} from "@/app/book-actions";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function prettyDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Preload images into browser cache so the modal appears instantly.
const preloaded = new Set<string>();
function preloadImg(src: string) {
  if (!src || preloaded.has(src)) return;
  preloaded.add(src);
  const img = new Image();
  img.src = src;
}

export function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"table" | "details" | "success">("table");
  const [date, setDate] = useState(todayStr());
  const [party, setParty] = useState(2);

  const [zones, setZones] = useState<Zone[]>([]);
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [zone, setZone] = useState<Zone | null>(null);
  const [time, setTime] = useState<string>("");

  const [form, setForm] = useState({ first: "", last: "", phone: "", email: "", occasion: "", request: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (d: string) => {
    setLoading(true);
    const res = await getAvailability(d);
    setZones(res.zones);
    setTaken(new Set(res.taken));
    setLoading(false);
    // Preload zone photos into the browser cache
    for (const z of res.zones) { if (z.photo) preloadImg(z.photo); }
  }, []);

  // Start fetching availability early (before user clicks the button) by
  // preloading on first render — the data is already cached when the modal opens.
  const prefetched = useRef(false);
  useEffect(() => {
    if (!prefetched.current) {
      prefetched.current = true;
      preloadImg("/assets/mural-booths.jpg");
      getAvailability(todayStr()).then((res) => {
        for (const z of res.zones) { if (z.photo) preloadImg(z.photo); }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (open) {
      setStep("table");
      setError("");
      load(date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  const onDateChange = (d: string) => {
    setDate(d);
    load(d);
  };

  const pickSlot = (z: Zone, slot: string) => {
    setZone(z);
    setTime(slot);
    setError("");
    setStep("details");
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;
    setSubmitting(true);
    setError("");
    const res = await createBooking({
      zoneId: zone.id,
      date,
      time,
      partySize: party,
      ...form,
    });
    setSubmitting(false);
    if (res.ok) {
      setStep("success");
    } else {
      setError(res.error);
      // If the slot was taken meanwhile, refresh availability for when they go back.
      load(date);
    }
  };

  const close = () => {
    onClose();
    // reset after the close animation
    setTimeout(() => {
      setStep("table");
      setZone(null);
      setTime("");
      setForm({ first: "", last: "", phone: "", email: "", occasion: "", request: "" });
      setError("");
    }, 200);
  };

  return (
    <div className="bk-overlay" onClick={close}>
      <div className="bk-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="bk-close" onClick={close} aria-label="Close"><Icon name="X" size={20} /></button>
        <div className="bk-hero" style={{ backgroundImage: "url(/assets/mural-booths.jpg)" }} />

        <div className="bk-body">
          <div className="bk-steps">
            <span className={step === "table" ? "bk-step on" : "bk-step done"}>
              {step === "table" ? <span className="bk-num">1</span> : <Icon name="Check" size={16} />} Find a table
            </span>
            <span className={`bk-step ${step !== "table" ? "on" : ""}`}>
              <span className="bk-num">2</span> Add your details
            </span>
          </div>

          {/* ── Step 1 ── */}
          {step === "table" && (
            <>
              <h3 className="bk-title">Reservation at Chiang Mai — Mississauga</h3>
              <div className="bk-controls">
                <label className="bk-control">
                  <Icon name="Calendar" size={16} />
                  <input type="date" value={date} min={todayStr()} onChange={(e) => onDateChange(e.target.value)} />
                </label>
                <label className="bk-control">
                  <Icon name="Users" size={16} />
                  <select value={party} onChange={(e) => setParty(Number(e.target.value))}>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
                    ))}
                  </select>
                </label>
              </div>

              {loading ? (
                <p className="bk-muted">Checking availability…</p>
              ) : zones.length === 0 ? (
                <p className="bk-muted">Booking zones aren&apos;t set up yet. Please run the zone seed (docs/BOOKING.md).</p>
              ) : (
                <div className="bk-zones">
                  {zones.map((z) => (
                    <div className="bk-zone" key={z.id}>
                      <div
                        className={`bk-zone-img ${z.photo ? "" : "noimg"}`}
                        style={z.photo ? { backgroundImage: `url(${z.photo})` } : undefined}
                        aria-hidden="true"
                      />
                      <div className="bk-zone-head">
                        <span className="bk-zone-name">{z.name}</span>
                        <span className="bk-zone-cap">
                          Seated {z.seated ?? "—"} · Reception {z.reception ?? "—"}
                        </span>
                      </div>
                      <div className="bk-slots">
                        {SLOTS.map((s) => {
                          const isTaken = taken.has(`${z.id}|${s.value}`);
                          const overCap = z.reception != null && party > z.reception;
                          const disabled = isTaken || overCap;
                          return (
                            <button
                              key={s.value}
                              type="button"
                              className={`bk-slot ${isTaken ? "taken" : ""}`}
                              disabled={disabled}
                              title={isTaken ? "Already booked" : overCap ? "Party too large for this zone" : ""}
                              onClick={() => pickSlot(z, s.value)}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="bk-fineprint">
                <Icon name="Info" size={13} /> Slots already reserved are greyed out — pick an available time to continue.
              </p>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === "details" && zone && (
            <form className="bk-form" onSubmit={submit}>
              <button type="button" className="bk-back" onClick={() => setStep("table")}>
                <Icon name="ArrowLeft" size={15} /> Back
              </button>
              <h3 className="bk-title">You&apos;re almost done!</h3>
              <div className="bk-summary">
                <strong>{zone.name}</strong>
                <span><Icon name="Calendar" size={14} /> {prettyDate(date)}</span>
                <span><Icon name="Clock" size={14} /> {slotLabel(time)}</span>
                <span><Icon name="Users" size={14} /> {party} {party === 1 ? "person" : "people"}</span>
              </div>

              {error && <div className="bk-error">{error}</div>}

              <div className="bk-grid2">
                <input required placeholder="First name" value={form.first} onChange={set("first")} autoComplete="given-name" />
                <input required placeholder="Last name" value={form.last} onChange={set("last")} autoComplete="family-name" />
              </div>
              <div className="bk-grid2">
                <input required type="tel" placeholder="Phone number" value={form.phone} onChange={set("phone")} autoComplete="tel" />
                <input required type="email" placeholder="Email" value={form.email} onChange={set("email")} autoComplete="email" />
              </div>
              <div className="bk-grid2">
                <select value={form.occasion} onChange={set("occasion")} className={form.occasion ? "" : "bk-ph"}>
                  <option value="">Select an occasion (optional)</option>
                  <option>Birthday</option>
                  <option>Anniversary</option>
                  <option>Corporate</option>
                  <option>Wedding</option>
                  <option>Celebration</option>
                </select>
                <input placeholder="Add a special request (optional)" value={form.request} onChange={set("request")} />
              </div>

              <button type="submit" className="bk-submit" disabled={submitting}>
                {submitting ? "Completing…" : "Complete reservation"}
              </button>
              <p className="bk-fineprint">
                <Icon name="Lock" size={13} /> Instantly confirmed. We hold your table for a 10-minute grace period.
              </p>
            </form>
          )}

          {/* ── Success ── */}
          {step === "success" && zone && (
            <div className="bk-success">
              <div className="bk-success-ring"><Icon name="Check" size={32} stroke={1.6} /></div>
              <h3 className="bk-title">Your table is booked!</h3>
              <p className="bk-muted">
                Thank you, {form.first}. We&apos;ve confirmed {zone.name} for {party} on {prettyDate(date)} at {slotLabel(time)}.
                A confirmation is on its way to {form.email}.
              </p>
              <button type="button" className="bk-submit" onClick={close}>Done</button>
            </div>
          )}

          <div className="bk-powered">Powered by Chiang Mai Reservations</div>
        </div>
      </div>
    </div>
  );
}
