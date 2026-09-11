# The Hype House — Event Coordination Console

A web app for The Hype House to run event-day coordination: schedules, checklists,
escalations, deputy handover, roll call, a vendor book, day-of MC/DJ cue phones, a
public no-login client report page, and full admin control over roles, people and
role accounts.

Rebuilt from a Claude Design prototype (`docs/design-handoff/`) into a real
production stack.

## Stack

- **Next.js** (App Router, static export) + TypeScript + Tailwind
- **Firebase**: Auth (per-person email/password accounts), Firestore (data +
  realtime sync + offline persistence), Storage (photos), Hosting (free tier,
  no server functions required)

The whole app is a client-side SPA talking directly to Firebase — this is what
keeps it on Firebase's free "Spark" plan with no billing account required for
hosting/Auth/Firestore. (Firebase **Storage** now requires the Blaze
pay-as-you-go plan to enable at all, even though usage stays inside the free
quota — see `docs/DEPLOYMENT.md`.)

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in your Firebase project config
npm run dev
```

## Deployment

See `docs/DEPLOYMENT.md` for creating the Firebase project, deploying
Firestore rules, and publishing to Firebase Hosting.

## Project structure

- `src/app/` — routes (one per view: control room, coordinator, MC/DJ cue,
  admin setup, create event, client portal, vendors, project record)
- `src/lib/` — Firebase config, auth/theme/event data providers, shared types
- `src/components/` — shared UI primitives (blueprint cards, buttons, chips)
- `firestore.rules` — security rules enforcing the role/permission matrix
- `docs/design-handoff/` — the original Claude Design conversation this app
  was built from
