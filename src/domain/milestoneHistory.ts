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
import type { MilestoneEvent, MilestoneStatusValue } from '../types';

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
  date: string | null;
  text: string | null;
  recordedAt: string;
  removed: boolean;
  erased: boolean;
}

/** Observations for one record, newest first, with removal / erase markers applied. */
export function observationsFor(events: readonly MilestoneEvent[], recordId: string): Observation[] {
  const mine = events.filter((e) => e.recordId === recordId);
  const removed = new Set(mine.filter((e) => e.type === 'observation-removed').map((e) => e.refEventId));
  return mine
    .filter((e) => e.type === 'observation')
    .map((e) => ({ id: e.id, date: e.eventDate, text: e.text ?? null, recordedAt: e.recordedAt, removed: removed.has(e.id), erased: !!e.erasedAt }))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.recordedAt.localeCompare(a.recordedAt));
}

/** Most recent status changes to Emerging/Achieved across all milestones (for Home). */
export function recentProgressEvents(events: readonly MilestoneEvent[], limit = 3): MilestoneEvent[] {
  return events
    .filter((e) => e.type === 'status' && (e.toStatus === 'achieved' || e.toStatus === 'emerging'))
    .sort((a, b) => (b.eventDate ?? '').localeCompare(a.eventDate ?? '') || b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, limit);
}
