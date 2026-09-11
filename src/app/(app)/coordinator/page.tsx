"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EventDataProvider, useEventData } from "@/lib/EventDataProvider";
import { useAuth } from "@/lib/AuthProvider";
import { Blueprint, Btn, Chip, Divider, Input, Toast } from "@/components/ui";
import { ScheduleRow } from "@/components/ScheduleRow";
import { SEVERITIES, type Density, type Severity } from "@/lib/types";

export default function CoordinatorPage() {
  return (
    <Suspense fallback={null}>
      <CoordinatorInner />
    </Suspense>
  );
}

function CoordinatorInner() {
  const eventId = useSearchParams().get("event");
  if (!eventId) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: 20 }}>
        <p className="text-muted">Pick an event from the events list first.</p>
        <Link href="/events/" className="btn btn-primary" style={{ marginTop: 10 }}>Go to events</Link>
      </div>
    );
  }
  return (
    <EventDataProvider eventId={eventId}>
      <CoordinatorBody />
    </EventDataProvider>
  );
}

function CoordinatorBody() {
  const { person, role } = useAuth();
  const { event, schedule, tasks, feed, roll, loading, toast, toggleTask, raiseEscalation, markRoll, log } = useEventData();
  const [density, setDensity] = useState<Density>("List");
  const [online, setOnline] = useState(true);
  const [escOpen, setEscOpen] = useState<Severity | null>(null);
  const [escNote, setEscNote] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hh-density") as Density | null;
      if (saved) setDensity(saved);
    } catch {
      /* ignore */
    }
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  function pickDensity(d: Density) {
    setDensity(d);
    try {
      localStorage.setItem("hh-density", d);
    } catch {
      /* ignore */
    }
  }

  if (loading || !event) return <p className="text-muted" style={{ padding: 20 }}>Loading…</p>;

  const myArea = role ? role.name.replace(/ Coordinator$/i, "").trim() : "";
  const mine = tasks.filter((t) => t.area === myArea);
  const mineDone = mine.filter((t) => t.done).length;
  const overdue = mine.filter((t) => !t.done); // due-time comparison omitted; shown as "pending"
  const myRoll = roll.find((r) => r.role === role?.name);

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(14px,3.6vw,22px) clamp(12px,3.4vw,16px)" }}>
      <Blueprint style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", marginBottom: 12 }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>You are assigned to</span>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(21px,5vw,26px)", lineHeight: 1.1, margin: "5px 0 5px" }}>{event.name}</div>
          <span className="text-muted" style={{ fontSize: 12.5 }}>
            {event.date} · {event.location} · your role: {role?.name || "—"}
          </span>
        </div>
        {!online && (
          <span style={{ padding: "6px 10px", background: "var(--hh-danger)", color: "var(--hh-danger-ink)", fontFamily: "var(--font-heading)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" }}>
            Offline — saved on this device
          </span>
        )}
      </Blueprint>

      {myRoll && myRoll.state !== "on" && (
        <button
          onClick={() => markRoll(myRoll.id, "on")}
          className="btn btn-primary"
          style={{ width: "100%", minHeight: 48, fontSize: 14, marginBottom: 12, background: "var(--hh-warn)", color: "var(--hh-warn-ink)", borderColor: "var(--hh-warn)" }}
        >
          I am on — check me in
        </button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 16, marginBottom: 16 }}>
        <Blueprint>
          <h4 style={{ margin: "0 0 12px" }}>Your checklist</h4>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 14 }}>
            <MiniStat value={String(mineDone)} label="Completed" color="var(--color-accent-700)" />
            <MiniStat value={String(mine.length - mineDone)} label="Pending" color="var(--color-text)" />
          </div>
          <Divider my={0} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10, maxHeight: 260, overflow: "auto" }}>
            {mine.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTask(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  minHeight: 48,
                  padding: "9px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  border: "1px solid var(--color-divider)",
                  background: t.done ? "var(--color-neutral-100)" : "transparent",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-heading)",
                    fontSize: 13,
                    border: `1px solid ${t.done ? "var(--color-accent-700)" : "var(--color-text)"}`,
                    background: t.done ? "var(--color-accent-700)" : "transparent",
                    color: t.done ? "var(--hh-paper)" : "inherit",
                  }}
                >
                  {t.done ? "✓" : ""}
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.3, opacity: t.done ? 0.5 : 1, textDecoration: t.done ? "line-through" : undefined }}>{t.task}</span>
              </button>
            ))}
            {mine.length === 0 && <p className="text-muted" style={{ fontSize: 12 }}>No tasks assigned to your area yet.</p>}
          </div>
        </Blueprint>

        <Blueprint style={{ minWidth: 0 }}>
          <h4 style={{ margin: "0 0 11px" }}>Announcements</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflow: "auto", paddingRight: 3 }}>
            {feed.slice().reverse().map((m) => (
              <div key={m.id} style={{ padding: "8px 10px", borderLeft: "2px solid var(--color-accent-500)", background: "var(--color-neutral-100)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, flexWrap: "wrap" }}>
                  <b style={{ fontFamily: "var(--font-heading)", fontSize: 12 }}>{m.route}</b>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>{m.text}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Reply to the team…" style={{ flex: 1, minWidth: 0 }} />
            <Btn
              variant="primary"
              onClick={() => {
                if (!draft.trim()) return;
                log("ping", `${role?.name || "Coordinator"} → Main`, draft.trim());
                setDraft("");
              }}
            >
              Send
            </Btn>
          </div>
        </Blueprint>

        <Blueprint style={{ minWidth: 0 }}>
          <h4 style={{ margin: "0 0 3px" }}>Programme</h4>
          <p className="text-muted" style={{ fontSize: 11, margin: "0 0 10px" }}>The rest is context.</p>
          <div style={{ display: "flex", flexDirection: "column", maxHeight: 260, overflow: "auto", paddingRight: 3 }}>
            {schedule.map((it) => (
              <ScheduleRow key={it.id} it={it} compact />
            ))}
          </div>
        </Blueprint>
      </div>

      <div style={{ maxWidth: "70ch", marginBottom: 16 }}>
        <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
          {role?.name} · {person?.name}
        </span>
        <h3 style={{ margin: "6px 0 6px" }}>Your run view</h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["Focus", "List", "Programme"] as Density[]).map((d) => (
            <Chip key={d} active={density === d} onClick={() => pickDensity(d)}>{d}</Chip>
          ))}
        </div>
      </div>

      {density === "Focus" && <FocusPhone mine={mine} onToggle={toggleTask} onSev={(s) => setEscOpen(s)} />}
      {density === "List" && <ListPhone mine={mine} onToggle={toggleTask} onSev={(s) => setEscOpen(s)} />}
      {density === "Programme" && <ProgrammePhone schedule={schedule} mine={mine} feed={feed} onToggle={toggleTask} onSev={(s) => setEscOpen(s)} />}

      {escOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "var(--hh-scrim)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 18 }}>
          <Blueprint style={{ width: "min(420px,100%)", background: "var(--color-bg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 9.5,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  background: SEVERITIES.find((s) => s.key === escOpen)?.bg,
                  color: SEVERITIES.find((s) => s.key === escOpen)?.fg,
                }}
              >
                {escOpen}
              </span>
            </div>
            <h4 style={{ margin: "12px 0 3px" }}>Add detail — optional</h4>
            <Input value={escNote} onChange={(e) => setEscNote(e.target.value)} placeholder="What is happening?" style={{ width: "100%", marginBottom: 9 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                variant="primary"
                style={{ flex: 1 }}
                onClick={async () => {
                  await raiseEscalation(escOpen, role?.name || "Coordinator", escNote);
                  setEscOpen(null);
                  setEscNote("");
                }}
              >
                Send
              </Btn>
              <Btn onClick={() => { setEscOpen(null); setEscNote(""); }}>Cancel</Btn>
            </div>
          </Blueprint>
        </div>
      )}
      <Toast text={toast} />
    </div>
  );
}

function MiniStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: 34, lineHeight: 1, color }}>{value}</span>
      <span style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

