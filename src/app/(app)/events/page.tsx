"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collectionGroup, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/hooks";
import { useAuth } from "@/lib/AuthProvider";
import { onSnapshot } from "firebase/firestore";
import { Blueprint } from "@/components/ui";
import type { HHEvent } from "@/lib/types";

function daysOut(dateISO: string | null): number | null {
  if (!dateISO) return null;
  const ms = new Date(dateISO).getTime() - Date.now();
  return Math.round(ms / 86400000);
}

export default function EventsPage() {
  const { person, hasPerm } = useAuth();
  const isAdmin = hasPerm("accounts");
  const { data: allEvents, loading: allLoading } = useCollection<HHEvent>("events", orderBy("createdAt", "desc"));
  const [assignedEventIds, setAssignedEventIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!person || isAdmin) return;
    const q = query(collectionGroup(db, "assignments"), where("personId", "==", person.id));
    return onSnapshot(q, (snap) => {
      setAssignedEventIds(new Set(snap.docs.map((d) => d.ref.parent.parent!.id)));
    });
  }, [person, isAdmin]);

  const events = isAdmin ? allEvents : allEvents.filter((e) => assignedEventIds?.has(e.id));

  const grouped = {
    ongoing: events.filter((e) => e.status === "ongoing"),
    upcoming: events.filter((e) => e.status === "upcoming"),
    completed: events.filter((e) => e.status === "completed"),
  };

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(14px,3.6vw,22px) clamp(12px,3.4vw,16px)" }}>
      <div style={{ maxWidth: "66ch", marginBottom: 18 }}>
        <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
          {isAdmin ? "Every project" : "Your assigned events"}
        </span>
        <h3 style={{ margin: "6px 0 4px" }}>Events</h3>
        {allLoading && <p className="text-muted" style={{ fontSize: 12.5 }}>Loading…</p>}
        {!allLoading && events.length === 0 && (
          <p className="text-muted" style={{ fontSize: 12.5 }}>
            {isAdmin ? "No events yet — create one under New event." : "You are not assigned to an event yet. Check with your Main Coordinator."}
          </p>
        )}
      </div>

      {(["ongoing", "upcoming", "completed"] as const).map((col) => {
        const list = grouped[col];
        if (!isAdmin && col !== "ongoing" && col !== "upcoming") return null;
        if (list.length === 0) return null;
        return (
          <div key={col} style={{ marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 10px", textTransform: "capitalize" }}>{col}</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 14 }}>
              {list.map((ev) => {
                const d = daysOut(ev.dateISO);
                return (
                  <Blueprint key={ev.id} style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                      {ev.type}
                    </span>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, margin: "4px 0 5px" }}>{ev.name}</div>
                    <span className="text-muted" style={{ fontSize: 11.5 }}>
                      {ev.date} · {ev.location}
                      {d !== null && col === "upcoming" ? ` · in ${d} day${d === 1 ? "" : "s"}` : ""}
                      {d !== null && col === "completed" ? ` · ${-d} day${d === -1 ? "" : "s"} ago` : ""}
                    </span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      {hasPerm("advance") && (
                        <Link href={`/control/?event=${ev.id}`} className="btn btn-primary" style={{ fontSize: 12 }}>
                          Control room
                        </Link>
                      )}
                      <Link href={`/coordinator/?event=${ev.id}`} className="btn btn-secondary" style={{ fontSize: 12 }}>
                        Coordinator
                      </Link>
                      <Link href={`/cue/?event=${ev.id}`} className="btn btn-secondary" style={{ fontSize: 12 }}>
                        MC / DJ
                      </Link>
                      <Link href={`/vendors/?event=${ev.id}`} className="btn btn-secondary" style={{ fontSize: 12 }}>
                        Vendors
                      </Link>
                    </div>
                  </Blueprint>
                );
              })}
            </div>
          </div>
        );
      })}
      {isAdmin && (
        <Link href="/archive/" className="btn btn-secondary" style={{ fontSize: 12 }}>
          Open project record →
        </Link>
      )}
    </div>
  );
}
