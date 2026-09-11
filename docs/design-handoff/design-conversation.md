# Hype House Event Coordination App

_Started 2026-09-10 00:10 UTC_

---

## User

Design a mobile app or web app for The Hype House Event Coordination.

1. To be accessed on all devices by sub cordinators and MCs for an event
2. Will have an admin side that will program the schedule for the event. Build a checklist for a project, assign roles or responsibilities for cordinators
3. Cordinators will be able to see their roles, tick the progress of their assignment, escalate issues to main cordinator or call on other cordinators to assist or step in
4. Get progress report for a project per checklist execution by main and other cordinators
5. On the day of event, assign account and role to MC, DJ and such people who will be used on the very day
6. Built event schedule can be checked item by item as its completed
7. Allow skipping or insert of item, approved by main coordinator and updated on all dashboards of appropriate user
8. Help cordinator or team communicate between each other (like a cordinator should b able to send an announcement to MC, MC should be able to update DJ of a song change, Ushering Cordinator should be able to alert Food Cordinator of readiness to come for food amongst others)
9. So main coordinator creates role accounts, and gives it out to who will use that account, should be able to retire that user afterwards so that even if the credentials don't change, the user cannot access the account until admin has reactivated it.
10. Admin side should keep record of each project where if you click on it should give you history of communication, event schedules, checklist and stuff.
11. Should be web-based, free tier, securely and accessible

## Assistant



## User

Answered — Asked for follow-up questions; primary_screen: Coordinator's day-of run sheet (phone), MC/DJ minimal cue view (phone); device_split: Everything responsive, one layout; event_type: Weddings, Receptions, Naming ceremonies. Corporate events, Theater and music shows, funerals; roles: Main Coordinator, Sub-Coordinator, Ushering Coordinator, Food/Catering Coordinator, Protocol/VIP, MC, DJ, Sound/AV, Photo/Video, Security, Decor, Logistics/Transport; comms_model: Role-to-role direct pings (MC → DJ), Broadcast announcements + role channels, One event-wide feed, everyone sees everything, Pi…

## Assistant



## Assistant

Before building, a few calls I can't make for you.

_[tool: ask_user]_

No answers came through, so I'll make the calls myself. Checking the Industry system's components first.

_[tool: list_files]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

Building it as one interactive prototype with a role switcher across five views.

_[tool: dc_write]_

Answers landed — but several were "all of the above," so a few sharpening questions.

_[tool: ask_user]_

Waiting on that second round — mainly the comms default, the escalation speed, and what the three layout directions should differ on. Once it's in I'll build the coordinator phone view to full fidelity with the MC/DJ cue view alongside it.

## User

Answered — comms_default: The event-wide feed — everyone sees everything, ambient awareness; sample_event: Nigerian wedding reception; escalation_speed: Three severity buttons, then an optional 20-second detail sheet; sub_authority: Tick and untick their own checklist rows, Mark a schedule item done / advance the run sheet, Skip an item in their own area, Insert a new item; variation_axis: Information density — one big card vs. full list; open_questions: 1. The default should be for a Ghanaian wedding reception  2. A web-app accessible on phone, desktop and tablet

## Assistant

Ghanaian wedding it is. Writing the full app now.

_[tool: dc_write]_

_[tool: ready_for_verification]_

Five views, one responsive layout, Ghanaian wedding data throughout: **Control room** (run sheet, area dials, approvals, escalation lane, event feed), **Coordinator** — three density directions A/B/C, all live, **MC/DJ** cue phones, **Admin setup** (role accounts you can retire and reactivate, schedule builder, checklist assignment), and **Project record**.

Worth trying: tick a task in B, then open Control room — the area dial moves. Escalation is three severity buttons that fire immediately, then an optional detail sheet.

Tell me which coordinator density you want (A, B or C) and I'll build that one out properly and drop the other two.

## User

