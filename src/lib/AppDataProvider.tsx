"use client";

import { createContext, useContext, type ReactNode } from "react";
import { collection, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { useCollection } from "./hooks";
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

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { data: people, loading: peopleLoading } = useCollection<Person>("people");
  const { data: roles, loading: rolesLoading } = useCollection<RoleDef>("roles");

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

// re-exported for convenience where a raw ordered query is needed
export function peopleQuery() {
  return query(collection(db, "people"), orderBy("name"));
}
