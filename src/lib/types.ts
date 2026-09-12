// Shared data model for Hype House Ops.
// Mirrors the Claude Design prototype's state shape, translated into
// normalized Firestore collections. See PROJECT_SPEC.md for the full
// collection layout.

export type EventType =
  | "Wedding / Reception"
  | "Naming ceremony"
  | "Funeral rites"
  | "Corporate"
  | "Concert / Show"
  | "Other";

export type EventStatus = "upcoming" | "ongoing" | "completed";

export interface HHEvent {
  id: string;
  orgId: string;
  name: string;
  type: EventType;
  principal: Record<string, string>;
  date: string; // display string, e.g. "Sat 12 Sep 2026"
  dateISO: string | null; // ISO date used for day-count math
  time: string;
  guests: string;
  location: string;
  description: string;
  coverImageUrl: string | null;
  status: EventStatus;
  controllerPersonId: string | null;
  deputyPersonId: string | null;
  clientToken: string;
  clientTokenActive: boolean;
  deletedAt: number | null;
  createdAt: number;
  createdBy: string;
}

// ── Multi-tenant platform types ──────────────────────────────────
// The console is outlet-able: The Hype House is the platform creator and
// runs its own coordination on it (as one organization, flagged
// isPlatformOwner), but any event house can register, get approved by a
// Hype House Super Admin, and get their own branded org space at
// thh-events-console/{slug}/... Person/RoleDef/Vendor/HHEvent all carry
// an orgId; platform Super Admins are a separate identity (platformAdmins/
// {uid}) with no org membership of their own.

export type OrgStatus = "pending" | "approved" | "rejected" | "suspended";

export interface OrgService {
  title: string;
  description: string;
}

export interface OrgTestimonial {
  name: string;
  role: string;
  quote: string;
}

export interface OrgSocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  twitter: string;
}

export interface OrgQuickLink {
  label: string;
  url: string;
}

export interface OrgSubscription {
  status: "none" | "active" | "expired";
  durationDays: number | null;
  startedAt: number | null;
  expiresAt: number | null;
}

export interface OrgRequester {
  name: string;
  email: string;
  contact: string;
  location: string;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  slogan: string;
  location: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  about: string;
  services: OrgService[];
  testimonials: OrgTestimonial[];
  gallery: string[];
  social: OrgSocialLinks;
  quickLinks: OrgQuickLink[];
  status: OrgStatus;
  isPlatformOwner: boolean;
  subscription: OrgSubscription;
  requester: OrgRequester;
  adminEmail: string | null;
  createdAt: number;
  approvedAt: number | null;
}

export interface PlatformAdmin {
  id: string; // == Firebase Auth uid
  name: string;
  email: string;
  createdAt: number;
}

export type PermissionId =
  | "seeRun"
  | "advance"
  | "skipOwn"
  | "approve"
  | "tickOwn"
  | "tickAny"
  | "assign"
  | "raise"
  | "ack"
  | "ping"
  | "broadcast"
  | "seeFeed"
  | "vendorAdd"
  | "vendorAll"
  | "vendorShare"
  | "accounts"
  | "client"
  | "print";

export interface RoleDef {
  id: string;
  orgId: string;
  name: string;
  base: string;
  perms: PermissionId[];
}

export interface Person {
  id: string; // == Firebase Auth uid
  orgId: string;
  name: string;
  contact: string;
  email: string;
  photoUrl: string | null;
  roleId: string | null;
  active: boolean; // false == retired; access is gated on this, not on the auth account
  createdAt: number;
}

export interface EventAssignment {
  id: string; // personId
  personId: string;
  roleId: string;
  isDayOf: boolean;
  expiresAt: number | null; // day-of accounts expire at midnight
}

export type ScheduleStatus = "todo" | "live" | "done" | "skipped";

export interface ScheduleItem {
  id: string;
  order: number;
  time: string;
  title: string;
  owner: string;
  ownerRoleId: string | null;
  status: ScheduleStatus;
  inserted: boolean;
  mcScript: string[];
  djTrack: { title: string; note: string } | null;
}

