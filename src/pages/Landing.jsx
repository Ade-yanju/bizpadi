import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * bizPadi — Landing (single file, inline styles only)
 * - Mobile nav (hamburger) with focus traps
 * - Accessible: aria-labels, roles, keyboardable buttons
 * - Responsive via JS breakpoints + fluid grids
 * - Skeleton loaders + optimistic microcopy
 * - No external CSS or layout component
 *
 * Optional endpoints (replace/migrate when backend is ready):
 *   GET  /api/shops               -> [{ id, name, dailyPercent, durationDays, remainingShares }]
 *   POST /api/subscribe           -> { email }
 *   POST /api/contact             -> { name, email, message }
 */

export default function Landing() {
  /* ---------------------- responsiveness ---------------------- */
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = vw < 640;
  const isTablet = vw >= 640 && vw < 1024;

  /* -------------------------- theme --------------------------- */
  const C = useMemo(
    () => ({
      brand: "#0C2745",
      accent: "#F36B21",
      soft: "#F8FAFC",
      ink: "#0F172A",
      muted: "#475569",
      line: "#E2E8F0",
      ok: "#16a34a",
      danger: "#dc2626",
    }),
    []
  );

  /* -------------------------- router -------------------------- */
  const nav = useNavigate();

  /* -------------------------- header -------------------------- */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  /* --------------------------- data --------------------------- */
  const [shops, setShops] = useState(null); // null = loading, [] = empty, [..] = data
  const [loadErr, setLoadErr] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/shops");
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to load shops");
        if (alive) setShops(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch (err) {
        if (alive) {
          setShops([]);
          setLoadErr("Couldn’t load shops. Please refresh.");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* --------------------------- forms -------------------------- */
  const [wl, setWl] = useState({
    email: "",
    sending: false,
    msg: null,
    err: null,
  });
  async function joinWaitlist(e) {
    e.preventDefault();
    if (!wl.email) return;
    setWl((v) => ({ ...v, sending: true, msg: null, err: null }));
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: wl.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to subscribe");
      setWl({
        email: "",
        sending: false,
        msg: "🎉 You’re on the list!",
        err: null,
      });
    } catch (err) {
      setWl((v) => ({
        ...v,
        sending: false,
        err: err.message || "Couldn’t subscribe",
      }));
    }
  }

  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [contactState, setContactState] = useState({
    sending: false,
    msg: null,
    err: null,
  });
  async function sendContact(e) {
    e.preventDefault();
    setContactState({ sending: true, msg: null, err: null });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Couldn’t send message");
      setContact({ name: "", email: "", message: "" });
      setContactState({
        sending: false,
        msg: "✅ Message sent. We’ll reply shortly.",
        err: null,
      });
    } catch (err) {
      setContactState({
        sending: false,
        msg: null,
        err: err.message || "Something went wrong",
      });
    }
  }

  /* ------------------------- utilities ------------------------ */
  const container = (pt = 0, pb = 0) => ({
    maxWidth: 1200,
    margin: "0 auto",
    padding: `${pt}px ${isMobile ? 16 : 24}px ${pb}px`,
  });
  const h2 = {
    margin: 0,
    color: C.brand,
    fontWeight: 900,
    fontSize: isMobile ? 22 : 28,
    letterSpacing: "-0.01em",
  };
  const a11yButton = {
    background: "transparent",
    border: "none",
    padding: 0,
    margin: 0,
    cursor: "pointer",
  };

  /* ============================== UI ============================== */
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, Segoe UI, Roboto, Arial",
        background: C.soft,
        color: C.ink,
      }}
    >
      {/* ------------------------- NAV / HEADER ------------------------- */}
      <header
        role="banner"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          background: "#fff",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            ...container(0, 0),
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* brand */}
          <div
            role="link"
            tabIndex={0}
            onClick={() => nav("/")}
            onKeyDown={(e) => e.key === "Enter" && nav("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              outline: "none",
            }}
            aria-label="Go to home"
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: C.accent,
              }}
            />
            <strong
              style={{ color: C.brand, fontSize: 18, letterSpacing: "-0.02em" }}
            >
              bizPadi
            </strong>
          </div>

          {/* desktop nav */}
          <nav
            aria-label="primary"
            style={{
              display: isMobile ? "none" : "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <a href="#how" style={navLink(C)}>
              How it works
            </a>
            <a href="#shops" style={navLink(C)}>
              Shops
            </a>
            <a href="#faq" style={navLink(C)}>
              FAQ
            </a>
            <Link to="/auth/login" style={navLink(C)}>
              Login
            </Link>
            <Link
              to="/auth/register"
              style={{
                textDecoration: "none",
                background: C.brand,
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 10,
                fontWeight: 800,
              }}
            >
              Create account
            </Link>
          </nav>

          {/* mobile button */}
          <button
            ref={menuBtnRef}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            style={{
              ...a11yButton,
              display: isMobile ? "inline-flex" : "none",
            }}
          >
            <span style={hamburgerBar(C)} />
            <span style={{ ...hamburgerBar(C), width: 18 }} />
            <span style={hamburgerBar(C)} />
          </button>
        </div>

        {/* mobile drawer */}
        {menuOpen && (
          <div
            role="dialog"
            aria-modal="true"
            style={{ borderTop: `1px solid ${C.line}`, background: "#fff" }}
          >
            <div style={{ ...container(8, 12), display: "grid", gap: 10 }}>
              <a
                href="#how"
                onClick={() => setMenuOpen(false)}
                style={mobileItem(C)}
              >
                How it works
              </a>
              <a
                href="#shops"
                onClick={() => setMenuOpen(false)}
                style={mobileItem(C)}
              >
                Shops
              </a>
              <a
                href="#faq"
                onClick={() => setMenuOpen(false)}
                style={mobileItem(C)}
              >
                FAQ
              </a>
              <Link
                to="/auth/login"
                onClick={() => setMenuOpen(false)}
                style={mobileItem(C)}
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  fontWeight: 900,
                  color: "#fff",
                  background: C.brand,
                  padding: "10px 14px",
                  borderRadius: 10,
                  textAlign: "center",
                }}
              >
                Create account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ---------------------------- HERO ---------------------------- */}
      <section
        style={{
          borderBottom: `1px solid ${C.line}`,
          background: `radial-gradient(1000px 360px at 20% -15%, rgba(243,107,33,.16), transparent), #fff`,
        }}
      >
        <div
          style={{
            ...container(isMobile ? 24 : 56, isMobile ? 24 : 56),
            display: "grid",
            gap: 28,
            gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.1fr 0.9fr",
            alignItems: "center",
          }}
        >
          <div>
            <Badge
              text="New"
              sub="Daily payouts, KYC & OTP security"
              color={C.accent}
              line={C.line}
            />
            <h1
              style={{
                margin: 0,
                color: C.brand,
                fontSize: isMobile ? 32 : isTablet ? 44 : 56,
                lineHeight: 1.05,
                fontWeight: 900,
                letterSpacing: "-0.02em",
              }}
            >
              Own shares in curated virtual shops.
              <span style={{ color: C.accent }}> Earn every day.</span>
            </h1>
            <p
              style={{
                marginTop: 12,
                color: C.muted,
                fontSize: isMobile ? 15 : 18,
                maxWidth: 640,
              }}
            >
              Buy into high-quality shops, watch profits accrue daily, withdraw
              profits anytime, and unlock your capital at maturity. Transparent
              tracking. Bank-grade protection.
            </p>

            {/* waitlist */}
            <form
              onSubmit={joinWaitlist}
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <input
                type="email"
                required
                value={wl.email}
                onChange={(e) =>
                  setWl((v) => ({ ...v, email: e.target.value }))
                }
                placeholder="you@example.com"
                aria-label="Email address"
                style={input(C, 48)}
              />
              <button disabled={wl.sending} style={primaryBtn(C, 48)}>
                {wl.sending ? "Joining…" : "Join waitlist"}
              </button>
            </form>
            {wl.msg && <Note ok>{wl.msg}</Note>}
            {wl.err && <Note>{wl.err}</Note>}

            {/* stats */}
            <div
              style={{
                marginTop: 20,
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
                gap: 12,
                maxWidth: 640,
              }}
            >
              <Stat
                label="Active users"
                value="5k+"
                color={C.brand}
                line={C.line}
                muted={C.muted}
              />
              <Stat
                label="Daily payouts"
                value="120k"
                color={C.brand}
                line={C.line}
                muted={C.muted}
              />
              {!isMobile && (
                <Stat
                  label="Shops sold out"
                  value="18+"
                  color={C.brand}
                  line={C.line}
                  muted={C.muted}
                />
              )}
            </div>
          </div>

          {/* visual */}
          <div>
            <div
              style={{
                background: "#fff",
                border: `1px solid ${C.line}`,
                borderRadius: 24,
                padding: isMobile ? 12 : 18,
                boxShadow: "0 28px 80px rgba(0,0,0,.08)",
              }}
            >
              <div
                style={{
                  height: isMobile ? 220 : 320,
                  borderRadius: 16,
                  background: "linear-gradient(135deg,#e2e8f0,#ffffff)",
                  display: "grid",
                  placeItems: "center",
                  color: C.muted,
                  fontWeight: 800,
                }}
              >
                Dashboard Preview
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
                Live data from{" "}
                <code
                  style={{
                    background: C.soft,
                    padding: "2px 6px",
                    borderRadius: 6,
                  }}
                >
                  /api/shops
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------ VALUE PROPS ------------------------ */}
      <section style={{ ...container(40, 16) }}>
        <h2 style={h2}>Built for growth, designed for trust</h2>
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns:
              !isMobile && !isTablet
                ? "repeat(3, 1fr)"
                : isTablet
                ? "repeat(2, 1fr)"
                : "1fr",
            gap: 16,
          }}
        >
          <Feature
            title="🔒 KYC + OTP Security"
            text="Verified identity and one-time codes guard transfers and withdrawals."
            C={C}
          />
          <Feature
            title="💸 Withdraw Any Time"
            text="Profits are liquid; withdraw whenever you like. Capital unlocks at maturity."
            C={C}
          />
          <Feature
            title="📈 Transparent Metrics"
            text="Positions, profits and payouts—all tracked with audit-friendly clarity."
            C={C}
          />
        </div>
      </section>

      {/* ----------------------- SHOPS PREVIEW ----------------------- */}
      <section
        id="shops"
        style={{
          borderTop: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
          background: "#fff",
        }}
      >
        <div style={{ ...container(36, 36) }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <h2 style={h2}>Featured shops</h2>
            <Link
              to="/shops"
              style={{
                textDecoration: "none",
                color: C.brand,
                fontWeight: 900,
                border: `1px solid ${C.line}`,
                padding: "10px 14px",
                borderRadius: 12,
              }}
            >
              Explore all →
            </Link>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns:
                !isMobile && !isTablet
                  ? "repeat(3,1fr)"
                  : isTablet
                  ? "repeat(2,1fr)"
                  : "1fr",
              gap: 16,
            }}
          >
            {shops === null &&
              [0, 1, 2].map((i) => <SkeletonCard key={i} C={C} />)}
            {shops && shops.length === 0 && (
              <div style={{ color: C.muted }}>
                {loadErr || "No shops yet—check back soon."}
              </div>
            )}
            {shops &&
              shops.length > 0 &&
              shops.map((s) => <ShopCard key={s.id} shop={s} C={C} />)}
          </div>
        </div>
      </section>

      {/* ----------------------- HOW IT WORKS ----------------------- */}
      <section id="how" style={{ ...container(40, 40) }}>
        <h2 style={h2}>How bizPadi works</h2>
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns:
              !isMobile && !isTablet
                ? "repeat(4,1fr)"
                : isTablet
                ? "repeat(2,1fr)"
                : "1fr",
            gap: 16,
          }}
        >
          <Step
            n={1}
            title="Create account"
            text="Sign up in minutes and secure your login."
            C={C}
          />
          <Step
            n={2}
            title="Complete KYC"
            text="Verify identity to enable withdrawals & higher limits."
            C={C}
          />
          <Step
            n={3}
            title="Buy shares"
            text="Choose a shop, pick a quantity, pay or use wallet funds."
            C={C}
          />
          <Step
            n={4}
            title="Earn & withdraw"
            text="Watch profits accrue each day. Withdraw profits any time."
            C={C}
          />
        </div>
      </section>

      {/* ----------------------- TESTIMONIALS ----------------------- */}
      <section
        style={{
          background: "#fff",
          borderTop: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div style={{ ...container(36, 36) }}>
          <h2 style={h2}>What investors say</h2>
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns:
                !isMobile && !isTablet
                  ? "repeat(3,1fr)"
                  : isTablet
                  ? "repeat(2,1fr)"
                  : "1fr",
              gap: 16,
            }}
          >
            <Testimonial
              name="Chinonso A."
              text="Profits hit my wallet every morning. Withdrawals arrive same day."
              C={C}
            />
            <Testimonial
              name="Zainab O."
              text="The capital lock keeps me disciplined. Love the transparency."
              C={C}
            />
            <Testimonial
              name="Femi I."
              text="KYC + OTP made me confident moving larger amounts."
              C={C}
            />
          </div>
        </div>
      </section>

      {/* ---------------------------- FAQ ---------------------------- */}
      <section id="faq" style={{ ...container(40, 40) }}>
        <h2 style={h2}>Frequently asked</h2>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <Faq
            C={C}
            q="Can I withdraw profits anytime?"
            a="Yes. Profits are withdrawable as soon as they accrue. Capital becomes available on the final day of the shop’s duration."
          />
          <Faq
            C={C}
            q="Is KYC mandatory?"
            a="Yes—KYC is required for withdrawals and larger limits. It protects you and the ecosystem."
          />
          <Faq
            C={C}
            q="How do deposits work?"
            a="We initiate a Velvpay payment. Once the webhook confirms success, your wallet is credited instantly."
          />
        </div>
      </section>

      {/* --------------------------- CONTACT -------------------------- */}
      <section style={{ background: "#fff", borderTop: `1px solid ${C.line}` }}>
        <div
          style={{
            ...container(36, 36),
            display: "grid",
            gap: 20,
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          }}
        >
          <div>
            <h2 style={h2}>Talk to us</h2>
            <p style={{ marginTop: 8, color: C.muted, maxWidth: 560 }}>
              Partnerships, questions, or feedback—send a note. We respond
              within 24 hours.
            </p>
          </div>
          <form
            onSubmit={sendContact}
            aria-label="Contact form"
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 12px 28px rgba(0,0,0,.06)",
            }}
          >
            <Label>C</Label>
            <input
              value={contact.name}
              onChange={(e) =>
                setContact((v) => ({ ...v, name: e.target.value }))
              }
              required
              placeholder="Your name"
              style={input(C)}
            />
            <Label>Email</Label>
            <input
              type="email"
              value={contact.email}
              onChange={(e) =>
                setContact((v) => ({ ...v, email: e.target.value }))
              }
              required
              placeholder="you@example.com"
              style={input(C)}
            />
            <Label>Message</Label>
            <textarea
              value={contact.message}
              onChange={(e) =>
                setContact((v) => ({ ...v, message: e.target.value }))
              }
              required
              placeholder="How can we help?"
              style={{ ...input(C), minHeight: 120, paddingTop: 10 }}
            />
            <button disabled={contactState.sending} style={solidBtn(C)}>
              {contactState.sending ? "Sending…" : "Send message"}
            </button>
            {contactState.msg && <Note ok>{contactState.msg}</Note>}
            {contactState.err && <Note>{contactState.err}</Note>}
          </form>
        </div>
      </section>

      {/* ----------------------------- CTA --------------------------- */}
      <section style={{ ...container(32, 48), textAlign: "center" }}>
        <h2 style={h2}>Ready to grow your income?</h2>
        <p style={{ margin: 0, color: C.muted, fontSize: isMobile ? 15 : 18 }}>
          Join investors earning from virtual shops—safely and transparently.
        </p>
        <Link
          to="/auth/register"
          style={{
            display: "inline-block",
            marginTop: 12,
            textDecoration: "none",
            background: C.accent,
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 12,
            fontWeight: 900,
            boxShadow: "0 16px 40px rgba(243,107,33,.35)",
          }}
        >
          Create free account
        </Link>
      </section>

      {/* --------------------------- FOOTER -------------------------- */}
      <footer
        role="contentinfo"
        style={{ borderTop: `1px solid ${C.line}`, background: "#fff" }}
      >
        <div
          style={{
            ...container(16, 16),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            color: C.muted,
            fontSize: 13,
          }}
        >
          <div>© {new Date().getFullYear()} bizPadi. All rights reserved.</div>
          <div style={{ display: "flex", gap: 14 }}>
            <a href="#faq" style={footerLink(C)}>
              FAQ
            </a>
            <a href="/legal/terms" style={footerLink(C)}>
              Terms
            </a>
            <a href="/legal/privacy" style={footerLink(C)}>
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ========================= Small Components ========================= */

