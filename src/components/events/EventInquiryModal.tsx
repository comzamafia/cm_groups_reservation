"use client";

import { useEffect } from "react";
import { Icon } from "./Icon";
import { BookingForm } from "./BookingForm";

const SPACES = [
  { name: "The Mural Lounge" },
  { name: "The Curio Library" },
  { name: "Main Dining Buyout" },
];

/**
 * "Book an Event" — large-party / private event inquiries. Wraps the existing
 * lead-capture form (which writes to the `leads` table) in a modal, so the full
 * form no longer lives inline on the landing page.
 */
export function EventInquiryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="bk-overlay" onClick={onClose}>
      <div className="bk-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="bk-close" onClick={onClose} aria-label="Close"><Icon name="X" size={20} /></button>
        <div className="bk-body" style={{ paddingTop: 28 }}>
          <div className="kicker"><span className="flourish"><span className="flourish-line" /><span className="flourish-diamond" /><span className="flourish-line" /></span><span>Begin Your Inquiry</span></div>
          <h3 className="bk-title">Plan a private event</h3>
          <p className="bk-muted" style={{ marginTop: -4, marginBottom: 14 }}>
            For larger parties and full buyouts, share a few details and our events team will reach out within one business day.
          </p>
          <BookingForm spaces={SPACES} />
        </div>
      </div>
    </div>
  );
}
