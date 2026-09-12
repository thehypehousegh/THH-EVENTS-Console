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
import type { PlatformAdmin } from "./types";

interface PlatformAuthCtx {
  user: User | null;
  admin: PlatformAdmin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const Ctx = createContext<PlatformAuthCtx | null>(null);

/** Auth context for Hype House platform Super Admins — a separate identity
 *  space from org members (platformAdmins/{uid}, not people/{uid}). Mount
 *  once under /platform/. */
export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthLoading(false);
        if (!u) {
          setAdmin(null);
          setDocLoading(false);
        }
      }),
    []
  );

  useEffect(() => {
    if (!user) return;
    setDocLoading(true);
    const unsub = onSnapshot(doc(db, "platformAdmins", user.uid), (snap) => {
      setAdmin(snap.exists() ? ({ id: snap.id, ...snap.data() } as PlatformAdmin) : null);
      setDocLoading(false);
    });
    return () => unsub();
  }, [user]);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }
  async function signOutUser() {
    await fbSignOut(auth);
  }

  return (
    <Ctx.Provider value={{ user, admin, loading: authLoading || (!!user && docLoading), signIn, signOutUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlatformAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlatformAuth must be used within PlatformAuthProvider");
  return ctx;
}
