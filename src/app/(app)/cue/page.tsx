"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EventDataProvider, useEventData } from "@/lib/EventDataProvider";
import { Blueprint, Toast } from "@/components/ui";

export default function CuePage() {
  return (
    <Suspense fallback={null}>
      <CueInner />
    </Suspense>
  );
}

function CueInner() {
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
      <CueBody />
    </EventDataProvider>
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

function CueBody() {
  const { schedule, feed, loading, toast, advance, log } = useEventData();
  if (loading) return <p className="text-muted" style={{ padding: 20 }}>Loading…</p>;

  const liveIdx = schedule.findIndex((s) => s.status === "live");
  const live = schedule[liveIdx] || schedule[0];
  const next = schedule[liveIdx + 1];
  const mcInbox = feed.filter((m) => /MC|All roles|Run sheet/i.test(m.route)).slice(-4).reverse();
  const djInbox = feed.filter((m) => /DJ|All roles|Run sheet/i.test(m.route)).slice(-4).reverse();

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(14px,3.6vw,22px) clamp(12px,3.4vw,16px)" }}>
      <div style={{ maxWidth: "70ch", marginBottom: 20 }}>
        <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
          Day-of accounts
        </span>
        <h3 style={{ margin: "6px 0 6px" }}>MC and DJ cue view</h3>
        <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
          The current cue at a size you can read from the stage, and the two or three things these roles actually send.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(16px,3vw,24px)", alignItems: "flex-start", justifyContent: "center" }}>
        <div style={phoneStyle}>
          <div style={phoneBarStyle}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>MC</span>
          </div>
          <div style={{ padding: "clamp(14px,3.6vw,20px) clamp(12px,3.4vw,16px)", background: "var(--color-accent-900)", color: "var(--hh-paper)" }}>
            <span style={{ fontSize: 9, letterSpacing: ".24em", textTransform: "uppercase", opacity: 0.6 }}>You are on</span>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, lineHeight: 1.06, margin: "6px 0 8px" }}>{live?.title || "—"}</div>
            <span style={{ fontSize: 13, opacity: 0.78 }}>{live?.owner}</span>
          </div>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--color-divider)" }}>
            <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Next up</span>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, lineHeight: 1.15, marginTop: 3 }}>{next?.title || "End of programme"}</div>
            <span className="text-muted" style={{ fontSize: 11.5 }}>{next?.owner || "—"}</span>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Script notes</span>
            <p style={{ margin: 0, fontSize: 13.5 }}>{live?.mcScript?.join(" · ") || "No script notes on this item — read the room."}</p>
            <div style={{ height: 1, background: "var(--color-divider)", margin: "4px 0" }} />
            <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Cues to you</span>
            {mcInbox.map((m) => (
              <div key={m.id} style={{ padding: "8px 10px", borderLeft: "2px solid var(--color-accent-500)", background: "var(--color-neutral-100)" }}>
                <b style={{ fontFamily: "var(--font-heading)", fontSize: 11.5 }}>{m.route}</b>
                <p style={{ margin: "4px 0 0", fontSize: 13.5 }}>{m.text}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--color-divider)", padding: "11px 14px", display: "flex", flexDirection: "column", gap: 8, background: "var(--color-bg)" }}>
            <button onClick={() => log("ping", "MC → DJ", "Cut the music now — going into the welcome.")} className="btn btn-primary" style={{ minHeight: 50, fontSize: 15 }}>
              Cue DJ — cut the music
            </button>
            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={advance} className="btn btn-secondary" style={{ flex: 1, minHeight: 46, fontSize: 13 }}>Segment done</button>
              <button onClick={() => log("ping", "MC → Main", "Chairperson is stretching — give me five more minutes.")} className="btn btn-secondary" style={{ flex: 1, minHeight: 46, fontSize: 13 }}>
                Stretching 5 min
              </button>
            </div>
          </div>
        </div>

        <div style={phoneStyle}>
          <div style={phoneBarStyle}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>DJ</span>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, flex: 1, overflow: "auto" }}>
            <Blueprint style={{ padding: 13 }}>
              <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Playing for</span>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 21, lineHeight: 1.1, marginTop: 3 }}>{live?.title || "—"}</div>
              <span className="text-muted" style={{ fontSize: 11.5 }}>{live?.djTrack?.note || "No track cue on this item"}</span>
            </Blueprint>
            <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Track sheet</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {schedule.filter((it) => it.djTrack).map((it) => {
                const on = it.status === "live";
                const dn = it.status === "done";
                return (
                  <div key={it.id} style={{ padding: 10, border: `1px solid ${on ? "var(--hh-danger)" : "var(--color-divider)"}`, opacity: dn ? 0.45 : 1, background: on ? "var(--color-accent-100)" : undefined }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10.5, color: "var(--color-accent-700)" }}>{it.time}</span>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: 13.5, flex: 1, minWidth: 0 }}>{it.djTrack?.title}</span>
                      {(on || dn) && <span className="text-muted" style={{ fontSize: 9 }}>{on ? "NOW" : "PLAYED"}</span>}
                    </div>
                    <span className="text-muted" style={{ fontSize: 11, display: "block", marginTop: 3 }}>{it.djTrack?.note}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 1, background: "var(--color-divider)", margin: "4px 0" }} />
            <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Cue log</span>
            {djInbox.map((m) => (
              <div key={m.id} style={{ padding: "8px 10px", borderLeft: "2px solid var(--color-accent-500)", background: "var(--color-neutral-100)" }}>
                <b style={{ fontFamily: "var(--font-heading)", fontSize: 11.5 }}>{m.route}</b>
                <p style={{ margin: "4px 0 0", fontSize: 13.5 }}>{m.text}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--color-divider)", padding: "11px 14px", background: "var(--color-bg)" }}>
            <button onClick={() => log("ping", "DJ → MC", "Copied. Music down.")} className="btn btn-primary" style={{ width: "100%", minHeight: 50, fontSize: 15 }}>
              Acknowledge cue
            </button>
          </div>
        </div>
      </div>
      <Toast text={toast} />
    </div>
  );
}
