import { useCallback, useEffect, useState } from 'preact/hooks';
import { useApp } from './app';
import type { Child, JournalEntry } from '../types';
import { listEntries } from '../data/repositories/journalRepo';

/** Change notification so the Journal reloads after a write. */
const listeners = new Set<() => void>();
export function notifyJournalChanged() {
  listeners.forEach((l) => l());
}

/** One child's journal entries. Null while loading. Never contains another child's entries. */
export function useChildJournal(child: Child | null) {
  const { db } = useApp();
  const [state, setState] = useState<{ childId: string; entries: JournalEntry[] } | null>(null);
  const childId = child?.id ?? null;

  const reload = useCallback(async () => {
    if (!childId) return setState(null);
    const entries = await listEntries(db, childId);
    setState({ childId, entries });
  }, [db, childId]);

  useEffect(() => {
    setState(null);
    void reload();
    listeners.add(reload);
    // Another open copy of the app may have changed something: re-read when this one becomes visible.
    const onVisible = () => document.visibilityState === 'visible' && void reload();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      listeners.delete(reload);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  // Guard against showing the previous child's list for one frame after a switch.
  const entries = state && state.childId === childId ? state.entries : null;
  return { entries, loading: entries === null, reload };
}
