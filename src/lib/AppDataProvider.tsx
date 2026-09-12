"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useOrgCollection } from "./hooks";
import type { Person, RoleDef } from "./types";

interface AppDataCtx {
  people: Person[];
  peopleLoading: boolean;
  roles: RoleDef[];
  rolesLoading: boolean;
  personName: (id: string | null | undefined) => string;
  roleName: (id: string | null | undefined) => string;
}

const Ctx = createContext<AppDataCtx | null>(null);

/** People/roles for ONE organization — mount inside OrgProvider with that
 *  org's id, scoped below AuthGate so it only ever runs for a signed-in
 *  member of that same org. */
export function AppDataProvider({ orgId, children }: { orgId: string; children: ReactNode }) {
  const { data: people, loading: peopleLoading } = useOrgCollection<Person>("people", orgId);
  const { data: roles, loading: rolesLoading } = useOrgCollection<RoleDef>("roles", orgId);

  function personName(id: string | null | undefined) {
    if (!id) return "—";
    return people.find((p) => p.id === id)?.name || "—";
  }
  function roleName(id: string | null | undefined) {
    if (!id) return "—";
    return roles.find((r) => r.id === id)?.name || "—";
  }

  return (
    <Ctx.Provider value={{ people, peopleLoading, roles, rolesLoading, personName, roleName }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