Admin should be able to create the event (name, date, time, image, short description, location, type of event (if wedding, reception, marriage should indicate groom and bride. If naming, should indicate either parents or child. If funeral, should indicate deceased. If corporate, should indicate company. and others).

There should be a seperate page with something like a reporting dashboard for client to view progress, updates or stuff like that and a way to share a link for client to view that page without logging into the system. Client can click on a button on that side to make a comment or input

## Assistant

Two additions: an event-creation form with type-dependent fields, and a public client report page with commenting.

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Two new tabs.

**New event** — name, type, date, start, guests, location, description, cover image drop. Picking the type swaps the principal-party fields: bride/groom, child/parents, deceased/chief mourner, company/occasion, act/promoter, or honouree/host. Live preview on the right shows how it heads the console and the client page, plus what scaffolding gets created for that type.

**Client link** — a shareable read-only URL (copy, or revoke and reissue), progress on programme and checklist, the live item, the full programme updating itself, curated updates from the coordinator, and an "Add a note" composer with a topic chip. A client note posts into the coordinator's event feed tagged *From client* — send one, then check Control room.

Escalations, backup requests and internal chatter deliberately never reach the client page.

## User

Cover Image side should be "Drop event poster, couple image, invitation flier or person's picture here

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Copy updated. (The two adherence warnings are just the unused Organic and Broadsheet systems — this app is built on Industry.)

## User

Make design more colorful to meet industry standard or you can introduce a 3 option theme picker for dark, corporate and industry or something

## Assistant

_[tool: read_file]_

_[tool: run_script]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Theme picker sits top-right — **Industry** (steel wireframe, the bound system), **Corporate** (brighter cool blue, lighter ground, white ink on fills), **Dark** (near-black ground, inverted accent ramp for night-of use in a dark hall). It swaps the whole token set, so every view, tag, button, chart bar and severity color retunes at once. Nav tabs moved to their own row so all seven fit.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Theme now applies from render instead of a lifecycle hook — Corporate and Dark actually repaint the whole console.

## User

The Main Coordinator or Admin Dashboard should have a logo of THE HYPE HOUSE , name of the company and what we stand for

Sections of Completed, Ongoing, Upcoming (with number of days more calculated from event date) showing status of projects or events

A send announcement, notification and message icon too

That of the Coordinators should have a login, from where their dashboard shows the event they've been assigned to, checklist, completed and pending plus those past deadline

Announmemts or messages or notification column

## User

The Main Coordinator or Admin Dashboard should have a logo of THE HYPE HOUSE , name of the company and what we stand for

Sections of Completed, Ongoing, Upcoming (with number of days more calculated from event date) showing status of projects or events

A send announcement, notification and message icon too

That of the Coordinators should have a login, from where their dashboard shows the event they've been assigned to, checklist, completed and pending plus those past deadline

Announmemts or messages or notification column

## User

Found issues — fixing…

## User

Found issues — fixing…

## User

This is good for now

## Assistant

Good. Where it stands: seven views on the Industry system with Corporate and Dark themes, Ghanaian wedding sample data throughout, and everything wired live — ticks move the dials, approvals rewrite the run sheet, client notes land in the coordinator feed.

Two things still open when you want them: pick a coordinator phone density (A, B or C) so I can drop the other two, and the offline queue / patchy-network behaviour you flagged early on is stated in the UI but not modelled.

## User

Let's delve into the two open issues

## Assistant



## Assistant

Building the offline model first, then I'll ask you the density question.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the connectivity UI.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the template: a connectivity strip on the coordinator dashboard, an offline banner on the phones, and the device chip in the global status bar.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Offline is now modelled, not just claimed. On the Coordinator view there's a **Network on this device** control (Good signal / Weak / No signal):

Going offline puts a red bar on the phones with a live "waiting to send" count, ticks still register instantly but show an amber "⋯" and *Saved here · waiting for signal*, escalations tell you they're held rather than pretending they sent, and a **Waiting to send** card lists queued messages with the time they were actually captured. The global status bar shows Main's side of it — *Ushering device offline · 3 pending*. Coming back online flushes everything into the feed at its original timestamp and reports what went out.

Now the other one:

_[tool: ask_user]_

Waiting on the density pick (A, B, C, or keep all three as a per-user setting) and where you want me next.

## User

Answered — density: Keep all three as a per-user setting; density_why: Experienced coordinators who own an area, People who need programme context, not just tasks, Depends on the role — vary it; next: Build out the winning phone view deeper, MC/DJ phones to the same depth, Free-tier reality: what the data model and hosting look like

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Now the free-tier / data-model page.

_[tool: dc_html_str_replace]_

Here's the audit. I've flagged what the prototype gets right only where it matters for the gap.

**Accessibility (WCAG 2.2 AA) — the biggest real gap**
- Severity is carried by colour alone in several places (red overdue rows, live pills, network chip). Add a shape or text token — this fails 1.4.1 and matters more than usual since a lot of Ghanaian men have some red-green deficiency and this runs in dim halls.
- Contrast: the amber `--hh-warn` on light and the `text-muted` 55% ink both sit under 4.5:1 at 10–11px. The 9px uppercase kickers are below any sane minimum — 11px floor.
- Everything interactive is a `<button>`, which is right, but there are no ARIA live regions. The toast, the escalation lane and the run-sheet advance all need `aria-live="polite"` (and `assertive` for blocking escalations) or a screen-reader user never learns the programme moved.
- Checkbox rows should be `role="checkbox" aria-checked`, not bare buttons. Dialogs need focus trap, `aria-modal`, Escape to close.
- No keyboard path through the phone views, no skip link, no visible focus ring audit against the dark theme.
- Touch targets pass on the phone views (46–64px), fail in the admin tables (Retire/Reactivate at 24px high).

**Security**
- Shared role credentials are the core design and the core risk: a code plus PIN handed to a volunteer is a shared secret with no repudiation. You cannot later prove who ticked what. Minimum fix: per-session device binding — the first sign-in claims the code to a device, admin sees the device, retiring clears it. Better: magic link to the person's phone number, role assigned on top.
- Add rate limiting and lockout on the PIN. A four-digit PIN with no throttle is trivially brute-forced.
- The client link is an unguessable URL — fine as a pattern (it's how Notion and Google do it), but it needs an expiry date, a visible "who has opened this" count, and revocation that actually invalidates (you have the button; wire it to a token version).
- Day-of accounts should hard-expire at a timestamp, not by an admin remembering. Show the expiry on the account row.
- Audit log needs to be append-only and include who approved each skip/insert — you have the display, not the immutability guarantee.

**Data protection (Ghana Act 843 / GDPR if any EU guests)**
- You're holding guest counts, VIP lists, chief mourner details, sometimes health/dietary data. Register with the Data Protection Commission, name a controller, and set a retention period per project — right now "full record retained" is stated as a feature with no end date. Offer a purge-after-N-months default.
- Client comments and coordinator chatter are personal data. The client page must say what's collected and who sees it.
- Photos attached to escalations may capture guests. Needs a notice and a retention rule.

**Incident handling vs. standard practice**
- Your three-severity ladder is good, but real incident systems (ICS, venue safety plans) add a fourth: *life safety*. Fire, medical, crowd crush. That should bypass the coordinator lane entirely, alert every device at once, and show the venue's emergency numbers and assembly point. This is the single most important functional addition.
- No acknowledgement timeout. If Main doesn't ack a Blocking escalation in 90 seconds it should escalate to the deputy automatically.
- No named deputy / handover. If the Main Coordinator's phone dies, the event has no controller.

**UI additions worth building**
- Roll call / radio check before doors: every role confirms they're on and reachable. Standard practice, currently missing.
- A deputy or acting-Main handover control.
- Timestamped "as-run" variance report — planned vs actual per item — which is what a client and your own post-mortem actually want. You have the data; you only show status.
- Search across the comms log in the project record. At 331 messages a funeral is unreadable.
- Undo on tick. Volunteers mis-tap constantly; currently a wrong tick silently moves the Main's dials.
- Language: Twi/Ga labels for volunteer-facing screens, or at least the Focus view.

**Other standards**
- Free tier: realistic on Supabase/Neon + Vercel for one event at a time, but the offline queue needs an IndexedDB store and a conflict rule (last-write-wins on ticks is fine; not fine on schedule edits). Push notifications on iOS require an installed PWA — plan for that or the MC won't get cues with the screen off.
- Print/export: a run sheet needs to exist on paper. Every professional operation runs a paper backup.

Want me to build any of these — I'd start with the life-safety lane, the deputy handover, and the accessibility pass.

## User

And it will be mostly opened on Mobile or tablet so make the layout very dynamic in that manner

## Assistant

Responsive pass — fluid containers, no fixed-width grids, scrollable nav, phone shells that fill a real phone.

_[tool: run_script]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: run_script]_

_[tool: ready_for_verification]_

Mobile/tablet pass:

- Every grid track is now `minmax(min(100%, N), 1fr)` — nothing can force a horizontal scrollbar at 320px.
- Page gutters, card padding and the big headings use `clamp()`, so they tighten on a phone and open up on a tablet without breakpoints.
- The seven nav tabs became one horizontally scrollable row with no-wrap 34px-tall targets; the active-project label truncates instead of pushing the icons off.
- Phone shells are `min(360px, 100%)` wide and `min(660px, 78vh)` tall — full-bleed on a phone, framed on a tablet.
- Touch targets: every small button went from ~24px to 38–40px, including the admin Retire/Reactivate rows and all the chips. That was the accessibility item I flagged.
- The notification panel now flows under the header instead of pinning to a fixed 97px offset, which broke when the header wrapped.

Also landed earlier in this turn: the coordinator density is a real per-user setting (Focus / List / Programme, saved to the device, with the role default noted), the MC phone shows per-item script notes and its time budget, and the DJ has a full track sheet with now/played states.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: grep]_

