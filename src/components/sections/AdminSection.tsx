"use client";

import { useState } from "react";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut as secondarySignOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { orderBy } from "firebase/firestore";
import { db, getSecondaryAuth, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { useOrg } from "@/lib/OrgProvider";
import { useCollection, useOrgCollection, genId, genToken } from "@/lib/hooks";
import { Blueprint, Btn, Chip, Divider, Input, Toast } from "@/components/ui";
import { OrgProfileEditor } from "@/components/OrgProfileEditor";
import { PERMS, PRESETS, type PermissionId, type HHEvent } from "@/lib/types";

const ROLE_BASES = ["Main Coordinator", "Sub-Coordinator", "Volunteer", "MC", "DJ", "Usher", "Vendor liaison"];
const PERM_GROUPS = ["Programme", "Checklist", "Issues", "Comms", "Vendors", "Admin"];

function useFlash() {
  const [toast, setToast] = useState("");
  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3400);
  }
  return { toast, flash };
}

export default function AdminSection() {
  const { org } = useOrg();
  const { hasPerm } = useAuth();
  const { toast, flash } = useFlash();
  const canManage = hasPerm("accounts");

  if (!canManage) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: 20 }}>
        <p className="text-muted">You don&apos;t have permission to manage roles and people.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: "clamp(14px,3.6vw,20px) clamp(12px,3.4vw,16px)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {org && <OrgProfileEditor org={org} flash={flash} />}
      <RolesPanel flash={flash} />
      <PeoplePanel flash={flash} />
      <EventBuilderPanel flash={flash} />
      <ClientLinkPanel flash={flash} />
      <Toast text={toast} />
    </div>
  );
}

