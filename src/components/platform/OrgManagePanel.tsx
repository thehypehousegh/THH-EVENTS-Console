"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useOrgCollection } from "@/lib/hooks";
import { Blueprint, Btn, Chip, Divider, Tag, Toast } from "@/components/ui";
import { OrgProfileEditor } from "@/components/OrgProfileEditor";
import { PERMS, type Organization, type Person, type RoleDef, type PermissionId } from "@/lib/types";

const PERM_GROUPS = ["Programme", "Checklist", "Issues", "Comms", "Vendors", "Admin"];

function useFlash() {
  const [toast, setToast] = useState("");
  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3400);
  }
  return { toast, flash };
}

/** Everything a platform Super Admin can do for one organization on its
 *  behalf: edit its public profile, adjust existing roles' permissions,
 *  retire/reactivate people, send the admin a password reset, and
 *  retire/reactivate the organization itself. Deliberately does NOT
 *  offer creating new roles or new people — that stays the org's own
 *  admin's call, seeded once at approval. */
export function OrgManagePanel({ org, onClose }: { org: Organization; onClose: () => void }) {
  const { toast, flash } = useFlash();
  const [resetBusy, setResetBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  async function sendReset() {
    if (!org.adminEmail) return flash("This organization has no admin email on file yet");
    setResetBusy(true);
    try {
      await sendPasswordResetEmail(auth, org.adminEmail);
      flash(`Password reset email sent to ${org.adminEmail}`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Could not send the reset email");
    } finally {
      setResetBusy(false);
    }
  }

  async function toggleOrgStatus() {
    const next = org.status === "approved" ? "suspended" : "approved";
    setStatusBusy(true);
    try {
      await updateDoc(doc(db, "organizations", org.id), { status: next });
      flash(next === "suspended" ? `${org.name} retired — sign-in and their public page are blocked` : `${org.name} reactivated`);
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Blueprint style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <div style={{ minWidth: 200, flex: 1 }}>
          <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Managing</span>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: "3px 0 2px" }}>{org.name}</div>
          <span className="text-muted" style={{ fontSize: 11.5 }}>
            <code>/{org.slug}/</code> · {org.adminEmail || "no admin email on file"}
          </span>
        </div>
        <Btn onClick={sendReset} disabled={resetBusy}>{resetBusy ? "Sending…" : "Send password reset email"}</Btn>
        {!org.isPlatformOwner && (
          <Btn
            onClick={toggleOrgStatus}
            disabled={statusBusy}
            style={org.status === "approved" ? { borderColor: "var(--hh-danger)", color: "var(--hh-danger)" } : undefined}
          >
            {org.status === "approved" ? "Retire organization" : "Reactivate organization"}
          </Btn>
        )}
        <Btn onClick={onClose}>Close</Btn>
      </Blueprint>

      <OrgProfileEditor org={org} flash={flash} />
      <RolesPanel orgId={org.id} flash={flash} />
      <PeoplePanel orgId={org.id} flash={flash} />
      <Toast text={toast} />
    </div>
  );
}

function RolesPanel({ orgId, flash }: { orgId: string; flash: (m: string) => void }) {
  const { data: roles } = useOrgCollection<RoleDef>("roles", orgId);
  const [editRole, setEditRole] = useState<string | null>(null);
  const activeRoleId = editRole || roles[0]?.id || null;
  const activeRole = roles.find((r) => r.id === activeRoleId);

  async function togglePerm(pid: PermissionId) {
    if (!activeRole) return;
    const has = activeRole.perms.includes(pid);
    const next = has ? activeRole.perms.filter((x) => x !== pid) : [...activeRole.perms, pid];
    await updateDoc(doc(db, "roles", activeRole.id), { perms: next });
    flash(`${activeRole.name} now has ${next.length} of ${PERMS.length} permissions`);
  }

  return (
    <Blueprint style={{ gridColumn: "1/-1" }}>
      <h4 style={{ margin: "0 0 2px" }}>Roles &amp; access</h4>
      <p className="text-muted" style={{ fontSize: 11, margin: "0 0 13px" }}>
        Adjust what an existing role can do. New roles are seeded once at approval — this organization&apos;s own admin adds more from their Admin setup.
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {roles.map((r) => (
          <Chip key={r.id} active={activeRoleId === r.id} onClick={() => setEditRole(r.id)}>{r.name}</Chip>
        ))}
      </div>
      {activeRole && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))", gap: 14 }}>
          {PERM_GROUPS.map((g) => (
            <div key={g} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>{g}</span>
              {PERMS.filter((p) => p.group === g).map((p) => {
                const on = activeRole.perms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePerm(p.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      width: "100%",
                      minHeight: 40,
                      padding: "6px 9px",
                      cursor: "pointer",
                      textAlign: "left",
                      border: "1px solid var(--color-divider)",
                      background: on ? "var(--color-accent-100)" : "transparent",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        flex: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-heading)",
                        fontSize: 11,
                        border: `1px solid ${on ? "var(--color-accent-700)" : "var(--color-text)"}`,
                        background: on ? "var(--color-accent-700)" : "transparent",
                        color: on ? "var(--hh-paper)" : "inherit",
                      }}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span style={{ fontSize: 12, lineHeight: 1.25, opacity: on ? 1 : 0.6 }}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </Blueprint>
  );
}

function PeoplePanel({ orgId, flash }: { orgId: string; flash: (m: string) => void }) {
  const { data: people, loading } = useOrgCollection<Person>("people", orgId);

  async function toggleActive(personId: string, current: boolean) {
    await updateDoc(doc(db, "people", personId), { active: !current });
    flash(!current ? "Reactivated — sign-in restored" : "Retired — sign-in blocked until reactivated");
  }

  return (
    <Blueprint style={{ gridColumn: "1/-1" }}>
      <h4 style={{ margin: "0 0 2px" }}>People</h4>
      <p className="text-muted" style={{ fontSize: 11, margin: "0 0 13px" }}>
        Retire or reactivate an existing account. Adding new people stays this organization&apos;s own admin&apos;s call.
      </p>
      {loading && <p className="text-muted" style={{ fontSize: 12 }}>Loading…</p>}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {people.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap", padding: "9px 6px", borderBottom: "1px solid var(--color-divider)", opacity: p.active ? 1 : 0.55 }}>
            <span style={{ display: "flex", flexDirection: "column", minWidth: 140, flex: 1 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 14 }}>{p.name}</span>
              <span className="text-muted" style={{ fontSize: 10.5 }}>{p.email} {p.active ? "" : "· RETIRED"}</span>
            </span>
            <Tag variant="neutral">{p.contact || "no phone on file"}</Tag>
            <Btn onClick={() => toggleActive(p.id, p.active)} style={{ fontSize: 11, padding: "8px 10px", minHeight: 36 }}>
              {p.active ? "Retire" : "Reactivate"}
            </Btn>
          </div>
        ))}
        {!loading && people.length === 0 && <p className="text-muted" style={{ fontSize: 12 }}>No people yet.</p>}
      </div>
      <Divider />
    </Blueprint>
  );
}
