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

export interface LayerVisibility {
  personal: boolean;
  wellVisits: boolean; // on by default (Q3)
  vaccines: boolean; // off until the parent enables it and chooses a source (Q2/Q3)
  therapy: boolean;
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
