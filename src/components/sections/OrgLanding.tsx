"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { where } from "firebase/firestore";
import { useOrg } from "@/lib/OrgProvider";
import { useOrgCollection } from "@/lib/hooks";
import { Blueprint } from "@/components/ui";
import type { HHEvent } from "@/lib/types";

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

function OrgLandingBody() {
  const { org, slug } = useOrg();
  const { data: completedEvents } = useOrgCollection<HHEvent>("events", org?.id, where("status", "==", "completed"));
  if (!org) return null;

  const nav = [
    { label: "Admin", href: `/${slug}/admin/` },
    { label: "Coordination", href: `/${slug}/coordinator/` },
    { label: "Events", href: `/${slug}/events/` },
  ];

  return (
    <div style={{ minWidth: 0 }}>
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
          background:
            "radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 55%), radial-gradient(circle at 82% 0%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 50%), var(--color-bg)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
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

        {completedEvents.length > 0 && (
          <div
            style={{
              maxWidth: 700,
              margin: "56px auto 0",
              display: "flex",
              justifyContent: "center",
              gap: "clamp(24px,6vw,64px)",
              flexWrap: "wrap",
            }}
          >
            <Stat value={String(completedEvents.length)} label="Events delivered" />
            {org.location && <Stat value={org.location} label="Based in" small />}
          </div>
        )}
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

      {/* ── Services ────────────────────────────────────────── */}
      {org.services.length > 0 && (
        <section style={{ padding: "clamp(40px,7vw,72px) clamp(16px,4vw,40px)", background: "var(--color-surface)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <Eyebrow center>Our services</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,250px),1fr))", gap: 16, marginTop: 24 }}>
              {org.services.map((s, i) => (
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
                  <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>{s.description}</p>
                </Blueprint>
              ))}
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
              {org.testimonials.map((t, i) => (
                <div key={i} style={{ padding: 22, background: "var(--color-accent-900)", color: "var(--hh-paper)" }}>
                  <p style={{ fontSize: 15, lineHeight: 1.55, margin: "0 0 16px" }}>&ldquo;{t.quote}&rdquo;</p>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, opacity: 0.65 }}>{t.role}</div>
                </div>
              ))}
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
        <div style={{ maxWidth: 1180, margin: "30px auto 0", paddingTop: 16, borderTop: "1px solid var(--hh-paper-20)", fontSize: 11, opacity: 0.5 }}>
          © {new Date().getFullYear()} {org.name}. Run on the THH Events Console.
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

function Stat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: small ? 20 : 36, lineHeight: 1, color: "var(--color-accent-700)" }}>{value}</div>
      <div style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", marginTop: 4, opacity: 0.65 }}>{label}</div>
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