_[tool: ready_for_verification]_

All three addressed:

- Network control is 44px tall and wraps to two rows instead of shrinking.
- Under 720px the status strip drops the venue/guest line, "Signed in", the exec tag and the console subline — it should collapse to about one row, leaving the clock, drift, open escalations and the sync chip. That's the one place I used a media query, since viewport-conditional hiding can't be done inline.
- 44px floor on every remaining button: header comms icons, admin Retire/Reactivate, Done & advance, Approve/Decline, Acknowledge/Send backup, Copy link, Revoke, Add a note, Sign out.

## User

The Hype House logo

## User

The Hype House logo

## User

Is there anything you will suggest to be added to make it more?

## Assistant

_[tool: list_files]_

_[tool: image_metadata]_

_[tool: view_image]_

_[tool: grep]_

_[tool: grep]_

_[tool: ready_for_verification]_

Logo is in — header (inverted white on the steel bar), admin dashboard masthead, coordinator sign-in, and the client page. It flips automatically in Dark theme.

Things I'd add next, roughly in order of value:

**Life-safety lane.** A fourth level above Blocking that bypasses the coordinator entirely — alarms every device at once, shows venue emergency numbers and the assembly point. Fire, medical, crowd crush. This is the one genuinely missing thing.

**Deputy handover.** If the Main Coordinator's phone dies, the event has no controller. A named deputy who can be promoted in two taps, plus auto-escalation if a Blocking alert goes unacknowledged for 90 seconds.

