"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";
import type { Organization } from "./types";

interface OrgCtx {
  slug: string;
  org: Organization | null;
  loading: boolean;
  notFound: boolean;
}

const Ctx = createContext<OrgCtx | null>(null);

/** Resolves an Organization by its URL slug and provides it down the tree.
 *  Mount this anywhere under the org-scoped shell (`/{slug}/...`). */
export function OrgProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setOrg(null);
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    setNotFound(false);
    // Firestore's list-rule evaluator only reliably sees resource.data
    // fields that are part of THIS query's own filters (see
    // firestore.rules' organizations list rule) — filtering on `status`
    // here, not just `slug`, is what lets the rule's
    // resource.data.status == "approved" branch actually see it.
    const q = query(
      collection(db, "organizations"),
      where("slug", "==", slug),
      where("status", "==", "approved"),
      limit(1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setOrg(null);
          setNotFound(true);
        } else {
          const d = snap.docs[0];
          setOrg({ id: d.id, ...(d.data() as Omit<Organization, "id">) });
          setNotFound(false);
        }
        setLoading(false);
      },
      () => {
        // Rules deny reading a non-"approved" org to a stranger — treat as not found.
        setOrg(null);
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [slug]);

  return <Ctx.Provider value={{ slug, org, loading, notFound }}>{children}</Ctx.Provider>;
}

export function useOrg() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
