"use client";

import { useState } from "react";
import { orderBy } from "firebase/firestore";
import { useCollection, useOrgCollection } from "@/lib/hooks";
import { useAuth } from "@/lib/AuthProvider";
import { useOrg } from "@/lib/OrgProvider";
import { Blueprint, Chip } from "@/components/ui";
import type { HHEvent, FeedMessage, ScheduleItem, ChecklistTask, ChangeRequest, Vendor } from "@/lib/types";

const TABS = ["Comms log", "Run sheet as executed", "Checklist by area", "Schedule changes", "Vendors used"] as const;
type Tab = typeof TABS[number];

export default function ArchiveSection() {
  const { org } = useOrg();
  const { hasPerm } = useAuth();
  const { data: events, loading } = useOrgCollection<HHEvent>("events", org?.id, orderBy("createdAt", "desc"));
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Comms log");
  const activeId = openId || events[0]?.id || null;
  const active = events.find((e) => e.id === activeId);

  if (!hasPerm("accounts")) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: 20 }}>
        <p className="text-muted">You don&apos;t have permission to view the project record.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(14px,3.6vw,22px) clamp(12px,3.4vw,16px)", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ maxWidth: "66ch" }}>
        <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Admin · project record</span>
        <h3 style={{ margin: "6px 0 4px" }}>Projects</h3>
        <p className="text-muted" style={{ fontSize: 12.5, margin: 0 }}>
          Open a project and you get everything it produced: the run sheet as executed, checklist completion, the full comms log, and every skip or insert with who approved it.
        </p>
      </div>

      {loading && <p className="text-muted">Loading…</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,215px),1fr))", gap: 14 }}>
        {events.map((ev) => (
          <Blueprint key={ev.id} onClick={() => setOpenId(ev.id)} style={{ cursor: "pointer", background: activeId === ev.id ? "var(--color-accent-100)" : undefined }}>
            <span style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>{ev.date}</span>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, lineHeight: 1.12, margin: "4px 0 5px" }}>{ev.name}</div>
            <span className="text-muted" style={{ fontSize: 11.5 }}>{ev.location} · {ev.guests} guests</span>
            <div style={{ marginTop: 9 }}>
              <span className="tag tag-outline">{ev.status}</span>
            </div>
          </Blueprint>
        ))}
      </div>

      {active && (
        <Blueprint>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 10 }}>
            <h4 style={{ margin: 0 }}>{active.name}</h4>
            <span className="text-muted" style={{ fontSize: 11.5 }}>{active.location} · full record retained</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "13px 0" }}>
            {TABS.map((t) => (
              <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>
            ))}
          </div>
          <ArchiveTable eventId={active.id} tab={tab} />
        </Blueprint>
      )}
    </div>
  );
}

function ArchiveTable({ eventId, tab }: { eventId: string; tab: Tab }) {
  const { org } = useOrg();
  const { data: feed } = useCollection<FeedMessage>(`events/${eventId}/feed`, orderBy("createdAt", "desc"));
  const { data: schedule } = useCollection<ScheduleItem>(`events/${eventId}/scheduleItems`, orderBy("order"));
  const { data: tasks } = useCollection<ChecklistTask>(`events/${eventId}/tasks`);
  const { data: changes } = useCollection<ChangeRequest>(`events/${eventId}/changes`);
  const { data: vendors } = useOrgCollection<Vendor>("vendors", org?.id);

  let rows: { a: string; b: string; c: string }[] = [];
  let cols = ["A", "B", "C"];

  if (tab === "Comms log") {
    cols = ["Time", "Route", "Message"];
    rows = feed.map((m) => ({ a: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), b: m.route, c: m.text }));
  } else if (tab === "Run sheet as executed") {
    cols = ["Time", "Item", "Outcome"];
    rows = schedule.map((it) => ({
      a: it.time,
      b: it.title,
      c: it.status === "done" ? "Completed" : it.status === "live" ? "Running now" : it.status === "skipped" ? "Skipped" : "Pending",
    }));
  } else if (tab === "Checklist by area") {
    cols = ["Area", "Completion", "Outstanding"];
    const areas = Array.from(new Set(tasks.map((t) => t.area)));
    rows = areas.map((n) => {
      const list = tasks.filter((t) => t.area === n);
      const d = list.filter((t) => t.done).length;
      return { a: n, b: `${d} of ${list.length} (${list.length ? Math.round((d / list.length) * 100) : 0}%)`, c: list.filter((t) => !t.done).map((t) => t.task).join("; ") || "None" };
    });
  } else if (tab === "Schedule changes") {
    cols = ["Kind", "Item", "Decided by"];
    rows = changes.map((r) => ({ a: r.kind, b: r.target, c: r.status === "approved" ? "Approved" : r.status === "auto" ? "Own area · logged" : r.status === "declined" ? "Declined" : "Pending" }));
  } else if (tab === "Vendors used") {
    cols = ["Vendor", "Contact", "Entered by"];
    rows = vendors.filter((v) => v.eventId === eventId).map((v) => ({ a: `${v.name} · ${v.category}`, b: v.contact, c: v.byLabel }));
  }

  return (
    <div style={{ overflow: "auto" }}>
      <table className="table" style={{ width: "100%", fontSize: 12.5, minWidth: 480 }}>
        <thead>
          <tr>
            {cols.map((c) => <th key={c} style={{ textAlign: "left" }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ whiteSpace: "nowrap", verticalAlign: "top" }}>{r.a}</td>
              <td style={{ verticalAlign: "top" }}>{r.b}</td>
              <td style={{ verticalAlign: "top" }}>{r.c}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={3} className="text-muted" style={{ padding: "10px 6px" }}>Nothing here yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
