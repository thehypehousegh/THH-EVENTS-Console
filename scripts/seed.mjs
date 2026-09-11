#!/usr/bin/env node
// One-time bootstrap: creates the base roles and the first Main Coordinator
// account, so there's someone who can sign in to Admin setup and take it
// from there. Run once per Firebase project, after Auth + Firestore are
// enabled and firestore.rules is deployed.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
//   ADMIN_NAME="Efua Mensah" ADMIN_EMAIL=efua@hypehouse.gh ADMIN_PASSWORD=changeme123 \
//   node scripts/seed.mjs

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

const PERMS = [
  "seeRun", "advance", "skipOwn", "approve", "tickOwn", "tickAny", "assign",
  "raise", "ack", "ping", "broadcast", "seeFeed", "vendorAdd", "vendorAll",
  "vendorShare", "accounts", "client", "print",
];
const PRESETS = {
  "Main Coordinator": PERMS,
  "Sub-Coordinator": ["seeRun", "advance", "skipOwn", "tickOwn", "assign", "raise", "ping", "seeFeed", "vendorAdd", "print"],
  Volunteer: ["seeRun", "tickOwn", "raise", "seeFeed"],
  MC: ["seeRun", "advance", "raise", "ping", "seeFeed"],
  DJ: ["seeRun", "raise", "ping", "seeFeed"],
  Usher: ["seeRun", "tickOwn", "raise", "ping", "seeFeed"],
  "Vendor liaison": ["seeRun", "seeFeed", "vendorAdd", "vendorAll", "raise"],
};

async function main() {
  console.log("Seeding roles…");
  const roleIds = {};
  for (const [name, perms] of Object.entries(PRESETS)) {
    const ref = db.collection("roles").doc();
    await ref.set({ name, base: name, perms });
    roleIds[name] = ref.id;
    console.log(`  ${name} -> ${ref.id}`);
  }

  const name = process.env.ADMIN_NAME || "Main Coordinator";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("\nSet ADMIN_EMAIL and ADMIN_PASSWORD to also create the first sign-in account.");
    console.log("Roles are seeded — you're done for now.");
    return;
  }

  console.log(`\nCreating first Main Coordinator account for ${email}…`);
  const user = await auth.createUser({ email, password, displayName: name });
  await db.collection("people").doc(user.uid).set({
    name,
    contact: "",
    email,
    photoUrl: null,
    roleId: roleIds["Main Coordinator"],
    active: true,
    createdAt: Date.now(),
  });
  console.log(`Done. Sign in at /signin/ with ${email} and the password you set.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