function RolesPanel({ flash }: { flash: (m: string) => void }) {
  const { org } = useOrg();
  const { roles } = useAppData();
  const [editRole, setEditRole] = useState<string | null>(null);
  const activeRoleId = editRole || roles[0]?.id || null;
  const activeRole = roles.find((r) => r.id === activeRoleId);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleBase, setNewRoleBase] = useState("Sub-Coordinator");

  async function togglePerm(pid: PermissionId) {
    if (!activeRole) return;
    const has = activeRole.perms.includes(pid);
    const next = has ? activeRole.perms.filter((x) => x !== pid) : [...activeRole.perms, pid];
    await updateDoc(doc(db, "roles", activeRole.id), { perms: next });
    flash(`${activeRole.name} now has ${next.length} of ${PERMS.length} permissions`);
  }

  async function createRole() {
    if (!org) return;
    const name = newRoleName.trim();
    if (!name) return flash("Give the role a name first");
    const id = genId("rd");
    await setDoc(doc(db, "roles", id), { orgId: org.id, name, base: newRoleBase, perms: PRESETS[newRoleBase] || [] });
    setNewRoleName("");
    setEditRole(id);
    flash(`"${name}" created with ${newRoleBase} access — adjust the boxes below`);
  }

  return (
    <Blueprint style={{ gridColumn: "1/-1" }}>
      <h4 style={{ margin: "0 0 2px" }}>Roles &amp; access</h4>
      <p className="text-muted" style={{ fontSize: 11, margin: "0 0 13px" }}>
        Define what a role can do once; every person in that role inherits it.
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {roles.map((r) => (
          <Chip key={r.id} active={activeRoleId === r.id} onClick={() => setEditRole(r.id)}>
            {r.name}
          </Chip>
        ))}
      </div>

      {activeRole && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "baseline", marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>{activeRole.name}</span>
            <span className="text-muted" style={{ fontSize: 11 }}>Based on the {activeRole.base} template</span>
            <span className="tag tag-accent" style={{ marginLeft: "auto" }}>
              {activeRole.perms.length} of {PERMS.length} permissions granted
            </span>
          </div>

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
                        minHeight: 44,
                        padding: "7px 9px",
                        cursor: "pointer",
                        textAlign: "left",
                        border: "1px solid var(--color-divider)",
                        background: on ? "var(--color-accent-100)" : "transparent",
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          flex: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-heading)",
                          fontSize: 12,
                          border: `1px solid ${on ? "var(--color-accent-700)" : "var(--color-text)"}`,
                          background: on ? "var(--color-accent-700)" : "transparent",
                          color: on ? "var(--hh-paper)" : "inherit",
                        }}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span style={{ fontSize: 12.5, lineHeight: 1.25, opacity: on ? 1 : 0.6 }}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      <Divider />
      <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Create a new role</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0 10px" }}>
        {ROLE_BASES.map((b) => (
          <Chip key={b} active={newRoleBase === b} onClick={() => setNewRoleBase(b)}>
            {b}
          </Chip>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role name, e.g. Kente Attendant" style={{ flex: 1, minWidth: 180 }} />
        <Btn variant="primary" onClick={createRole}>Create role</Btn>
      </div>
    </Blueprint>
  );
}

function PeoplePanel({ flash }: { flash: (m: string) => void }) {
  const { org } = useOrg();
  const { people, roles, peopleLoading } = useAppData();
  const { data: events } = useOrgCollection<HHEvent>("events", org?.id, orderBy("createdAt", "desc"));
  const [assignPerson, setAssignPerson] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const active = people.find((p) => p.id === assignPerson) || null;

  async function addPerson() {
    if (!org) return;
    if (!name.trim() || !contact.trim() || !email.trim()) return flash("A person needs a name, phone and email");
    const pwd = Math.random().toString(36).slice(2, 10);
    setBusy(true);
    try {
      const secondaryAuth = getSecondaryAuth();
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), pwd);
      const uid = cred.user.uid;
      let photoUrl: string | null = null;
      if (photoFile) {
        const r = ref(storage, `people/${uid}/passport.jpg`);
        await uploadBytes(r, photoFile);
        photoUrl = await getDownloadURL(r);
      }
      await setDoc(doc(db, "people", uid), {
        orgId: org.id,
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim(),
        photoUrl,
        roleId: null,
        active: true,
        createdAt: Date.now(),
      });
      await secondarySignOut(secondaryAuth);
      setTempPassword(pwd);
      setName("");
      setContact("");
      setEmail("");
      setPhotoFile(null);
      setAssignPerson(uid);
      flash(`${name} added — give them a role, then hand them the temporary password shown below`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Could not create that account");
    } finally {
      setBusy(false);
    }
  }

  async function assignRole(roleId: string) {
    if (!active) return;
    await updateDoc(doc(db, "people", active.id), { roleId });
    flash(`${active.name} is now ${roles.find((r) => r.id === roleId)?.name} — they can be put on an event`);
  }

  async function toggleEventAssignment(ev: HHEvent) {
    if (!active?.roleId) return;
    await setDoc(doc(db, "events", ev.id, "assignments", active.id), {
      personId: active.id,
      roleId: active.roleId,
      isDayOf: false,
      expiresAt: null,
    });
    await setDoc(doc(db, "events", ev.id, "rollCall", active.id), {
      role: roles.find((r) => r.id === active.roleId)?.name || "",
      who: active.name,
      phone: active.contact,
      state: "waiting",
      confirmedAt: "",
    });
    flash(`${active.name} assigned to ${ev.name}`);
  }

  async function toggleActive(personId: string, current: boolean) {
    await updateDoc(doc(db, "people", personId), { active: !current });
    flash(!current ? "Reactivated — sign-in restored" : "Retired — sign-in blocked until reactivated");
  }

  return (
    <Blueprint style={{ gridColumn: "1/-1" }}>
      <h4 style={{ margin: "0 0 2px" }}>People</h4>
      <p className="text-muted" style={{ fontSize: 11, margin: "0 0 13px" }}>
        Add the person, give them a role, then put them on an event. Retiring blocks sign-in without changing their credentials.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 16, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {peopleLoading && <p className="text-muted" style={{ fontSize: 12 }}>Loading…</p>}
            {people.map((p) => (
              <div
                key={p.id}
                onClick={() => setAssignPerson(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  flexWrap: "wrap",
                  padding: "9px 6px",
                  borderBottom: "1px solid var(--color-divider)",
                  cursor: "pointer",
                  background: assignPerson === p.id ? "var(--color-accent-100)" : "transparent",
                  opacity: p.active ? 1 : 0.55,
                }}
              >
                <span
                  style={{
                    width: 42,
                    height: 42,
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-heading)",
                    fontSize: 15,
                    border: p.photoUrl ? "1px solid var(--color-accent-700)" : "1px dashed var(--color-divider)",
                    background: p.photoUrl ? "var(--color-accent-200)" : "transparent",
                    color: p.photoUrl ? "var(--color-accent-900)" : "var(--color-neutral-700)",
                    backgroundImage: p.photoUrl ? `url(${p.photoUrl})` : undefined,
                    backgroundSize: "cover",
                  }}
                >
                  {!p.photoUrl && p.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                </span>
                <span style={{ display: "flex", flexDirection: "column", minWidth: 110, flex: 1 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: 14.5 }}>{p.name}</span>
                  <span className="text-muted" style={{ fontSize: 10.5 }}>
                    {p.contact} · {p.photoUrl ? "Passport photo on file" : "Photo missing"} {p.active ? "" : "· RETIRED"}
                  </span>
                </span>
                <span
                  className="tag"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: 9.5,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    background: p.roleId ? "var(--color-accent-200)" : "var(--hh-warn)",
                    color: p.roleId ? "var(--color-accent-900)" : "var(--hh-warn-ink)",
                  }}
                >
                  {p.roleId ? roles.find((r) => r.id === p.roleId)?.name || "Role" : "No role yet"}
                </span>
                <Btn
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleActive(p.id, p.active);
                  }}
                  style={{ fontSize: 11, padding: "8px 10px", minHeight: 36 }}
                >
                  {p.active ? "Retire" : "Reactivate"}
                </Btn>
              </div>
            ))}
          </div>
          <Divider />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ flex: 1, minWidth: 130 }} />
              <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="024 000 0000" style={{ flex: 1, minWidth: 120 }} />
            </div>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="login email" />
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            <Btn variant="primary" onClick={addPerson} disabled={busy}>
              {busy ? "Adding…" : "Add person"}
            </Btn>
            {tempPassword && (
              <div style={{ padding: 10, background: "var(--color-accent-100)", fontSize: 12 }}>
                Temporary password: <b style={{ fontFamily: "ui-monospace,monospace" }}>{tempPassword}</b> — hand this to them, they should change it after signing in.
              </div>
            )}
          </div>
        </div>

        <div style={{ minWidth: 0, padding: 13, border: "1px solid var(--color-divider)", background: "var(--color-accent-100)" }}>
          <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Assigning</span>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 19, margin: "3px 0 4px" }}>{active?.name || "—"}</div>
          <p className="text-muted" style={{ fontSize: 11.5, margin: "0 0 12px" }}>
            {active?.roleId ? "Now put them on an event." : "Give them a role first — event assignment unlocks once a role is set."}
          </p>

          <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Step 1 · Role</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "7px 0 14px" }}>
            {roles.map((r) => (
              <Chip key={r.id} active={active?.roleId === r.id} onClick={() => assignRole(r.id)} disabled={!active}>
                {r.name}
              </Chip>
            ))}
          </div>

          {active?.roleId && (
            <>
              <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Step 2 · Events</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                {events.map((ev) => (
                  <Chip key={ev.id} onClick={() => toggleEventAssignment(ev)}>
                    {ev.name}
                  </Chip>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Blueprint>
  );
}

const TASK_PHASES = ["Setup", "Live", "Teardown"] as const;

function EventBuilderPanel({ flash }: { flash: (m: string) => void }) {
  const { org } = useOrg();
  const { data: events } = useOrgCollection<HHEvent>("events", org?.id, orderBy("createdAt", "desc"));
  const [eventId, setEventId] = useState<string | null>(null);
  const activeEventId = eventId || events[0]?.id || null;

  const { data: schedule } = useCollection<{ order: number; time: string; title: string; owner: string; status: string }>(
    activeEventId ? `events/${activeEventId}/scheduleItems` : "__none__",
    orderBy("order")
  );
  const { data: tasks } = useCollection<{ area: string; phase: string; task: string; done: boolean }>(
    activeEventId ? `events/${activeEventId}/tasks` : "__none__"
  );

  const [itemTitle, setItemTitle] = useState("");
  const [itemTime, setItemTime] = useState("");
  const [itemOwnerRole, setItemOwnerRole] = useState("");
  const [taskArea, setTaskArea] = useState("");
  const [taskPhase, setTaskPhase] = useState<typeof TASK_PHASES[number]>("Setup");
  const [taskText, setTaskText] = useState("");

  async function insertItem() {
    if (!activeEventId || !itemTitle.trim()) return flash("Give the item a title first");
    const isLive = schedule.length === 0;
    await setDoc(doc(db, "events", activeEventId, "scheduleItems", genId("s")), {
      order: schedule.length,
      time: itemTime || "--:--",
      title: itemTitle.trim(),
      owner: itemOwnerRole || "Unassigned",
      ownerRoleId: null,
      status: isLive ? "live" : "todo",
      inserted: false,
      mcScript: [],
      djTrack: null,
    });
    setItemTitle("");
    setItemTime("");
    flash("Item added and published — every coordinator now sees it");
  }

  async function addTask() {
    if (!activeEventId || !taskText.trim() || !taskArea.trim()) return flash("A task needs an area and a description");
    await setDoc(doc(db, "events", activeEventId, "tasks", genId("t")), {
      area: taskArea.trim(),
      phase: taskPhase,
      task: taskText.trim(),
      done: false,
      ownerRoleId: null,
      dueTime: null,
    });
    setTaskText("");
    flash("Task added to the checklist");
  }

  if (events.length === 0) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 16 }}>
      <Blueprint style={{ gridColumn: "1/-1" }}>
        <h4 style={{ margin: "0 0 10px" }}>Editing project</h4>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {events.map((ev) => (
            <Chip key={ev.id} active={activeEventId === ev.id} onClick={() => setEventId(ev.id)}>
              {ev.name}
            </Chip>
          ))}
        </div>
      </Blueprint>

      <Blueprint style={{ minWidth: 0 }}>
        <h4 style={{ margin: "0 0 2px" }}>Schedule builder</h4>
        <p className="text-muted" style={{ fontSize: 11, margin: "0 0 12px" }}>
          Programme the running order and the owning role. Publishing pushes to every signed-in dashboard.
        </p>
        <div style={{ display: "flex", flexDirection: "column", maxHeight: 340, overflow: "auto", paddingRight: 3 }}>
          {schedule.map((it) => (
            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 6px", borderBottom: "1px solid var(--color-divider)" }}>
              <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10.5, width: 40, color: "var(--color-accent-700)" }}>{it.time}</span>
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 13.5 }}>{it.title}</span>
                <span className="text-muted" style={{ fontSize: 10.5 }}>{it.owner}</span>
              </span>
              <span style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase" }} className="text-muted">{it.status}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
          <Input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="Item title" style={{ flex: 1, minWidth: 120 }} />
          <Input value={itemTime} onChange={(e) => setItemTime(e.target.value)} placeholder="19:15" style={{ width: 70 }} />
          <Input value={itemOwnerRole} onChange={(e) => setItemOwnerRole(e.target.value)} placeholder="Owner label" style={{ width: 120 }} />
          <Btn variant="primary" onClick={insertItem}>Insert</Btn>
        </div>
      </Blueprint>

      <Blueprint style={{ minWidth: 0 }}>
        <h4 style={{ margin: "0 0 2px" }}>Checklist &amp; assignment</h4>
        <p className="text-muted" style={{ fontSize: 11, margin: "0 0 12px" }}>
          Every task carries an owning area and a phase.
        </p>
        <div style={{ display: "flex", flexDirection: "column", maxHeight: 340, overflow: "auto", paddingRight: 3 }}>
          {tasks.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 6px", borderBottom: "1px solid var(--color-divider)" }}>
              <span style={{ width: 8, height: 8, flex: "none", background: t.done ? "var(--color-accent-700)" : "var(--color-neutral-400)" }} />
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 12.5 }}>{t.task}</span>
                <span className="text-muted" style={{ fontSize: 10, letterSpacing: ".04em" }}>{t.phase}</span>
              </span>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 9.5,
                  letterSpacing: ".11em",
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  background: "var(--color-accent-100)",
                  color: "var(--color-accent-800)",
                  whiteSpace: "nowrap",
                }}
              >
                {t.area}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
          <Input value={taskArea} onChange={(e) => setTaskArea(e.target.value)} placeholder="Area, e.g. Ushering" style={{ width: 130 }} />
          <div style={{ display: "flex", gap: 4 }}>
            {TASK_PHASES.map((p) => (
              <Chip key={p} active={taskPhase === p} onClick={() => setTaskPhase(p)}>{p}</Chip>
            ))}
          </div>
          <Input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="New task" style={{ flex: 1, minWidth: 120 }} />
          <Btn variant="primary" onClick={addTask}>Add</Btn>
        </div>
      </Blueprint>
    </div>
  );
}

