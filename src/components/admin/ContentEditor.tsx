"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveContent } from "@/app/admin/content-actions";

export type Field = {
  key: string;
  grp: string;
  label: string;
  type: "text" | "textarea" | "image";
  sort: number;
  value: string;
};

export function ContentEditor({ fields }: { fields: Field[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Group fields by grp, preserving sort order.
  const groups: Record<string, Field[]> = {};
  for (const f of fields) (groups[f.grp] ||= []).push(f);

  const action = async (formData: FormData) => {
    setBusy(true);
    setMsg("");
    setErr("");
    const res = await saveContent(formData);
    setBusy(false);
    if (res.ok) {
      const warning = "warning" in res ? (res as { warning?: string }).warning : undefined;
      setMsg(warning || "Saved ✓ — open the public site and refresh (pull-to-refresh on mobile) to see the changes.");
      router.refresh();
    } else {
      setErr(res.error || "Save failed.");
    }
  };

  return (
    <form action={action}>
      <div className="content-bar">
        <div>
          {msg && <span className="content-ok">{msg}</span>}
          {err && <span className="content-err">{err}</span>}
        </div>
        <button type="submit" className="btn-gold" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>

      {Object.entries(groups).map(([grp, items]) => (
        <div className="panel" key={grp} style={{ marginBottom: 18 }}>
          <div className="panel-head"><h2>{grp}</h2></div>
          <div className="content-grid">
            {items.map((f) => (
              <div className="content-field" key={f.key}>
                <label className="field-label" htmlFor={f.key}>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea id={f.key} name={f.key} defaultValue={f.value} rows={3} />
                ) : f.type === "image" ? (
                  <div className="content-img">
                    <div
                      className="content-img-preview"
                      style={f.value ? { backgroundImage: `url(${f.value})` } : undefined}
                    />
                    <div className="content-img-controls">
                      <input type="file" name={`file__${f.key}`} accept="image/jpeg,image/png,image/webp,image/avif" />
                      <input id={f.key} name={f.key} type="text" defaultValue={f.value} placeholder="current image URL" />
                    </div>
                  </div>
                ) : (
                  <input id={f.key} name={f.key} type="text" defaultValue={f.value} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="content-bar">
        <span className="muted" style={{ fontSize: "0.84rem" }}>
          Tip: clearing a field restores its default text.
        </span>
        <button type="submit" className="btn-gold" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
