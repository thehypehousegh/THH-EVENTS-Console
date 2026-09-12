"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useOrg } from "@/lib/OrgProvider";
import { Blueprint, Btn, FieldLabel, Input } from "@/components/ui";

export default function OrgLanding() {
  const { org, loading, notFound } = useOrg();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <p className="text-muted" style={{ fontSize: 13 }}>Loading…</p>
      </div>
    );
  }
  if (notFound || !org) {
    return (
      <div style={{ maxWidth: 520, margin: "80px auto", padding: 20, textAlign: "center" }}>
        <h3>Organization not found</h3>
        <p className="text-muted" style={{ fontSize: 13 }}>
          There&apos;s no event house at this address, or it hasn&apos;t been approved yet.
        </p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 14, display: "inline-flex" }}>
          Back to THH Events Console
        </Link>
      </div>
    );
  }
  if (org.status !== "approved") {
    return (
      <div style={{ maxWidth: 520, margin: "80px auto", padding: 20, textAlign: "center" }}>
        <h3>{org.name}</h3>
        <p className="text-muted" style={{ fontSize: 13 }}>
          This organization&apos;s page isn&apos;t public yet — its registration is still {org.status}.
        </p>
      </div>
    );
  }

  return <OrgLandingBody />;
}

type LandingTheme = "corporate" | "industry" | "dark";
const LANDING_THEMES: { id: LandingTheme; label: string }[] = [
  { id: "corporate", label: "Corporate" },
  { id: "industry", label: "Industry" },
  { id: "dark", label: "Dark" },
];
const LANDING_THEME_KEY = "hh-landing-theme";

function useLandingTheme() {
  const [theme, setThemeState] = useState<LandingTheme>("corporate");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANDING_THEME_KEY) as LandingTheme | null;
      if (saved && LANDING_THEMES.some((t) => t.id === saved)) setThemeState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function setTheme(t: LandingTheme) {
    setThemeState(t);
    try {
      localStorage.setItem(LANDING_THEME_KEY, t);
    } catch {
      /* ignore */
    }
  }

  return { theme, setTheme };
}

