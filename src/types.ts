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
  theme: ThemeId;
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
