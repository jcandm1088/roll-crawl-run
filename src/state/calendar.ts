import { useCallback, useEffect, useState } from 'preact/hooks';
import { useApp } from './app';
import type { CalendarEvent, Child } from '../types';
import { listEvents } from '../data/repositories/eventsRepo';

/** Change notification so every screen showing calendar events (Calendar, Home) reloads after a write. */
const listeners = new Set<() => void>();
export function notifyEventsChanged() {
  listeners.forEach((l) => l());
}

/** One child's parent-entered calendar events. Null while loading. Never contains another child's events. */
export function useChildEvents(child: Child | null) {
  const { db } = useApp();
  const [state, setState] = useState<{ childId: string; events: CalendarEvent[] } | null>(null);
  const childId = child?.id ?? null;

  const reload = useCallback(async () => {
    if (!childId) return setState(null);
    const events = await listEvents(db, childId);
    setState({ childId, events });
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
  const events = state && state.childId === childId ? state.events : null;
  return { events, loading: events === null, reload };
}
