"use client";

import { OrgShell } from "@/components/OrgShell";

// Firebase Hosting's catch-all rewrite (see firebase.json) sends every
// /{orgSlug}[/{section}] URL that isn't a real static file here. OrgShell
// reads the real browser pathname to figure out which org and section to
// render — Next's static export can't pre-render an org slug it doesn't
// know about at build time.
export default function OrgCatchAllPage() {
  return <OrgShell />;
}
