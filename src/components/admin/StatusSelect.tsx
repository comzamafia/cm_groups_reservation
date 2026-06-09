"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus, updateReservationStatus } from "@/app/admin/actions";

const OPTIONS = {
  lead: ["new", "contacted", "won", "lost"],
  reservation: [
    "pending",
    "confirmed",
    "seated",
    "completed",
    "cancelled",
    "no_show",
  ],
} as const;

export function StatusSelect({
  kind,
  id,
  value,
}: {
  kind: "lead" | "reservation";
  id: string;
  value: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [pending, startTransition] = useTransition();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    const prev = current;
    setCurrent(next);
    startTransition(async () => {
      const res =
        kind === "lead"
          ? await updateLeadStatus(id, next)
          : await updateReservationStatus(id, next);
      if (!res.ok) {
        setCurrent(prev); // revert on failure
        alert(res.error || "Failed to update status");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <select
      className="status-select"
      value={current}
      onChange={onChange}
      disabled={pending}
      aria-label="Change status"
    >
      {OPTIONS[kind].map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
