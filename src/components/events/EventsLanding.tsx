"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { BookingModal } from "./BookingModal";
import { EventInquiryModal } from "./EventInquiryModal";

type C = Record<string, string>;

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.offsetTop - 64, behavior: "smooth" });
};
const lines = (s: string) => (s || "").split("\n").map((x) => x.trim()).filter(Boolean);

/* ───────────────────── Shared bits ───────────────────── */
function Flourish() {
  return (
    <span className="flourish" aria-hidden="true">
      <span className="flourish-line" />
      <span className="flourish-diamond" />
      <span className="flourish-line" />
    </span>
  );
}

function InstagramGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function FacebookGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function Reveal({
  children, as: Tag = "div", className = "", delay = 0, style = {},
}: {
  children: React.ReactNode; as?: React.ElementType; className?: string; delay?: number; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.unobserve(el); } });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${seen ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </Tag>
  );
}

/* ───────────────────────── Nav ───────────────────────── */
function Nav({ c, onBookTable }: { c: C; onBookTable: () => void }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const go = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); scrollToId(id); };
  return (
    <header className={`nav ${solid ? "is-solid" : ""}`}>
      <div className="nav-inner">
        <a href="#top" className="brand" onClick={go("top")}>
          <span className="brand-mark">{c.brand_name}</span>
          <span className="brand-sub">{c.brand_sub}</span>
        </a>
        <nav className="nav-links">
          <a href="#spaces" onClick={go("spaces")}>{c.nav_spaces}</a>
          <a href="#menus" onClick={go("menus")}>{c.nav_menus}</a>
          <a href="#story" onClick={go("story")}>{c.nav_venue}</a>
          <button type="button" className="nav-cta" onClick={onBookTable}>{c.nav_cta}</button>
        </nav>
      </div>
    </header>
  );
}

/* ───────────────────────── Hero ───────────────────────── */
function Hero({ c, onBookTable, onBookEvent }: { c: C; onBookTable: () => void; onBookEvent: () => void }) {
  return (
    <section className="hero" id="top">
      <div className="hero-img" style={{ backgroundImage: `url(${c.hero_image})` }} />
      <div className="hero-scrim" />
      <div className="hero-grain" />
      <div className="hero-content">
        <div className="hero-eyebrow reveal is-in">
          <Flourish />
          <span>{c.hero_eyebrow}</span>
        </div>
        <h1 className="hero-title">
          <span className="line line-1">{c.hero_title_1}</span>
          <span className="line line-2"><em>{c.hero_title_2}</em></span>
        </h1>
        <p className="hero-sub line line-3">{c.hero_subtitle}</p>
        <div className="hero-actions line line-4">
          <button type="button" className="btn-gold" onClick={onBookTable}>
            {c.hero_cta_primary} <Icon name="ArrowRight" size={18} />
          </button>
          <button type="button" className="btn-outline" onClick={onBookEvent}>
            {c.hero_cta_secondary}
          </button>
        </div>
      </div>
      <div className="hero-foot line line-5">
        <div className="hero-foot-item"><Icon name="Users" size={16} /> {c.hero_stat_1}</div>
        <div className="hero-foot-item"><Icon name="MapPin" size={16} /> {c.hero_stat_2}</div>
        <div className="hero-foot-item"><Icon name="Sparkles" size={16} /> {c.hero_stat_3}</div>
      </div>
    </section>
  );
}

