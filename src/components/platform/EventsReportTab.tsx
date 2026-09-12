"use client";

import { orderBy } from "firebase/firestore";
import { useCollection } from "@/lib/hooks";
import { Blueprint, Tag } from "@/components/ui";
import type { HHEvent, Organization } from "@/lib/types";

const STATUS_LABEL: Record<HHEvent["status"], string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
};

export function EventsReportTab({ orgs }: { orgs: Organization[] }) {
  const { data: events, loading } = useCollection<HHEvent>("events", orderBy("createdAt", "desc"));
  const orgName = (id: string) => orgs.find((o) => o.id === id)?.name || id;

  const counts = {
    total: events.length,
    ongoing: events.filter((e) => e.status === "ongoing").length,
    upcoming: events.filter((e) => e.status === "upcoming").length,
    completed: events.filter((e) => e.status === "completed").length,
  };

  const byOrg = new Map<string, HHEvent[]>();
  for (const ev of events) {
    if (!byOrg.has(ev.orgId)) byOrg.set(ev.orgId, []);
    byOrg.get(ev.orgId)!.push(ev);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: 12 }}>
        <StatCard value={counts.total} label="Total events" />
        <StatCard value={counts.ongoing} label="Ongoing" accent="var(--hh-danger)" />
        <StatCard value={counts.upcoming} label="Upcoming" />
        <StatCard value={counts.completed} label="Completed" />
      </div>

      {loading && <p className="text-muted">Loading…</p>}
      {!loading && events.length === 0 && <p className="text-muted">No events across any organization yet.</p>}

      {[...byOrg.entries()].map(([orgId, list]) => (
        <Blueprint key={orgId}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", marginBottom: 10 }}>
            <h4 style={{ margin: 0 }}>{orgName(orgId)}</h4>
            <span className="text-muted" style={{ fontSize: 11 }}>{list.length} event{list.length === 1 ? "" : "s"}</span>
          </div>
          <div style={{ overflow: "auto" }}>
            <table className="table" style={{ width: "100%", fontSize: 12.5, minWidth: 480 }}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((ev) => (
                  <tr key={ev.id}>
                    <td style={{ fontFamily: "var(--font-heading)" }}>{ev.name}</td>
                    <td>{ev.type}</td>
                    <td>{ev.date}</td>
                    <td><Tag variant={ev.status === "ongoing" ? "accent" : "outline"}>{STATUS_LABEL[ev.status]}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Blueprint>
      ))}
    </div>
  );
}

function StatCard({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <Blueprint style={{ textAlign: "center", padding: "18px 12px" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, lineHeight: 1, color: accent || "var(--color-accent-700)" }}>{value}</div>
      <div style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", marginTop: 6, opacity: 0.65 }}>{label}</div>
    </Blueprint>
  );
}
