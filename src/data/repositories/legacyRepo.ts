/**
 * Legacy personal milestone entries (Decision #87 → Checkpoint 2b, owner-approved D9 and D10).
 *
 * Entries made with “Make a personal version” (before R-005) stay exactly as they are unless the parent
 * explicitly moves one to My Goals or deletes it. Nothing happens automatically.
 *
 * Moving (conversion), in ONE atomic transaction:
 * - Achieved → a standalone achievement dated with its recorded achievement date. If none is recorded,
 *   the parent must supply a known date first; otherwise the entry stays unchanged.
 * - Emerging / Not yet observed → an active goal. Its start date stays unknown unless the parent gives one.
 * - Title, description, area and the milestone it was based on (as an optional related milestone) are kept.
 * - Its whole history is copied into itemEvents with new ids: observations, edits, removals, erase
 *   markers and the undated note keep their dates, recording times and lineage (references remapped).
 *   Permanently erased text stays erased (null is copied; nothing is recovered).
 * - The legacy entry becomes a content-free tombstone pointing to the new record, and its milestone
 *   record and milestone history are deleted, so no text exists twice and nothing is counted twice.
 * - Repeating the action (another tab, a retry) finds the tombstone and returns the same result.
 * A legacy entry was never an official milestone and its result never becomes one.
 */
import type { Achievement, ItemEvent, ItemTombstone, MilestoneEvent, MilestoneRecord, PersonalCategory, PersonalGoal, PersonalMilestone } from '../../types';
import type { RcrDB } from '../db';
import { newEnvelope, newId, nowIso } from '../envelope';
import { runAtomic, type RcrTx } from '../transactions';
import { monotonicRecordedAt } from '../history';
import { getMilestone } from '../../domain/milestones';
import { PersonalInputError, checkDate, type PersonalContext } from './personalRepo';

type Stores = ['customItems', 'milestoneRecords', 'milestoneEvents', 'itemEvents'];
const STORES: Stores = ['customItems', 'milestoneRecords', 'milestoneEvents', 'itemEvents'];

export interface LegacyPreview {
  as: 'goal' | 'achievement';
  status: MilestoneRecord['status'];
  achievedDate: string | null;
  /** An achieved entry without a recorded date needs a known date from the parent. */
  needsDate: boolean;
  observations: number;
  hasUndatedNote: boolean;
  relatedMilestoneId: string | null;
}

export function previewLegacy(item: PersonalMilestone, record: MilestoneRecord | undefined, events: readonly MilestoneEvent[]): LegacyPreview {
  const status = record?.status ?? 'not-yet';
  const mine = record ? events.filter((e) => e.recordId === record.id) : [];
  const removed = new Set(mine.filter((e) => e.type === 'observation-removed').map((e) => e.refEventId));
  return {
    as: status === 'achieved' ? 'achievement' : 'goal',
    status,
    achievedDate: record?.achievedDate ?? null,
    needsDate: status === 'achieved' && !record?.achievedDate,
    observations: mine.filter((e) => e.type === 'observation' && !e.erasedAt && !removed.has(e.id)).length,
    hasUndatedNote: !!record?.note,
    relatedMilestoneId: item.derivedFromDefId && getMilestone(item.derivedFromDefId) ? item.derivedFromDefId : null,
  };
}

async function loadLegacy(tx: RcrTx<Stores>, ctx: PersonalContext, customId: string) {
  const raw = (await tx.objectStore('customItems').get(customId)) as unknown as PersonalMilestone | ItemTombstone | undefined;
  if (!raw || raw.childId !== ctx.childId || raw.kind !== 'milestone') throw new PersonalInputError('This personal entry no longer exists.');
  const record = (await tx.objectStore('milestoneRecords').index('byChildAndCustomItem').get([ctx.childId, customId])) as unknown as MilestoneRecord | undefined;
  const events = record
    ? ((await tx.objectStore('milestoneEvents').index('byRecord').getAll(IDBKeyRange.only(record.id))) as unknown as MilestoneEvent[]).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id))
    : [];
  return { raw, record, events };
}

async function removeLegacyData(tx: RcrTx<Stores>, ctx: PersonalContext, item: PersonalMilestone, record: MilestoneRecord | undefined, events: MilestoneEvent[], convertedToItemId?: string) {
  for (const e of events) await tx.objectStore('milestoneEvents').delete(e.id);
  if (record) await tx.objectStore('milestoneRecords').delete(record.id);
  const tombstone: ItemTombstone = {
    id: item.id,
    childId: item.childId,
    kind: 'milestone',
    createdAt: item.createdAt,
    originDeviceId: item.originDeviceId,
    updatedAt: nowIso(),
    deletedAt: nowIso(),
    rev: item.rev + 1,
    lastModifiedBy: ctx.deviceId,
    ...(convertedToItemId ? { convertedToItemId } : {}),
  };
  await tx.objectStore('customItems').put(tombstone as never);
}

export interface ConvertOptions {
  /** Required only when an achieved entry has no recorded achievement date. */
  achievedDate?: string;
  /** Optional known start date for a goal (never invented). */
  startDate?: string | null;
}

