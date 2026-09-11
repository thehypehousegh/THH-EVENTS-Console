"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthProvider";
import { Blueprint, Btn, Chip, FieldLabel, Input, Toast } from "@/components/ui";
import { EVENT_TYPES, type EventType } from "@/lib/types";
import { genId, genToken } from "@/lib/hooks";

const TYPES = Object.keys(EVENT_TYPES) as EventType[];

export default function CreateEventPage() {
  const { hasPerm, person } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<EventType>("Wedding / Reception");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [principal, setPrincipal] = useState<Record<string, string>>({});
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const def = EVENT_TYPES[type];

  if (!hasPerm("client") && !hasPerm("accounts")) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: 20 }}>
        <p className="text-muted">You don&apos;t have permission to create events.</p>
      </div>
    );
  }

  async function createEvent() {
    if (!name.trim()) {
      setToast("Give the event a name first");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    setBusy(true);
    try {
      const id = genId("ev");
      let coverImageUrl: string | null = null;
      if (coverFile) {
        const r = ref(storage, `events/${id}/cover.jpg`);
        await uploadBytes(r, coverFile);
        coverImageUrl = await getDownloadURL(r);
      }
      await setDoc(doc(db, "events", id), {
        name: name.trim(),
        type,
        principal,
        date: date || "Date not set",
        dateISO: null,
        time,
        guests,
        location,
        description: desc,
        coverImageUrl,
        status: "upcoming",
        controllerPersonId: person?.id || null,
        deputyPersonId: null,
        clientToken: genToken(),
        clientTokenActive: true,
        deletedAt: null,
        createdAt: Date.now(),
        createdBy: person?.id || "",
      });
      router.push(`/admin/?event=${id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "clamp(14px,3.6vw,22px) clamp(12px,3.4vw,16px)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
        gap: 16,
        alignItems: "start",
      }}
    >
      <Blueprint style={{ minWidth: 0 }}>
        <h4 style={{ margin: "0 0 2px" }}>New event</h4>
        <p className="text-muted" style={{ fontSize: 11, margin: "0 0 14px" }}>
          Creating the event opens a project: run sheet, checklist, role accounts and a client link all hang off it.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <label>
            <FieldLabel>Event name</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nana Ama & Kwabena · Reception" />
          </label>

          <div>
            <FieldLabel>Type of event</FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {TYPES.map((t) => (
                <Chip key={t} active={type === t} onClick={() => { setType(t); setPrincipal({}); }}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          <div style={{ padding: 12, border: "1px dashed var(--color-divider)", background: "var(--color-accent-100)" }}>
            <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>{def.heading}</span>
            <p className="text-muted" style={{ fontSize: 11, margin: "5px 0 10px" }}>{def.hint}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,140px),1fr))", gap: 9 }}>
              {def.fields.map(([key, label, placeholder]) => (
                <label key={key}>
                  <span style={{ fontSize: 10.5 }}>{label}</span>
                  <Input
                    value={principal[key] || ""}
                    onChange={(e) => setPrincipal((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,120px),1fr))", gap: 9 }}>
            <label>
              <FieldLabel>Date</FieldLabel>
              <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="Sat 12 Sep 2026" />
            </label>
            <label>
              <FieldLabel>Start</FieldLabel>
              <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="14:30" />
            </label>
            <label>
              <FieldLabel>Guests</FieldLabel>
              <Input value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="480" />
            </label>
          </div>

          <label>
            <FieldLabel>Location</FieldLabel>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Alisa Hotel, Ridge, Accra" />
          </label>
          <label>
            <FieldLabel>Short description</FieldLabel>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="One line the whole team and the client will see" />
          </label>

          <Btn variant="primary" onClick={createEvent} disabled={busy} style={{ minHeight: 48, fontSize: 15, marginTop: 3 }}>
            {busy ? "Creating…" : "Create event & open project"}
          </Btn>
        </div>
      </Blueprint>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <Blueprint>
          <h4 style={{ margin: "0 0 12px" }}>Cover image</h4>
          <div
            style={{
              aspectRatio: "16/10",
              border: "1px dashed var(--color-divider)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "var(--color-neutral-100)",
              textAlign: "center",
              padding: 16,
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {coverFile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={URL.createObjectURL(coverFile)} alt="Cover preview" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>
                  Drop event poster, couple image, invitation flier or person&apos;s picture here
                </span>
                <span className="text-muted" style={{ fontSize: 11 }}>Shows on the client link and every coordinator&apos;s sign-in screen.</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            />
          </div>
        </Blueprint>

        <Blueprint>
          <h4 style={{ margin: "0 0 3px" }}>Preview</h4>
          <p className="text-muted" style={{ fontSize: 11, margin: "0 0 12px" }}>How the event heads the console and the client page.</p>
          <div style={{ padding: 14, background: "var(--color-accent-900)", color: "var(--hh-paper)" }}>
            <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", opacity: 0.6 }}>{type}</span>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: "5px 0 6px" }}>{name || "Untitled event"}</div>
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              {def.fields.map(([key]) => principal[key]).filter(Boolean).join("  ·  ") || def.fields.map(([, label]) => label).join(" · ") + " — not yet filled"}
            </span>
            <div style={{ height: 1, background: "var(--hh-paper-20)", margin: "11px 0" }} />
            <span style={{ fontSize: 12, opacity: 0.8 }}>{[date || "Date not set", time, location].filter(Boolean).join(" · ")}</span>
          </div>
          <p className="text-muted" style={{ fontSize: 11.5, margin: "12px 0 0" }}>
            {desc || "The short description shows here, on the client link and above every coordinator's run sheet."}
          </p>
        </Blueprint>

        <Blueprint>
          <h4 style={{ margin: "0 0 3px" }}>Created with the event</h4>
          <p className="text-muted" style={{ fontSize: 11, margin: "0 0 10px" }}>Standard scaffolding for a {def.short}, editable after.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {def.scaffold.map((s) => (
              <div key={s} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
                <span style={{ width: 7, height: 7, flex: "none", background: "var(--color-accent-500)", transform: "translateY(-1px)" }} />
                <span style={{ fontSize: 12.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </Blueprint>
      </div>
      <Toast text={toast} />
    </div>
  );
}