export type TaskPhase = "Setup" | "Live" | "Teardown";

export interface ChecklistTask {
  id: string;
  area: string;
  phase: TaskPhase;
  task: string;
  done: boolean;
  ownerRoleId: string | null;
  dueTime: string | null;
}

export type Severity = "Need a hand" | "Attention" | "Blocking";
export type EscalationStatus = "open" | "ack" | "dispatched";

export interface Escalation {
  id: string;
  severity: Severity;
  fromPersonId: string;
  fromLabel: string;
  text: string;
  link: string;
  status: EscalationStatus;
  raisedAt: number;
  autoEsc: boolean;
}

export type FeedKind = "broadcast" | "ping" | "escalation" | "client" | "system";

export interface FeedMessage {
  id: string;
  kind: FeedKind;
  route: string;
  text: string;
  createdAt: number;
  pendingSince?: number; // set client-side while a write is in the offline queue
}

export type ChangeKind = "Skip" | "Insert";
export type ChangeStatus = "open" | "auto" | "approved" | "declined";

export interface ChangeRequest {
  id: string;
  kind: ChangeKind;
  target: string;
  byPersonId: string;
  byLabel: string;
  reason: string;
  scope: "own" | "other";
  status: ChangeStatus;
  createdAt: number;
}

export type RollState = "waiting" | "on" | "no-show";

export interface RollCallEntry {
  id: string; // personId
  role: string;
  who: string;
  phone: string;
  state: RollState;
  confirmedAt: string;
}

export interface Vendor {
  id: string;
  orgId: string;
  name: string;
  category: string;
  contact: string;
  location: string;
  fb: string;
  ig: string;
  tiktok: string;
  byPersonId: string;
  byRoleId: string;
  byLabel: string;
  eventId: string | null;
  eventName: string;
  shared: string[]; // roleIds
  createdAt: number;
}

export type CommentStatus = "new" | "seen" | "handled";

export interface ClientComment {
  id: string;
  topic: string;
  who: string;
  text: string;
  status: CommentStatus;
  createdAt: number;
}

export type Density = "Focus" | "List" | "Programme";

export const PERMS: { id: PermissionId; label: string; group: string }[] = [
  { id: "seeRun", label: "See the run sheet", group: "Programme" },
  { id: "advance", label: "Mark items done / advance", group: "Programme" },
  { id: "skipOwn", label: "Skip or insert in own area", group: "Programme" },
  { id: "approve", label: "Approve others' schedule changes", group: "Programme" },
  { id: "tickOwn", label: "Tick own checklist", group: "Checklist" },
  { id: "tickAny", label: "Tick anyone's checklist", group: "Checklist" },
  { id: "assign", label: "Assign tasks to others", group: "Checklist" },
  { id: "raise", label: "Raise an escalation", group: "Issues" },
  { id: "ack", label: "Acknowledge & dispatch backup", group: "Issues" },
  { id: "ping", label: "Ping another role directly", group: "Comms" },
  { id: "broadcast", label: "Broadcast to all roles", group: "Comms" },
  { id: "seeFeed", label: "See the whole event feed", group: "Comms" },
  { id: "vendorAdd", label: "Add vendors", group: "Vendors" },
  { id: "vendorAll", label: "See every vendor", group: "Vendors" },
  { id: "vendorShare", label: "Share vendor contacts", group: "Vendors" },
  { id: "accounts", label: "Create & retire accounts", group: "Admin" },
  { id: "client", label: "Manage the client link", group: "Admin" },
  { id: "print", label: "Print paper backups", group: "Admin" },
];

export const PRESETS: Record<string, PermissionId[]> = {
  "Main Coordinator": PERMS.map((p) => p.id),
  "Sub-Coordinator": ["seeRun", "advance", "skipOwn", "tickOwn", "assign", "raise", "ping", "seeFeed", "vendorAdd", "print"],
  Volunteer: ["seeRun", "tickOwn", "raise", "seeFeed"],
  MC: ["seeRun", "advance", "raise", "ping", "seeFeed"],
  DJ: ["seeRun", "raise", "ping", "seeFeed"],
  Usher: ["seeRun", "tickOwn", "raise", "ping", "seeFeed"],
  "Vendor liaison": ["seeRun", "seeFeed", "vendorAdd", "vendorAll", "raise"],
};