/* ───────────────────── Story ───────────────────── */
function Story({ c }: { c: C }) {
  const points = [c.story_point_1, c.story_point_2, c.story_point_3, c.story_point_4].filter(Boolean);
  const icons = ["ChefHat", "Speaker", "CalendarHeart", "GlassWater"];
  return (
    <section className="story" id="story">
      <div className="story-grid">
        <Reveal className="story-media">
          <div className="story-photo" style={{ backgroundImage: `url(${c.story_image})` }} />
          <div className="story-badge">
            <span className="badge-num">{c.story_badge_num}</span>
            <span className="badge-txt">{c.story_badge_text}</span>
          </div>
        </Reveal>
        <Reveal className="story-copy" delay={120}>
          <div className="kicker"><Flourish /><span>{c.story_kicker}</span></div>
          <h2 className="h2">{c.story_heading}</h2>
          <p className="lead">{c.story_lead}</p>
          <ul className="story-list">
            {points.map((p, i) => (
              <li key={i}><Icon name={icons[i] ?? "Check"} size={18} /> {p}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────── Spaces ───────────────────── */
function Spaces({ c, onBookTable }: { c: C; onBookTable: () => void }) {
  const cards = [1, 2, 3, 4].map((i) => ({
    name: c[`space${i}_name`], tag: c[`space${i}_tag`], caps: c[`space${i}_caps`],
    desc: c[`space${i}_desc`], image: c[`space${i}_image`],
  })).filter((s) => s.name);
  const layout = cards.length === 4 ? "is-four" : cards.length === 2 ? "is-two" : "is-three";
  return (
    <section className="spaces" id="spaces">
      <div className="section-head">
        <div className="kicker center"><Flourish /><span>{c.spaces_kicker}</span></div>
        <h2 className="h2 center">{c.spaces_heading}</h2>
        <p className="section-intro">{c.spaces_intro}</p>
      </div>
      <div className={`space-grid ${layout}`}>
        {cards.map((s, i) => (
          <Reveal as="article" className="space-card" key={s.name} delay={i * 90}>
            <div className="space-img" style={{ backgroundImage: `url(${s.image})` }}>
              {s.tag && <span className="space-tag">{s.tag}</span>}
            </div>
            <div className="space-body">
              <h3 className="space-name">{s.name}</h3>
              <div className="space-cap">
                <span><Icon name="Users" size={15} /> {s.caps}</span>
              </div>
              <p className="space-desc">{s.desc}</p>
              <button type="button" className="link-arrow" onClick={onBookTable}>
                Book this space <Icon name="ArrowRight" size={15} />
              </button>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── Menus ───────────────────── */
function Menus({ c }: { c: C }) {
  const icons = ["UtensilsCrossed", "Martini", "Wine"];
  const menus = [1, 2, 3].map((i) => ({
    icon: icons[i - 1], name: c[`menu${i}_name`], price: c[`menu${i}_price`],
    desc: c[`menu${i}_desc`], items: lines(c[`menu${i}_items`]),
  })).filter((m) => m.name);
  return (
    <section className="menus" id="menus">
      <div className="menus-inner">
        <div className="section-head left">
          <div className="kicker"><Flourish /><span>{c.menus_kicker}</span></div>
          <h2 className="h2">{c.menus_heading}</h2>
          <p className="section-intro">{c.menus_intro}</p>
        </div>
        <div className="menu-grid">
          {menus.map((m, i) => (
            <Reveal as="article" className="menu-card" key={m.name} delay={i * 90}>
              <div className="menu-icon"><Icon name={m.icon} size={22} /></div>
              <div className="menu-top">
                <h3 className="menu-name">{m.name}</h3>
                <span className="menu-price">{m.price}</span>
              </div>
              <p className="menu-desc">{m.desc}</p>
              <ul className="menu-items">
                {m.items.map((it) => (<li key={it}><Icon name="Check" size={14} /> {it}</li>))}
              </ul>
            </Reveal>
          ))}
        </div>
        <Reveal className="menu-download">
          <div>
            <h4>{c.menu_dl_title}</h4>
            <p>{c.menu_dl_sub}</p>
          </div>
          <a href="#" className="btn-outline" onClick={(e) => e.preventDefault()}>
            <Icon name="Download" size={17} /> Download Event Package (PDF)
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────── Reserve ───────────────────── */
function Reserve({ c, onBookTable, onBookEvent }: { c: C; onBookTable: () => void; onBookEvent: () => void }) {
  return (
    <section className="inquire" id="inquire">
      <div className="reserve-grid">
        <div>
          <div className="kicker"><Flourish /><span>{c.reserve_kicker}</span></div>
          <h2 className="h2">{c.reserve_heading}</h2>
          <p className="lead">{c.reserve_lead}</p>
          <ul className="contact-list">
            <li><span className="ci"><Icon name="Mail" size={16} /></span><a href={`mailto:${c.contact_email}`}>{c.contact_email}</a></li>
            <li><span className="ci"><Icon name="Phone" size={16} /></span><a href={`tel:${c.contact_phone}`}>{c.contact_phone}</a></li>
            <li><span className="ci"><Icon name="MapPin" size={16} /></span>{c.contact_address}</li>
            <li><span className="ci"><Icon name="Clock" size={16} /></span>{c.contact_hours}</li>
          </ul>
        </div>
        <div className="reserve-cards">
          <button type="button" className="reserve-card primary" onClick={onBookTable}>
            <Icon name="CalendarCheck" size={26} />
            <span className="reserve-card-title">{c.hero_cta_primary}</span>
            <span className="reserve-card-sub">Pick a zone &amp; time — instantly confirmed.</span>
            <span className="reserve-card-go">Choose a time <Icon name="ArrowRight" size={16} /></span>
          </button>
          <button type="button" className="reserve-card" onClick={onBookEvent}>
            <Icon name="Sparkles" size={26} />
            <span className="reserve-card-title">{c.hero_cta_secondary}</span>
            <span className="reserve-card-sub">Large parties &amp; full buyouts — send an inquiry.</span>
            <span className="reserve-card-go">Start inquiry <Icon name="ArrowRight" size={16} /></span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Footer ───────────────────── */
function Footer({ c }: { c: C }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark big">{c.brand_name}</span>
          <p>{c.footer_blurb}</p>
          <div className="footer-social">
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Instagram"><InstagramGlyph /></a>
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Facebook"><FacebookGlyph /></a>
          </div>
        </div>
        <div className="footer-col">
          <h5>Events</h5>
          <a href={`mailto:${c.contact_email}`}>{c.contact_email}</a>
          <a href={`tel:${c.contact_phone}`}>{c.contact_phone}</a>
        </div>
        <div className="footer-col">
          <h5>Visit</h5>
          <span>{c.footer_visit_1}</span>
          <span>{c.footer_visit_2}</span>
        </div>
        <div className="footer-col">
          <h5>Hours</h5>
          <span>{c.footer_hours_1}</span>
          <span>{c.footer_hours_2}</span>
        </div>
      </div>
      <div className="footer-base">
        <span>{c.footer_copyright}</span>
        <span className="footer-base-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Accessibility</a>
        </span>
      </div>
    </footer>
  );
}

/* ───────────────────── Page ───────────────────── */
export function EventsLanding({ content }: { content: C }) {
  const c = content;
  const [tableOpen, setTableOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const openTable = () => setTableOpen(true);
  const openEvent = () => setEventOpen(true);

  return (
    <>
      <Nav c={c} onBookTable={openTable} />
      <main>
        <Hero c={c} onBookTable={openTable} onBookEvent={openEvent} />
        <Story c={c} />
        <Spaces c={c} onBookTable={openTable} />
        <Menus c={c} />
        <Reserve c={c} onBookTable={openTable} onBookEvent={openEvent} />
      </main>
      <Footer c={c} />

      <BookingModal open={tableOpen} onClose={() => setTableOpen(false)} />
      <EventInquiryModal open={eventOpen} onClose={() => setEventOpen(false)} />
    </>
  );
}
