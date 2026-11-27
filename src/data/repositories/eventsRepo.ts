/**
 * Parent-entered calendar events (Checkpoint 3, Simplified Calendar).
 *
 * - Stored in the existing `events` store (database version 3 unchanged), one child each, found through
 *   the `byChild` index. The store is in CHILD_SCOPED_STORES, so deleting a profile erases its events in
 *   the same transaction, and a full reset deletes the whole database.
 * - Every write runs in ONE transaction that also checks the child still exists, and an edit or delete
 *   checks the event belongs to the child the editor was opened for. A write can therefore never land
 *   in another profile, even if the active child changed while an editor was open.
 * - Deleting removes the record outright: no title, note, location or tombstone is kept.
 * - Vaccine schedule reference dates are derived for display only and are never stored here.
 */
import type { CalendarEvent } from '../../types';
import type { GenericRecord, RcrDB } from '../db';
import { runAtomic } from '../transactions';
import { newEnvelope, touch } from '../envelope';
import { EventInputError, isCalendarEvent, validateEventInput, type EventInput } from '../../domain/calendar';
import { isActiveChild } from './childrenRepo';

export interface EventContext {
  deviceId: string;
  /** The child the editor was opened for (captured when it opened, not re-read at save time). */
  childId: string;
}

const STORES: ['events', 'children'] = ['events', 'children'];

/** This child's events. Records in the store that are not valid calendar events are ignored, never altered. */
export async function listEvents(db: RcrDB, childId: string): Promise<CalendarEvent[]> {
  const all = await db.getAllFromIndex('events', 'byChild', IDBKeyRange.only(childId));
  return (all as unknown[]).filter(isCalendarEvent);
}

/**
 * Creates an event. `id` makes a retried save idempotent: if an earlier attempt already stored this id
 * for this child, that record is returned instead of a duplicate.
 */
export async function createEvent(db: RcrDB, ctx: EventContext, input: EventInput, id?: string): Promise<CalendarEvent> {
  const clean = validateEventInput(input);
  return runAtomic(db, STORES, async (tx) => {
    if (!isActiveChild(await tx.objectStore('children').get(ctx.childId))) throw new EventInputError('That child profile no longer exists, so the event was not saved.');
    if (id) {
      const existing = (await tx.objectStore('events').get(id)) as unknown;
      if (existing) {
        if (isCalendarEvent(existing) && existing.childId === ctx.childId) return existing;
        throw new EventInputError('That couldn’t be saved. Please try again.');
      }
    }
    const event: CalendarEvent = { ...newEnvelope(ctx.deviceId), ...(id ? { id } : {}), deletedAt: null, recordType: 'calendarEvent', childId: ctx.childId, ...clean };
    await tx.objectStore('events').put(event as unknown as GenericRecord);
    return event;
  });
}

async function ownEvent(tx: { objectStore: (name: 'events') => { get: (id: string) => Promise<unknown> } }, ctx: EventContext, id: string): Promise<CalendarEvent> {
  const current = await tx.objectStore('events').get(id);
  if (!isCalendarEvent(current)) throw new EventInputError('That event no longer exists.');
  if (current.childId !== ctx.childId) throw new EventInputError('That event belongs to another child’s calendar, so nothing was changed.');
  return current;
}

export async function updateEvent(db: RcrDB, ctx: EventContext, id: string, input: EventInput): Promise<CalendarEvent> {
  const clean = validateEventInput(input);
  return runAtomic(db, STORES, async (tx) => {
    if (!isActiveChild(await tx.objectStore('children').get(ctx.childId))) throw new EventInputError('That child profile no longer exists, so the event was not saved.');
    const current = await ownEvent(tx, ctx, id);
    const next: CalendarEvent = { ...touch(current, ctx.deviceId), ...clean };
    await tx.objectStore('events').put(next as unknown as GenericRecord);
    return next;
  });
}

/** Permanently removes one event. Nothing about it is retained. */
export async function deleteEvent(db: RcrDB, ctx: EventContext, id: string): Promise<void> {
  await runAtomic(db, STORES, async (tx) => {
    await ownEvent(tx, ctx, id);
    await tx.objectStore('events').delete(id);
  });
}
