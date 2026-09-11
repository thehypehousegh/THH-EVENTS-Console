"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EventDataProvider, useEventData } from "@/lib/EventDataProvider";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { Blueprint, Btn, Divider, SevPill, Tag, Toast } from "@/components/ui";
import { PrintBackup } from "@/components/PrintBackup";
import { ScheduleRow } from "@/components/ScheduleRow";

const EMERGENCY = [
  { label: "Ambulance · National", phone: "193" },
  { label: "Fire Service", phone: "192" },
  { label: "Police", phone: "191" },
];

const AREAS_FALLBACK = ["Ushering", "Catering", "Protocol", "Sound/AV", "Decor", "Logistics"];

export default function ControlPage() {
  return (
    <Suspense fallback={null}>
      <ControlInner />
    </Suspense>
  );
}

function ControlInner() {
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
      <ControlBody />
    </EventDataProvider>
  );
}

function ControlBody() {
  const { hasPerm } = useAuth();
  const { personName, people } = useAppData();
  const {
    event,
    schedule,
    tasks,
    escalations,
    changes,
    roll,
    feed,
    loading,
    toast,
    advance,
    closeEscalation,
    settleChange,
    startRollCall,
    markRoll,
    promoteDeputy,
    log,
  } = useEventData();

  if (loading || !event) {
    return <p className="text-muted" style={{ padding: 20 }}>Loading…</p>;
  }
  if (!hasPerm("advance") && !hasPerm("approve")) {
    return <p className="text-muted" style={{ padding: 20 }}>You don&apos;t have Control Room access for this event.</p>;
  }

  const liveIdx = schedule.findIndex((s) => s.status === "live");
  const live = schedule[liveIdx] || schedule[0];
  const doneCount = schedule.filter((s) => s.status === "done").length;
  const allDoneCount = tasks.filter((t) => t.done).length;
  const openEsc = escalations.filter((e) => e.status === "open");
  const areaNames = Array.from(new Set(tasks.map((t) => t.area))).sort() || AREAS_FALLBACK;

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(14px,3.6vw,22px) clamp(12px,3.4vw,16px)" }}>
      <PrintBackup event={event} schedule={schedule} tasks={tasks} emergency={EMERGENCY} controllerName={personName(event.controllerPersonId)} deputyName={personName(event.deputyPersonId)} />

      <div className="hh-screen">
        <Blueprint style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "center", marginBottom: 16 }}>
          <div style={{ minWidth: 220, flex: 1 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(24px,6vw,31px)", lineHeight: 1 }}>{event.name}</div>
            <div style={{ fontSize: 9.5, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--color-accent-700)", marginTop: 6 }}>
              {event.date} · {event.location}
            </div>
          </div>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
            <Stat value={`${Math.round((doneCount / Math.max(1, schedule.length)) * 100)}%`} label="Programme run" />
            <Stat value={`${Math.round((allDoneCount / Math.max(1, tasks.length)) * 100)}%`} label="Checklist executed" />
            <Stat value={String(openEsc.length)} label="Open escalations" />
          </div>
        </Blueprint>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,310px),1fr))", gap: 16, alignItems: "start" }}>
          {/* Run sheet */}
          <Blueprint style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
              <h4 style={{ margin: 0 }}>Run sheet</h4>
              <span className="text-muted" style={{ fontSize: 11 }}>{doneCount} of {schedule.length} complete</span>
              {hasPerm("advance") && (
                <Btn variant="primary" onClick={advance} style={{ marginLeft: "auto" }}>Done &amp; advance</Btn>
              )}
            </div>
            <Divider />
            <div style={{ display: "flex", flexDirection: "column", maxHeight: 520, overflow: "auto", paddingRight: 3 }}>
              {schedule.map((it) => (
                <ScheduleRow key={it.id} it={it} />
              ))}
            </div>
          </Blueprint>

          {/* Control & cover + Roll call + Paper backup + Emergency */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <Blueprint>
              <h4 style={{ margin: "0 0 2px" }}>Control &amp; cover</h4>
              <p className="text-muted" style={{ fontSize: 11, margin: "0 0 12px" }}>
                If the controller&apos;s phone dies the event still needs someone holding it.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                <div style={{ minWidth: 130 }}>
                  <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Controller</span>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, marginTop: 3 }}>{personName(event.controllerPersonId)}</div>
                </div>
                <div style={{ minWidth: 130 }}>
                  <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Named deputy</span>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, marginTop: 3 }}>{personName(event.deputyPersonId)}</div>
                </div>
                {event.deputyPersonId && hasPerm("accounts") && (
                  <Btn onClick={promoteDeputy} style={{ marginLeft: "auto", alignSelf: "center" }}>Hand over control</Btn>
                )}
              </div>
              <Divider />
              <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", marginBottom: 9 }}>
                <h4 style={{ margin: 0 }}>Roll call</h4>
                <span className="text-muted" style={{ fontSize: 11 }}>{roll.filter((r) => r.state === "on").length} of {roll.length} confirmed</span>
                <Btn onClick={startRollCall} style={{ marginLeft: "auto" }}>Run roll call</Btn>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {roll.map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "9px 6px", borderBottom: "1px solid var(--color-divider)" }}>
                    <RollMark state={r.state} />
                    <span style={{ display: "flex", flexDirection: "column", minWidth: 120, flex: 1 }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: 13.5 }}>{r.role}</span>
                      <span className="text-muted" style={{ fontSize: 10.5 }}>{r.who} · {r.phone}</span>
                    </span>
                    <span className="text-muted" style={{ fontSize: 10.5, minWidth: 92 }}>
                      {r.state === "on" ? "On the floor" : r.state === "waiting" ? "No answer yet" : "Unreachable"}
                    </span>
                    <Btn onClick={() => markRoll(r.id, r.state === "on" ? "waiting" : "on")}>{r.state === "on" ? "Clear" : "Mark on"}</Btn>
                  </div>
                ))}
              </div>
              <Divider />
              <h4 style={{ margin: "0 0 3px" }}>Paper backup</h4>
              <p className="text-muted" style={{ fontSize: 11, margin: "0 0 10px" }}>Print before doors open</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn variant="primary" onClick={() => window.print()}>Print run sheet &amp; checklist</Btn>
              </div>
              <Divider />
              <h4 style={{ margin: "0 0 3px" }}>Emergency &amp; key numbers</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,170px),1fr))", gap: 8 }}>
                {EMERGENCY.map((c) => (
                  <a key={c.label} href={`tel:${c.phone.replace(/\s/g, "")}`} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "9px 10px", minHeight: 44, border: "1px solid var(--color-divider)", textDecoration: "none", color: "var(--color-text)" }}>
                    <span style={{ fontSize: 10.5 }}>{c.label}</span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{c.phone}</span>
                  </a>
                ))}
              </div>
            </Blueprint>

            <Blueprint>
              <h4 style={{ margin: "0 0 2px" }}>Checklist execution</h4>
              <p className="text-muted" style={{ fontSize: 11, margin: "0 0 13px" }}>Ticked by the coordinator who owns the area, live.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,140px),1fr))", gap: 13 }}>
                {areaNames.map((n) => {
                  const list = tasks.filter((t) => t.area === n);
                  const d = list.filter((t) => t.done).length;
                  const pct = list.length ? Math.round((d / list.length) * 100) : 0;
                  return (
                    <div key={n} style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: 13 }}>{n}</span>
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: 13, color: "var(--color-accent-700)" }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "var(--color-neutral-300)" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "var(--color-accent-700)" : "var(--color-accent-500)" }} />
                      </div>
                      <span className="text-muted" style={{ fontSize: 10 }}>{d} of {list.length} ticked</span>
                    </div>
                  );
                })}
              </div>
            </Blueprint>

            <Blueprint>
              <h4 style={{ margin: "0 0 2px" }}>Schedule changes</h4>
              <p className="text-muted" style={{ fontSize: 11, margin: "0 0 12px" }}>Requests from coordinators awaiting your approval.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {changes.map((r) => (
                  <div key={r.id} style={{ padding: 11, border: "1px solid var(--color-divider)", background: r.status === "open" ? "var(--color-accent-100)" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Tag variant={r.kind === "Skip" ? "neutral" : "accent"}>{r.kind}</Tag>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: 14 }}>{r.target}</span>
                      <span className="text-muted" style={{ fontSize: 10.5, marginLeft: "auto" }}>{r.byLabel}</span>
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 12.5 }}>{r.reason}</p>
                    {r.status === "open" ? (
                      <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
                        <Btn variant="primary" onClick={() => settleChange(r.id, true)}>Approve &amp; push</Btn>
                        <Btn onClick={() => settleChange(r.id, false)}>Decline</Btn>
                      </div>
                    ) : (
                      <span style={{ display: "block", marginTop: 8, fontFamily: "var(--font-heading)", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                        {r.status === "approved" ? "Approved" : r.status === "auto" ? "Own area · logged" : "Declined"}
                      </span>
                    )}
                  </div>
                ))}
                {changes.length === 0 && <p className="text-muted" style={{ fontSize: 12 }}>No changes to the published order.</p>}
              </div>
            </Blueprint>
          </div>

          {/* Escalations + feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <Blueprint>
              <h4 style={{ margin: "0 0 11px" }}>Escalation lane</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {escalations.map((e) => (
                  <div key={e.id} style={{ padding: 11, border: "1px solid var(--color-divider)", borderLeft: "3px solid var(--hh-danger)", opacity: e.status === "open" ? 1 : 0.62 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <SevPill severity={e.severity} />
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: 13.5 }}>{e.fromLabel}</span>
                      <span className="text-muted" style={{ fontSize: 10.5, marginLeft: "auto" }}>
                        {e.autoEsc ? "Passed to deputy" : ""}
                      </span>
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 12.5 }}>{e.text}</p>
                    <span className="text-muted" style={{ fontSize: 10.5 }}>{e.link}</span>
                    {e.status === "open" && (
                      <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
                        <Btn variant="primary" onClick={() => closeEscalation(e.id, false)}>Acknowledge</Btn>
                        <Btn onClick={() => closeEscalation(e.id, true)}>Send backup</Btn>
                      </div>
                    )}
                  </div>
                ))}
                {escalations.filter((e) => e.status === "open").length === 0 && <p className="text-muted" style={{ fontSize: 12 }}>Lane is clear.</p>}
              </div>
            </Blueprint>

            <FeedPanel feed={feed} onSend={(target, text) => log("broadcast", `Main → ${target}`, text)} />

            {hasPerm("client") && <ClientUpdateComposer eventId={event.id} />}
          </div>
        </div>
      </div>
      <Toast text={toast} />
    </div>
  );
}

function ClientUpdateComposer({ eventId }: { eventId: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Blueprint>
      <h4 style={{ margin: "0 0 3px" }}>Post a client update</h4>
      <p className="text-muted" style={{ fontSize: 11, margin: "0 0 10px" }}>
        Shows on the public client link only — escalations and internal chatter never reach it.
      </p>
      <div style={{ display: "flex", gap: 7 }}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Everyone is seated, running six minutes behind…" style={{ flex: 1, minWidth: 0 }} />
        <Btn
          variant="primary"
          disabled={busy}
          onClick={async () => {
            if (!text.trim()) return;
            setBusy(true);
            const { addDoc, collection } = await import("firebase/firestore");
            await addDoc(collection(db, "events", eventId, "clientUpdates"), {
              who: "Your coordinator",
              text: text.trim(),
              createdAt: Date.now(),
            });
            setText("");
            setBusy(false);
          }}
        >
          Post
        </Btn>
      </div>
    </Blueprint>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: 30, lineHeight: 1, color: "var(--color-accent-700)" }}>{value}</span>
      <span style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function RollMark({ state }: { state: string }) {
  const on = state === "on";
  const waiting = state === "waiting";
  return (
    <span
      style={{
        width: 26,
        height: 26,
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-heading)",
        fontSize: 13,
        border: `1px solid ${on ? "var(--color-accent-700)" : waiting ? "var(--hh-warn)" : "var(--hh-danger)"}`,
        background: on ? "var(--color-accent-700)" : waiting ? "var(--hh-warn)" : "var(--hh-danger)",
        color: on ? "var(--hh-paper)" : waiting ? "var(--hh-warn-ink)" : "var(--hh-danger-ink)",
      }}
    >
      {on ? "✓" : waiting ? "?" : "✕"}
    </span>
  );
}


function FeedPanel({ feed, onSend }: { feed: { id: string; kind: string; route: string; text: string; createdAt: number }[]; onSend: (target: string, text: string) => void }) {
  const targets = ["All roles", "MC", "DJ", "Ushering", "Catering"];
  return (
    <FeedPanelInner feed={feed} targets={targets} onSend={onSend} />
  );
}

function FeedPanelInner({ feed, targets, onSend }: { feed: { id: string; kind: string; route: string; text: string; createdAt: number }[]; targets: string[]; onSend: (target: string, text: string) => void }) {
  const [target, setTarget] = useState(targets[0]);
  const [draft, setDraft] = useState("");
  const KIND_STYLE: Record<string, [string, string, string]> = {
    broadcast: ["var(--color-accent-200)", "var(--color-accent-900)", "var(--color-accent-500)"],
    ping: ["var(--color-neutral-300)", "var(--color-neutral-900)", "var(--color-neutral-500)"],
    escalation: ["var(--hh-danger-tint)", "var(--hh-danger-tint-ink)", "var(--hh-danger)"],
    client: ["var(--color-accent-700)", "var(--hh-paper)", "var(--color-accent-700)"],
    system: ["var(--color-accent-900)", "var(--hh-paper)", "var(--color-accent-900)"],
  };
  return (
    <Blueprint>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <h4 style={{ margin: 0 }}>Event feed</h4>
        <span className="text-muted" style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase" }}>Everyone sees it</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflow: "auto", paddingRight: 3 }}>
        {feed.slice().reverse().map((m) => {
          const [bg, fg, bar] = KIND_STYLE[m.kind] || KIND_STYLE.system;
          return (
            <div key={m.id} style={{ padding: "8px 10px", borderLeft: `2px solid ${bar}`, background: "var(--color-neutral-100)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", padding: "2px 6px", background: bg, color: fg }}>
                  {m.kind}
                </span>
                <b style={{ fontFamily: "var(--font-heading)", fontSize: 12 }}>{m.route}</b>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>{m.text}</p>
            </div>
          );
        })}
      </div>
      <Divider />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {targets.map((t) => (
          <button
            key={t}
            onClick={() => setTarget(t)}
            className="tag"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 11,
              letterSpacing: ".09em",
              textTransform: "uppercase",
              padding: "9px 12px",
              minHeight: 38,
              cursor: "pointer",
              border: `1px solid ${target === t ? "var(--color-accent-700)" : "var(--color-divider)"}`,
              background: target === t ? "var(--color-accent-700)" : "transparent",
              color: target === t ? "var(--hh-paper)" : "var(--color-text)",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message…"
          style={{ flex: 1, minWidth: 0 }}
        />
        <Btn
          variant="primary"
          onClick={() => {
            if (!draft.trim()) return;
            onSend(target, draft.trim());
            setDraft("");
          }}
        >
          Send
        </Btn>
      </div>
    </Blueprint>
  );
}
