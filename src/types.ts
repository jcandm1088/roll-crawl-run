import type { LocalDate } from './domain/dates';
import type { AgeBasis } from './domain/age';
import type { ThemeId } from './ui/theme/themes';

/**
 * Common envelope for every user record. Designed so records can later be
 * exchanged between devices and merged field by field (see plan §8.1a).
 */
export interface RecordEnvelope {
  id: string; // UUID v4
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  deletedAt: string | null; // tombstone marker
  rev: number; // incremented on every local write
  originDeviceId: string;
  lastModifiedBy: string; // deviceId
}

export type ChildColor = 'clay' | 'ocean' | 'rose' | 'plum' | 'moss' | 'slate';

export interface CorrectedAgeSettings {
  enabled: boolean;
  inputMethod: 'dueDate' | 'gestationalAge';
  /** Estimated due date. When entered as gestational age, computed from it. */
  dueDate: LocalDate | null;
  gestationalWeeks: number | null;
  gestationalDays: number | null;
}

export interface Child extends RecordEnvelope {
  deletedAt: null;
  name: string | null; // name or nickname, optional
  dob: LocalDate;
  photoId: string | null;
  color: ChildColor;
  about: string | null; // optional additional profile information
  correctedAge: CorrectedAgeSettings;
  ageBasis: AgeBasis;
}

/** What remains after a child profile is deleted: no personal information, only the id and tombstone. */
export interface ChildTombstone extends RecordEnvelope {
  deletedAt: string;
}

export type ChildRecord = Child | ChildTombstone;

export interface Photo {
  id: string;
  childId: string;
  blob: Blob;
  width: number;
  height: number;
  createdAt: string;
}

export interface Meta {
  id: 'meta';
  schemaVersion: number;
  deviceId: string;
  /** Optional, user-entered; blank by default (Q8). Used later to attribute merged history. */
  deviceLabel: string;
  createdAt: string;
  onboardingComplete: boolean;
  lastBackupAt: string | null;
}

/**
 * Calendar overlay preferences, stored per device. The Simplified Calendar (Checkpoint 3) uses exactly
 * three: `vaccines` (off by default), `medical` and `personal`. `wellVisits` and `therapy` are inert
 * fields kept only so older stored settings stay readable; they are not overlays and nothing reads them.
 */
export interface LayerVisibility {
  personal: boolean;
  medical: boolean;
  vaccines: boolean; // Recommended vaccine schedule: off until the parent turns it on
  wellVisits: boolean; // inert (earlier plan)
  therapy: boolean; // inert (earlier plan)
}

export type CalendarEventKind = 'medical' | 'personal';

/**
 * A parent-entered calendar event (stored in the `events` store, one child each). Deleting an event
 * removes the record outright: no title, note or location is kept (owner decision, Checkpoint 3).
 */
export interface CalendarEvent extends RecordEnvelope {
  deletedAt: null;
  recordType: 'calendarEvent';
  childId: string;
  kind: CalendarEventKind;
  title: string;
  date: LocalDate;
  /** Optional wall-clock time, "HH:MM" (24-hour). No time zone is attached. */
  time: string | null;
  location: string;
  notes: string;
}

export type JournalEntryType = 'reflection' | 'care';

/**
 * A journal entry (stored in the `journal` store, one child each). Personal Reflections and Care Notes
 * share the store but stay distinct by `type`, so a later export can leave Personal Reflections out by
 * default. Only a Care Note can be a provider question, and only a question can be answered.
 * Deleting an entry removes the record outright: no title, text or tag is kept (Checkpoint 4).
 */
export interface JournalEntry extends RecordEnvelope {
  deletedAt: null;
  recordType: 'journalEntry';
  childId: string;
  type: JournalEntryType;
  /** The day the entry is about (today by default; can be earlier, never later). */
  date: LocalDate;
  /** Optional: "" when the parent gave none. */
  title: string;
  body: string;
  /** Parent-created, free-form; unique without regard to capitals. */
  tags: string[];
  isProviderQuestion: boolean;
  /** Meaningful only when isProviderQuestion is true; otherwise always false. */
  answered: boolean;
}

export interface Settings {
  id: 'settings';
  /**
   * Before per-child themes: the single app-wide theme. Kept for backward
   * compatibility (migration source) and as the fallback for a child that
   * somehow has no entry in childThemes. Screens shown before any child
   * exists use Earth.
   */
  theme: ThemeId;
  /** Per-child theme preference, keyed by child id. Device-local (not part of partner sharing). */
  childThemes: Record<string, ThemeId>;
  activeChildId: string | null;
  layers: LayerVisibility;
  vaccineSchedule: 'cdc-acip' | 'aap' | null;
  notificationsEnabled: boolean;
  familyCalendar: boolean;
  updatedAt: string;
}

/** Internal safety snapshot (created by later checkpoints before destructive operations). */
export interface Backup {
  id: string;
  createdAt: string;
  reason: string;
  childIds: string[];
  /** Records grouped by store name. Every child-related record carries a childId. */
  payload: Record<string, Array<Record<string, unknown>>>;
}

