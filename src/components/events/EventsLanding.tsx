"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { BookingForm } from "./BookingForm";

/* ───────────────────────── Data ───────────────────────── */
const SPACES = [
  {
    name: "The Mural Lounge",
    img: "/assets/mural-booths.jpg",
    seated: 40,
    reception: 60,
    tag: "Signature",
    desc: "Banquette seating beneath our hand-painted jungle mural, lit by glowing rattan lanterns. The room of choice for milestone dinners with theatre.",
  },
  {
    name: "The Curio Library",
    img: "/assets/curio-shelf.jpg",
    seated: 18,
    reception: 28,
    tag: "Intimate",
    desc: "An intimate, warmly-lit alcove framed by backlit walnut shelving and collected treasures. Tailor-made for board dinners and close celebrations.",
  },
  {
    name: "Main Dining Buyout",
    img: "/assets/bar-dining-room.jpg",
    seated: 120,
    reception: 180,
    tag: "Full Venue",
    desc: "The entire room — sweeping marble bar, herringbone floors and mural walls — exclusively yours. The grandest stage for weddings and receptions.",
  },
] as const;

const MENUS = [
  {
    icon: "UtensilsCrossed",
    name: "Family-Style Thai Feast",
    price: "from $68 / guest",
    desc: "Shared platters served to the centre of the table — green curry, crispy pad see ew, whole fried sea bass, jasmine rice and seasonal som tam.",
    items: ["Three shared starters", "Four mains, family-style", "Sticky rice & mango"],
  },
  {
    icon: "Martini",
    name: "Cocktail Reception Canapés",
    price: "from $52 / guest",
    desc: "Passed bites and a stationed display for free-flowing evenings — chicken satay, betel-leaf miang kham, prawn toast and pandan custard tarts.",
    items: ["Eight passed canapés", "Grazing station", "Two signature cocktails"],
  },
  {
    icon: "Wine",
    name: "The Chef's Tasting",
    price: "from $95 / guest",
    desc: "A guided seven-course progression from our kitchen, paired by the room — the full expression of modern Northern Thai cooking, plated and personal.",
    items: ["Seven plated courses", "Optional wine pairing", "Dedicated server team"],
  },
] as const;

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.offsetTop - 64, behavior: "smooth" });
};

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

/* Brand glyphs — lucide removed brand icons, so inline these to match the design. */
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
  children,
  as: Tag = "div",
  className = "",
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </Tag>
  );
}

/* ───────────────────────── Nav ───────────────────────── */
function Nav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };
  return (
    <header className={`nav ${solid ? "is-solid" : ""}`}>
      <div className="nav-inner">
        <a href="#top" className="brand" onClick={go("top")}>
          <span className="brand-mark">CHIANG&nbsp;MAI</span>
          <span className="brand-sub">Modern Thai · Mississauga</span>
        </a>
        <nav className="nav-links">
          <a href="#spaces" onClick={go("spaces")}>Spaces</a>
          <a href="#menus" onClick={go("menus")}>Menus</a>
          <a href="#story" onClick={go("story")}>The Venue</a>
          <a href="#inquire" onClick={go("inquire")} className="nav-cta">Inquire Now</a>
        </nav>
      </div>
    </header>
  );
}

/* ───────────────────────── Hero ───────────────────────── */
function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-img" style={{ backgroundImage: `url(/assets/bar-dining-room.jpg)` }} />
      <div className="hero-scrim" />
      <div className="hero-grain" />
      <div className="hero-content">
        <div className="hero-eyebrow reveal is-in">
          <Flourish />
          <span>Private Dining &amp; Group Events</span>
        </div>
        <h1 className="hero-title">
          <span className="line line-1">Gather beneath</span>
          <span className="line line-2"><em>the canopy.</em></span>
        </h1>
        <p className="hero-sub line line-3">
          Celebrate your most memorable moments inside our modern Thai dining room —
          murals, candlelight and a kitchen built for a crowd.
        </p>
        <div className="hero-actions line line-4">
          <a href="#inquire" className="btn-gold" onClick={(e) => { e.preventDefault(); scrollToId("inquire"); }}>
            Inquire Now <Icon name="ArrowRight" size={18} />
          </a>
          <a href="#spaces" className="btn-outline" onClick={(e) => { e.preventDefault(); scrollToId("spaces"); }}>
            Explore the Spaces
          </a>
        </div>
      </div>
      <div className="hero-foot line line-5">
        <div className="hero-foot-item"><Icon name="Users" size={16} /> 2 – 180 guests</div>
        <div className="hero-foot-item"><Icon name="MapPin" size={16} /> Heartland, Mississauga</div>
        <div className="hero-foot-item"><Icon name="Sparkles" size={16} /> Fully customizable menus</div>
      </div>
    </section>
  );
}

