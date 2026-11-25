import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Backup, ChildRecord, Meta, Photo, Settings } from '../types';

/**
 * IndexedDB schema.
 *
 * Version 1 creates every store the approved plan needs, including stores
 * used by later checkpoints, so that later releases only add data — never
 * restructure existing stores. Stores not yet used in Checkpoint 1 are
 * typed loosely (`GenericRecord`) until their features are built.
 *
 * Logical uniqueness constraints (plan §4.3) are enforced with unique
 * compound indexes. IndexedDB skips records whose key path is missing, so
 * e.g. custom-milestone records (no milestoneDefId) are not constrained by
 * the starter-milestone index.
 */

export const DB_NAME = 'roll-crawl-run';
/**
 * Schema history:
 * - v1 (Checkpoint 1): all stores and indexes.
 * - v2 (Checkpoint 1 final refinement): per-child themes. No store changes; a data
 *   migration copies the previous app-wide theme into a theme entry for every
 *   existing child profile (settings.childThemes). Runs inside the atomic
 *   upgrade transaction: if it fails, the database stays at v1 unchanged.
 */
export const DB_VERSION = 2;

export type GenericRecord = Record<string, unknown> & { id: string; childId?: string };

export interface RcrSchema extends DBSchema {
  meta: { key: string; value: Meta };
  settings: { key: string; value: Settings };
  children: { key: string; value: ChildRecord };
  photos: { key: string; value: Photo; indexes: { byChild: string } };
  idAliases: { key: string; value: GenericRecord; indexes: { byChild: string; byCanonical: string } };
  milestoneRecords: {
    key: string;
    value: GenericRecord;
    indexes: { byChild: string; byChildAndDefinition: [string, string]; byChildAndCustomItem: [string, string] };
  };
  milestoneEvents: { key: string; value: GenericRecord; indexes: { byChild: string; byRecord: string } };
  customItems: { key: string; value: GenericRecord; indexes: { byChild: string } };
  completions: { key: string; value: GenericRecord; indexes: { byChild: string; byItemAndOccurrence: [string, string] } };
  events: { key: string; value: GenericRecord; indexes: { byChild: string } };
  eventCompletions: { key: string; value: GenericRecord; indexes: { byChild: string; byEventAndOccurrence: [string, string] } };
  referenceAnnotations: { key: string; value: GenericRecord; indexes: { byChild: string; byChildAndReference: [string, string] } };
  journal: { key: string; value: GenericRecord; indexes: { byChild: string } };
  /** Field-level common-ancestor snapshots for three-way merge, keyed by [recordKey, peerDeviceId]. */
  mergeBases: { key: [string, string]; value: GenericRecord & { recordKey: string; peerDeviceId: string }; indexes: { byChild: string } };
  backups: { key: string; value: Backup };
}

export type StoreName = 'meta' | 'settings' | 'children' | 'photos' | 'idAliases' | 'milestoneRecords' | 'milestoneEvents' | 'customItems' | 'completions' | 'events' | 'eventCompletions' | 'referenceAnnotations' | 'journal' | 'mergeBases' | 'backups';

/** Stores whose records belong to a single child (all have a `byChild` index). */
export const CHILD_SCOPED_STORES = [
  'photos',
  'idAliases',
  'milestoneRecords',
  'milestoneEvents',
  'customItems',
  'completions',
  'events',
  'eventCompletions',
  'referenceAnnotations',
  'journal',
  'mergeBases',
] as const;
export type ChildScopedStore = (typeof CHILD_SCOPED_STORES)[number];

export type RcrDB = IDBPDatabase<RcrSchema>;

