"use client";

import { useEffect } from "react";

/**
 * Catches errors that escape page-level boundaries. The most common one in
 * production is a chunk-load error right after a deploy (the old build's JS
 * chunks 404). A reload fetches the fresh build, so we recover automatically
 * instead of showing a scary "Application error" screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = `${error?.name ?? ""} ${error?.message ?? ""}`;
    const isChunkError =
      /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|importing a module script failed/i.test(msg);
    if (isChunkError) {
      // Avoid a reload loop: only auto-reload once per page load.
      const KEY = "__chunk_reload_ts";
      const last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last > 10000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0A0A0A",
          color: "#F6F3EC",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", marginBottom: 10 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#B3B3B3", lineHeight: 1.6, marginBottom: 22 }}>
            The page hit a temporary error. Reloading usually fixes it.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#F4A626",
              color: "#140516",
              border: "none",
              borderRadius: 8,
              padding: "13px 24px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
