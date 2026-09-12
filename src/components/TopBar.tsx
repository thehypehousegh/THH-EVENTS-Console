"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/ThemeProvider";
import { useAuth } from "@/lib/AuthProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { useOrg } from "@/lib/OrgProvider";

export function TopBar() {
  const { theme, setTheme, themes } = useTheme();
  const { person, role, signOutUser } = useAuth();
  const { roleName } = useAppData();
  const { org, slug } = useOrg();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const eventQS = searchParams.get("event") ? `?event=${searchParams.get("event")}` : "";

  const VIEWS = [
    { id: `/${slug}/control/`, label: "Control room" },
    { id: `/${slug}/coordinator/`, label: "Coordinator" },
    { id: `/${slug}/cue/`, label: "MC / DJ" },
    { id: `/${slug}/create/`, label: "New event" },
    { id: `/${slug}/admin/`, label: "Admin setup" },
    { id: `/${slug}/vendors/`, label: "Vendors" },
    { id: `/${slug}/archive/`, label: "Project record" },
  ];

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 14,
        padding: "10px 16px",
        background: "var(--color-accent-900)",
        color: "var(--hh-paper)",
      }}
    >
      {org?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={org.logoUrl} alt={org.name} width={34} height={34} style={{ flex: "none", objectFit: "contain" }} />
      ) : (
        <span
          style={{
            flex: "none",
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            background: "var(--hh-paper-20)",
          }}
        >
          {(org?.name || "?").slice(0, 1)}
        </span>
      )}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 19, letterSpacing: ".03em" }}>{(org?.name || "").toUpperCase()}</span>
        <span style={{ fontSize: 9, letterSpacing: ".22em", textTransform: "uppercase", opacity: 0.6, marginTop: 4 }}>
          Event Coordination Console
        </span>
      </div>
      <div style={{ width: 1, height: 28, background: "var(--hh-paper-30)", flex: "none" }} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 90, flex: "1 1 130px", overflow: "hidden" }}>
        <span style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", opacity: 0.55 }}>Signed in</span>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {person ? `${person.name} · ${roleName(role?.id)}` : "…"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginLeft: "auto" }}>
        <span style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", opacity: 0.5 }}>Theme</span>
        <div style={{ display: "flex", border: "1px solid var(--hh-paper-30)" }}>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 11,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                padding: "6px 10px",
                minHeight: 40,
                cursor: "pointer",
                border: "none",
                background: theme === t.id ? "var(--hh-paper)" : "transparent",
                color: theme === t.id ? "var(--color-accent-900)" : "var(--hh-paper)",
                opacity: theme === t.id ? 1 : 0.65,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => signOutUser()}
          className="btn btn-secondary"
          style={{ fontSize: 11, minHeight: 40, borderColor: "var(--hh-paper-30)", color: "var(--hh-paper)" }}
        >
          Sign out
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, width: "100%", overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
        {VIEWS.map((v) => {
          const active = pathname === v.id;
          return (
            <Link
              key={v.id}
              href={v.id.endsWith("/create/") || v.id.endsWith("/admin/") ? v.id : `${v.id}${eventQS}`}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 12,
                letterSpacing: ".07em",
                textTransform: "uppercase",
                padding: "7px 12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flex: "none",
                minHeight: 34,
                display: "inline-flex",
                alignItems: "center",
                border: `1px solid ${active ? "var(--hh-paper)" : "var(--hh-paper-30)"}`,
                borderRadius: "var(--radius-md)",
                background: active ? "var(--hh-paper)" : "transparent",
                color: active ? "var(--color-accent-900)" : "var(--hh-paper)",
                textDecoration: "none",
              }}
            >
              {v.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
