"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut as secondarySignOut } from "firebase/auth";
import { db, getSecondaryAuth } from "@/lib/firebase";
import { usePlatformAuth } from "@/lib/PlatformAuthProvider";
import { useCollection, genId } from "@/lib/hooks";
import { Blueprint, Btn, Chip, Divider, FieldLabel, Input, Toast } from "@/components/ui";
import { OrgManagePanel } from "@/components/platform/OrgManagePanel";
import { EventsReportTab } from "@/components/platform/EventsReportTab";
import { VendorsReportTab } from "@/components/platform/VendorsReportTab";
import { PRESETS, type Organization } from "@/lib/types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function useFlash() {
  const [toast, setToast] = useState("");
  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 4000);
  }
  return { toast, flash };
}

const TABS = ["Overview", "Organizations", "Events", "Vendors"] as const;
type Tab = (typeof TABS)[number];

export default function PlatformAdminPage() {
  const { user, admin, loading, signOutUser } = usePlatformAuth();
  const router = useRouter();
  const { toast, flash } = useFlash();
  const { data: orgs, loading: orgsLoading } = useCollection<Organization>("organizations", orderBy("createdAt", "desc"));
  const [tab, setTab] = useState<Tab>("Overview");
  const [managingOrgId, setManagingOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/platform/signin/");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p className="text-muted" style={{ fontSize: 13 }}>Loading…</p>
      </div>
    );
  }
  if (!user) return null;
  if (!admin) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", padding: 20 }}>
        <div style={{ padding: "13px 15px", background: "var(--hh-danger-tint)", color: "var(--hh-danger-tint-ink)" }}>
          This account isn&apos;t a platform admin.
        </div>
      </div>
    );
  }

  const pending = orgs.filter((o) => o.status === "pending");
  const approved = orgs.filter((o) => o.status === "approved");
  const suspended = orgs.filter((o) => o.status === "suspended");
  const rejected = orgs.filter((o) => o.status === "rejected");
  const managingOrg = orgs.find((o) => o.id === managingOrgId) || null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 14,
          padding: "12px 20px",
          background: "var(--color-accent-900)",
          color: "var(--hh-paper)",
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            background: "var(--hh-paper-20)",
          }}
        >
          T
        </span>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 18, letterSpacing: ".03em" }}>THH EVENTS CONSOLE</span>
          <span style={{ fontSize: 9, letterSpacing: ".22em", textTransform: "uppercase", opacity: 0.6, marginTop: 4 }}>
            Platform admin
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 14 }}>{admin.name}</span>
          <Btn onClick={() => signOutUser()} style={{ borderColor: "var(--hh-paper-30)", color: "var(--hh-paper)" }}>Sign out</Btn>
        </div>
      </header>

      <div style={{ borderBottom: "1px solid var(--color-divider)", background: "var(--color-surface)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px", display: "flex", gap: 6, overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setManagingOrgId(null);
              }}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 13,
                letterSpacing: ".04em",
                padding: "13px 16px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                border: "none",
                borderBottom: `2px solid ${tab === t && !managingOrgId ? "var(--color-accent-700)" : "transparent"}`,
                background: "transparent",
                color: tab === t && !managingOrgId ? "var(--color-accent-700)" : "var(--color-text)",
                opacity: tab === t && !managingOrgId ? 1 : 0.65,
              }}
            >
              {t}
              {t === "Organizations" && pending.length > 0 && (
                <span
                  style={{
                    marginLeft: 7,
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 999,
                    background: "var(--hh-danger)",
                    color: "var(--hh-danger-ink)",
                  }}
                >
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, background: "var(--color-bg)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(16px,3.6vw,28px) clamp(14px,3.4vw,20px)" }}>
          {orgsLoading && <p className="text-muted">Loading…</p>}

          {managingOrg ? (
            <OrgManagePanel org={managingOrg} onClose={() => setManagingOrgId(null)} />
          ) : (
            <>
              {tab === "Overview" && (
                <OverviewTab orgs={orgs} pending={pending} approved={approved} suspended={suspended} />
              )}
              {tab === "Organizations" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <h4 style={{ margin: "0 0 10px" }}>Pending applications ({pending.length})</h4>
                    {pending.length === 0 && <p className="text-muted" style={{ fontSize: 12.5 }}>Nothing waiting on review.</p>}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {pending.map((org) => (
                        <PendingOrgCard key={org.id} org={org} flash={flash} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: "0 0 10px" }}>Approved ({approved.length})</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 12 }}>
                      {approved.map((org) => (
                        <OrgCard key={org.id} org={org} flash={flash} onManage={() => setManagingOrgId(org.id)} />
                      ))}
                    </div>
                  </div>

                  {suspended.length > 0 && (
                    <div>
                      <h4 style={{ margin: "0 0 10px" }}>Retired ({suspended.length})</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 12 }}>
                        {suspended.map((org) => (
                          <OrgCard key={org.id} org={org} flash={flash} onManage={() => setManagingOrgId(org.id)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {rejected.length > 0 && (
                    <div>
                      <h4 style={{ margin: "0 0 10px" }}>Rejected ({rejected.length})</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 12 }}>
                        {rejected.map((org) => (
                          <OrgCard key={org.id} org={org} flash={flash} onManage={() => setManagingOrgId(org.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {tab === "Events" && <EventsReportTab orgs={orgs} />}
              {tab === "Vendors" && <VendorsReportTab orgs={orgs} />}
            </>
          )}
        </div>
      </div>
      <Toast text={toast} />
    </div>
  );
}

function OverviewTab({
  orgs,
  pending,
  approved,
  suspended,
}: {
  orgs: Organization[];
  pending: Organization[];
  approved: Organization[];
  suspended: Organization[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,170px),1fr))", gap: 12 }}>
        <StatCard value={orgs.length} label="Registered organizations" />
        <StatCard value={pending.length} label="Pending review" accent={pending.length > 0 ? "var(--hh-warn)" : undefined} />
        <StatCard value={approved.length} label="Active organizations" />
        <StatCard value={suspended.length} label="Retired" />
      </div>

      {pending.length > 0 && (
        <Blueprint>
          <h4 style={{ margin: "0 0 4px" }}>Awaiting your review</h4>
          <p className="text-muted" style={{ fontSize: 11.5, margin: "0 0 12px" }}>Switch to the Organizations tab to approve or reject.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.slice(0, 5).map((o) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 14 }}>{o.name}</span>
                <span className="text-muted" style={{ fontSize: 11.5 }}>{o.requester.email}</span>
              </div>
            ))}
          </div>
        </Blueprint>
      )}
    </div>
  );
}

function StatCard({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <Blueprint style={{ textAlign: "center", padding: "20px 12px" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 36, lineHeight: 1, color: accent || "var(--color-accent-700)" }}>{value}</div>
      <div style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", marginTop: 6, opacity: 0.65 }}>{label}</div>
    </Blueprint>
  );
}

function PendingOrgCard({ org, flash }: { org: Organization; flash: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(org.slug);
  const [adminName, setAdminName] = useState(org.requester.name);
  const [adminEmail, setAdminEmail] = useState(org.requester.email);
  const [password, setPassword] = useState(() => Math.random().toString(36).slice(2, 10));
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  async function approve() {
    const cleanSlug = slugify(slug);
    if (!cleanSlug) return flash("Give the organization a valid URL slug");
    if (!adminEmail.trim() || !adminName.trim()) return flash("Admin name and email are required");
    setBusy(true);
    try {
      const roleIds: Record<string, string> = {};
      for (const [name, perms] of Object.entries(PRESETS)) {
        const id = genId("rd");
        await setDoc(doc(db, "roles", id), { orgId: org.id, name, base: name, perms });
        roleIds[name] = id;
      }

      const secondaryAuth = getSecondaryAuth();
      const cred = await createUserWithEmailAndPassword(secondaryAuth, adminEmail.trim(), password);
      const uid = cred.user.uid;
      await setDoc(doc(db, "people", uid), {
        orgId: org.id,
        name: adminName.trim(),
        contact: org.requester.contact,
        email: adminEmail.trim(),
        photoUrl: null,
        roleId: roleIds["Main Coordinator"],
        active: true,
        createdAt: Date.now(),
      });
      await secondarySignOut(secondaryAuth);

      await updateDoc(doc(db, "organizations", org.id), {
        status: "approved",
        slug: cleanSlug,
        adminEmail: adminEmail.trim(),
        approvedAt: Date.now(),
      });

      setIssued({ email: adminEmail.trim(), password });
      flash(`${org.name} approved`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Could not approve this organization");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    try {
      await updateDoc(doc(db, "organizations", org.id), { status: "rejected" });
      flash(`${org.name} marked rejected`);
    } finally {
      setBusy(false);
    }
  }

  if (issued) {
    return (
      <Blueprint>
        <h4 style={{ margin: "0 0 8px" }}>{org.name} — approved</h4>
        <p className="text-muted" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
          Send these to the organization now — this password is shown only once.
        </p>
        <div style={{ padding: 12, background: "var(--color-accent-100)", fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
          <div>Login page: <code>/{org.slug}/signin/</code></div>
          <div>Email: <b>{issued.email}</b></div>
          <div>Temporary password: <b style={{ fontFamily: "ui-monospace,monospace" }}>{issued.password}</b></div>
        </div>
      </Blueprint>
    );
  }

  return (
    <Blueprint>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h4 style={{ margin: 0 }}>{org.name}</h4>
        <span className="text-muted" style={{ fontSize: 11.5 }}>{org.location}</span>
        <Btn onClick={() => setOpen((v) => !v)} style={{ marginLeft: "auto" }}>{open ? "Close" : "Review"}</Btn>
      </div>
      <p className="text-muted" style={{ fontSize: 11.5, margin: "6px 0 0" }}>
        {org.requester.name} · {org.requester.email} · {org.requester.contact}
      </p>

      {open && (
        <>
          <Divider />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 9 }}>
            <label>
              <FieldLabel>URL slug</FieldLabel>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </label>
            <label>
              <FieldLabel>Admin name</FieldLabel>
              <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            </label>
            <label>
              <FieldLabel>Admin email</FieldLabel>
              <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            </label>
            <label>
              <FieldLabel>Temporary password</FieldLabel>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn variant="primary" onClick={approve} disabled={busy} style={{ minHeight: 44 }}>
              {busy ? "Approving…" : "Approve & create admin login"}
            </Btn>
            <Btn onClick={reject} disabled={busy} style={{ minHeight: 44 }}>Reject</Btn>
          </div>
        </>
      )}
    </Blueprint>
  );
}

function OrgCard({ org, flash, onManage }: { org: Organization; flash: (m: string) => void; onManage: () => void }) {
  const [busy, setBusy] = useState(false);

  async function setStatus(status: "approved" | "suspended") {
    setBusy(true);
    try {
      await updateDoc(doc(db, "organizations", org.id), { status });
      flash(`${org.name} is now ${status === "approved" ? "active" : "retired"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Blueprint>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {org.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logoUrl} alt={org.name} width={28} height={28} style={{ objectFit: "contain" }} />
        )}
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{org.name}</span>
        {org.isPlatformOwner && <Chip active>Platform owner</Chip>}
      </div>
      <p className="text-muted" style={{ fontSize: 11.5, margin: "6px 0 8px" }}>
        <code>/{org.slug}/</code> · {org.adminEmail || "—"}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Btn variant="primary" onClick={onManage} style={{ fontSize: 12 }}>Manage</Btn>
        {org.status === "approved" && !org.isPlatformOwner && (
          <Btn onClick={() => setStatus("suspended")} disabled={busy} style={{ fontSize: 12 }}>Retire</Btn>
        )}
        {org.status === "suspended" && (
          <Btn onClick={() => setStatus("approved")} disabled={busy} style={{ fontSize: 12 }}>Reactivate</Btn>
        )}
      </div>
    </Blueprint>
  );
}
