"use client";

import { orderBy } from "firebase/firestore";
import { useCollection } from "@/lib/hooks";
import { Blueprint, Tag } from "@/components/ui";
import type { Vendor, Organization } from "@/lib/types";

export function VendorsReportTab({ orgs }: { orgs: Organization[] }) {
  const { data: vendors, loading } = useCollection<Vendor>("vendors", orderBy("createdAt", "desc"));
  const orgName = (id: string) => orgs.find((o) => o.id === id)?.name || id;

  const byOrg = new Map<string, Vendor[]>();
  for (const v of vendors) {
    if (!byOrg.has(v.orgId)) byOrg.set(v.orgId, []);
    byOrg.get(v.orgId)!.push(v);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Blueprint style={{ textAlign: "center", padding: "18px 12px" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, lineHeight: 1, color: "var(--color-accent-700)" }}>{vendors.length}</div>
        <div style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", marginTop: 6, opacity: 0.65 }}>Vendors across all organizations</div>
      </Blueprint>

      {loading && <p className="text-muted">Loading…</p>}
      {!loading && vendors.length === 0 && <p className="text-muted">No vendors registered anywhere yet.</p>}

      {[...byOrg.entries()].map(([orgId, list]) => (
        <Blueprint key={orgId}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", marginBottom: 10 }}>
            <h4 style={{ margin: 0 }}>{orgName(orgId)}</h4>
            <span className="text-muted" style={{ fontSize: 11 }}>{list.length} vendor{list.length === 1 ? "" : "s"}</span>
          </div>
          <div style={{ overflow: "auto" }}>
            <table className="table" style={{ width: "100%", fontSize: 12.5, minWidth: 560 }}>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Entered by</th>
                </tr>
              </thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontFamily: "var(--font-heading)" }}>{v.name}</td>
                    <td><Tag variant="accent">{v.category}</Tag></td>
                    <td>{v.contact}</td>
                    <td>{v.location || "—"}</td>
                    <td>{v.byLabel || "—"}</td>
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
