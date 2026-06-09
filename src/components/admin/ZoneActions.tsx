"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setZoneActive, deleteZone } from "@/app/admin/zone-actions";
import { Icon } from "@/components/events/Icon";

export function ZoneActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const toggle = () =>
    start(async () => {
      const res = await setZoneActive(id, !active);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });

  const remove = () => {
    if (!confirm("Delete this zone? (If it has reservations, deactivate instead.)")) return;
    start(async () => {
      const res = await deleteZone(id);
      if (!res.ok) alert("Couldn't delete (it may have reservations). Deactivate it instead.");
      else router.refresh();
    });
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <button
        type="button"
        className={`badge ${active ? "won" : "lost"}`}
        onClick={toggle}
        disabled={pending}
        style={{ cursor: "pointer", border: "none" }}
        title={active ? "Click to deactivate" : "Click to activate"}
      >
        {active ? "Active" : "Hidden"}
      </button>
      <button type="button" className="icon-btn" onClick={remove} disabled={pending} aria-label="Delete zone">
        <Icon name="Trash2" size={16} />
      </button>
    </div>
  );
}
