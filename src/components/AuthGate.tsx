"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

/** Gates an org's internal coordination app. Requires sign-in AND that the
 *  signed-in person's home org matches the org currently being viewed —
 *  this is what stops one org's member from reaching another org's data
 *  even if they type/guess the URL; Firestore rules enforce the same
 *  boundary server-side. */
export function AuthGate({ orgSlug, orgId, children }: { orgSlug: string; orgId: string; children: ReactNode }) {
  const { user, person, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/${orgSlug}/signin/`);
  }, [loading, user, orgSlug, router]);

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
  if (person && person.orgId !== orgId) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", padding: 20 }}>
        <div style={{ padding: "13px 15px", background: "var(--hh-danger-tint)", color: "var(--hh-danger-tint-ink)" }}>
          This account belongs to a different organization. Sign in at your own organization&apos;s address instead.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