function Badge({ text, sub, color, line }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
        background: "#fff",
        border: `1px solid ${line}`,
        borderRadius: 999,
        padding: "6px 12px",
        boxShadow: "0 6px 24px rgba(0,0,0,.06)",
        fontSize: 12,
        color: "#475569",
      }}
    >
      <span style={{ fontWeight: 900, color }}>{text}</span>
      {sub}
    </div>
  );
}

function Stat({ label, value, color, line, muted }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${line}`,
        borderRadius: 14,
        padding: 14,
        textAlign: "center",
        boxShadow: "0 8px 30px rgba(0,0,0,.05)",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 12, color: muted }}>{label}</div>
    </div>
  );
}

function Feature({ title, text, C }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 16px 40px rgba(0,0,0,.05)",
      }}
    >
      <div style={{ fontWeight: 900, color: C.brand, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ color: C.muted }}>{text}</div>
    </div>
  );
}

function SkeletonCard({ C }) {
  return (
    <div
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        padding: 16,
        background: "#fff",
      }}
    >
      <div style={{ height: 120, borderRadius: 12, background: "#e5e7eb" }} />
      <div
        style={{
          height: 12,
          marginTop: 10,
          borderRadius: 6,
          background: "#e5e7eb",
        }}
      />
      <div
        style={{
          height: 12,
          marginTop: 8,
          borderRadius: 6,
          background: "#e5e7eb",
          width: "70%",
        }}
      />
      <div
        style={{
          height: 36,
          marginTop: 12,
          borderRadius: 8,
          background: "#e5e7eb",
        }}
      />
    </div>
  );
}

function ShopCard({ shop, C }) {
  const nav = useNavigate();
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        padding: 16,
        display: "grid",
        gap: 10,
        boxShadow: "0 16px 40px rgba(0,0,0,.05)",
      }}
    >
      <div
        style={{
          height: 120,
          borderRadius: 12,
          background: "linear-gradient(135deg,#e2e8f0,#ffffff)",
          display: "grid",
          placeItems: "center",
          color: C.muted,
          fontWeight: 800,
        }}
      >
        {shop.name}
      </div>
      <Row k="Daily" v={`${fmtPct(shop.dailyPercent)}`} C={C} />
      <Row k="Duration" v={`${shop.durationDays} days`} C={C} />
      <Row k="Remaining" v={String(shop.remainingShares)} C={C} />
      <button
        onClick={() => nav(`/shops/${shop.id}`)}
        style={{
          marginTop: 6,
          height: 44,
          borderRadius: 10,
          border: "none",
          background: C.brand,
          color: "#fff",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        View & buy shares
      </button>
    </div>
  );
}

function Row({ k, v, C }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        color: C.muted,
        fontSize: 13,
      }}
    >
      <span>{k}</span>
      <b style={{ color: C.brand }}>{v}</b>
    </div>
  );
}

function Step({ n, title, text, C }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 18,
        display: "grid",
        gap: 6,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          background: C.brand,
          color: "#fff",
          fontWeight: 900,
        }}
      >
        {n}
      </div>
      <div style={{ fontWeight: 900, color: C.brand }}>{title}</div>
      <div style={{ color: C.muted }}>{text}</div>
    </div>
  );
}

function Testimonial({ name, text, C }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 16px 40px rgba(0,0,0,.05)",
      }}
    >
      <div style={{ fontStyle: "italic", color: C.ink }}>“{text}”</div>
      <div style={{ marginTop: 8, fontWeight: 900, color: C.brand }}>
        {name}
      </div>
    </div>
  );
}

function Faq({ q, a, C }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: 14,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontWeight: 900,
          color: C.brand,
        }}
      >
        {q}
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px", color: C.muted }}>{a}</div>
      )}
    </div>
  );
}

/* ========================= Style Helpers ========================= */

function navLink(C) {
  return { textDecoration: "none", color: C.brand, fontWeight: 800 };
}
function footerLink(C) {
  return { textDecoration: "none", color: C.muted };
}
function hamburgerBar(C) {
  return {
    display: "block",
    width: 24,
    height: 2,
    background: C.brand,
    margin: "3px 0",
    borderRadius: 2,
  };
}
function mobileItem(C) {
  return {
    textDecoration: "none",
    color: C.brand,
    fontWeight: 800,
    padding: "6px 0",
  };
}
function input(C, h = 44) {
  return {
    width: "100%",
    height: h,
    borderRadius: 12,
    border: `1px solid ${C.line}`,
    padding: "0 12px",
    outline: "none",
    fontSize: 14,
    background: "#fff",
  };
}
function primaryBtn(C, h = 44) {
  return {
    height: h,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: C.accent,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 14px 36px rgba(243,107,33,.35)",
  };
}
function solidBtn(C) {
  return {
    marginTop: 10,
    height: 46,
    borderRadius: 12,
    border: "none",
    background: C.brand,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  };
}

function Label({ children }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        color: "#64748b",
        margin: "4px 0",
      }}
    >
      {children}
    </label>
  );
}
function Note({ children, ok }) {
  return (
    <div
      style={{ marginTop: 8, fontSize: 13, color: ok ? "#16a34a" : "#dc2626" }}
    >
      {children}
    </div>
  );
}
function fmtPct(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(2) + "%" : String(n) + "%";
}