const phoneStyle: React.CSSProperties = {
  width: "min(360px,100%)",
  height: "min(660px,78vh)",
  minHeight: 520,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "var(--color-bg)",
  boxShadow: "var(--shadow-md)",
  border: "1px solid var(--color-divider)",
};
const phoneBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 15px 10px",
  background: "var(--color-accent-900)",
  color: "var(--hh-paper)",
};

type MiniTask = { id: string; task: string; done: boolean; phase: string };

function SevButtons({ onSev }: { onSev: (s: Severity) => void }) {
  return (
    <div style={{ borderTop: "1px solid var(--color-divider)", padding: "10px 12px", display: "flex", gap: 6, background: "var(--color-bg)" }}>
      {SEVERITIES.map((s) => (
        <button
          key={s.key}
          onClick={() => onSev(s.key)}
          style={{ flex: 1, minHeight: 48, cursor: "pointer", border: "none", fontFamily: "var(--font-heading)", fontSize: 12.5, background: s.bg, color: s.fg }}
        >
          {s.key}
        </button>
      ))}
    </div>
  );
}

function FocusPhone({ mine, onToggle, onSev }: { mine: MiniTask[]; onToggle: (id: string) => void; onSev: (s: Severity) => void }) {
  const focus = mine.find((t) => !t.done);
  return (
    <div style={phoneStyle}>
      <div style={phoneBarStyle}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>Focus</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px 15px", gap: 14 }}>
        {focus ? (
          <>
            <div>
              <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Your next task · {focus.phase}</span>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 29, lineHeight: 1.12, margin: "8px 0 6px" }}>{focus.task}</div>
            </div>
            <button onClick={() => onToggle(focus.id)} className="btn btn-primary" style={{ minHeight: 64, fontSize: 17, width: "100%" }}>
              Mark done
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, lineHeight: 1.15 }}>All your tasks are ticked</div>
          </div>
        )}
      </div>
      <SevButtons onSev={onSev} />
    </div>
  );
}

