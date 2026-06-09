export default function Home() {
  return (
    <main className="flex-1">
      {/* Promotional banner (Module 1 — placeholder for dynamic banners) */}
      <div className="bg-night-purple text-cream text-center text-sm py-2 px-4">
        Host your private event at Chiang Mai — inquire for group bookings
      </div>

      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24 text-center">
        <p className="uppercase tracking-[0.25em] text-grey-600 text-xs mb-4">
          Chiang Mai Thai Dining
        </p>
        <h1 className="text-4xl sm:text-6xl font-medium text-ink mb-6">
          Group Party &amp; Events
        </h1>
        <p className="text-grey-900 text-lg leading-relaxed max-w-xl mx-auto mb-10">
          Reserve private rooms, semi-private nooks, and full event spaces — with
          drink packages, AV, and more, all in a few elegant steps.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#"
            className="inline-flex items-center justify-center min-h-11 px-7 rounded-xl bg-night-purple text-white font-medium"
          >
            Start a Reservation
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center min-h-11 px-7 rounded-xl bg-gold text-ink font-medium"
          >
            Make an Inquiry
          </a>
        </div>

        <p className="mt-16 text-xs text-grey-400">
          Phase 0 foundation · Next.js + Supabase · brand tokens wired
        </p>
      </section>
    </main>
  );
}
