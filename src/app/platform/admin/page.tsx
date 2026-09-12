"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut as secondarySignOut } from "firebase/auth";
import { db, getSecondaryAuth } from "@/lib/firebase";
import { usePlatformAuth } from "@/lib/PlatformAuthProvider";
import { useCollection, genId } from "@/lib/hooks";
import { Blueprint, Btn, Chip, Divider, FieldLabel, Input, Toast } from "@/components/ui";
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

export default function PlatformAdminPage() {
  const { user, admin, loading, signOutUser } = usePlatformAuth();
  const router = useRouter();
  const { toast, flash } = useFlash();
  const { data: orgs, loading: orgsLoading } = useCollection<Organization>("organizations", orderBy("createdAt", "desc"));

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

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(14px,3.6vw,22px) clamp(12px,3.4vw,16px)", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>THH Events Console</span>
          <h3 style={{ margin: "4px 0 0" }}>Platform admin — {admin.name}</h3>
        </div>
        <Btn onClick={() => signOutUser()} style={{ marginLeft: "auto" }}>Sign out</Btn>
      </div>

      {orgsLoading && <p className="text-muted">Loading organizations…</p>}

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
            <OrgCard key={org.id} org={org} flash={flash} />
          ))}
        </div>
      </div>

      {suspended.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 10px" }}>Suspended ({suspended.length})</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 12 }}>
            {suspended.map((org) => (
              <OrgCard key={org.id} org={org} flash={flash} />
            ))}
          </div>
        </div>
      )}

      {rejected.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 10px" }}>Rejected ({rejected.length})</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 12 }}>
            {rejected.map((org) => (
              <OrgCard key={org.id} org={org} flash={flash} />
            ))}
          </div>
        </div>
      )}
      <Toast text={toast} />
    </div>
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

function OrgCard({ org, flash }: { org: Organization; flash: (m: string) => void }) {
  const [busy, setBusy] = useState(false);

  async function setStatus(status: "approved" | "suspended") {
    setBusy(true);
    try {
      await updateDoc(doc(db, "organizations", org.id), { status });
      flash(`${org.name} is now ${status}`);
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
      <div style={{ display: "flex", gap: 6 }}>
        {org.status === "approved" && !org.isPlatformOwner && (
          <Btn onClick={() => setStatus("suspended")} disabled={busy}>Suspend</Btn>
        )}
        {org.status === "suspended" && (
          <Btn variant="primary" onClick={() => setStatus("approved")} disabled={busy}>Reactivate</Btn>
        )}
      </div>
    </Blueprint>
  );
}