function ListPhone({ mine, onToggle, onSev }: { mine: MiniTask[]; onToggle: (id: string) => void; onSev: (s: Severity) => void }) {
  const phases = ["Setup", "Live", "Teardown"];
  return (
    <div style={phoneStyle}>
      <div style={phoneBarStyle}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>Full list</span>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "12px 15px 16px", display: "flex", flexDirection: "column", gap: 15 }}>
        {phases.map((ph) => {
          const list = mine.filter((t) => t.phase === ph);
          if (list.length === 0) return null;
          return (
            <div key={ph} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>{ph}</span>
              {list.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onToggle(t.id)}
                  style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", minHeight: 46, padding: "7px 9px", cursor: "pointer", textAlign: "left", border: "1px solid var(--color-divider)", background: t.done ? "var(--color-neutral-100)" : "transparent" }}
                >
                  <span style={{ width: 22, height: 22, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontFamily: "var(--font-heading)", border: `1px solid ${t.done ? "var(--color-accent-700)" : "var(--color-text)"}`, background: t.done ? "var(--color-accent-700)" : "transparent", color: t.done ? "var(--hh-paper)" : "inherit" }}>
                    {t.done ? "✓" : ""}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.3, textAlign: "left", opacity: t.done ? 0.5 : 1, textDecoration: t.done ? "line-through" : undefined }}>{t.task}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <SevButtons onSev={onSev} />
    </div>
  );
}

function ProgrammePhone({
  schedule,
  mine,
  feed,
  onToggle,
  onSev,
}: {
  schedule: { id: string; time: string; title: string; owner: string; status: string }[];
  mine: MiniTask[];
  feed: { id: string; route: string; text: string }[];
  onToggle: (id: string) => void;
  onSev: (s: Severity) => void;
}) {
  const liveTasks = mine.filter((t) => t.phase === "Live");
  return (
    <div style={phoneStyle}>
      <div style={phoneBarStyle}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>Programme</span>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "12px 15px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
          {schedule.map((it) => (
            <ScheduleRow key={it.id} it={it} compact />
          ))}
        </div>
        <div style={{ padding: "8px 15px 10px" }}>
          <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Your tasks on this item</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 7 }}>
            {liveTasks.map((t) => (
              <button key={t.id} onClick={() => onToggle(t.id)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", minHeight: 40, padding: "6px 8px", cursor: "pointer", textAlign: "left", border: "1px solid var(--color-divider)" }}>
                <span>{t.done ? "✓" : "○"}</span>
                <span style={{ fontSize: 13 }}>{t.task}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "10px 15px 14px", borderTop: "1px solid var(--color-divider)", background: "var(--color-neutral-100)" }}>
          <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Event feed</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 7 }}>
            {feed.slice(-3).reverse().map((m) => (
              <div key={m.id} style={{ padding: "6px 8px", background: "var(--color-bg)" }}>
                <b style={{ fontFamily: "var(--font-heading)", fontSize: 11.5 }}>{m.route}</b>
                <p style={{ margin: "3px 0 0", fontSize: 12 }}>{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SevButtons onSev={onSev} />
    </div>
  );
}
