/**
 * Calendar event storage (Checkpoint 3): the existing `events` store at database version 3.
 * Create, read, update, delete; child isolation; profile deletion; full reset; failed writes;
 * overlay preferences. FICTIONAL data only.
 */
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { CHILD_SCOPED_STORES, DB_VERSION, openRcrDb, type RcrDB } from '../../src/data/db';
import { defaultSettings, ensureMeta, getSettings, updateSettings } from '../../src/data/repositories/metaRepo';
import { createChild, deleteChild } from '../../src/data/repositories/childrenRepo';
import { createEvent, deleteEvent, listEvents, updateEvent } from '../../src/data/repositories/eventsRepo';
import { createGoal, loadChildPersonal } from '../../src/data/repositories/personalRepo';
import { setStatus, loadChildMilestones } from '../../src/data/repositories/milestonesRepo';
import { deleteAllData } from '../../src/data/storage';
import { EventInputError, type EventInput } from '../../src/domain/calendar';
import { SAMPLE_CHILD_A, SAMPLE_CHILD_B } from '../fixtures/children';

let n = 0;
const opened: RcrDB[] = [];
afterEach(() => opened.splice(0).forEach((d) => d.close()));

async function setup() {
  const name = `events-${++n}`;
  const db = await openRcrDb(name);
  opened.push(db);
  const { deviceId } = await ensureMeta(db);
  const a = await createChild(db, deviceId, SAMPLE_CHILD_A);
  const b = await createChild(db, deviceId, SAMPLE_CHILD_B);
  return { name, db, deviceId, a, b, ctxA: { deviceId, childId: a.id }, ctxB: { deviceId, childId: b.id } };
}
const input = (over: Partial<EventInput> = {}): EventInput => ({ kind: 'medical', title: 'Fictional checkup', date: '2026-11-30', time: '', location: '', notes: '', ...over });

describe('calendar events use the existing store at database version 3', () => {
  it('needs no new version, store or index', async () => {
    const { db } = await setup();
    expect(DB_VERSION).toBe(3);
    expect(db.version).toBe(3);
    expect([...db.transaction('events').store.indexNames]).toEqual(['byChild']);
    expect(CHILD_SCOPED_STORES).toContain('events');
    expect([...db.objectStoreNames].sort()).toEqual([
      'backups', 'children', 'completions', 'customItems', 'eventCompletions', 'events', 'idAliases', 'itemEvents', 'journal',
      'mergeBases', 'meta', 'milestoneEvents', 'milestoneRecords', 'photos', 'referenceAnnotations', 'settings', 'trackerState',
    ]);
  });
});

describe('create, view, edit, delete', () => {
  it('creates an event with only a title and date; optional fields stay empty', async () => {
    const { db, ctxA, a, deviceId } = await setup();
    const e = await createEvent(db, ctxA, input());
    expect(e).toMatchObject({ recordType: 'calendarEvent', childId: a.id, kind: 'medical', title: 'Fictional checkup', date: '2026-11-30', time: null, location: '', notes: '', deletedAt: null, rev: 1, originDeviceId: deviceId });
    expect(await listEvents(db, a.id)).toEqual([e]);
  });

  it('stores every optional field and keeps the date exactly as entered', async () => {
    const { db, ctxA, a } = await setup();
    const e = await createEvent(db, ctxA, input({ kind: 'personal', title: ' Fictional visit ', date: '2028-02-29', time: '14:05', location: 'Sample Park', notes: 'Line one\nLine two' }));
    expect(e).toMatchObject({ kind: 'personal', title: 'Fictional visit', date: '2028-02-29', time: '14:05', location: 'Sample Park', notes: 'Line one\nLine two' });
    expect((await listEvents(db, a.id))[0]).toEqual(e);
  });

  it('edits in place, keeping the id and creation time', async () => {
    const { db, ctxA, a } = await setup();
    const e = await createEvent(db, ctxA, input({ time: '09:30', location: 'Sample Clinic' }));
    const u = await updateEvent(db, ctxA, e.id, input({ kind: 'personal', title: 'Fictional renamed', date: '2026-12-01', time: '', location: '', notes: 'Fictional note' }));
    expect(u).toMatchObject({ id: e.id, createdAt: e.createdAt, rev: 2, kind: 'personal', title: 'Fictional renamed', date: '2026-12-01', time: null, location: '', notes: 'Fictional note' });
    expect(await listEvents(db, a.id)).toEqual([u]);
  });

  it('deletes outright: no record, title, note or tombstone remains', async () => {
    const { db, ctxA, a } = await setup();
    const keep = await createEvent(db, ctxA, input({ title: 'Fictional keep' }));
    const gone = await createEvent(db, ctxA, input({ title: 'Fictional private title', location: 'Fictional private place', notes: 'Fictional private note' }));
    await deleteEvent(db, ctxA, gone.id);
    expect(await listEvents(db, a.id)).toEqual([keep]);
    expect(await db.get('events', gone.id)).toBeUndefined();
    let everything = '';
    for (const s of [...db.objectStoreNames]) everything += JSON.stringify(await db.getAll(s as never));
    expect(everything).not.toContain('Fictional private');
    expect(everything).not.toContain(gone.id);
    await expect(deleteEvent(db, ctxA, gone.id)).rejects.toThrow(/no longer exists/);
  });

  it('a retried save with the same form id never creates a duplicate', async () => {
    const { db, ctxA, a } = await setup();
    const first = await createEvent(db, ctxA, input(), 'form-1');
    const again = await createEvent(db, ctxA, input({ title: 'Fictional second attempt' }), 'form-1');
    expect(again).toEqual(first);
    expect(await listEvents(db, a.id)).toHaveLength(1);
  });
});

