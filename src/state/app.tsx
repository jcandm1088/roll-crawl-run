import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'preact/hooks';
import type { Child, Meta, Settings } from '../types';
import { openRcrDb, type RcrDB } from '../data/db';
import { ensureMeta, getSettings, setChildTheme, themeForChild, updateMeta, updateSettings } from '../data/repositories/metaRepo';
import type { ThemeId } from '../ui/theme/themes';
import { listChildren } from '../data/repositories/childrenRepo';
import { applyTheme } from './theme';

export interface AppState {
  db: RcrDB;
  meta: Meta;
  settings: Settings;
  children: Child[];
  activeChild: Child | null;
  /** Re-reads children and settings from storage (after any write). */
  refresh: () => Promise<void>;
  setSettings: (patch: Partial<Omit<Settings, 'id'>>) => Promise<void>;
  setMeta: (patch: Partial<Omit<Meta, 'id' | 'deviceId'>>) => Promise<void>;
  setActiveChild: (id: string) => Promise<void>;
  /** The theme in use: the active child's own theme (Earth when there is no child). */
  theme: ThemeId;
  /** Changes the ACTIVE child's theme only. */
  setActiveChildTheme: (theme: ThemeId) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; db: RcrDB; meta: Meta; settings: Settings; children: Child[] };

export function AppProvider({ children: content, fallback, errorView }: { children: ComponentChildren; fallback: ComponentChildren; errorView: (message: string) => ComponentChildren }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await openRcrDb();
        const meta = await ensureMeta(db);
        let settings = await getSettings(db);
        const kids = await listChildren(db);
        // Keep the active child valid (e.g. after a deletion).
        if (!kids.some((k) => k.id === settings.activeChildId)) {
          settings = await updateSettings(db, { activeChildId: kids[0]?.id ?? null });
        }
        applyTheme(themeForChild(settings, settings.activeChildId)); // before first paint of the app
        if (!cancelled) setState({ status: 'ready', db, meta, settings, children: kids });
      } catch (e) {
        if (!cancelled)
          setState({
            status: 'error',
            message:
              e instanceof Error && /indexeddb|storage|quota/i.test(`${e.name} ${e.message}`)
                ? 'This browser isn’t allowing the app to store data (for example, in some private-browsing modes). Roll, Crawl, RUN needs local storage to save your information.'
                : `The app couldn’t open its local storage. ${e instanceof Error ? e.message : ''}`,
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = state.status === 'ready' ? state : null;

  const refresh = useCallback(async () => {
    if (!ready) return;
    const kids = await listChildren(ready.db);
    let settings = await getSettings(ready.db);
    if (!kids.some((k) => k.id === settings.activeChildId)) settings = await updateSettings(ready.db, { activeChildId: kids[0]?.id ?? null });
    const meta = await ensureMeta(ready.db);
    setState((prev) => (prev.status === 'ready' ? { ...prev, children: kids, settings, meta } : prev));
  }, [ready]);

  const setSettings = useCallback(
    async (patch: Partial<Omit<Settings, 'id'>>) => {
      if (!ready) return;
      const settings = await updateSettings(ready.db, patch);
      setState((prev) => (prev.status === 'ready' ? { ...prev, settings } : prev));
    },
    [ready],
  );

  const setMeta = useCallback(
    async (patch: Partial<Omit<Meta, 'id' | 'deviceId'>>) => {
      if (!ready) return;
      const meta = await updateMeta(ready.db, patch);
      setState((prev) => (prev.status === 'ready' ? { ...prev, meta } : prev));
    },
    [ready],
  );

  const setActiveChild = useCallback(
    async (id: string) => {
      if (!ready) return;
      // Apply the new child's theme synchronously, before any re-render shows the new child,
      // so the previous child's theme is never shown alongside the newly selected child.
      applyTheme(themeForChild(ready.settings, id));
      await setSettings({ activeChildId: id });
    },
    [ready, setSettings],
  );

  const setActiveChildTheme = useCallback(
    async (theme: ThemeId) => {
      if (!ready) return;
      const id = ready.children.find((c) => c.id === ready.settings.activeChildId)?.id ?? ready.children[0]?.id;
      if (!id) return;
      applyTheme(theme);
      const settings = await setChildTheme(ready.db, id, theme);
      setState((prev) => (prev.status === 'ready' ? { ...prev, settings } : prev));
    },
    [ready],
  );

  const activeId = ready ? (ready.children.find((c) => c.id === ready.settings.activeChildId) ?? ready.children[0])?.id ?? null : null;
  const effectiveTheme = ready ? themeForChild(ready.settings, activeId) : null;
  // Keeps the page in sync after refreshes, deletions, and edits (no-op when already applied).
  useLayoutEffect(() => {
    if (effectiveTheme && ready?.meta.onboardingComplete && ready.children.length > 0) applyTheme(effectiveTheme);
    else if (effectiveTheme && ready?.meta.onboardingComplete) applyTheme('earth');
  }, [effectiveTheme, ready?.meta.onboardingComplete, ready?.children.length]);

  const value = useMemo<AppState | null>(() => {
    if (!ready) return null;
    return {
      db: ready.db,
      meta: ready.meta,
      settings: ready.settings,
      children: ready.children,
      activeChild: ready.children.find((c) => c.id === ready.settings.activeChildId) ?? ready.children[0] ?? null,
      refresh,
      setSettings,
      setMeta,
      setActiveChild,
      theme: effectiveTheme ?? 'earth',
      setActiveChildTheme,
    };
  }, [ready, refresh, setSettings, setMeta, setActiveChild, effectiveTheme, setActiveChildTheme]);

  if (state.status === 'loading') return <>{fallback}</>;
  if (state.status === 'error') return <>{errorView(state.message)}</>;
  return <AppContext.Provider value={value}>{content}</AppContext.Provider>;
}