/* ───────────────────── Story ───────────────────── */
function Story() {
  return (
    <section className="story" id="story">
      <div className="story-grid">
        <Reveal className="story-media">
          <div className="story-photo" style={{ backgroundImage: `url(/assets/mural-booths.jpg)` }} />
          <div className="story-badge">
            <span className="badge-num">12</span>
            <span className="badge-txt">years hosting<br />celebrations</span>
          </div>
        </Reveal>
        <Reveal className="story-copy" delay={120}>
          <div className="kicker"><Flourish /><span>Why Chiang Mai</span></div>
          <h2 className="h2">A room that does the celebrating for you.</h2>
          <p className="lead">
            From corporate milestones to birthdays and weddings, our team builds the
            evening around you — flexible floor plans, customizable menus and a space
            that feels designed for the occasion before a single guest arrives.
          </p>
          <ul className="story-list">
            <li><Icon name="ChefHat" size={18} /> Menus tailored with our executive chef</li>
            <li><Icon name="Speaker" size={18} /> In-house AV, music &amp; microphone</li>
            <li><Icon name="CalendarHeart" size={18} /> A dedicated event planner, end to end</li>
            <li><Icon name="GlassWater" size={18} /> Bespoke cocktail &amp; wine pairings</li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────── Spaces ───────────────────── */
function Spaces() {
  return (
    <section className="spaces" id="spaces">
      <div className="section-head">
        <div className="kicker center"><Flourish /><span>Our Event Spaces</span></div>
        <h2 className="h2 center">Four rooms, one unforgettable address.</h2>
        <p className="section-intro">
          Each space carries its own mood — choose the one that matches your moment,
          or take the room entirely.
        </p>
      </div>
      <div className="space-grid is-three">
        {SPACES.map((s, i) => (
          <Reveal as="article" className="space-card" key={s.name} delay={i * 90}>
            <div className="space-img" style={{ backgroundImage: `url(${s.img})` }}>
              <span className="space-tag">{s.tag}</span>
            </div>
            <div className="space-body">
              <h3 className="space-name">{s.name}</h3>
              <div className="space-cap">
                <span><Icon name="Armchair" size={15} /> Seated {s.seated}</span>
                <span className="cap-sep" />
                <span><Icon name="Users" size={15} /> Reception {s.reception}</span>
              </div>
              <p className="space-desc">{s.desc}</p>
              <button type="button" className="link-arrow" onClick={() => scrollToId("inquire")}>
                View details <Icon name="ArrowRight" size={15} />
              </button>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── Menus ───────────────────── */
function Menus() {
  return (
    <section className="menus" id="menus">
      <div className="menus-inner">
        <div className="section-head left">
          <div className="kicker"><Flourish /><span>Set Menus &amp; Packages</span></div>
          <h2 className="h2">Dining styles built for sharing.</h2>
          <p className="section-intro">
            Every package is a starting point. We&apos;ll shape courses, dietary needs and
            pacing around your group with our chef.
          </p>
        </div>
        <div className="menu-grid">
          {MENUS.map((m, i) => (
            <Reveal as="article" className="menu-card" key={m.name} delay={i * 90}>
              <div className="menu-icon"><Icon name={m.icon} size={22} /></div>
              <div className="menu-top">
                <h3 className="menu-name">{m.name}</h3>
                <span className="menu-price">{m.price}</span>
              </div>
              <p className="menu-desc">{m.desc}</p>
              <ul className="menu-items">
                {m.items.map((it) => (
                  <li key={it}><Icon name="Check" size={14} /> {it}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <Reveal className="menu-download">
          <div>
            <h4>Take the full picture with you.</h4>
            <p>Floor plans, sample menus, capacities and pricing in one place.</p>
          </div>
          <a href="#" className="btn-outline" onClick={(e) => e.preventDefault()}>
            <Icon name="Download" size={17} /> Download Event Package (PDF)
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────── Inquire ───────────────────── */
function Inquire() {
  return (
    <section className="inquire" id="inquire">
      <div className="inquire-grid">
        <div className="inquire-aside">
          <div className="kicker"><Flourish /><span>Begin Your Inquiry</span></div>
          <h2 className="h2">Let&apos;s plan something<br />worth remembering.</h2>
          <p className="lead">
            Share a few details and our events team will be in touch within one
            business day to start designing your evening.
          </p>
          <ul className="contact-list">
            <li><span className="ci"><Icon name="Mail" size={16} /></span><a href="mailto:events@chiangmai.ca">events@chiangmai.ca</a></li>
            <li><span className="ci"><Icon name="Phone" size={16} /></span><a href="tel:+19055550182">(905) 555-0182</a></li>
            <li><span className="ci"><Icon name="MapPin" size={16} /></span>5985 Rodeo Drive, Mississauga, ON</li>
            <li><span className="ci"><Icon name="Clock" size={16} /></span>Events team · Mon–Fri, 10–6</li>
          </ul>
        </div>
        <div className="form-shell">
          <BookingForm spaces={SPACES.map((s) => ({ name: s.name }))} />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Footer ───────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark big">CHIANG&nbsp;MAI</span>
          <p>Modern Thai dining in the heart of Mississauga. Open for dinner nightly, and yours for the evening when the occasion calls.</p>
          <div className="footer-social">
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Instagram"><InstagramGlyph /></a>
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Facebook"><FacebookGlyph /></a>
          </div>
        </div>
        <div className="footer-col">
          <h5>Events</h5>
          <a href="mailto:events@chiangmai.ca">events@chiangmai.ca</a>
          <a href="tel:+19055550182">(905) 555-0182</a>
        </div>
        <div className="footer-col">
          <h5>Visit</h5>
          <span>5985 Rodeo Drive</span>
          <span>Mississauga, ON</span>
        </div>
        <div className="footer-col">
          <h5>Hours</h5>
          <span>Dinner · 5pm–late, nightly</span>
          <span>Events · Mon–Fri, 10–6</span>
        </div>
      </div>
      <div className="footer-base">
        <span>© 2026 Chiang Mai Restaurant. All rights reserved.</span>
        <span className="footer-base-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Accessibility</a>
        </span>
      </div>
    </footer>
  );
}

/* ───────────────────── Page ───────────────────── */
export function EventsLanding() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Story />
        <Spaces />
        <Menus />
        <Inquire />
      </main>
      <Footer />
    </>
  );
}
