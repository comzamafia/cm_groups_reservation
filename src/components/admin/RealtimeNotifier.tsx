"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Toast = { id: number; text: string };

/**
 * Module 4 — smart notifications. Subscribes to Supabase Realtime inserts on
 * `leads` and `reservations`, pops a toast and refreshes server components so
 * the dashboard/calendar update live without a manual reload.
 *
 * Requires the tables to be in the `supabase_realtime` publication
 * (see supabase/migrations/0005_enable_realtime.sql).
 */
export function RealtimeNotifier() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const push = (text: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, text }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
      router.refresh();
    };

    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const name = (payload.new as { name?: string })?.name ?? "Someone";
          push(`New inquiry from ${name}`);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations" },
        (payload) => {
          const name = (payload.new as { guest_name?: string })?.guest_name ?? "a guest";
          push(`New reservation for ${name}`);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="toast-dot" />
          {t.text}
        </div>
      ))}
    </div>
  );
}