// ---------------------------------------------------------------------------
// Milestone tracking (Checkpoint 2a). Stored in the existing v2 stores:
// milestoneRecords, milestoneEvents, customItems. No schema change.
// ---------------------------------------------------------------------------

export type MilestoneStatusValue = 'not-yet' | 'emerging' | 'achieved';

/** The basis used for milestone applicability at the time something was recorded. */
export interface AgeBasisSnapshot {
  basis: 'chronological' | 'corrected';
  /** Completed calendar months used for milestones; null before a corrected due date. */
  milestoneAgeMonths: number | null;
}

/** Current state of one milestone for one child (sourced or personal version). */
export interface MilestoneRecord extends RecordEnvelope {
  childId: string;
  /** Set for a sourced CDC milestone (unique per child). */
  milestoneDefId?: string;
  /** Set for a parent's personal version (unique per child). */
  customItemId?: string;
  status: MilestoneStatusValue;
  firstObservedDate: string | null;
  achievedDate: string | null;
  note: string;
  hidden: boolean;
}

export type MilestoneEventType =
  | 'status'
  | 'achieved-date-corrected'
  | 'observation'
  /** Notes & Observations (R-007): a later wording/date for an observation; refEventId = the original. */
  | 'observation-edited'
  | 'observation-removed'
  | 'note'
  | 'hidden'
  | 'restored'
  | 'personal-version-created'
  | 'personal-version-edited'
  | 'entry-erased';

/**
 * Append-only history entry. `eventDate` is the date the parent says it happened
 * (observation/achievement date); `recordedAt` is when it was entered on this device.
 * Ordinary edits never rewrite earlier entries. The only exception is a deliberate,
 * confirmed permanent erase of an entry's personal text (see eraseEntryText).
 */
export interface MilestoneEvent extends RecordEnvelope {
  childId: string;
  recordId: string;
  /** "def:<milestone id>" or "custom:<custom item id>" — stable logical key for future merging. */
  recordKey: string;
  type: MilestoneEventType;
  eventDate: string | null;
  recordedAt: string;
  deviceId: string;
  fromStatus?: MilestoneStatusValue;
  toStatus?: MilestoneStatusValue;
  fromDate?: string | null;
  toDate?: string | null;
  /** Observation or note text (null after a permanent erase). */
  text?: string | null;
  /** For removals / erasures: the entry they refer to. */
  refEventId?: string;
  erasedAt?: string;
  /** State snapshot so past progress can be reconstructed without using current state. */
  ageBasis: AgeBasisSnapshot;
  hiddenAtTime: boolean;
  statusAfter: MilestoneStatusValue;
}

/** A parent's personal version of a milestone. Never modifies the sourced original. */
export interface PersonalMilestone extends RecordEnvelope {
  childId: string;
  kind: 'milestone';
  title: string;
  description: string;
  appCategory: string;
  /** Provenance: the sourced milestone it was based on (if any). */
  derivedFromDefId: string | null;
  /** Copied reference age of the original, for context only (never counted in sourced progress). */
  referenceAgeMonths: number | null;
}

// ---------------------------------------------------------------------------
// Checkpoint 2b: personal goals, achievements, exercises and sessions.
// customItems (kinds goal / achievement / exercise), completions (sessions),
// itemEvents (history and Notes & Observations) and trackerState (device-local).
// Database version 3; see src/data/db.ts.
// ---------------------------------------------------------------------------

/** One of the five app areas, or null (Uncategorized). */
export type PersonalCategory = 'gross-motor' | 'fine-motor' | 'cognitive' | 'language-communication' | 'social-emotional' | null;

/** Provenance kept when a legacy personal milestone entry was moved to My Goals. */
export interface ConvertedFrom {
  legacyCustomItemId: string;
  convertedAt: string;
}

export interface PersonalGoal extends RecordEnvelope {
  childId: string;
  kind: 'goal';
  title: string;
  appCategory: PersonalCategory;
  description: string;
  /** Default today; null only when it isn't known (a converted legacy entry). Never invented. */
  startDate: string | null;
  /** The parent's own plan; never a deadline. */
  targetDate: string | null;
  status: 'active' | 'accomplished';
  accomplishedDate: string | null;
  /** Optional related CDC milestone. Linking never changes the milestone. */
  milestoneDefId: string | null;
  archivedAt: string | null;
  convertedFrom?: ConvertedFrom;
}

