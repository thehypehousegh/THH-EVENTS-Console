"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { OrgProvider, useOrg } from "@/lib/OrgProvider";
import { AppDataProvider } from "@/lib/AppDataProvider";
import { AuthGate } from "@/components/AuthGate";
import { TopBar } from "@/components/TopBar";
import OrgLanding from "@/components/sections/OrgLanding";
import OrgSignInSection from "@/components/sections/OrgSignInSection";
import ClientPortalSection from "@/components/sections/ClientPortalSection";
import AdminSection from "@/components/sections/AdminSection";
import ControlSection from "@/components/sections/ControlSection";
import CoordinatorSection from "@/components/sections/CoordinatorSection";
import CueSection from "@/components/sections/CueSection";
import CreateEventSection from "@/components/sections/CreateEventSection";
import EventsSection from "@/components/sections/EventsSection";
import ArchiveSection from "@/components/sections/ArchiveSection";
import VendorsSection from "@/components/sections/VendorsSection";

// Every URL of the shape /{orgSlug}[/{section}][?...] is served by this one
// static page (see the Firebase Hosting catch-all rewrite in firebase.json)
// — Next's static export can't pre-render an unknown, dynamically-created
// org slug, so section switching happens client-side against the real
// browser pathname instead of Next's file-based router.
const APP_SECTIONS = ["admin", "control", "coordinator", "cue", "create", "events", "archive", "vendors"] as const;
type AppSection = (typeof APP_SECTIONS)[number];

export function OrgShell() {
  return (
    <Suspense fallback={null}>
      <OrgShellInner />
    </Suspense>
  );
}

function OrgShellInner() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const slug = parts[0] || "";
  const section = parts[1] || "";

  return (
    <OrgProvider slug={slug}>
      {section === "" && <OrgLanding />}
      {section === "signin" && <OrgSignInSection />}
      {section === "client" && <ClientPortalSection />}
      {APP_SECTIONS.includes(section as AppSection) && <InternalApp section={section as AppSection} />}
      {section !== "" && section !== "signin" && section !== "client" && !APP_SECTIONS.includes(section as AppSection) && <NotFound />}
    </OrgProvider>
  );
}

function InternalApp({ section }: { section: AppSection }) {
  const { org, slug, loading, notFound } = useOrg();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p className="text-muted" style={{ fontSize: 13 }}>Loading…</p>
      </div>
    );
  }
  if (notFound || !org) return <NotFound />;

  return (
    <AuthGate orgSlug={slug} orgId={org.id}>
      <AppDataProvider orgId={org.id}>
        <Suspense fallback={null}>
          <TopBar />
        </Suspense>
        {section === "admin" && <AdminSection />}
        {section === "control" && <ControlSection />}
        {section === "coordinator" && <CoordinatorSection />}
        {section === "cue" && <CueSection />}
        {section === "create" && <CreateEventSection />}
        {section === "events" && <EventsSection />}
        {section === "archive" && <ArchiveSection />}
        {section === "vendors" && <VendorsSection />}
      </AppDataProvider>
    </AuthGate>
  );
}

function NotFound() {
  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: 20, textAlign: "center" }}>
      <h3>Page not found</h3>
      <p className="text-muted" style={{ fontSize: 13 }}>Check the address and try again.</p>
    </div>
  );
}