function OrgLandingBody() {
  const { org, slug } = useOrg();
  const { theme, setTheme } = useLandingTheme();
  if (!org) return null;
  const sinceYear = new Date(org.createdAt).getFullYear();
  const industry = theme === "industry";

  const nav = [
    { label: "Admin", href: `/${slug}/admin/` },
    { label: "Coordination", href: `/${slug}/coordinator/` },
    { label: "Events", href: `/${slug}/events/` },
  ];

  const presenceStats = [
    org.location ? { value: org.location, label: "Based in" } : null,
    { value: String(sinceYear), label: "Coordinating since" },
    { value: "Live", label: "Run sheet & checklists" },
  ].filter((s): s is { value: string; label: string } => s !== null);

  return (
    <div data-landing-theme={theme} style={{ minWidth: 0 }}>
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "13px clamp(16px,4vw,40px)",
          background: "color-mix(in srgb, var(--color-bg) 88%, transparent)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        {org.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logoUrl} alt={org.name} width={36} height={36} style={{ objectFit: "contain", flex: "none" }} />
        ) : (
          <span
            style={{
              width: 36,
              height: 36,
              flex: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-heading)",
              fontSize: 16,
              background: "var(--color-accent-700)",
              color: "var(--hh-paper)",
            }}
          >
            {org.name.slice(0, 1)}
          </span>
        )}
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: ".02em" }}>{org.name}</span>
        <nav style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {nav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 12.5,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                padding: "9px 14px",
                minHeight: 38,
                display: "inline-flex",
                alignItems: "center",
                color: "var(--color-text)",
                textDecoration: "none",
                borderRadius: "var(--radius-md)",
              }}
              className="org-nav-link"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "clamp(56px,11vw,120px) clamp(16px,4vw,40px) clamp(48px,8vw,88px)",
          background: industry
            ? "var(--color-bg)"
            : "radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 55%), radial-gradient(circle at 82% 0%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 50%), var(--color-bg)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          {industry ? (
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 12,
                  letterSpacing: ".2em",
                  textTransform: "uppercase",
                  color: "var(--color-accent-700)",
                }}
              >
                Event coordination, run live
              </span>
              <span style={{ width: 40, height: 3, background: "var(--color-accent)", marginTop: 9 }} />
            </div>
          ) : (
            <span
              style={{
                display: "inline-block",
                fontFamily: "var(--font-heading)",
                fontSize: 11,
                letterSpacing: ".24em",
                textTransform: "uppercase",
                color: "var(--color-accent-700)",
                padding: "6px 14px",
                border: "1px solid var(--color-accent-300)",
                borderRadius: 999,
                marginBottom: 20,
              }}
            >
              Event coordination, run live
            </span>
          )}
          <h1 style={{ fontSize: "clamp(34px,7vw,64px)", lineHeight: 1.03, margin: "0 0 16px" }}>{org.name}</h1>
          <p style={{ fontSize: "clamp(15px,2.4vw,19px)", color: "color-mix(in srgb, var(--color-text) 68%, transparent)", maxWidth: 620, margin: "0 auto 30px" }}>
            {org.slogan || "Every run sheet, checklist and escalation, coordinated from one live console."}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/${slug}/signin/`} className="btn btn-primary" style={{ minHeight: 50, fontSize: 15, padding: "0 26px" }}>
              Team sign in
            </Link>
            <a href="#about" className="btn btn-secondary" style={{ minHeight: 50, fontSize: 15, padding: "0 26px" }}>
              Learn more
            </a>
          </div>
        </div>

      </section>

      {/* ── About ───────────────────────────────────────────── */}
      <section id="about" style={{ padding: "clamp(48px,8vw,88px) clamp(16px,4vw,40px)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow>About {org.name}</Eyebrow>
          <p style={{ fontSize: "clamp(17px,2.6vw,22px)", lineHeight: 1.5, margin: "12px 0 0" }}>
            {org.about || `${org.name} plans and runs events end to end — from the first run sheet to the last thank-you, coordinated live by a team that never loses the thread.`}
          </p>
        </div>
      </section>

      {/* ── Presence ────────────────────────────────────────── */}
      <section
        style={{
          padding: "clamp(32px,6vw,56px) clamp(16px,4vw,40px)",
          background: industry ? "var(--color-surface)" : "var(--color-accent-900)",
          color: industry ? "var(--color-text)" : "var(--hh-paper)",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            justifyContent: "center",
            gap: industry ? 0 : "clamp(28px,7vw,72px)",
            flexWrap: "wrap",
          }}
        >
          {presenceStats.map((s, i) => (
            <div
              key={s.label}
              style={
                industry
                  ? { padding: "0 clamp(20px,5vw,40px)", borderLeft: i > 0 ? "1px solid var(--color-divider)" : "none" }
                  : undefined
              }
            >
              <PresenceStat value={s.value} label={s.label} onDark={!industry} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────── */}
      {org.services.length > 0 && (
        <section style={{ padding: "clamp(40px,7vw,72px) clamp(16px,4vw,40px)", background: "var(--color-surface)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <Eyebrow center>Our services</Eyebrow>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,250px),1fr))",
                gap: industry ? "28px 32px" : 16,
                marginTop: 24,
              }}
            >
              {org.services.map((s, i) =>
                industry ? (
                  <div key={i} style={{ minWidth: 0, paddingBottom: 16, borderBottom: "1px solid var(--color-divider)" }}>
                    <span style={{ display: "block", fontFamily: "var(--font-heading)", fontSize: 32, color: "var(--color-accent)", marginBottom: 10 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h4 style={{ margin: "0 0 5px" }}>{s.title}</h4>
                    <p className="text-muted" style={{ fontSize: 13, margin: "0 0 10px" }}>{s.description}</p>
                    <a href="#contact" style={{ fontFamily: "var(--font-heading)", fontSize: 11.5, letterSpacing: ".05em" }}>Enquire →</a>
                  </div>
                ) : (
                  <Blueprint key={i} style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        width: 34,
                        height: 34,
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-heading)",
                        fontSize: 15,
                        background: "var(--color-accent-100)",
                        color: "var(--color-accent-800)",
                        marginBottom: 10,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h4 style={{ margin: "0 0 5px" }}>{s.title}</h4>
                    <p className="text-muted" style={{ fontSize: 13, margin: "0 0 10px" }}>{s.description}</p>
                    <a href="#contact" style={{ fontFamily: "var(--font-heading)", fontSize: 11.5, letterSpacing: ".05em" }}>Enquire →</a>
                  </Blueprint>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ────────────────────────────────────── */}
      {org.testimonials.length > 0 && (
        <section style={{ padding: "clamp(40px,7vw,72px) clamp(16px,4vw,40px)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <Eyebrow center>What clients say</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 16, marginTop: 24 }}>
              {org.testimonials.map((t, i) =>
                industry ? (
                  <div key={i} style={{ padding: "2px 0 2px 18px", borderLeft: "3px solid var(--color-accent)" }}>
                    <p style={{ fontSize: 16, lineHeight: 1.55, margin: "0 0 14px", fontStyle: "italic" }}>&ldquo;{t.quote}&rdquo;</p>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 14 }}>{t.name}</div>
                    <div className="text-muted" style={{ fontSize: 11.5 }}>{t.role}</div>
                  </div>
                ) : (
                  <div key={i} style={{ padding: 22, background: "var(--color-accent-900)", color: "var(--hh-paper)" }}>
                    <p style={{ fontSize: 15, lineHeight: 1.55, margin: "0 0 16px" }}>&ldquo;{t.quote}&rdquo;</p>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, opacity: 0.65 }}>{t.role}</div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Executed events gallery ─────────────────────────── */}
      {org.gallery.length > 0 && (
        <section style={{ padding: "clamp(40px,7vw,72px) clamp(16px,4vw,40px)", background: "var(--color-surface)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <Eyebrow center>Executed events</Eyebrow>
            <GallerySlideshow images={org.gallery} />
          </div>
        </section>
      )}

      {/* ── CTA banner (Industry theme only) ────────────────── */}
      {industry && (
        <section style={{ padding: "clamp(40px,7vw,72px) clamp(16px,4vw,40px)", background: "var(--color-accent-900)", color: "var(--hh-paper)", textAlign: "center" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", margin: "0 0 12px" }}>Ready to run your next event without the chaos?</h2>
            <p style={{ opacity: 0.75, margin: "0 0 22px", fontSize: 14.5 }}>
              Talk to {org.name} about your date, guest count and the moments that matter — a coordinator takes it from there.
            </p>
            <a href="#contact" className="btn btn-primary" style={{ minHeight: 48, fontSize: 15, padding: "0 26px", display: "inline-flex" }}>
              Start the conversation
            </a>
          </div>
        </section>
      )}

      {/* ── Contact / inquiry form ──────────────────────────── */}
      <section id="contact" style={{ padding: "clamp(48px,8vw,88px) clamp(16px,4vw,40px)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Eyebrow center>Get in touch</Eyebrow>
          <h2 style={{ textAlign: "center", margin: "10px 0 8px", fontSize: "clamp(24px,4vw,34px)" }}>Have an event in mind? Let&apos;s connect</h2>
          <p className="text-muted" style={{ textAlign: "center", fontSize: 14, margin: "0 0 28px" }}>
            Tell {org.name} a little about what you&apos;re planning — a coordinator will get back to you directly.
          </p>
          <ContactForm orgId={org.id} />
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ padding: "clamp(36px,6vw,56px) clamp(16px,4vw,40px) 26px", background: "var(--color-accent-900)", color: "var(--hh-paper)" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))",
            gap: 28,
          }}
        >
          <div>
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt={org.name} width={32} height={32} style={{ objectFit: "contain", marginBottom: 10, filter: "invert(1)" }} />
            ) : null}
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, marginBottom: 6 }}>{org.name}</div>
            <p style={{ fontSize: 12, opacity: 0.65, margin: 0 }}>{org.slogan}</p>
          </div>
          <FooterCol title="Contact">
            {org.address && <div>{org.address}</div>}
            {org.contactPhone && <div>{org.contactPhone}</div>}
            {org.contactEmail && <div>{org.contactEmail}</div>}
            {!org.address && !org.contactPhone && !org.contactEmail && <div style={{ opacity: 0.5 }}>Not published yet</div>}
          </FooterCol>
          <FooterCol title="Social">
            {[
              ["Facebook", org.social.facebook],
              ["Instagram", org.social.instagram],
              ["TikTok", org.social.tiktok],
              ["Twitter / X", org.social.twitter],
            ]
              .filter(([, v]) => v)
              .map(([label, v]) => (
                <a key={label} href={v} target="_blank" rel="noreferrer" style={{ color: "var(--hh-paper)", opacity: 0.75, display: "block" }}>
                  {label}
                </a>
              ))}
            {Object.values(org.social).every((v) => !v) && <div style={{ opacity: 0.5 }}>Not published yet</div>}
          </FooterCol>
          {org.quickLinks.length > 0 && (
            <FooterCol title="Quick links">
              {org.quickLinks.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ color: "var(--hh-paper)", opacity: 0.75, display: "block" }}>
                  {l.label}
                </a>
              ))}
            </FooterCol>
          )}
        </div>
        <div
          style={{
            maxWidth: 1180,
            margin: "30px auto 0",
            paddingTop: 16,
            borderTop: "1px solid var(--hh-paper-20)",
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 11, opacity: 0.5 }}>
            © {new Date().getFullYear()} {org.name}. Run on the THH Events Console.
          </span>
          <ThemePicker theme={theme} setTheme={setTheme} />
        </div>
      </footer>

      <style jsx global>{`
        .org-nav-link:hover {
          background: color-mix(in srgb, var(--color-text) 7%, transparent);
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}