**Roll call before doors.** Every role confirms they're on and reachable. Standard practice at any professional operation, and it catches the volunteer who never installed the app.

**Undo on tick.** Volunteers mis-tap constantly and a wrong tick silently moves Main's dials.

**Paper fallback.** A printable run sheet and checklist. Every serious operation runs paper as backup — and it's cheap to add.

**Vendor/contact sheet.** Phone numbers for caterer, venue manager, ambulance, the couple's families. Currently there's nowhere to look up a number.

**As-run variance report.** Planned vs actual per item — what the client and your own post-mortem actually want. The data is already there; only status is shown.

**Twi or Ga labels** on the volunteer-facing Focus view.

Say which and I'll build them.

## User

Deputy handover. If the Main Coordinator's phone dies, the event has no controller. A named deputy who can be promoted in two taps, plus auto-escalation if a Blocking alert goes unacknowledged for 90 seconds.

Roll call before doors. Every role confirms they're on and reachable. Standard practice at any professional operation, and it catches the volunteer who never installed the app.

Undo on tick. Volunteers mis-tap constantly and a wrong tick silently moves Main's dials.

Paper fallback. A printable run sheet and checklist. Every serious operation runs paper as backup — and it's cheap to add.

Vendor/contact sheet. Phone numbers for caterer, venue manager, ambulance, the couple's families. Currently there's nowhere to look up a number.

As-run variance report. Planned vs actual per item — what the client and your own post-mortem actually want. The data is already there; only status is shown.


