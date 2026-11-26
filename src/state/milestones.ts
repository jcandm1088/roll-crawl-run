import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { useApp } from './app';
import { useToday } from './today';
import { correctedAge, viewingAge, type ViewingAge } from '../domain/age';
import { intervalForAge } from '../domain/intervals';
import type { Child, MilestoneRecord } from '../types';
import { loadChildMilestones, type ChildMilestoneData, type MilestoneTarget, type WriteContext } from '../data/repositories/milestonesRepo';
import type { RecordState } from '../domain/milestones';

/** Tiny change notification so every screen showing milestones reloads after a write. */
const listeners = new Set<() => void>();
export function notifyMilestonesChanged() {
  listeners.forEach((l) => l());
}

/**
 * The age used for milestones (the "milestone age"): chronological by default; corrected only
 * when the child's existing corrected-age preference is on AND selected. Before a corrected due
 * date it has no value (nothing applies yet). This never changes when a parent previews an interval.
 */
export function milestoneAgeFor(child: Child, today: string): ViewingAge {
  return viewingAge(child.dob, child.correctedAge.enabled ? child.correctedAge.dueDate : null, child.ageBasis, today);
}

/**
 * Read-only milestone age for the educational guide. Loads NO milestone records: the guide's content
 * is structurally independent of what has been recorded, and it never writes anything.
 */
export function useMilestoneAge(child: Child | null) {
  const today = useToday();
  const age = child ? milestoneAgeFor(child, today) : null;
  const corrected = child?.correctedAge.enabled ? correctedAge(child.dob, child.correctedAge.dueDate, today) : null;
  return { today, age, corrected, currentInterval: intervalForAge(age?.months ?? null) };
}

export function useChildMilestones(child: Child | null) {
  const { db, meta } = useApp();
  const today = useToday();
  const [data, setData] = useState<ChildMilestoneData | null>(null);
  const childId = child?.id ?? null;

  const reload = useCallback(async () => {
    if (!childId) return setData(null);
    setData(await loadChildMilestones(db, childId));
  }, [db, childId]);

  useEffect(() => {
    setData(null);
    void reload();
    listeners.add(reload);
    return () => {
      listeners.delete(reload);
    };
  }, [reload]);

  const age = child ? milestoneAgeFor(child, today) : null;
  const corrected = child?.correctedAge.enabled ? correctedAge(child.dob, child.correctedAge.dueDate, today) : null;

  const sourcedStates = useMemo(() => {
    const m = new Map<string, RecordState>();
    for (const r of data?.records ?? []) if (r.milestoneDefId) m.set(r.milestoneDefId, { status: r.status, hidden: r.hidden });
    return m;
  }, [data]);

  const recordFor = useCallback(
    (t: MilestoneTarget): MilestoneRecord | undefined =>
      data?.records.find((r) => (t.kind === 'sourced' ? r.milestoneDefId === t.defId : r.customItemId === t.customId)),
    [data],
  );

  const ctx: WriteContext | null =
    child && age
      ? { deviceId: meta.deviceId, childId: child.id, dob: child.dob, today, ageBasis: { basis: age.basis, milestoneAgeMonths: age.months } }
      : null;

  return {
    data,
    loading: data === null,
    reload,
    today,
    age,
    corrected,
    currentInterval: intervalForAge(age?.months ?? null),
    sourcedStates,
    recordFor,
    ctx,
  };
}

/** Route keys for milestone detail: sourced ids as-is; personal versions as "p-<id>". */
export function targetFromKey(key: string): MilestoneTarget {
  return key.startsWith('p-') ? { kind: 'personal', customId: key.slice(2) } : { kind: 'sourced', defId: key };
}
export function keyFromTarget(t: MilestoneTarget): string {
  return t.kind === 'personal' ? `p-${t.customId}` : t.defId;
}
