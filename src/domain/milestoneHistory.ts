/**
 * History helpers. These read ONLY the append-only event log — never the current
 * record — so earlier recorded states can be reconstructed exactly.
 *
 * Checkpoint 2b charts will use `stateAsRecordedAt` ("what had been recorded by
 * then"), which deliberately differs from today's corrected records: a later
 * achievement-date correction or status reversal appears in the chart from the
 * moment it was recorded, not retroactively. Corrections can additionally be shown
 * via `achieved-date-corrected` entries (fromDate → toDate).
 */
import type { MilestoneEvent, MilestoneRecord, MilestoneStatusValue } from '../types';

export interface ReconstructedState {
  status: MilestoneStatusValue;
  hidden: boolean;
  achievedDate: string | null;
}

/** State of every milestone as it had been recorded at `atIso` (a recording timestamp). */
export function stateAsRecordedAt(events: readonly MilestoneEvent[], atIso: string): Map<string, ReconstructedState> {
  const out = new Map<string, ReconstructedState>();
  const sorted = [...events].filter((e) => e.recordedAt <= atIso).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id));
  for (const e of sorted) {
    const prev = out.get(e.recordKey) ?? { status: 'not-yet' as MilestoneStatusValue, hidden: false, achievedDate: null };
    const next = { ...prev };
    if (e.type === 'status') {
      next.status = e.toStatus!;
      next.achievedDate = e.toDate ?? null;
    } else if (e.type === 'achieved-date-corrected') next.achievedDate = e.toDate ?? null;
    else if (e.type === 'hidden') next.hidden = true;
    else if (e.type === 'restored') next.hidden = false;
    out.set(e.recordKey, next);
  }
  return out;
}

export interface Observation {
  id: string;
  /** Observation date (the latest, if the entry was edited). */
  date: string | null;
  /** Current text (the latest, if edited); null after a permanent erase. */
  text: string | null;
  recordedAt: string;
  removed: boolean;
  erased: boolean;
  /** True when the wording or date was changed after the entry was first added. */
  edited: boolean;
}

/** Observations for one record, newest first, with edits, removal and erase markers applied. */
export function observationsFor(events: readonly MilestoneEvent[], recordId: string): Observation[] {
  const mine = events.filter((e) => e.recordId === recordId);
  const removed = new Set(mine.filter((e) => e.type === 'observation-removed').map((e) => e.refEventId));
  const edits = new Map<string, MilestoneEvent>();
  for (const e of [...mine].filter((x) => x.type === 'observation-edited').sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id))) edits.set(e.refEventId!, e);
  return mine
    .filter((e) => e.type === 'observation')
    .map((e) => {
      const latest = edits.get(e.id);
      const erased = !!e.erasedAt;
      return {
        id: e.id,
        date: latest ? latest.eventDate : e.eventDate,
        text: erased ? null : (latest ? latest.text ?? null : e.text ?? null),
        recordedAt: e.recordedAt,
        removed: removed.has(e.id),
        erased,
        edited: !!latest,
      };
    })
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.recordedAt.localeCompare(a.recordedAt));
}

/**
 * One entry in Notes & Observations (R-007).
 * - `observation`: a dated entry (everything added since R-007, and observations from earlier versions).
 * - `undated-note`: the single note saved by an earlier version of the app. It never had an observation
 *   date, so none is shown or invented; `savedOn` is the date it was last saved on this device.
 */
export type NoteEntry =
  | ({ kind: 'observation' } & Observation)
  | { kind: 'undated-note'; text: string; savedOn: string | null };

/**
 * Everything shown in Notes & Observations for one milestone record: the undated note from an earlier
 * version (if any) first, then visible dated entries, newest first. Removed and erased entries are left
 * out here; they remain visible (as removed or erased) in the history.
 */
export function notesAndObservationsFor(events: readonly MilestoneEvent[], record: Pick<MilestoneRecord, 'id' | 'note'>): NoteEntry[] {
  const out: NoteEntry[] = [];
  if (record.note) {
    const saved = events
      .filter((e) => e.recordId === record.id && e.type === 'note' && e.text === record.note)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
      .pop();
    out.push({ kind: 'undated-note', text: record.note, savedOn: saved ? saved.recordedAt.slice(0, 10) : null });
  }
  for (const o of observationsFor(events, record.id)) if (!o.removed && !o.erased) out.push({ kind: 'observation', ...o });
  return out;
}

/** Most recent status changes to Emerging/Achieved across all milestones (for Home). */
export function recentProgressEvents(events: readonly MilestoneEvent[], limit = 3): MilestoneEvent[] {
  return events
    .filter((e) => e.type === 'status' && (e.toStatus === 'achieved' || e.toStatus === 'emerging'))
    .sort((a, b) => (b.eventDate ?? '').localeCompare(a.eventDate ?? '') || b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, limit);
}
