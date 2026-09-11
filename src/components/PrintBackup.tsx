"use client";

import type { HHEvent, ScheduleItem, ChecklistTask } from "@/lib/types";

export function PrintBackup({
  event,
  schedule,
  tasks,
  emergency,
  controllerName,
  deputyName,
}: {
  event: HHEvent;
  schedule: ScheduleItem[];
  tasks: ChecklistTask[];
  emergency: { label: string; phone: string }[];
  controllerName: string;
  deputyName: string;
}) {
  return (
    <div className="hh-print">
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "24pt", margin: 0 }}>{event.name}</h1>
      <p style={{ margin: "4px 0 2px", fontSize: "11pt" }}>
        {event.date} · {event.location} · {event.guests} guests
      </p>
      <p style={{ margin: "0 0 18px", fontSize: "10pt" }}>
        Paper backup — The Hype House. Controller: {controllerName} · Deputy: {deputyName}
      </p>

      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "15pt", margin: "0 0 8px" }}>Run sheet</h2>
      <table>
        <thead>
          <tr>
            <th style={{ width: 60 }}>Time</th>
            <th>Item</th>
            <th style={{ width: 170 }}>Owner</th>
            <th style={{ width: 70 }}>Done</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((it) => (
            <tr key={it.id}>
              <td>{it.time}</td>
              <td>{it.title}</td>
              <td>{it.owner}</td>
              <td><span className="box" /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "15pt", margin: "24px 0 8px", pageBreakBefore: "always" }}>Checklist</h2>
      <table>
        <thead>
          <tr>
            <th style={{ width: 110 }}>Area</th>
            <th style={{ width: 80 }}>Phase</th>
            <th>Task</th>
            <th style={{ width: 70 }}>Done</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>{t.area}</td>
              <td>{t.phase}</td>
              <td>{t.task}</td>
              <td><span className="box" /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "15pt", margin: "24px 0 8px" }}>Key numbers</h2>
      <table>
        <tbody>
          {emergency.map((c) => (
            <tr key={c.label}>
              <td>{c.label}</td>
              <td>{c.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
