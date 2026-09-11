# Deploying Hype House Ops

Everything runs client-side against Firebase, so hosting itself never needs a
server or a paid plan. One caveat below (Storage) needs the Blaze plan to
even switch on, but stays inside its free monthly quota for a single-event
operation.

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project** → name it
   (e.g. `hype-house-ops`) → you can decline Google Analytics.
2. Inside the project, click the **`</>`** (web) icon to register a web app.
   Copy the `firebaseConfig` values it shows you — you'll need them for step 2.

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in the six `NEXT_PUBLIC_FIREBASE_*` values from the config you copied.

## 3. Turn on the Firebase products this app uses

In the Firebase console, for this project:

- **Authentication** → Get started → enable the **Email/Password** sign-in
  provider. (Free, no plan change needed.)
- **Firestore Database** → Create database → production mode → pick a region
  close to Ghana (e.g. `europe-west1`). (Free Spark-plan quota: 1GiB storage,
  50k reads/20k writes per day — comfortable for one event company.)
- **Storage** → as of late 2024, Firebase requires the **Blaze**
  (pay-as-you-go) plan to enable Storage at all, even though the free monthly
  quota (5GB storage, 1GB/day download) is unlikely to be exceeded by event
  photos and passport pictures for this use case. Enabling Blaze asks for a
  billing card but you will not be charged unless you exceed the free quota.
  If you'd rather stay strictly card-free, skip Storage — photo upload
  fields in Admin → People and Create Event will just not have anywhere to
  save to; everything else in the app works without it.
- **Hosting** → Get started (you can skip its CLI instructions, we do that
  below).

## 4. Install the Firebase CLI and connect this project

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # pick the project you just created
```

## 5. Deploy Firestore rules, indexes, and Storage rules

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 6. Seed the first roles and Main Coordinator account

Download a service account key: Firebase console → Project settings →
Service accounts → **Generate new private key**. Save it somewhere outside
the repo (never commit it).

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
ADMIN_NAME="Your Name" \
ADMIN_EMAIL=you@hypehouse.gh \
ADMIN_PASSWORD='choose-a-temporary-password' \
node scripts/seed.mjs
```

This creates the eight base roles (Main Coordinator, Sub-Coordinator,
Volunteer, MC, DJ, Usher, Vendor liaison) and your own sign-in as Main
Coordinator. Change your password after first sign-in — there's no in-app
"change password" screen yet, so use Firebase console → Authentication →
Users → ⋮ → Reset password, or wire up `updatePassword` from the Auth SDK.

## 7. Build and deploy the app

```bash
npm run build
firebase deploy --only hosting
```

Firebase Hosting prints your live URL (`https://<project-id>.web.app`). You
can attach a custom domain from Hosting → Add custom domain.

## 8. Sign in and take it from there

Go to `/signin/` on your Hosting URL, sign in with the email/password from
step 6, and use **Admin setup** to add people, assign roles, and create your
first event under **New event**.

## Known limitations on the free tier

- **The 90-second unacknowledged-Blocking-escalation auto-pass-to-deputy
  watch runs in the browser**, not on a server — it only fires while someone
  with Control Room access has a tab open. A serverless Cloud Function would
  make this reliable with nobody watching, but Cloud Functions (2nd gen)
  require the Blaze plan. If you're already on Blaze for Storage, this is a
  reasonable next addition.
- **Push notifications** (so the MC gets a cue with the screen off) need a
  installed PWA + a notification service; not built in this pass.
- Firestore's offline persistence handles the "bad signal at a venue" case
  for reads and writes automatically — there's no custom retry logic to
  maintain.
