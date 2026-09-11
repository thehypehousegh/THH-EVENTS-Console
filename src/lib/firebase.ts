"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

// Firestore with offline persistence — this is what gives us most of the
// "works on a bad signal at a wedding venue" behaviour for free: writes made
// while offline queue in IndexedDB and flush automatically on reconnect, and
// `snapshot.metadata.hasPendingWrites` tells the UI what is still in flight.
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const storage: FirebaseStorage = getStorage(app);

// A second, independent app instance used ONLY for creating new Firebase Auth
// users from the admin screen. createUserWithEmailAndPassword on the default
// app would sign the admin out and into the new account — this avoids that.
export function getSecondaryAuth(): Auth {
  const name = "hh-secondary";
  const secondaryApp = getApps().find((a) => a.name === name) ?? initializeApp(firebaseConfig, name);
  return getAuth(secondaryApp);
}