describe('failed writes change nothing', () => {
  it('rejects invalid input before writing, and existing events are untouched', async () => {
    const { db, ctxA, a } = await setup();
    const e = await createEvent(db, ctxA, input());
    await expect(createEvent(db, ctxA, input({ title: '  ' }))).rejects.toBeInstanceOf(EventInputError);
    await expect(createEvent(db, ctxA, input({ date: '2026-02-30' }))).rejects.toThrow(/valid date/);
    await expect(updateEvent(db, ctxA, e.id, input({ time: '99:99' }))).rejects.toThrow(/valid time/);
    await expect(updateEvent(db, ctxA, e.id, input({ title: '' }))).rejects.toThrow(/title/);
    expect(await listEvents(db, a.id)).toEqual([e]);
  });

  it('a write that fails inside the transaction is rolled back completely', async () => {
    const { db, ctxA, a } = await setup();
    const e = await createEvent(db, ctxA, input());
    const before = await db.getAll('events');
    await expect(updateEvent(db, ctxA, 'missing-id', input({ title: 'Fictional change' }))).rejects.toThrow(/no longer exists/);
    await expect(createEvent(db, { ...ctxA, childId: 'no-such-child' }, input())).rejects.toThrow(/no longer exists/);
    expect(await db.getAll('events')).toEqual(before);
    expect(await listEvents(db, a.id)).toEqual([e]);
  });

  it('records it does not recognise are ignored and never altered', async () => {
    const { db, ctxA, a } = await setup();
    const foreign = { id: 'foreign-1', childId: a.id, something: 'Fictional unknown record' };
    await db.put('events', foreign);
    const e = await createEvent(db, ctxA, input());
    expect(await listEvents(db, a.id)).toEqual([e]);
    await expect(updateEvent(db, ctxA, 'foreign-1', input())).rejects.toThrow(/no longer exists/);
    await expect(deleteEvent(db, ctxA, 'foreign-1')).rejects.toThrow(/no longer exists/);
    await expect(createEvent(db, ctxA, input(), 'foreign-1')).rejects.toThrow(/couldn’t be saved/);
    expect(await db.get('events', 'foreign-1')).toEqual(foreign);
  });
});

describe('child isolation', () => {
  it('each child sees only their own events', async () => {
    const { db, ctxA, ctxB, a, b } = await setup();
    const ea = await createEvent(db, ctxA, input({ title: 'Fictional A event' }));
    const eb = await createEvent(db, ctxB, input({ title: 'Fictional B event', kind: 'personal' }));
    expect(await listEvents(db, a.id)).toEqual([ea]);
    expect(await listEvents(db, b.id)).toEqual([eb]);
  });

  it('an editor opened for one child can never change or delete another child’s event', async () => {
    const { db, ctxA, ctxB, a, b } = await setup();
    const ea = await createEvent(db, ctxA, input({ title: 'Fictional A event' }));
    await expect(updateEvent(db, ctxB, ea.id, input({ title: 'Fictional overwrite' }))).rejects.toThrow(/another child’s calendar/);
    await expect(deleteEvent(db, ctxB, ea.id)).rejects.toThrow(/another child’s calendar/);
    await expect(createEvent(db, ctxB, input({ title: 'Fictional overwrite' }), ea.id)).rejects.toThrow(/couldn’t be saved/);
    expect(await listEvents(db, a.id)).toEqual([ea]);
    expect(await listEvents(db, b.id)).toEqual([]);
  });

  it('a save for a child follows the editor’s child, not whichever child is active', async () => {
    const { db, ctxA, a, b } = await setup();
    await updateSettings(db, { activeChildId: b.id }); // the active child changed while the editor was open
    const e = await createEvent(db, ctxA, input({ title: 'Fictional A event' }));
    expect(e.childId).toBe(a.id);
    expect(await listEvents(db, b.id)).toEqual([]);
  });
});

