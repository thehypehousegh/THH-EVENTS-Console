"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthProvider";
import { useDocument } from "@/lib/hooks";
import { Blueprint, Btn, FieldLabel, Input } from "@/components/ui";
import type { Organization } from "@/lib/types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function PlatformLandingPage() {
  const { user, person, loading } = useAuth();
  const router = useRouter();
  const { data: myOrg } = useDocument<Organization>(person?.orgId ? `organizations/${person.orgId}` : null);

  useEffect(() => {
    if (loading || !user || !person || !myOrg) return;
    router.replace(`/${myOrg.slug}/events/`);
  }, [loading, user, person, myOrg, router]);

  return (
    <div style={{ minWidth: 0 }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px clamp(16px,4vw,40px)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            background: "var(--color-accent-700)",
            color: "var(--hh-paper)",
          }}
        >
          T
        </span>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>THH Events Console</span>
        <Link href="/platform/signin/" className="btn btn-secondary" style={{ marginLeft: "auto", fontSize: 12.5, minHeight: 38 }}>
          Platform staff sign in
        </Link>
      </header>

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "clamp(56px,11vw,120px) clamp(16px,4vw,40px) clamp(48px,8vw,88px)",
          background:
            "radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 55%), radial-gradient(circle at 82% 0%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 50%), var(--color-bg)",
        }}
      >
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
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
            Built by The Hype House
          </span>
          <h1 style={{ fontSize: "clamp(32px,6.5vw,58px)", lineHeight: 1.05, margin: "0 0 16px" }}>
            One live console for every event you run
          </h1>
          <p style={{ fontSize: "clamp(15px,2.2vw,18px)", color: "color-mix(in srgb, var(--color-text) 68%, transparent)", maxWidth: 600, margin: "0 auto 30px" }}>
            Run sheets, checklists, escalations and a client-facing live page — coordinated from one console. Register
            your event house below and get your own branded space.
          </p>
          <a href="#register" className="btn btn-primary" style={{ minHeight: 50, fontSize: 15, padding: "0 30px" }}>
            Register your organization
          </a>
        </div>
      </section>

      <section id="register" style={{ padding: "clamp(40px,7vw,80px) clamp(16px,4vw,40px)", background: "var(--color-surface)" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <RegisterForm />
        </div>
      </section>

      <footer style={{ padding: "24px clamp(16px,4vw,40px)", fontSize: 11.5, opacity: 0.6, textAlign: "center" }}>
        © {new Date().getFullYear()} The Hype House — THH Events Console.
      </footer>
    </div>
  );
}

function RegisterForm() {
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !orgName.trim() || !email.trim() || !contact.trim()) {
      setError("Fill in your name, organization name, email and contact number.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const orgDoc: Omit<Organization, "id"> = {
        slug: slugify(orgName) || slugify(name) || `org-${Date.now()}`,
        name: orgName.trim(),
        logoUrl: null,
        slogan: "",
        location: location.trim(),
        address: "",
        contactPhone: contact.trim(),
        contactEmail: email.trim(),
        about: "",
        services: [],
        testimonials: [],
        gallery: [],
        social: { facebook: "", instagram: "", tiktok: "", twitter: "" },
        quickLinks: [],
        status: "pending",
        isPlatformOwner: false,
        subscription: { status: "none", durationDays: null, startedAt: null, expiresAt: null },
        requester: { name: name.trim(), email: email.trim(), contact: contact.trim(), location: location.trim() },
        adminEmail: null,
        createdAt: Date.now(),
        approvedAt: null,
      };
      await addDoc(collection(db, "organizations"), orgDoc);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Blueprint style={{ textAlign: "center", padding: 30 }}>
        <h4 style={{ margin: "0 0 8px" }}>Application received</h4>
        <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
          The Hype House team will review your application and reach out with your admin sign-in details.
        </p>
      </Blueprint>
    );
  }

  return (
    <Blueprint style={{ padding: "clamp(18px,4vw,28px)" }}>
      <h3 style={{ margin: "0 0 4px" }}>Register your organization</h3>
      <p className="text-muted" style={{ fontSize: 12.5, margin: "0 0 18px" }}>
        We review every application. Once approved, we&apos;ll send your admin login so you can add people, roles and
        start creating events.
      </p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <label>
          <FieldLabel>Your name</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </label>
        <label>
          <FieldLabel>Organization name</FieldLabel>
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your event house's name" />
        </label>
        <label>
          <FieldLabel>Location</FieldLabel>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, country" />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", gap: 9 }}>
          <label>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label>
            <FieldLabel>Contact number</FieldLabel>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="024 000 0000" />
          </label>
        </div>
        {error && (
          <div style={{ padding: "10px 11px", background: "var(--hh-danger-tint)", color: "var(--hh-danger-tint-ink)", fontSize: 12.5 }}>{error}</div>
        )}
        <Btn variant="primary" type="submit" disabled={busy} style={{ minHeight: 48, fontSize: 15, marginTop: 4 }}>
          {busy ? "Submitting…" : "Submit application"}
        </Btn>
      </form>
    </Blueprint>
  );
}