/** Moves a legacy personal entry to My Goals. Returns the new item's id (the same id if already moved). */
export async function convertLegacyEntry(db: RcrDB, ctx: PersonalContext, customId: string, opts: ConvertOptions = {}): Promise<{ id: string; kind: 'goal' | 'achievement' }> {
  return runAtomic(db, STORES, async (tx) => {
    const { raw, record, events } = await loadLegacy(tx, ctx, customId);
    if (raw.deletedAt !== null) {
      const t = raw as ItemTombstone;
      if (t.convertedToItemId) {
        const done = (await tx.objectStore('customItems').get(t.convertedToItemId)) as unknown as { kind: 'goal' | 'achievement' } | undefined;
        return { id: t.convertedToItemId, kind: done?.kind ?? 'goal' };
      }
      throw new PersonalInputError('This personal entry no longer exists.');
    }
    const item = raw as PersonalMilestone;
    const preview = previewLegacy(item, record, events);
    const now = nowIso();
    const base = {
      ...newEnvelope(ctx.deviceId),
      id: newId(),
      childId: ctx.childId,
      title: item.title,
      appCategory: (getMilestone(item.derivedFromDefId ?? '')?.appCategory ?? item.appCategory ?? null) as PersonalCategory,
      description: item.description ?? '',
      milestoneDefId: preview.relatedMilestoneId,
      archivedAt: null,
      convertedFrom: { legacyCustomItemId: item.id, convertedAt: now },
    };
    let created: PersonalGoal | Achievement;
    if (preview.as === 'achievement') {
      const date = preview.achievedDate ?? opts.achievedDate ?? null;
      if (!date) throw new PersonalInputError('Please enter the date it was achieved. If you don’t know it, the entry can stay where it is.');
      checkDate(ctx, date, 'achievement date');
      created = { ...base, kind: 'achievement', achievedDate: date };
    } else {
      if (opts.startDate) checkDate(ctx, opts.startDate, 'start date', true);
      created = { ...base, kind: 'goal', startDate: opts.startDate || null, targetDate: null, status: 'active', accomplishedDate: null };
    }
    await tx.objectStore('customItems').add(created as never);

    // Copy the history with new ids and remapped references.
    const idMap = new Map(events.map((e) => [e.id, newId()]));
    const itemKey = `${created.kind}:${created.id}`;
    const copy = (e: MilestoneEvent): ItemEvent => {
      const common = {
        ...newEnvelope(e.deviceId),
        id: idMap.get(e.id)!,
        createdAt: e.createdAt,
        childId: ctx.childId,
        itemId: created.id,
        itemKey,
        eventDate: e.eventDate,
        recordedAt: e.recordedAt,
        deviceId: e.deviceId,
        migratedFromEventId: e.id,
        legacyType: e.type,
      };
      const ref = e.refEventId ? idMap.get(e.refEventId) ?? e.refEventId : undefined;
      switch (e.type) {
        case 'observation':
          return { ...common, type: 'observation', text: e.erasedAt ? null : e.text ?? null, ...(e.erasedAt ? { erasedAt: e.erasedAt } : {}) };
        case 'observation-edited':
          return { ...common, type: 'observation-edited', text: e.erasedAt ? null : e.text ?? null, refEventId: ref, fromDate: e.fromDate ?? null, ...(e.erasedAt ? { erasedAt: e.erasedAt } : {}) };
        case 'observation-removed':
          return { ...common, type: 'observation-removed', refEventId: ref };
        case 'note':
          return { ...common, type: 'note', text: e.erasedAt ? null : e.text ?? '', ...(e.erasedAt ? { erasedAt: e.erasedAt } : {}) };
        case 'entry-erased':
          return { ...common, type: 'entry-erased', refEventId: ref };
        case 'status':
          return { ...common, type: 'legacy-status', fromStatus: e.fromStatus, toStatus: e.toStatus, fromDate: e.fromDate ?? null, toDate: e.toDate ?? null };
        default:
          // achieved-date-corrected, hidden, restored, personal-version-created/edited: kept as a dated marker
          // without text (the title and description live on the new record; nothing is duplicated).
          return { ...common, type: 'legacy-event', fromDate: e.fromDate ?? null, toDate: e.toDate ?? null };
      }
    };
    const store = tx.objectStore('itemEvents');
    for (const e of events) await store.add(copy(e) as never);
    // A current note that has no matching history entry (not expected) is kept, never lost.
    const notes = events.filter((e) => e.type === 'note');
    const lastNote = notes[notes.length - 1];
    if (record?.note && (!lastNote || lastNote.text !== record.note)) {
      await store.add({ ...newEnvelope(ctx.deviceId), childId: ctx.childId, itemId: created.id, itemKey, type: 'note', eventDate: null, recordedAt: record.updatedAt, deviceId: ctx.deviceId, text: record.note } as never);
    }
    await store.add({ ...newEnvelope(ctx.deviceId), childId: ctx.childId, itemId: created.id, itemKey, type: 'converted', eventDate: ctx.today, recordedAt: monotonicRecordedAt(), deviceId: ctx.deviceId } as never);
    await removeLegacyData(tx, ctx, item, record, events, created.id);
    return { id: created.id, kind: created.kind };
  });
}

/** Permanently deletes a legacy personal entry, its status, notes, observations and history (two-step confirmed). */
export async function deleteLegacyEntry(db: RcrDB, ctx: PersonalContext, customId: string): Promise<void> {
  await runAtomic(db, STORES, async (tx) => {
    const { raw, record, events } = await loadLegacy(tx, ctx, customId);
    if (raw.deletedAt !== null) return; // already deleted or moved
    await removeLegacyData(tx, ctx, raw as PersonalMilestone, record, events);
  });
}