export async function openRcrDb(name: string = DB_NAME, version: number = DB_VERSION): Promise<RcrDB> {
  return openDB<RcrSchema>(name, version, {
    async upgrade(db, oldVersion, newVersion, tx) {
      // Migrations are additive and run inside the atomic `versionchange` transaction:
      // if any step throws, the database stays at its previous version.
      if (oldVersion < 1) {
        db.createObjectStore('meta', { keyPath: 'id' });
        db.createObjectStore('settings', { keyPath: 'id' });
        db.createObjectStore('children', { keyPath: 'id' });
        db.createObjectStore('photos', { keyPath: 'id' }).createIndex('byChild', 'childId');

        const aliases = db.createObjectStore('idAliases', { keyPath: 'id' });
        aliases.createIndex('byChild', 'childId');
        aliases.createIndex('byCanonical', 'canonicalId');

        const mr = db.createObjectStore('milestoneRecords', { keyPath: 'id' });
        mr.createIndex('byChild', 'childId');
        mr.createIndex('byChildAndDefinition', ['childId', 'milestoneDefId'], { unique: true });
        mr.createIndex('byChildAndCustomItem', ['childId', 'customItemId'], { unique: true });

        const me = db.createObjectStore('milestoneEvents', { keyPath: 'id' });
        me.createIndex('byChild', 'childId');
        me.createIndex('byRecord', 'recordId');

        db.createObjectStore('customItems', { keyPath: 'id' }).createIndex('byChild', 'childId');

        const comp = db.createObjectStore('completions', { keyPath: 'id' });
        comp.createIndex('byChild', 'childId');
        comp.createIndex('byItemAndOccurrence', ['customItemId', 'occurrenceDate'], { unique: true });

        db.createObjectStore('events', { keyPath: 'id' }).createIndex('byChild', 'childId');

        const ec = db.createObjectStore('eventCompletions', { keyPath: 'id' });
        ec.createIndex('byChild', 'childId');
        ec.createIndex('byEventAndOccurrence', ['eventId', 'occurrenceDate'], { unique: true });

        const ra = db.createObjectStore('referenceAnnotations', { keyPath: 'id' });
        ra.createIndex('byChild', 'childId');
        ra.createIndex('byChildAndReference', ['childId', 'referenceItemId'], { unique: true });

        db.createObjectStore('journal', { keyPath: 'id' }).createIndex('byChild', 'childId');
        db.createObjectStore('mergeBases', { keyPath: ['recordKey', 'peerDeviceId'] }).createIndex('byChild', 'childId');
        db.createObjectStore('backups', { keyPath: 'id' });
      }
      if (oldVersion < 2 && (newVersion ?? 0) >= 2) {
        await migratePerChildThemes(tx as unknown as MigrationTx);
      }
    },
  });
}

type MigrationTx = {
  objectStore(name: 'settings' | 'children'): {
    get(key: string): Promise<unknown>;
    getAll(): Promise<unknown[]>;
    put(value: unknown): Promise<unknown>;
  };
};

const THEME_IDS = ['earth', 'sky', 'blush', 'lavender', 'sage'];

/**
 * v1 → v2: every existing, non-deleted child receives the theme that was
 * previously used app-wide (or Earth if none was ever saved). Entries that
 * already exist are never overwritten. Child records themselves are not
 * modified, so their revision history is untouched.
 */
async function migratePerChildThemes(tx: MigrationTx): Promise<void> {
  const settingsStore = tx.objectStore('settings');
  const settings = (await settingsStore.get('settings')) as (Record<string, unknown> & { theme?: string; childThemes?: Record<string, string> }) | undefined;
  const children = (await tx.objectStore('children').getAll()) as Array<{ id: string; deletedAt: string | null }>;
  if (!settings && children.length === 0) return; // fresh install: defaults apply
  const legacy = settings?.theme && THEME_IDS.includes(settings.theme) ? settings.theme : 'earth';
  const childThemes: Record<string, string> = { ...(settings?.childThemes ?? {}) };
  for (const c of children) if (c.deletedAt === null && !childThemes[c.id]) childThemes[c.id] = legacy;
  await settingsStore.put({ ...(settings ?? { id: 'settings' }), id: 'settings', childThemes });
}
