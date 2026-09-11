"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { useCollection, useDocument, genId } from "./hooks";
import { useAuth } from "./AuthProvider";
import { useAppData } from "./AppDataProvider";
import type {
  HHEvent,
  ScheduleItem,
  ChecklistTask,
  Escalation,
  FeedMessage,
  ChangeRequest,
  RollCallEntry,
  ClientComment,
  Severity,
} from "./types";
import { ACK_LIMIT_SECONDS } from "./types";

interface EventDataCtx {
  eventId: string;
  event: HHEvent | null;
  schedule: ScheduleItem[];
  tasks: ChecklistTask[];
  escalations: Escalation[];
  feed: FeedMessage[];
  changes: ChangeRequest[];
  roll: RollCallEntry[];
  comments: ClientComment[];
  loading: boolean;
  toast: string;
  flash: (m: string) => void;
  liveItem: () => ScheduleItem | null;
  advance: () => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  raiseEscalation: (severity: Severity, fromLabel: string, note?: string) => Promise<void>;
  closeEscalation: (id: string, dispatch: boolean) => Promise<void>;
  log: (kind: FeedMessage["kind"], route: string, text: string) => Promise<void>;
  settleChange: (id: string, approve: boolean) => Promise<void>;
  startRollCall: () => Promise<void>;
  markRoll: (personId: string, state: RollCallEntry["state"]) => Promise<void>;
  promoteDeputy: () => Promise<void>;
  sendComment: (topic: string, text: string) => Promise<void>;
}

const Ctx = createContext<EventDataCtx | null>(null);

