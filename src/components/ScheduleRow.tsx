"use client";

export function ScheduleRow({
  it,
  compact,
}: {
  it: { id: string; time: string; title: string; owner: string; status: string; inserted?: boolean };
  compact?: boolean;
}) {
  const on = it.status === "live";
  const dn = it.status === "done";
  const sk = it.status === "skipped";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: compact ? "6px 6px" : "8px 6px",
        borderBottom: "1px solid var(--color-divider)",
        background: on ? "var(--color-accent-200)" : undefined,
      }}
    >
      <span
        style={{
          fontFamily: "ui-monospace,Menlo,monospace",
          fontSize: compact ? 10 : 11,
          width: compact ? 36 : 40,
          color: on ? "var(--color-accent-900)" : "var(--color-accent-700)",
        }}
      >
        {it.time}
      </span>
      <span
        style={{
          width: 15,
          height: 15,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontFamily: "var(--font-heading)",
          border: `1px solid ${dn ? "var(--color-accent-700)" : sk ? "var(--color-neutral-500)" : "var(--color-divider)"}`,
          background: dn ? "var(--color-accent-700)" : on ? "var(--hh-danger)" : undefined,
          color: dn ? "var(--hh-paper)" : on ? "var(--hh-danger-ink)" : "transparent",
        }}
      >
        {dn ? "✓" : sk ? "–" : on ? "●" : ""}
      </span>
      <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: compact ? 13 : 14,
            lineHeight: 1.2,
            opacity: dn ? 0.5 : 1,
            textDecoration: sk ? "line-through" : undefined,
          }}
        >
          {it.title}
        </span>
        <span className="text-muted" style={{ fontSize: 10.5 }}>{it.owner}</span>
      </span>
      {(on || it.inserted || sk) && (
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 9,
            letterSpacing: ".13em",
            textTransform: "uppercase",
            padding: "2px 7px",
            background: on ? "var(--hh-danger)" : it.inserted ? "var(--color-accent-700)" : "var(--color-neutral-300)",
            color: on ? "var(--hh-danger-ink)" : it.inserted ? "var(--hh-paper)" : "var(--color-neutral-800)",
          }}
        >
          {on ? "Live" : it.inserted ? "Inserted" : "Skipped"}
        </span>
      )}
    </div>
  );
}
