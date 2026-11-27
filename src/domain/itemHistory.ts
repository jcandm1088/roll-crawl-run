/**
 * Notes & Observations and history for personal goals, achievements and exercises (Checkpoint 2b).
 *
 * Same rules as milestone Notes & Observations (R-007, Decisions #55/#81/#88), applied to the separate
 * `itemEvents` log: entries are append-only; an edit is a later `observation-edited` entry; removal adds
 * a marker; a permanent erase overwrites the text with null. These functions read only the event log.
 */
import type { ItemEvent } from '../types';
import type { NoteEntry, Observation } from './milestoneHistory';

const byRecorded = (a: ItemEvent, b: ItemEvent) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id);

/** Observations for one item, newest first, with edits, removal and erase markers applied. */
export function itemObservations(events: readonly ItemEvent[], itemId: string): Observation[] {
  const mine = events.filter((e) => e.itemId === itemId);
  const removed = new Set(mine.filter((e) => e.type === 'observation-removed').map((e) => e.refEventId));
  const edits = new Map<string, ItemEvent>();
  for (const e of mine.filter((x) => x.type === 'observation-edited').sort(byRecorded)) edits.set(e.refEventId!, e);
  return mine
    .filter((e) => e.type === 'observation')
    .map((e) => {
      const latest = edits.get(e.id);
      const erased = !!e.erasedAt;
      return {
        id: e.id,
        date: latest ? latest.eventDate : e.eventDate,
        text: erased ? null : latest ? latest.text ?? null : e.text ?? null,
        recordedAt: e.recordedAt,
        removed: removed.has(e.id),
        erased,
        edited: !!latest,
      };
    })
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.recordedAt.localeCompare(a.recordedAt));
}

/**
 * The current undated note of an item, if any. Only a converted legacy entry can have one: the note
 * saved by an earlier version of the app without an observation date. It is the latest `note` entry.
 */
export function currentUndatedNote(events: readonly ItemEvent[], itemId: string): ItemEvent | null {
  const notes = events.filter((e) => e.itemId === itemId && e.type === 'note').sort(byRecorded);
  const last = notes[notes.length - 1];
  if (!last || last.erasedAt || !last.text) return null;
  return last;
}

/** Everything shown in Notes & Observations for one item (undated note first, then dated entries). */
export function itemNotesAndObservations(events: readonly ItemEvent[], itemId: string): NoteEntry[] {
  const out: NoteEntry[] = [];
  const note = currentUndatedNote(events, itemId);
  if (note) {
    const firstSaved = events
      .filter((e) => e.itemId === itemId && e.type === 'note' && e.text === note.text)
      .sort(byRecorded)
      .pop();
    out.push({ kind: 'undated-note', text: note.text!, savedOn: firstSaved ? firstSaved.recordedAt.slice(0, 10) : null });
  }
  for (const o of itemObservations(events, itemId)) if (!o.removed && !o.erased) out.push({ kind: 'observation', ...o });
  return out;
}

/** History of one item, oldest first. */
export function itemHistory(events: readonly ItemEvent[], itemId: string): ItemEvent[] {
  return events.filter((e) => e.itemId === itemId).sort(byRecorded);
}