export interface Achievement extends RecordEnvelope {
  childId: string;
  kind: 'achievement';
  title: string;
  appCategory: PersonalCategory;
  description: string;
  achievedDate: string;
  /** Optional related CDC milestone (kept from a converted legacy entry). Never changes the milestone. */
  milestoneDefId: string | null;
  archivedAt: string | null;
  convertedFrom?: ConvertedFrom;
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export type ScheduleRule = { kind: 'asNeeded' } | { kind: 'daily' } | { kind: 'weekdays'; days: Weekday[] };

/** A schedule in force from `effectiveFrom` (inclusive) until the next version. History is never rewritten. */
export interface ScheduleVersion {
  effectiveFrom: string;
  rule: ScheduleRule;
  /** 1–24 scheduled sessions on each scheduled day. A capacity limit, not a recommended frequency. */
  sessionsPerDay: number;
  paused: boolean;
}

export type TrackingMethod = 'simple' | 'stopwatch' | 'reps';
export type Tracking = { method: 'simple' } | { method: 'stopwatch'; targetSeconds: number | null } | { method: 'reps'; targetReps: number | null };

export type ExerciseOrigin = 'recommended' | 'parent' | 'provider';

export interface ExerciseSource {
  /** Stable activity id from the locked CDC activity inventory. */
  activityId: string;
  /** The CDC tip record adopted (one of the activity's source records). */
  sourceRecordId: string;
  contentVersion: string;
  /** True once the parent edits the instructions: the wording is then theirs, not CDC's. */
  instructionsEdited: boolean;
}

export interface Exercise extends RecordEnvelope {
  childId: string;
  kind: 'exercise';
  title: string;
  appCategory: PersonalCategory;
  instructions: string;
  origin: ExerciseOrigin;
  /** Optional: who recommended it (for provider-directed exercises). */
  providerName: string;
  source: ExerciseSource | null;
  goalIds: string[];
  tracking: Tracking;
  schedule: ScheduleVersion[];
  archivedAt: string | null;
}

export type PersonalItem = PersonalGoal | Achievement | Exercise;

/** Content-free remainder of a permanently deleted goal, achievement, exercise or legacy entry. */
export interface ItemTombstone extends RecordEnvelope {
  childId: string;
  kind: 'goal' | 'achievement' | 'exercise' | 'milestone';
  deletedAt: string;
  /** Set when a legacy personal milestone entry was moved to My Goals. */
  convertedToItemId?: string;
}

/** One recorded exercise session. Logical key: (customItemId, slotKey). */
export interface ExerciseSession extends RecordEnvelope {
  childId: string;
  customItemId: string;
  /** The local day the session belongs to. */
  occurrenceDate: string;
  /** `${date}#${n}` for scheduled session n, or `extra:${uuid}` for an additional session. */
  slotKey: string;
  method: TrackingMethod;
  durationSeconds: number | null;
  reps: number | null;
  targetSnapshot: number | null;
  note: string;
  entry: 'live' | 'manual';
  /** Un-completion marker (the session no longer counts); cleared if the same slot is recorded again. */
  reversedAt: string | null;
  correctsSessionId?: string;
}

/**
 * What remains of a deleted exercise session (R-015): identity, child, exercise, date and lineage only.
 * No note, duration, count, target or entry method is kept. `slotKey` is rewritten to `deleted:<id>` so
 * the scheduled slot is free again (the logical key stays unique); the original slot is kept in
 * `deletedSlotKey` so a future merge can recognise a stale copy by its id or by its logical key.
 */
export interface SessionTombstone extends RecordEnvelope {
  childId: string;
  customItemId: string;
  occurrenceDate: string;
  slotKey: string;
  deletedSlotKey: string;
  deletedAt: string;
  reversedAt: string;
  correctsSessionId?: string;
}

export type ItemEventType =
  | 'created'
  | 'edited'
  | 'status'
  | 'date-corrected'
  | 'archived'
  | 'restored'
  | 'schedule-changed'
  | 'session-recorded'
  | 'session-reversed'
  /** R-015: a session was deleted (content-free; never shown in the visible history). */
  | 'session-deleted'
  | 'session-edited'
  | 'observation'
  | 'observation-edited'
  | 'observation-removed'
  | 'note'
  | 'entry-erased'
  /** History carried over from a legacy personal milestone entry. */
  | 'legacy-status'
  | 'legacy-event'
  | 'converted';

/** Append-only history for goals, achievements and exercises (separate from milestone history). */
export interface ItemEvent extends RecordEnvelope {
  childId: string;
  itemId: string;
  /** 'goal:<id>' | 'achievement:<id>' | 'exercise:<id>' — stable logical key for future merging. */
  itemKey: string;
  type: ItemEventType;
  eventDate: string | null;
  recordedAt: string;
  deviceId: string;
  text?: string | null;
  refEventId?: string;
  erasedAt?: string;
  fromStatus?: string;
  toStatus?: string;
  fromDate?: string | null;
  toDate?: string | null;
  sessionId?: string;
  /** For copied legacy history: the original milestone event id and type. */
  migratedFromEventId?: string;
  legacyType?: string;
}

/** Device-local, in-progress stopwatch or counter. Never part of partner sharing. */
export interface TrackerState {
  /** `${exerciseId}|${slotKey}` */
  id: string;
  childId: string;
  exerciseId: string;
  slotKey: string;
  occurrenceDate: string;
  method: 'stopwatch' | 'reps';
  running: boolean;
  /** Time banked from earlier running periods. */
  accumulatedMs: number;
  /** Wall clock at the last Start/Resume (used only to recover after suspension or reload). */
  runningSinceEpochMs: number | null;
  count: number;
  /** Pre-generated session id, so saving twice can never create two sessions. */
  sessionId: string;
  /** Incremented on every write; a write based on an older revision is refused (multiple open copies). */
  rev: number;
  updatedAt: string;
}
