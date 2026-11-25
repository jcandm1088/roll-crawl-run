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
export const DB_VERSION = 1;

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

export async function openRcrDb(name: string = DB_NAME): Promise<RcrDB> {
  return openDB<RcrSchema>(name, DB_VERSION, {
    upgrade(db, oldVersion) {
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
    },
  });
}
