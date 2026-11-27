/**
 * Journal entries (Checkpoint 4).
 *
 * - Stored in the `journal` store that has existed since database version 1 (database version 3 is
 *   unchanged), one child each, found through the `byChild` index. The store is in CHILD_SCOPED_STORES,
 *   so deleting a profile erases its entries in the same transaction, and a full reset deletes the
 *   whole database.
 * - Every write runs in ONE transaction that also checks the child still exists, and an edit, an
 *   answered toggle or a delete checks the entry belongs to the child the editor was opened for. A write
 *   can therefore never land in another profile, even if the active child changed while an editor was open.
 * - Deleting removes the record outright: no title, text, tag or tombstone is kept.
 * - Records in the store that are not valid journal entries are ignored and never altered.
 */
import type { JournalEntry } from '../../types';
import type { GenericRecord, RcrDB } from '../db';
import type { LocalDate } from '../../domain/dates';
import { runAtomic } from '../transactions';
import { newEnvelope, touch } from '../envelope';
import { isJournalEntry, JournalInputError, validateJournalInput, type JournalInput } from '../../domain/journal';
import { isActiveChild } from './childrenRepo';

export interface JournalContext {
  deviceId: string;
  /** The child the editor was opened for (captured when it opened, not re-read at save time). */
  childId: string;
  /** The device's current local date: entries can't be dated in the future. */
  today: LocalDate;
}

const STORES: ['journal', 'children'] = ['journal', 'children'];
const NO_CHILD = 'That child profile no longer exists, so the entry was not saved.';

/** This child's journal entries (unordered). Never contains another child's entries. */
export async function listEntries(db: RcrDB, childId: string): Promise<JournalEntry[]> {
  const all = await db.getAllFromIndex('journal', 'byChild', IDBKeyRange.only(childId));
  return (all as unknown[]).filter(isJournalEntry);
}

/**
 * Creates an entry. `id` makes a retried save idempotent: if an earlier attempt already stored this id
 * for this child, that record is returned instead of a duplicate.
 */
export async function createEntry(db: RcrDB, ctx: JournalContext, input: JournalInput, id?: string): Promise<JournalEntry> {
  const clean = validateJournalInput(input, ctx.today);
  return runAtomic(db, STORES, async (tx) => {
    if (!isActiveChild(await tx.objectStore('children').get(ctx.childId))) throw new JournalInputError(NO_CHILD);
    if (id) {
      const existing = (await tx.objectStore('journal').get(id)) as unknown;
      if (existing) {
        if (isJournalEntry(existing) && existing.childId === ctx.childId) return existing;
        throw new JournalInputError('That couldn’t be saved. Please try again.');
      }
    }
    const entry: JournalEntry = { ...newEnvelope(ctx.deviceId), ...(id ? { id } : {}), deletedAt: null, recordType: 'journalEntry', childId: ctx.childId, ...clean };
    await tx.objectStore('journal').put(entry as unknown as GenericRecord);
    return entry;
  });
}

async function ownEntry(tx: { objectStore: (name: 'journal') => { get: (id: string) => Promise<unknown> } }, ctx: JournalContext, id: string): Promise<JournalEntry> {
  const current = await tx.objectStore('journal').get(id);
  if (!isJournalEntry(current)) throw new JournalInputError('That entry no longer exists.');
  if (current.childId !== ctx.childId) throw new JournalInputError('That entry belongs to another child’s journal, so nothing was changed.');
  return current;
}

export async function updateEntry(db: RcrDB, ctx: JournalContext, id: string, input: JournalInput): Promise<JournalEntry> {
  const clean = validateJournalInput(input, ctx.today);
  return runAtomic(db, STORES, async (tx) => {
    if (!isActiveChild(await tx.objectStore('children').get(ctx.childId))) throw new JournalInputError(NO_CHILD);
    const current = await ownEntry(tx, ctx, id);
    const next: JournalEntry = { ...touch(current, ctx.deviceId), ...clean };
    await tx.objectStore('journal').put(next as unknown as GenericRecord);
    return next;
  });
}

/**
 * Marks a provider question answered or unanswered. Only that one field changes: the note's title, text,
 * date, tags and type are written back exactly as they were.
 */
export async function setAnswered(db: RcrDB, ctx: JournalContext, id: string, answered: boolean): Promise<JournalEntry> {
  return runAtomic(db, STORES, async (tx) => {
    if (!isActiveChild(await tx.objectStore('children').get(ctx.childId))) throw new JournalInputError(NO_CHILD);
    const current = await ownEntry(tx, ctx, id);
    if (current.type !== 'care' || !current.isProviderQuestion) throw new JournalInputError('That entry isn’t marked as a question for the provider.');
    if (current.answered === answered) return current;
    const next: JournalEntry = { ...touch(current, ctx.deviceId), answered };
    await tx.objectStore('journal').put(next as unknown as GenericRecord);
    return next;
  });
}

/** Permanently removes one entry. Nothing about it is retained. */
export async function deleteEntry(db: RcrDB, ctx: JournalContext, id: string): Promise<void> {
  await runAtomic(db, STORES, async (tx) => {
    await ownEntry(tx, ctx, id);
    await tx.objectStore('journal').delete(id);
  });
}
