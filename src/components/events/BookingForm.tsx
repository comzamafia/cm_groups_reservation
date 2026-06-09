"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { submitLead, type LeadInput } from "@/app/actions";

const EVENT_TYPES = [
  "Corporate Dinner",
  "Birthday Celebration",
  "Wedding & Reception",
  "Cocktail Reception",
  "Other",
];

type FormState = LeadInput;
type Errors = Partial<Record<keyof FormState, string>>;
type Touched = Partial<Record<keyof FormState, boolean>>;

const BLANK: FormState = {
  first: "",
  last: "",
  email: "",
  phone: "",
  date: "",
  guests: "",
  type: "",
  space: "",
  notes: "",
};

function validateField(k: keyof FormState, v: string): string {
  const val = (v || "").trim();
  switch (k) {
    case "first":
      return val ? "" : "Please enter your first name.";
    case "last":
      return val ? "" : "Please enter your last name.";
    case "email":
      if (!val) return "Please enter your email.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
        ? ""
        : "Enter a valid email address.";
    case "phone":
      if (!val) return "Please enter a phone number.";
      return val.replace(/[^0-9]/g, "").length >= 10
        ? ""
        : "Enter a valid phone number.";
    case "date":
      return val ? "" : "Choose a preferred date.";
    case "guests":
      if (!val) return "How many guests?";
      return Number(val) >= 2 ? "" : "Group events are for 2+ guests.";
    case "type":
      return val ? "" : "Select an event type.";
    case "space":
      return val ? "" : "Select a preferred space.";
    default:
      return "";
  }
}

function formatDate(d: string): string {
  if (!d) return "—";
  try {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | false;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="field-req">*</span>}
      </span>
      {children}
      <span className={`field-error ${error ? "is-shown" : ""}`}>
        {error || " "}
      </span>
    </label>
  );
}

export function BookingForm({ spaces }: { spaces: { name: string }[] }) {
  const SPACE_NAMES = (spaces || []).map((s) => s.name);
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const set =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setForm((f) => ({ ...f, [k]: v }));
      if (touched[k]) setErrors((er) => ({ ...er, [k]: validateField(k, v) }));
    };

  const blur = (k: keyof FormState) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors((er) => ({ ...er, [k]: validateField(k, form[k]) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    (Object.keys(BLANK) as (keyof FormState)[]).forEach((k) => {
      if (k === "notes") return;
      const msg = validateField(k, form[k]);
      if (msg) next[k] = msg;
    });
    setErrors(next);
    setTouched(
      (Object.keys(BLANK) as (keyof FormState)[]).reduce((a, k) => {
        a[k] = true;
        return a;
      }, {} as Touched),
    );

    if (Object.keys(next).length > 0) {
      const firstErr = Object.keys(next)[0];
      const el = document.querySelector<HTMLElement>(`[name="${firstErr}"]`);
      if (el) el.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    const res = await submitLead(form);
    setSubmitting(false);

    if (res.ok) {
      setDone(true);
      try {
        const target = document.getElementById("inquire");
        if (target)
          window.scrollTo({ top: target.offsetTop - 40, behavior: "smooth" });
      } catch {
        /* no-op */
      }
    } else {
      setSubmitError(
        "Something went wrong submitting your inquiry. Please try again or email us directly.",
      );
    }
  };

  if (done) {
    return (
      <div className="form-success">
        <div className="success-ring">
          <Icon name="Check" size={34} stroke={1.6} />
        </div>
        <h3 className="success-title">Your inquiry is in.</h3>
        <p className="success-body">
          Thank you, {form.first || "friend"}. Our events team will reach out
          within one business day to craft your evening at Chiang&nbsp;Mai. A
          confirmation is on its way to{" "}
          <span className="success-em">{form.email}</span>.
        </p>
        <dl className="success-recap">
          <div>
            <dt>Event</dt>
            <dd>{form.type}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatDate(form.date)}</dd>
          </div>
          <div>
            <dt>Guests</dt>
            <dd>{form.guests}</dd>
          </div>
          <div>
            <dt>Space</dt>
            <dd>{form.space}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setForm(BLANK);
            setErrors({});
            setTouched({});
            setDone(false);
            setSubmitError("");
          }}
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form-grid two">
        <Field label="First name" required error={touched.first && errors.first}>
          <input name="first" type="text" value={form.first} onChange={set("first")} onBlur={blur("first")} placeholder="Somchai" autoComplete="given-name" />
        </Field>
        <Field label="Last name" required error={touched.last && errors.last}>
          <input name="last" type="text" value={form.last} onChange={set("last")} onBlur={blur("last")} placeholder="Wattana" autoComplete="family-name" />
        </Field>
      </div>

      <div className="form-grid two">
        <Field label="Email address" required error={touched.email && errors.email}>
          <input name="email" type="email" value={form.email} onChange={set("email")} onBlur={blur("email")} placeholder="you@email.com" autoComplete="email" />
        </Field>
        <Field label="Phone number" required error={touched.phone && errors.phone}>
          <input name="phone" type="tel" value={form.phone} onChange={set("phone")} onBlur={blur("phone")} placeholder="(905) 000-0000" autoComplete="tel" />
        </Field>
      </div>

      <div className="form-grid three">
        <Field label="Preferred date" required error={touched.date && errors.date}>
          <div className="input-affix">
            <input name="date" type="date" value={form.date} onChange={set("date")} onBlur={blur("date")} />
            <Icon name="Calendar" size={17} className="affix-icon" />
          </div>
        </Field>
        <Field label="Guests" required error={touched.guests && errors.guests}>
          <div className="input-affix">
            <input name="guests" type="number" min="2" value={form.guests} onChange={set("guests")} onBlur={blur("guests")} placeholder="24" />
            <Icon name="Users" size={17} className="affix-icon" />
          </div>
        </Field>
        <Field label="Event type" required error={touched.type && errors.type}>
          <div className="input-affix">
            <select name="type" value={form.type} onChange={set("type")} onBlur={blur("type")} className={form.type ? "" : "is-placeholder"}>
              <option value="" disabled>Select…</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <Icon name="ChevronDown" size={17} className="affix-icon" />
          </div>
        </Field>
      </div>

      <Field label="Preferred space" required error={touched.space && errors.space}>
        <div className="input-affix">
          <select name="space" value={form.space} onChange={set("space")} onBlur={blur("space")} className={form.space ? "" : "is-placeholder"}>
            <option value="" disabled>Select a room…</option>
            {SPACE_NAMES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="Not sure — recommend one">Not sure — recommend one</option>
          </select>
          <Icon name="ChevronDown" size={17} className="affix-icon" />
        </div>
      </Field>

      <Field label="Additional notes & special requests">
        <textarea name="notes" rows={4} value={form.notes} onChange={set("notes")} placeholder="Tell us about the occasion — dietary needs, AV, a favourite dish to feature, a celebration we should know about…" />
      </Field>

      {submitError && (
        <p className="field-error is-shown" style={{ opacity: 1 }}>
          {submitError}
        </p>
      )}

      <button type="submit" className="btn-submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Inquiry"}
        <Icon name="ArrowRight" size={18} />
      </button>
      <p className="form-fineprint">
        <Icon name="Lock" size={13} /> We reply within one business day. No deposit
        required to inquire.
      </p>
    </form>
  );
}