function ClientLinkPanel({ flash }: { flash: (m: string) => void }) {
  const { org, slug } = useOrg();
  const { data: events } = useOrgCollection<HHEvent>("events", org?.id, orderBy("createdAt", "desc"));
  const [eventId, setEventId] = useState<string | null>(null);
  const activeEventId = eventId || events[0]?.id || null;
  const active = events.find((e) => e.id === activeEventId);
  const [copied, setCopied] = useState(false);

  if (!active) return null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/${slug}/client/?e=${active.id}&t=${active.clientToken}`;

  async function rotate() {
    if (!active) return;
    await updateDoc(doc(db, "events", active.id), { clientToken: genToken(), clientTokenActive: true });
    flash("Old link revoked — a fresh one has been issued, send it to the client");
  }

  return (
    <Blueprint style={{ gridColumn: "1/-1" }}>
      <h4 style={{ margin: "0 0 10px" }}>Client link</h4>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {events.map((ev) => (
          <Chip key={ev.id} active={activeEventId === ev.id} onClick={() => setEventId(ev.id)}>{ev.name}</Chip>
        ))}
      </div>
      <div style={{ padding: "13px 15px", background: "var(--color-accent-100)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
            Shareable client link · no sign-in, read only
          </span>
          <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link}</span>
        </span>
        <Btn
          variant="primary"
          onClick={() => {
            navigator.clipboard?.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
        >
          {copied ? "✓ Link copied" : "Copy link"}
        </Btn>
        <Btn onClick={rotate}>Revoke &amp; reissue</Btn>
      </div>
    </Blueprint>
  );
}