function PresenceStat({ value, label, onDark = true }: { value: string; label: string; onDark?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, lineHeight: 1, color: onDark ? undefined : "var(--color-text)" }}>{value}</div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          marginTop: 6,
          opacity: onDark ? 0.6 : 0.7,
          color: onDark ? undefined : "var(--color-accent-700)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ThemePicker({ theme, setTheme }: { theme: LandingTheme; setTheme: (t: LandingTheme) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.5 }}>Theme</span>
      {LANDING_THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          aria-pressed={theme === t.id}
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 11,
            letterSpacing: ".04em",
            padding: "5px 12px",
            border: "1px solid var(--hh-paper-30)",
            borderRadius: 999,
            cursor: "pointer",
            background: theme === t.id ? "var(--hh-paper)" : "transparent",
            color: theme === t.id ? "var(--color-accent-900)" : "var(--hh-paper)",
            opacity: theme === t.id ? 1 : 0.75,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div style={{ textAlign: center ? "center" : "left" }}>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
        {children}
      </span>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, opacity: 0.85 }}>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: 10.5, letterSpacing: ".18em", textTransform: "uppercase", opacity: 0.55, marginBottom: 2 }}>{title}</span>
      {children}
    </div>
  );
}

const EVENT_TYPE_OPTIONS = ["Wedding / Reception", "Naming ceremony", "Funeral rites", "Corporate", "Concert / Show", "Other"];

