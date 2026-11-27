import { useCallback, useEffect, useState } from 'preact/hooks';
import { useApp } from './app';
import { useToday } from './today';
import type { Child } from '../types';
import { loadChildPersonal, type ChildPersonalData, type PersonalContext } from '../data/repositories/personalRepo';

/** Change notification so every screen showing goals or exercises (including Home) reloads after a write. */
const listeners = new Set<() => void>();
export function notifyPersonalChanged() {
  listeners.forEach((l) => l());
}

/** Goals, achievements, exercises, sessions and their history for one child, plus the write context. */
export function useChildPersonal(child: Child | null) {
  const { db, meta } = useApp();
  const today = useToday();
  const [data, setData] = useState<ChildPersonalData | null>(null);
  const childId = child?.id ?? null;

  const reload = useCallback(async () => {
    if (!childId) return setData(null);
    const d = await loadChildPersonal(db, childId);
    setData(d);
  }, [db, childId]);

  useEffect(() => {
    setData(null);
    void reload();
    listeners.add(reload);
    // Another open copy of the app may have recorded something: re-read when this one becomes visible.
    const onVisible = () => document.visibilityState === 'visible' && void reload();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      listeners.delete(reload);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  const ctx: PersonalContext | null = child ? { deviceId: meta.deviceId, childId: child.id, dob: child.dob, today } : null;
  return { data, loading: data === null, reload, today, ctx };
}
