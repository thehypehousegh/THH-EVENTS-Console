"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { addDoc, collection, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection, useDocument } from "@/lib/hooks";
import { Blueprint, Btn, Chip, Divider, Input } from "@/components/ui";
import type { HHEvent, ScheduleItem, ClientComment } from "@/lib/types";

const TOPICS = ["The programme", "Music", "Food", "Guests", "Something else"];

export default function ClientPortalPage() {
  return (
    <Suspense fallback={null}>
      <ClientPortalInner />
    </Suspense>
  );
}

function ClientPortalInner() {
  const params = useSearchParams();
  const eventId = params.get("e");
  const token = params.get("t");

  const { data: event, loading } = useDocument<HHEvent>(eventId ? `events/${eventId}` : null);

  if (!eventId || !token) {
    return <Centered text="This link is missing its access token." />;
  }
  if (loading) return <Centered text="Loading…" />;
  if (!event || !event.clientTokenActive || event.clientToken !== token) {
    return <Centered text="This link has been revoked or is no longer valid. Ask your coordinator for a fresh one." />;
  }

  return <ClientPortalBody event={event} />;
}

function Centered({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 20 }}>
      <p className="text-muted" style={{ fontSize: 13, textAlign: "center", maxWidth: 360 }}>{text}</p>
    </div>
  );
}

function ClientPortalBody({ event }: { event: HHEvent }) {
  const { data: schedule } = useCollection<ScheduleItem>(`events/${event.id}/scheduleItems`, orderBy("order"));
  const { data: updates } = useCollection<{ who: string; text: string; createdAt: number }>(
    `events/${event.id}/clientUpdates`,
    orderBy("createdAt", "desc")
  );
  const { data: comments } = useCollection<ClientComment>(`events/${event.id}/clientComments`, orderBy("createdAt", "desc"));

  const [commentOpen, setCommentOpen] = useState(false);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const done = schedule.filter((s) => s.status === "done").length;
  const live = schedule.find((s) => s.status === "live");
  const liveIdx = schedule.indexOf(live!);
  const next = schedule[liveIdx + 1];
  const schedPct = schedule.length ? Math.round((done / schedule.length) * 100) : 0;

  async function sendComment() {
    if (!draft.trim()) return;
    setBusy(true);
    await addDoc(collection(db, "events", event.id, "clientComments"), {
      topic,
      who: "Client",
      text: draft.trim(),
      status: "new",
      createdAt: Date.now(),
    });
    await addDoc(collection(db, "events", event.id, "feed"), {
      kind: "client",
      route: "Client → Main",
      text: `[${topic}] ${draft.trim()}`,
      createdAt: Date.now(),
    });
    setDraft("");
    setCommentOpen(false);
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(14px,3.6vw,20px) clamp(12px,3.4vw,16px)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 20, alignItems: "start" }}>
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <Image src="/hype-house-logo.png" alt="The Hype House" width={54} height={54} style={{ objectFit: "contain", marginBottom: 14 }} />
            <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
              {event.type} · {event.date}
            </span>
            <h3 style={{ margin: "7px 0 6px", fontSize: "clamp(23px,5.5vw,29px)" }}>{event.name}</h3>
            <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
              {event.location} · {event.guests} guests · coordinated by The Hype House
            </p>
          </div>

          <Blueprint>
            <h4 style={{ margin: 0 }}>Where we are</h4>
            <div style={{ margin: "14px 0 4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 12 }}>Programme</span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 19, color: "var(--color-accent-700)" }}>{schedPct}%</span>
              </div>
              <div style={{ height: 9, background: "var(--color-neutral-300)" }}>
                <div style={{ height: "100%", width: `${schedPct}%`, background: "var(--color-accent-700)" }} />
              </div>
            </div>
            <Divider />
            <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Happening now</span>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 21, lineHeight: 1.15, marginTop: 4 }}>{live?.title || "—"}</div>
            <span className="text-muted" style={{ fontSize: 12 }}>Next: {next?.title || "End of programme"}</span>
          </Blueprint>

          <Blueprint>
            <h4 style={{ margin: "0 0 3px" }}>Your programme</h4>
            <p className="text-muted" style={{ fontSize: 11, margin: "0 0 12px" }}>Updates by itself as the team ticks items off.</p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {schedule.map((it) => {
                const on = it.status === "live";
                const dn = it.status === "done";
                return (
                  <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", borderBottom: "1px solid var(--color-divider)", background: on ? "var(--color-accent-200)" : undefined }}>
                    <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, width: 40, color: "var(--color-accent-700)" }}>{it.time}</span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 14, flex: 1, minWidth: 0, opacity: dn ? 0.5 : 1 }}>{it.title}</span>
                    {on && <span className="text-muted" style={{ fontSize: 9 }}>NOW</span>}
                  </div>
                );
              })}
            </div>
          </Blueprint>
        </div>

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <Blueprint>
            <h4 style={{ margin: "0 0 3px" }}>Updates from your coordinator</h4>
            <p className="text-muted" style={{ fontSize: 11, margin: "0 0 12px" }}>Curated — the team&apos;s own radio chatter stays on their side.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {updates.map((u) => (
                <div key={u.id} style={{ padding: 11, borderLeft: "2px solid var(--color-accent-500)", background: "var(--color-neutral-100)" }}>
                  <b style={{ fontFamily: "var(--font-heading)", fontSize: 13 }}>{u.who}</b>
                  <p style={{ margin: "4px 0 0", fontSize: 13 }}>{u.text}</p>
                </div>
              ))}
              {updates.length === 0 && <p className="text-muted" style={{ fontSize: 12 }}>No updates posted yet.</p>}
            </div>
          </Blueprint>

          <Blueprint>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
              <h4 style={{ margin: 0 }}>Your notes to the team</h4>
              <Btn variant="primary" onClick={() => setCommentOpen((v) => !v)} style={{ marginLeft: "auto" }}>
                {commentOpen ? "Close" : "Add a note"}
              </Btn>
            </div>
            <p className="text-muted" style={{ fontSize: 11, margin: "6px 0 0" }}>Anything you send lands with the coordinator within seconds. No account needed.</p>

            {commentOpen && (
              <div style={{ marginTop: 13, padding: 13, border: "1px solid var(--color-divider)", background: "var(--color-accent-100)" }}>
                <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>About</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "7px 0 11px" }}>
                  {TOPICS.map((t) => (
                    <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>{t}</Chip>
                  ))}
                </div>
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your note…" style={{ width: "100%", marginBottom: 9 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="primary" disabled={busy} onClick={sendComment} style={{ flex: 1 }}>Send to coordinator</Btn>
                  <button onClick={() => setCommentOpen(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {comments.map((c) => (
                <div key={c.id} style={{ padding: 11, border: "1px solid var(--color-divider)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span className="tag tag-accent">{c.topic}</span>
                    <b style={{ fontFamily: "var(--font-heading)", fontSize: 12.5 }}>{c.who}</b>
                  </div>
                  <p style={{ margin: "5px 0 0", fontSize: 13 }}>{c.text}</p>
                </div>
              ))}
            </div>
          </Blueprint>
        </div>
      </div>
    </div>
  );
}