export const EVENT_TYPES: Record<
  EventType,
  { short: string; heading: string; hint: string; fields: [string, string, string][]; scaffold: string[] }
> = {
  "Wedding / Reception": {
    short: "wedding reception",
    heading: "The couple",
    hint: "Both names print on the client link, the run sheet and every day-of account.",
    fields: [
      ["bride", "Bride", "Nana Ama Asante"],
      ["groom", "Groom", "Kwabena Owusu"],
    ],
    scaffold: [
      "Run sheet from the reception template — 12 items",
      "Checklist across ushering, catering, protocol, AV, decor",
      "Day-of accounts for MC and DJ, expiring at midnight",
      "Client link for the couple and the families",
    ],
  },
  "Naming ceremony": {
    short: "naming ceremony",
    heading: "Child and parents",
    hint: "Outdooring name is often withheld until the day — leave it blank and fill it in later.",
    fields: [
      ["child", "Child", 'Name, or "to be outdoored"'],
      ["parents", "Parents", "Mr & Mrs Mensah"],
    ],
    scaffold: [
      "Morning-rite run sheet — 8 items",
      "Checklist for elders, libation, catering",
      "Day-of account for the officiant",
      "Client link for the family",
    ],
  },
  "Funeral rites": {
    short: "funeral",
    heading: "The deceased",
    hint: "Multi-day programmes get one project per day, linked under the same family.",
    fields: [
      ["deceased", "Deceased", "Nana Kwabena Otu I"],
      ["family", "Chief mourner / family", "Otu family, Cape Coast"],
    ],
    scaffold: [
      "Three-day programme skeleton — wake, burial, thanksgiving",
      "Checklist for protocol, seating, donations, catering",
      "Day-of accounts for MC and the donations desk",
      "Client link for the family head",
    ],
  },
  Corporate: {
    short: "corporate event",
    heading: "The company",
    hint: "Client contacts get the link; the internal team never sees your coordinator chatter.",
    fields: [
      ["company", "Company", "GhanaTech Ltd"],
      ["occasion", "Occasion", "Annual summit, day 2"],
    ],
    scaffold: [
      "Conference-day run sheet — sessions and breaks",
      "Checklist for AV, registration, catering, logistics",
      "Day-of accounts for the session MC and AV lead",
      "Client link for the company's events lead",
    ],
  },
  "Concert / Show": {
    short: "show",
    heading: "The act",
    hint: "Set times drive the run sheet; the DJ and AV accounts key off them.",
    fields: [
      ["act", "Headline act", "Black Star Sounds"],
      ["promoter", "Promoter", "Ridge Live"],
    ],
    scaffold: [
      "Set-time run sheet with changeovers",
      "Checklist for stage, front of house, security",
      "Day-of accounts for MC, DJ, stage manager",
      "Client link for the promoter",
    ],
  },
  Other: {
    short: "event",
    heading: "Who it is for",
    hint: "Give the person or body the event honours, and who is hosting.",
    fields: [
      ["subject", "Honouree / subject", "Name"],
      ["host", "Host", "Hosting family or body"],
    ],
    scaffold: ["Blank run sheet", "Blank checklist with your standard areas", "Day-of accounts on request", "Client link"],
  },
};

export const SEVERITIES: { key: Severity; bg: string; fg: string }[] = [
  { key: "Need a hand", bg: "var(--color-accent-600)", fg: "var(--hh-paper)" },
  { key: "Attention", bg: "var(--hh-warn)", fg: "var(--hh-warn-ink)" },
  { key: "Blocking", bg: "var(--hh-danger)", fg: "var(--hh-danger-ink)" },
];

export const ACK_LIMIT_SECONDS = 90;
