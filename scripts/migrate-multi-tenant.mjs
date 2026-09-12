#!/usr/bin/env node
// One-time migration: turns the single-tenant deployment into the first
// tenant of the multi-org platform. Creates the-hype-house organization,
// tags the existing roles/person docs with its orgId, and (optionally)
// creates the first platform Super Admin account.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
//   SUPERADMIN_NAME="Jane Doe" SUPERADMIN_EMAIL=jane@example.com SUPERADMIN_PASSWORD=changeme123 \
//   node scripts/migrate-multi-tenant.mjs

import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const app = initializeApp({
  credential: credPath ? cert(JSON.parse(readFileSync(credPath, "utf8"))) : applicationDefault(),
});
const auth = getAuth(app);
const db = getFirestore(app);

const ORG_ID = "the-hype-house";
const ORG_SLUG = "the-hype-house";

async function main() {
  const orgRef = db.collection("organizations").doc(ORG_ID);
  const orgSnap = await orgRef.get();
  if (orgSnap.exists) {
    console.log(`organizations/${ORG_ID} already exists — skipping creation.`);
  } else {
    console.log(`Creating organizations/${ORG_ID}…`);
    await orgRef.set({
      slug: ORG_SLUG,
      name: "The Hype House",
      logoUrl: null,
      slogan: "Every run sheet, checklist and escalation — coordinated live.",
      location: "Accra, Ghana",
      address: "",
      contactPhone: "",
      contactEmail: "",
      about: "The Hype House plans and runs events end to end, coordinated live by a team that never loses the thread.",
      services: [],
      testimonials: [],
      gallery: [],
      social: { facebook: "", instagram: "", tiktok: "", twitter: "" },
      quickLinks: [],
      status: "approved",
      isPlatformOwner: true,
      subscription: { status: "active", durationDays: null, startedAt: Date.now(), expiresAt: null },
      requester: { name: "", email: "", contact: "", location: "" },
      adminEmail: null,
      createdAt: Date.now(),
      approvedAt: Date.now(),
    });
  }

  console.log("Tagging existing roles with orgId…");
  const rolesSnap = await db.collection("roles").get();
  let roleCount = 0;
  for (const doc of rolesSnap.docs) {
    if (doc.data().orgId) continue;
    await doc.ref.update({ orgId: ORG_ID });
    roleCount++;
  }
  console.log(`  ${roleCount} role(s) updated (${rolesSnap.size - roleCount} already tagged).`);

  console.log("Tagging existing people with orgId…");
  const peopleSnap = await db.collection("people").get();
  let personCount = 0;
  for (const doc of peopleSnap.docs) {
    if (doc.data().orgId) continue;
    await doc.ref.update({ orgId: ORG_ID });
    personCount++;
    console.log(`  ${doc.data().name || doc.id} -> orgId ${ORG_ID}`);
  }
  console.log(`  ${personCount} person(s) updated (${peopleSnap.size - personCount} already tagged).`);

  const name = process.env.SUPERADMIN_NAME;
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password || !name) {
    console.log("\nSet SUPERADMIN_NAME, SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD to also create the first");
    console.log("platform Super Admin account (Hype House staff who approve new organizations).");
    console.log("Migration otherwise complete.");
    return;
  }

  console.log(`\nCreating platform Super Admin account for ${email}…`);
  const existing = await auth.getUserByEmail(email).catch(() => null);
  const user = existing || (await auth.createUser({ email, password, displayName: name }));
  await db.collection("platformAdmins").doc(user.uid).set({
    name,
    email,
    createdAt: Date.now(),
  });
  console.log(`Done. Sign in at /platform/signin/ with ${email}.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