export function EventDataProvider({ eventId, children }: { eventId: string; children: ReactNode }) {
  const { person } = useAuth();
  const { personName, roleName } = useAppData();
  const { data: event, loading: eventLoading } = useDocument<HHEvent>(eventId ? `events/${eventId}` : null);
  const { data: scheduleRaw, loading: schLoading } = useCollection<ScheduleItem>(
    eventId ? `events/${eventId}/scheduleItems` : "__none__",
    orderBy("order")
  );
  const { data: tasks, loading: taskLoading } = useCollection<ChecklistTask>(eventId ? `events/${eventId}/tasks` : "__none__");
  const { data: escalations, loading: escLoading } = useCollection<Escalation>(
    eventId ? `events/${eventId}/escalations` : "__none__"
  );
  const { data: feedRaw, loading: feedLoading } = useCollection<FeedMessage>(
    eventId ? `events/${eventId}/feed` : "__none__",
    orderBy("createdAt")
  );
  const { data: changes, loading: chLoading } = useCollection<ChangeRequest>(eventId ? `events/${eventId}/changes` : "__none__");
  const { data: roll, loading: rollLoading } = useCollection<RollCallEntry>(eventId ? `events/${eventId}/rollCall` : "__none__");
  const { data: comments, loading: cmLoading } = useCollection<ClientComment>(
    eventId ? `events/${eventId}/clientComments` : "__none__",
    orderBy("createdAt", "desc")
  );

  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(m: string) {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3400);
  }

  function col(sub: string) {
    return collection(db, "events", eventId, sub);
  }

  function liveItem(): ScheduleItem | null {
    return scheduleRaw.find((s) => s.status === "live") || scheduleRaw[0] || null;
  }

  async function advance() {
    const idx = scheduleRaw.findIndex((s) => s.status === "live");
    if (idx < 0 || idx === scheduleRaw.length - 1) return;
    const cur = scheduleRaw[idx];
    const next = scheduleRaw[idx + 1];
    await updateDoc(doc(db, "events", eventId, "scheduleItems", cur.id), { status: "done" });
    await updateDoc(doc(db, "events", eventId, "scheduleItems", next.id), { status: "live" });
    await log("system", "Run sheet → All roles", `Now live: ${next.title} (${next.owner})`);
    flash(`Run sheet advanced — "${next.title}" is live on every dashboard`);
  }

  async function toggleTask(id: string) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    await updateDoc(doc(db, "events", eventId, "tasks", id), { done: !t.done });
    if (!t.done) {
      flash(`"${t.task}" ticked — ${t.area} progress updated for the Main Coordinator`);
    }
  }

  async function log(kind: FeedMessage["kind"], route: string, text: string) {
    await addDoc(col("feed"), { kind, route, text, createdAt: Date.now() });
  }

  async function raiseEscalation(severity: Severity, fromLabel: string, note?: string) {
    const live = liveItem();
    await addDoc(col("escalations"), {
      severity,
      fromPersonId: person?.id || "",
      fromLabel,
      text: note || "No note added",
      link: `Tied to · ${live?.title || "—"}`,
      status: "open",
      raisedAt: Date.now(),
      autoEsc: false,
    });
    await log("escalation", `${fromLabel} → Main`, `${severity} raised on "${live?.title || "—"}".`);
    flash(`${severity.toUpperCase()} alert sent to Main Coordinator`);
  }

  async function closeEscalation(id: string, dispatch: boolean) {
    const e = escalations.find((x) => x.id === id);
    if (!e) return;
    await updateDoc(doc(db, "events", eventId, "escalations", id), { status: dispatch ? "dispatched" : "ack" });
    await log("system", `Main → ${e.fromLabel}`, dispatch ? "Backup dispatched — reinforcement reassigned" : "Acknowledged, standing by");
    flash(dispatch ? `Backup dispatched to ${e.fromLabel}` : `Acknowledged — ${e.fromLabel} notified`);
  }

  async function settleChange(id: string, approve: boolean) {
    const r = changes.find((x) => x.id === id);
    if (!r) return;
    await updateDoc(doc(db, "events", eventId, "changes", id), { status: approve ? "approved" : "declined" });
    if (approve) {
      const live = scheduleRaw.findIndex((s) => s.status === "live");
      const insertAt = scheduleRaw[Math.min(scheduleRaw.length - 1, live + 1)];
      await setDoc(doc(db, "events", eventId, "scheduleItems", genId("ins")), {
        order: (insertAt?.order ?? scheduleRaw.length) + 0.5,
        time: insertAt?.time || "--:--",
        title: r.target,
        owner: "Assigned by Main",
        ownerRoleId: null,
        status: "todo",
        inserted: true,
        mcScript: [],
        djTrack: null,
      });
    }
    await log("system", "Main → All roles", `${approve ? "Approved" : "Declined"} ${r.kind.toLowerCase()}: ${r.target}`);
    flash(approve ? `${r.kind} approved — pushed to every dashboard` : `${r.kind} declined — requester notified`);
  }

  async function startRollCall() {
    for (const r of roll) {
      await updateDoc(doc(db, "events", eventId, "rollCall", r.id), { state: "waiting", confirmedAt: "" });
    }
    await log("broadcast", "Main → All roles", 'Roll call. Tap "I am on" on your phone now.');
    flash("Roll call sent — every device is asking for confirmation");
  }

  async function markRoll(personId: string, state: RollCallEntry["state"]) {
    await updateDoc(doc(db, "events", eventId, "rollCall", personId), {
      state,
      confirmedAt: state === "on" ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
    });
    const label = roll.find((r) => r.id === personId)?.role || "Role";
    if (state === "on") flash(`${label} confirmed on the floor`);
    if (state === "no-show") flash(`${label} marked unreachable — Main can reassign their tasks`);
  }

  async function promoteDeputy() {
    if (!event?.deputyPersonId) return;
    const newController = event.deputyPersonId;
    await updateDoc(doc(db, "events", eventId), { controllerPersonId: newController, deputyPersonId: event.controllerPersonId });
    await log("system", "Main → All roles", `Control handed to ${personName(newController)}. Send escalations to them from now.`);
    flash(`${personName(newController)} is now acting Main Coordinator — every dashboard has been told`);
  }

  async function sendComment(topic: string, text: string) {
    await addDoc(col("clientComments"), { topic, who: "Client", text, status: "new", createdAt: Date.now() });
    await log("client", "Client → Main", `[${topic}] ${text}`);
    flash("Sent — it is in the coordinator's feed now");
  }

  // 90-second unacknowledged-Blocking-escalation auto-pass-to-deputy watch.
  // Runs client-side (matches the original prototype) — on the free tier
  // there is no server function, so this only fires while a Control Room
  // tab from someone with `ack` permission is open. Documented as a known
  // limitation for the Blaze-plan upgrade path.
  useEffect(() => {
    const iv = setInterval(async () => {
      const now = Date.now();
      for (const e of escalations) {
        if (e.status !== "open" || e.severity !== "Blocking" || e.autoEsc) continue;
        if (now - e.raisedAt >= ACK_LIMIT_SECONDS * 1000) {
          await updateDoc(doc(db, "events", eventId, "escalations", e.id), { autoEsc: true });
          await log("system", `Auto → ${personName(event?.deputyPersonId)}`, `Blocking escalation from ${e.fromLabel} unacknowledged for 90s — passed to the deputy.`);
          flash(`No acknowledgement in 90 seconds — escalation passed to ${personName(event?.deputyPersonId)}`);
        }
      }
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escalations, eventId, event?.deputyPersonId]);

  const loading = eventLoading || schLoading || taskLoading || escLoading || feedLoading || chLoading || rollLoading || cmLoading;

  return (
    <Ctx.Provider
      value={{
        eventId,
        event,
        schedule: scheduleRaw,
        tasks,
        escalations,
        feed: feedRaw,
        changes,
        roll,
        comments,
        loading,
        toast,
        flash,
        liveItem,
        advance,
        toggleTask,
        raiseEscalation,
        closeEscalation,
        log,
        settleChange,
        startRollCall,
        markRoll,
        promoteDeputy,
        sendComment,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useEventData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEventData must be used within EventDataProvider");
  return ctx;
}

export { Timestamp, serverTimestamp, deleteDoc };
