"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Blueprint, Btn, Divider, FieldLabel, Input } from "@/components/ui";
import type { Organization, OrgService, OrgTestimonial, OrgQuickLink } from "@/lib/types";

/** Org branding/marketing content editor — name, logo, slogan, about,
 *  contact, social, services, testimonials, gallery, quick links. Used
 *  both by an org's own admin (Admin setup) and by a platform Super
 *  Admin managing an org on its behalf. Takes the org explicitly rather
 *  than reading it from context, so either caller can supply it. */
export function OrgProfileEditor({ org, flash }: { org: Organization; flash: (m: string) => void }) {
  const [name, setName] = useState(org.name || "");
  const [slogan, setSlogan] = useState(org.slogan || "");
  const [about, setAbout] = useState(org.about || "");
  const [location, setLocation] = useState(org.location || "");
  const [address, setAddress] = useState(org.address || "");
  const [contactPhone, setContactPhone] = useState(org.contactPhone || "");
  const [contactEmail, setContactEmail] = useState(org.contactEmail || "");
  const [social, setSocial] = useState(org.social || { facebook: "", instagram: "", tiktok: "", twitter: "" });
  const [services, setServices] = useState<OrgService[]>(org.services || []);
  const [testimonials, setTestimonials] = useState<OrgTestimonial[]>(org.testimonials || []);
  const [gallery, setGallery] = useState<string[]>(org.gallery || []);
  const [quickLinks, setQuickLinks] = useState<OrgQuickLink[]>(org.quickLinks || []);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      let logoUrl = org.logoUrl;
      if (logoFile) {
        const r = ref(storage, `organizations/${org.id}/logo-${Date.now()}.jpg`);
        await uploadBytes(r, logoFile);
        logoUrl = await getDownloadURL(r);
      }
      await updateDoc(doc(db, "organizations", org.id), {
        name: name.trim() || org.name,
        slogan: slogan.trim(),
        about: about.trim(),
        location: location.trim(),
        address: address.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        social,
        services,
        testimonials,
        gallery,
        quickLinks,
        logoUrl,
      });
      setLogoFile(null);
      flash("Organization profile saved — the public page is updated");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Could not save the profile");
    } finally {
      setBusy(false);
    }
  }

  async function addGalleryImage() {
    if (!galleryFile) return;
    setBusy(true);
    try {
      const r = ref(storage, `organizations/${org.id}/gallery-${Date.now()}.jpg`);
      await uploadBytes(r, galleryFile);
      const url = await getDownloadURL(r);
      setGallery((g) => [...g, url]);
      setGalleryFile(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Blueprint style={{ gridColumn: "1/-1" }}>
      <h4 style={{ margin: "0 0 2px" }}>Organization profile</h4>
      <p className="text-muted" style={{ fontSize: 11, margin: "0 0 13px" }}>
        Name, logo and slogan appear across every coordination page. Everything below feeds the public page at{" "}
        <code>{typeof window !== "undefined" ? window.location.origin : ""}/{org.slug}/</code>.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 12 }}>
        <label>
          <FieldLabel>Organization name</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <FieldLabel>Slogan</FieldLabel>
          <Input value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="A short line under the name" />
        </label>
        <div>
          <FieldLabel>Logo</FieldLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {org.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt={org.name} width={34} height={34} style={{ objectFit: "contain" }} />
            )}
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <FieldLabel>About</FieldLabel>
        <textarea className="input" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="A few sentences about the organization" style={{ width: "100%", minHeight: 80 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 9, marginTop: 12 }}>
        <label>
          <FieldLabel>Location</FieldLabel>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Accra, Ghana" />
        </label>
        <label>
          <FieldLabel>Address</FieldLabel>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
        </label>
        <label>
          <FieldLabel>Contact phone</FieldLabel>
          <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </label>
        <label>
          <FieldLabel>Contact email</FieldLabel>
          <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", gap: 9, marginTop: 12 }}>
        {(["facebook", "instagram", "tiktok", "twitter"] as const).map((k) => (
          <label key={k}>
            <FieldLabel>{k[0].toUpperCase() + k.slice(1)}</FieldLabel>
            <Input value={social[k]} onChange={(e) => setSocial((s) => ({ ...s, [k]: e.target.value }))} placeholder="https://…" />
          </label>
        ))}
      </div>

      <Divider />
      <ListEditor
        title="Services"
        items={services}
        onChange={setServices}
        empty={{ title: "", description: "" }}
        renderRow={(row, onEdit) => (
          <>
            <Input value={row.title} onChange={(e) => onEdit({ ...row, title: e.target.value })} placeholder="Service title" style={{ flex: 1, minWidth: 140 }} />
            <Input value={row.description} onChange={(e) => onEdit({ ...row, description: e.target.value })} placeholder="Short description" style={{ flex: 2, minWidth: 180 }} />
          </>
        )}
      />

      <Divider />
      <ListEditor
        title="Testimonials"
        items={testimonials}
        onChange={setTestimonials}
        empty={{ name: "", role: "", quote: "" }}
        renderRow={(row, onEdit) => (
          <>
            <Input value={row.name} onChange={(e) => onEdit({ ...row, name: e.target.value })} placeholder="Name" style={{ flex: 1, minWidth: 110 }} />
            <Input value={row.role} onChange={(e) => onEdit({ ...row, role: e.target.value })} placeholder="Role / event" style={{ flex: 1, minWidth: 110 }} />
            <Input value={row.quote} onChange={(e) => onEdit({ ...row, quote: e.target.value })} placeholder="Quote" style={{ flex: 2, minWidth: 180 }} />
          </>
        )}
      />

      <Divider />
      <ListEditor
        title="Quick links"
        items={quickLinks}
        onChange={setQuickLinks}
        empty={{ label: "", url: "" }}
        renderRow={(row, onEdit) => (
          <>
            <Input value={row.label} onChange={(e) => onEdit({ ...row, label: e.target.value })} placeholder="Label" style={{ flex: 1, minWidth: 110 }} />
            <Input value={row.url} onChange={(e) => onEdit({ ...row, url: e.target.value })} placeholder="https://…" style={{ flex: 2, minWidth: 180 }} />
          </>
        )}
      />

      <Divider />
      <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Executed events gallery</span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
        {gallery.map((src, i) => (
          <div key={i} style={{ position: "relative", width: 84, height: 60 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => setGallery((g) => g.filter((_, j) => j !== i))}
              style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, border: "none", cursor: "pointer", background: "var(--hh-danger)", color: "var(--hh-danger-ink)", fontSize: 10 }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="file" accept="image/*" onChange={(e) => setGalleryFile(e.target.files?.[0] || null)} />
        <Btn onClick={addGalleryImage} disabled={!galleryFile || busy}>Add to gallery</Btn>
      </div>

      <Divider />
      <Btn variant="primary" onClick={save} disabled={busy} style={{ minHeight: 46, fontSize: 14 }}>
        {busy ? "Saving…" : "Save organization profile"}
      </Btn>
    </Blueprint>
  );
}

export function ListEditor<T>({
  title,
  items,
  onChange,
  empty,
  renderRow,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  empty: T;
  renderRow: (row: T, onEdit: (row: T) => void) => React.ReactNode;
}) {
  return (
    <div>
      <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>{title}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, margin: "8px 0" }}>
        {items.map((row, i) => (
          <div key={i} style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
            {renderRow(row, (next) => onChange(items.map((r, j) => (j === i ? next : r))))}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="btn btn-ghost" style={{ minHeight: 40 }}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <Btn onClick={() => onChange([...items, empty])}>Add {title.toLowerCase().replace(/s$/, "")}</Btn>
    </div>
  );
}
