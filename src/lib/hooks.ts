"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  type QueryConstraint,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

/** Live-subscribes to a Firestore collection and returns typed docs + id. */
export function useCollection<T extends DocumentData>(path: string, ...constraints: QueryConstraint[]) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(constraints.map((c) => c.type));

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, path), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })));
      setLoading(false);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key]);

  return { data, loading };
}

export function useDocument<T extends DocumentData>(path: string | null) {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(doc(db, path), (snap) => {
      setData(snap.exists() ? ({ id: snap.id, ...(snap.data() as T) }) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [path]);

  return { data, loading };
}

export function genId(prefix = "id") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export function genToken() {
  return Math.random().toString(36).slice(2, 10);
}
