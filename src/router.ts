import { useEffect, useState } from 'preact/hooks';

/**
 * Minimal hash router. Hash URLs (#/growth) never hit the server, so they
 * work on GitHub Pages (no SPA rewrite rules) and offline.
 */
export interface LibraryPreset { view: 'now' | 'upcoming' | 'all'; area: (typeof LIBRARY_AREAS)[number] | null }
export const LIBRARY_AREAS = ['gross-motor', 'fine-motor', 'cognitive', 'language-communication', 'social-emotional'] as const;

/** Replace the current address without adding history or triggering navigation (e.g. after applying a preset). */
export function replaceRoute(route: Route): void {
  window.history.replaceState(window.history.state, '', href(route));
}

export type Route =
  | { name: 'home' }
  | { name: 'growth' }
  | { name: 'growthProgress' }
  | { name: 'growthExpect'; interval: number | null }
  /** preset: open a specific Library view (resetting filters); null = restore the Library as it was left. */
  | { name: 'growthLibrary'; preset: LibraryPreset | null }
  | { name: 'growthAbout' }
  | { name: 'growthMilestone'; key: string }
  | { name: 'calendar' }
  | { name: 'journal' }
  | { name: 'resources' }
  | { name: 'settings' }
  | { name: 'privacy' }
  | { name: 'storage' }
  | { name: 'install' }
  | { name: 'about' }
  | { name: 'profiles' }
  | { name: 'profileNew' }
  /** section 'age': opened from Progress → "Manage age settings"; shows the age settings and returns to Progress. */
  | { name: 'profileEdit'; id: string; section?: 'age' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [a, b] = parts;
  switch (a) {
    case undefined:
    case 'home':
      return { name: 'home' };
    case 'growth':
      if (b === 'progress') return { name: 'growthProgress' };
      if (b === 'library') {
        const view = parts[2];
        const area = parts[3];
        if (view === 'now' || view === 'upcoming' || view === 'all') {
          return { name: 'growthLibrary', preset: { view, area: area && (LIBRARY_AREAS as readonly string[]).includes(area) ? (area as LibraryPreset['area']) : null } };
        }
        return { name: 'growthLibrary', preset: null };
      }
      if (b === 'about') return { name: 'growthAbout' };
      if (b === 'milestone' && parts[2]) return { name: 'growthMilestone', key: decodeURIComponent(parts[2]) };
      if (b === 'expect') {
        // Superseded "Everything up to now" tracking view (owner decision D-1) → the Library's Up to now view.
        if (parts[2] === 'all') return { name: 'growthLibrary', preset: { view: 'now', area: null } };
        const n = parts[2] === undefined ? null : Number(parts[2]);
        return { name: 'growthExpect', interval: n !== null && Number.isInteger(n) && n >= 0 && n < 20 ? n : null };
      }
      return { name: 'growth' };
    case 'calendar':
    case 'journal':
    case 'resources':
      return { name: a };
    case 'settings':
      if (b === 'privacy' || b === 'storage' || b === 'install' || b === 'about') return { name: b };
      return { name: 'settings' };
    case 'profiles':
      if (b === 'new') return { name: 'profileNew' };
      if (b) return parts[2] === 'age' ? { name: 'profileEdit', id: decodeURIComponent(b), section: 'age' } : { name: 'profileEdit', id: decodeURIComponent(b) };
      return { name: 'profiles' };
    default:
      return { name: 'home' };
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'privacy':
    case 'storage':
    case 'install':
    case 'about':
      return `#/settings/${route.name}`;
    case 'profileNew':
      return '#/profiles/new';
    case 'growthProgress':
      return '#/growth/progress';
    case 'growthLibrary':
      return route.preset ? `#/growth/library/${route.preset.view}${route.preset.area ? `/${route.preset.area}` : ''}` : '#/growth/library';
    case 'growthAbout':
      return '#/growth/about';
    case 'growthMilestone':
      return `#/growth/milestone/${encodeURIComponent(route.key)}`;
    case 'growthExpect':
      return route.interval === null ? '#/growth/expect' : `#/growth/expect/${route.interval}`;
    case 'profileEdit':
      return `#/profiles/${encodeURIComponent(route.id)}${route.section === 'age' ? '/age' : ''}`;
    default:
      return `#/${route.name}`;
  }
}

export function navigate(route: Route): void {
  window.location.hash = href(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    // The hash may have changed between the first render and this listener being attached.
    setRoute((current) => {
      const latest = parseHash(window.location.hash);
      return JSON.stringify(latest) === JSON.stringify(current) ? current : latest;
    });
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