function ContactForm({ orgId }: { orgId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPE_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Name, email and a short message are required.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await addDoc(collection(db, "orgInquiries"), {
        orgId,
        name: name.trim(),
        email: email.trim(),
        company: company.trim(),
        eventType,
        message: message.trim(),
        status: "new",
        createdAt: Date.now(),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Blueprint style={{ textAlign: "center", padding: 28 }}>
        <h4 style={{ margin: "0 0 6px" }}>Message sent</h4>
        <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>Thanks — the team will be in touch shortly.</p>
      </Blueprint>
    );
  }

  return (
    <Blueprint style={{ padding: "clamp(18px,4vw,28px)" }}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 9 }}>
          <label>
            <FieldLabel>Your name</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </label>
          <label>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 9 }}>
          <label>
            <FieldLabel>Company / family name (optional)</FieldLabel>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
          <div>
            <FieldLabel>Event type</FieldLabel>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="input"
              style={{ width: "100%" }}
            >
              {EVENT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <label>
          <FieldLabel>Message</FieldLabel>
          <textarea
            className="input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about the event — date, guests, location, anything else that helps"
            style={{ width: "100%", minHeight: 100 }}
          />
        </label>
        {error && (
          <div style={{ padding: "10px 11px", background: "var(--hh-danger-tint)", color: "var(--hh-danger-tint-ink)", fontSize: 12.5 }}>{error}</div>
        )}
        <Btn variant="primary" type="submit" disabled={busy} style={{ minHeight: 48, fontSize: 15, marginTop: 4 }}>
          {busy ? "Sending…" : "Send message"}
        </Btn>
      </form>
    </Blueprint>
  );
}

function GallerySlideshow({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const iv = setInterval(() => setIdx((i) => (i + 1) % images.length), 4500);
    return () => clearInterval(iv);
  }, [images.length]);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ position: "relative", aspectRatio: "16/8", overflow: "hidden", background: "var(--color-neutral-200)" }}>
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src + i}
            src={src}
            alt={`Executed event ${i + 1}`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === idx ? 1 : 0,
              transition: "opacity 700ms ease",
            }}
          />
        ))}
      </div>
      {images.length > 1 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Show image ${i + 1}`}
              style={{
                width: 8,
                height: 8,
                padding: 0,
                border: "none",
                cursor: "pointer",
                background: i === idx ? "var(--color-accent-700)" : "var(--color-neutral-400)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
