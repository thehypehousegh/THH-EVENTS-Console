"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Person, PermissionId, RoleDef } from "./types";

interface AuthCtx {
  user: User | null;
  person: Person | null;
  role: RoleDef | null;
  loading: boolean;
  hasPerm: (id: PermissionId) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [role, setRole] = useState<RoleDef | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setAuthLoading(false);
    if (!u) {
      setPerson(null);
      setRole(null);
      setDocsLoading(false);
    }
  }), []);

  useEffect(() => {
    if (!user) return;
    setDocsLoading(true);
    const unsubPerson = onSnapshot(doc(db, "people", user.uid), (snap) => {
      const p = snap.exists() ? ({ id: snap.id, ...snap.data() } as Person) : null;
      setPerson(p);
      if (!p?.roleId) {
        setRole(null);
        setDocsLoading(false);
      }
    });
    return () => unsubPerson();
  }, [user]);

  useEffect(() => {
    if (!person?.roleId) return;
    const unsubRole = onSnapshot(doc(db, "roles", person.roleId), (snap) => {
      setRole(snap.exists() ? ({ id: snap.id, ...snap.data() } as RoleDef) : null);
      setDocsLoading(false);
    });
    return () => unsubRole();
  }, [person?.roleId]);

  function hasPerm(id: PermissionId) {
    if (!person?.active) return false;
    return !!role?.perms?.includes(id);
  }

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }
  async function signOutUser() {
    await fbSignOut(auth);
  }

  return (
    <Ctx.Provider
      value={{ user, person, role, loading: authLoading || (!!user && docsLoading), hasPerm, signIn, signOutUser }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
