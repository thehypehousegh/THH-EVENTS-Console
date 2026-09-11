"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, person, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/signin/");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p className="text-muted" style={{ fontSize: 13 }}>Loading…</p>
      </div>
    );
  }
  if (!user) return null;

  if (person && !person.active) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", padding: 20 }}>
        <div style={{ padding: "13px 15px", background: "var(--hh-danger-tint)", color: "var(--hh-danger-tint-ink)" }}>
          This account has been retired. Your credentials are correct, but access is off until an admin reactivates it.
        </div>
      </div>
    );
  }
  if (user && !person) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", padding: 20 }}>
        <div style={{ padding: "13px 15px", background: "var(--hh-danger-tint)", color: "var(--hh-danger-tint-ink)" }}>
          No profile is set up for this login yet. Ask your Main Coordinator to add you under Admin setup → People.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