Do all this.
For the Vendor contact sheet; Coordinators should take Vendor name, contact, location and Social media handles (FB, IG and Tiktok) of all vendors. Summary list of all vendors, contacts and other details should show at the Main Cordinator end. Sub cordinators shouldn't see contacts of vendors other coordinators have inputed. Main cordintor should have an option to share a vendor detail to a cordinator or user of the system either through the chat, or another feature (and should be able to post it in the general chat or announcemment)

Details of vendors for a completed event should be kept under the log of that event and even if event is deleted, should be retained. Probably under a tab called vendors where new vendors can be added and assigned an event.

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the vendors view data, variance report, and the `isVendors` flag.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: read_file]_

Now the archive rows for Variance and Vendors used.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the template: deputy + roll call + ack watch on Control room, undo and check-in on Coordinator, the Vendors view, and print.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Now the coordinator check-in + undo, then the Vendors view.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

Now the printable paper backup sheet.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

All six landed, plus the vendor book.

**Deputy handover** — Control & cover card on the Control room names the controller and deputy; two taps promotes. A live 90-second countdown sits at the top of the escalation lane for every open Blocking item, going red under 30s; if it runs out the escalation passes to the deputy automatically and the feed records it. It's on a real clock, so leave e1 unacknowledged and watch it fire.

**Roll call** — nine roles with confirm state, time confirmed and phone number; "Run roll call" resets everyone to waiting and broadcasts. Coordinator side has a big amber *I am on — check me in* button that turns steel once tapped. Outstanding roles are listed by name, and one is already marked unreachable.

**Undo on tick** — after any tick a bar offers *Undo "…"*, and it correctly restores the previous state offline too.

**Paper backup** — print run sheet and checklist buttons open a proper print layout: titled sheet with controller and deputy, run sheet with tick boxes, checklist on its own page, key numbers. Screen UI is hidden in print.

**Emergency & key numbers** — tap-to-dial grid: ambulance, fire, police, duty manager, both families.

**Vendors** (own tab) — coordinators enter name, category, phone, location and FB/IG/TikTok. The *Viewing as* toggle demonstrates the permission rule: as Ushering you see six of eight; as Main you see all eight across every event. Main gets a Share button — send privately to one role, or post the contact card to the event feed. Shared vendors then appear in that role's list. Vendors carry their event, and the Cape Coast one is tagged *Event deleted · vendor retained*.

**As-run variance** — new tab in the project record: planned → actual per item with drift in minutes, alongside a *Vendors used* tab for that event.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Three fixes:

- The interval now starts only while a Blocking escalation is unacknowledged and clears itself the moment one is acked or auto-passed — no free-running clock.
- `applyTheme()` is back out of render, into `componentDidMount` plus a guarded `componentDidUpdate`, so theme switching still works without writing 30 custom properties on every tick.
- The countdown derives from a stored `raisedAt` timestamp rather than an incremented counter, so 90 seconds is 90 wall-clock seconds even if a tick is dropped.

## User

I hope Admin is allowed to create New Roles (Role Name, Roles) then later assign role to a person (Name, contact, passport picture) and assign event to the person after the person has been assigned role

For Access of Roles:
Cordinators should have things they can see and have access to or do (per the conversation we'e had so far)
Volunteers
DJ
MC
Usher
Others as appropriate should all have their varying level of access either based on WHat the Main coordinator determines

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the admin template.

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Two new cards at the top of **Admin setup**.

**Roles & access** — eight roles across the top; pick one and you get its permission matrix in six groups (Programme, Checklist, Issues, Comms, Vendors, Admin — 18 permissions). Every box is live and the count updates. Create a new role by naming it and choosing a starting template (Main Coordinator, Sub-Coordinator, Volunteer, MC, DJ, Usher, Vendor liaison), then adjust the boxes. So a Volunteer gets four permissions, a DJ four different ones, a Sub-Coordinator ten — and the Main Coordinator can change any of it.

**People** — directory with initials avatar (solid = passport photo on file, dashed = missing), contact, current role and events. Add name + contact, drop the passport picture. Tap anyone to open the assignment panel on the right: Step 1 role, Step 2 events — and Step 2 stays hidden until a role is set, which is the ordering you asked for. Ama Serwaa is seeded with no role so you can walk the flow.

