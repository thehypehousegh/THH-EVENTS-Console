"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doc, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { useCollection, genId } from "@/lib/hooks";
import { Blueprint, Btn, Chip, FieldLabel, Input, Toast } from "@/components/ui";
import type { HHEvent, Vendor } from "@/lib/types";

const CATEGORIES = ["Catering", "Sound / DJ", "Photo / Video", "Decor", "Venue", "Rentals", "Ushering", "Transport", "Security"];

function useFlash() {
  const [toast, setToast] = useState("");
  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3400);
  }
  return { toast, flash };
}

export default function VendorsPage() {
  return (
    <Suspense fallback={null}>
      <VendorsInner />
    </Suspense>
  );
}

function VendorsInner() {
  const eventId = useSearchParams().get("event");
  const { person, role, hasPerm } = useAuth();
  const { roles } = useAppData();
  const { data: events } = useCollection<HHEvent>("events", orderBy("createdAt", "desc"));
  const { data: vendors } = useCollection<Vendor>("vendors", orderBy("createdAt", "desc"));
  const { toast, flash } = useFlash();

  const isAll = hasPerm("vendorAll");
  const visible = vendors.filter((v) => isAll || v.byPersonId === person?.id || v.shared.includes(role?.id || "__none__"));

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [fb, setFb] = useState("");
  const [ig, setIg] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [shareVendor, setShareVendor] = useState<Vendor | null>(null);
  const [shareTo, setShareTo] = useState<string | null>(null);

  const activeEvent = events.find((e) => e.id === eventId) || null;

  async function addVendor() {
    if (!name.trim() || !contact.trim()) return flash("A vendor needs at least a name and a phone number");
    if (!hasPerm("vendorAdd")) return flash("You don't have permission to add vendors");
    await setDoc(doc(db, "vendors", genId("v")), {
      name: name.trim(),
      category,
      contact: contact.trim(),
      location,
      fb,
      ig,
      tiktok,
      byPersonId: person?.id || "",
      byRoleId: role?.id || "",
      byLabel: role?.name || "",
      eventId: activeEvent?.id || null,
      eventName: activeEvent?.name || "No event",
      shared: [],
      createdAt: Date.now(),
    });
    setName("");
    setContact("");
    setLocation("");
    setFb("");
    setIg("");
    setTiktok("");
    flash(`${name} saved — visible to you and the Main Coordinator only`);
  }

  async function doShare(where: "direct" | "feed") {
    if (!shareVendor) return;
    const card = `${shareVendor.name} · ${shareVendor.category} · ${shareVendor.contact}${shareVendor.location ? " · " + shareVendor.location : ""}`;
    if (where === "direct" && shareTo) {
      await updateDoc(doc(db, "vendors", shareVendor.id), {
        shared: shareVendor.shared.includes(shareTo) ? shareVendor.shared : [...shareVendor.shared, shareTo],
      });
      flash(`${shareVendor.name} shared — it now appears in their vendor list`);
    } else if (where === "feed" && activeEvent) {
      const { addDoc, collection } = await import("firebase/firestore");
      await addDoc(collection(db, "events", activeEvent.id, "feed"), {
        kind: "broadcast",
        route: "Main → All roles",
        text: `Vendor contact — ${card}`,
        createdAt: Date.now(),
      });
      flash(`${shareVendor.name} posted to the event feed`);
    }
    setShareVendor(null);
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "clamp(14px,3.6vw,22px) clamp(12px,3.4vw,16px)", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ maxWidth: "60ch" }}>
        <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Vendor book</span>
        <h3 style={{ margin: "6px 0 5px" }}>Vendors</h3>
        <p className="text-muted" style={{ fontSize: 12.5, margin: 0 }}>
          {isAll
            ? "You see every vendor on the books, whoever entered them, across every event — including events that have since been deleted."
            : "You see the vendors you entered, plus any the Main Coordinator has shared with you."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 16, alignItems: "start" }}>
        <Blueprint style={{ minWidth: 0 }}>
          <h4 style={{ margin: "0 0 2px" }}>Add a vendor</h4>
          <p className="text-muted" style={{ fontSize: 11, margin: "0 0 13px" }}>
            {activeEvent ? `For ${activeEvent.name}` : "Open this page from an event to attach it — otherwise it's saved unattached."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label>
              <FieldLabel>Vendor name</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Auntie Akos Kitchen" />
            </label>
            <div>
              <FieldLabel>Category</FieldLabel>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {CATEGORIES.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,140px),1fr))", gap: 9 }}>
              <label>
                <FieldLabel>Phone</FieldLabel>
                <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="020 776 3311" />
              </label>
              <label>
                <FieldLabel>Location</FieldLabel>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Dansoman, Accra" />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,130px),1fr))", gap: 9 }}>
              <label>
                <FieldLabel>Facebook</FieldLabel>
                <Input value={fb} onChange={(e) => setFb(e.target.value)} placeholder="AuntieAkosKitchen" />
              </label>
              <label>
                <FieldLabel>Instagram</FieldLabel>
                <Input value={ig} onChange={(e) => setIg(e.target.value)} placeholder="@auntieakos" />
              </label>
              <label>
                <FieldLabel>TikTok</FieldLabel>
                <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@auntieakos" />
              </label>
            </div>
            <Btn variant="primary" onClick={addVendor} style={{ minHeight: 48, fontSize: 15, marginTop: 3 }}>Save vendor</Btn>
          </div>
        </Blueprint>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
            <h4 style={{ margin: 0 }}>Vendor list</h4>
            <span className="text-muted" style={{ fontSize: 11 }}>{visible.length} of {vendors.length} vendors visible to you</span>
          </div>
          {visible.map((v) => (
            <div key={v.id} style={{ padding: 12, border: `1px solid ${v.eventName.includes("deleted") ? "var(--color-neutral-400)" : "var(--color-divider)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{v.name}</span>
                <span className="tag tag-accent">{v.category}</span>
                {isAll && (
                  <Btn onClick={() => setShareVendor(v)} style={{ marginLeft: "auto" }}>Share</Btn>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 7, alignItems: "baseline" }}>
                <a href={`tel:${v.contact.replace(/\s/g, "")}`} style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{v.contact}</a>
                <span className="text-muted" style={{ fontSize: 11.5 }}>{v.location || "—"}</span>
              </div>
              <p className="text-muted" style={{ fontSize: 11.5, margin: "6px 0 0" }}>
                {[v.fb ? "FB " + v.fb : "", v.ig ? "IG " + v.ig : "", v.tiktok ? "TikTok " + v.tiktok : ""].filter(Boolean).join("  ·  ") || "No handles on file"}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 7 }}>
                <span className="text-muted" style={{ fontSize: 10.5 }}>{v.byPersonId === person?.id ? "Entered by you" : `Entered by ${v.byLabel}`}</span>
                <span className="text-muted" style={{ fontSize: 10.5 }}>{v.eventName}</span>
              </div>
              {v.shared.length > 0 && (
                <span style={{ display: "block", marginTop: 6, fontFamily: "var(--font-heading)", fontSize: 9.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                  Shared with {v.shared.map((rid) => roles.find((r) => r.id === rid)?.name || rid).join(", ")}
                </span>
              )}
            </div>
          ))}
          {visible.length === 0 && <p className="text-muted" style={{ fontSize: 12 }}>No vendors yet.</p>}
        </div>
      </div>

      {shareVendor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "var(--hh-scrim)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
          <Blueprint style={{ width: "min(420px,100%)", background: "var(--color-bg)" }}>
            <h4 style={{ margin: "0 0 3px" }}>Share {shareVendor.name}</h4>
            <p className="text-muted" style={{ fontSize: 11.5, margin: "0 0 12px" }}>Send the full contact card to one role, or post it where the whole team can see it.</p>
            <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Send to</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "7px 0 14px" }}>
              {roles.map((r) => (
                <Chip key={r.id} active={shareTo === r.id} onClick={() => setShareTo(r.id)}>{r.name}</Chip>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Btn variant="primary" onClick={() => doShare("direct")} disabled={!shareTo} style={{ minHeight: 48, fontSize: 14 }}>Send privately to this role</Btn>
              <Btn onClick={() => doShare("feed")} disabled={!activeEvent} style={{ minHeight: 46, fontSize: 14 }}>Post to the event feed</Btn>
              <button onClick={() => setShareVendor(null)} className="btn btn-ghost" style={{ minHeight: 44, fontSize: 13 }}>Cancel</button>
            </div>
          </Blueprint>
        </div>
      )}
      <Toast text={toast} />
    </div>
  );
}