describe('profile deletion and full reset', () => {
  it('deleting a profile erases that child’s events only, and leaves other data alone', async () => {
    const { db, deviceId, ctxA, ctxB, a, b } = await setup();
    await createEvent(db, ctxA, input({ title: 'Fictional A one' }));
    await createEvent(db, ctxA, input({ title: 'Fictional A two', kind: 'personal' }));
    const eb = await createEvent(db, ctxB, input({ title: 'Fictional B event' }));
    await createGoal(db, { deviceId, childId: b.id, dob: b.dob, today: '2026-11-26' }, { title: 'Fictional goal', appCategory: null, description: '', startDate: '2026-11-26', targetDate: null, milestoneDefId: null });
    await deleteChild(db, deviceId, a.id, { purgeFromBackups: true });
    expect(await listEvents(db, a.id)).toEqual([]);
    expect(await db.getAllFromIndex('events', 'byChild', IDBKeyRange.only(a.id))).toEqual([]);
    expect(await listEvents(db, b.id)).toEqual([eb]);
    expect((await loadChildPersonal(db, b.id)).goals.map((g) => g.title)).toEqual(['Fictional goal']);
    expect(JSON.stringify(await db.getAll('events'))).not.toContain('Fictional A');
    await expect(createEvent(db, ctxA, input())).rejects.toThrow(/no longer exists/); // nothing can be written to a deleted profile
  });

  it('a full reset removes every event with the rest of the database', async () => {
    const { db, name, ctxA, ctxB } = await setup();
    await createEvent(db, ctxA, input());
    await createEvent(db, ctxB, input());
    await deleteAllData(db, name);
    opened.splice(opened.indexOf(db), 1);
    const fresh = await openRcrDb(name);
    opened.push(fresh);
    expect(await fresh.getAll('events')).toEqual([]);
    expect(await fresh.getAll('children')).toEqual([]);
  });

  it('calendar writes leave milestone, goal and settings records untouched', async () => {
    const { db, deviceId, ctxA, a } = await setup();
    const mctx = { deviceId, childId: a.id, dob: a.dob, today: '2026-06-01', ageBasis: { basis: 'chronological' as const, milestoneAgeMonths: 15 } };
    await setStatus(db, mctx, { kind: 'sourced', defId: 'cdc22-m02-se-01' }, 'achieved', '2025-04-10');
    await createGoal(db, { deviceId, childId: a.id, dob: a.dob, today: '2026-11-26' }, { title: 'Fictional goal', appCategory: null, description: '', startDate: '2026-11-26', targetDate: null, milestoneDefId: null });
    const snapshot = async () => {
      const out: Record<string, unknown> = {};
      for (const s of [...db.objectStoreNames].filter((x) => x !== 'events')) out[s] = await db.getAll(s as never);
      return JSON.stringify(out);
    };
    const before = await snapshot();
    const e = await createEvent(db, ctxA, input());
    await updateEvent(db, ctxA, e.id, input({ title: 'Fictional edit' }));
    await deleteEvent(db, ctxA, e.id);
    expect(await snapshot()).toBe(before);
    expect((await loadChildMilestones(db, a.id)).records).toHaveLength(1);
  });
});

describe('overlay preferences (Settings.layers, per device)', () => {
  it('defaults: vaccine schedule off, medical and personal on', () => {
    expect(defaultSettings().layers).toMatchObject({ vaccines: false, medical: true, personal: true });
  });

  it('settings saved before Checkpoint 3 gain the medical overlay (on) and keep everything else', async () => {
    const { db } = await setup();
    const old = { ...(await getSettings(db)), layers: { personal: false, wellVisits: true, vaccines: false, therapy: true } };
    await db.put('settings', old as never);
    const s = await getSettings(db);
    expect(s.layers).toEqual({ personal: false, medical: true, vaccines: false, wellVisits: true, therapy: true });
    expect(s.activeChildId).toBe(old.activeChildId);
  });

  it('switching overlays changes only the preference: events are neither changed nor deleted', async () => {
    const { db, ctxA, ctxB, a, b } = await setup();
    await createEvent(db, ctxA, input());
    await createEvent(db, ctxA, input({ kind: 'personal', title: 'Fictional visit' }));
    await createEvent(db, ctxB, input());
    const before = JSON.stringify(await db.getAll('events'));
    const s = await getSettings(db);
    await updateSettings(db, { layers: { ...s.layers, medical: false, personal: false, vaccines: true } });
    expect((await getSettings(db)).layers).toMatchObject({ medical: false, personal: false, vaccines: true });
    expect(JSON.stringify(await db.getAll('events'))).toBe(before);
    await updateSettings(db, { layers: { ...s.layers, medical: true, personal: true, vaccines: false } });
    expect(await listEvents(db, a.id)).toHaveLength(2);
    expect(await listEvents(db, b.id)).toHaveLength(1);
    // Turning the vaccine overlay on stores no vaccine records anywhere.
    expect(JSON.stringify(await db.getAll('events'))).not.toMatch(/cdc25|vaccin/i);
  });
});
