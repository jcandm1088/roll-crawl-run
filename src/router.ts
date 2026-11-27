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
  // Checkpoint 2b — Goals & Exercises and Progress over time
  | { name: 'goals' }
  | { name: 'myGoals' }
  /** Prefill from inspiration: a milestone to start from, or a goal idea id (R-010). */
  | { name: 'goalNew'; milestone?: string; idea?: string }
  | { name: 'achievementNew' }
  | { name: 'goalItem'; id: string }
  | { name: 'goalEdit'; id: string }
  /** range: a goal idea range id (R-010), or none for the child's default. */
  | { name: 'goalIdeas'; range?: string }
  /** focus 'today': open with Today's routine in view (Home shortcut). */
  | { name: 'exercises'; focus?: 'today' }
  /** activity: adopting a recommended activity. */
  | { name: 'exerciseNew'; activity?: string }
  /** age: a CDC reference age in months, 'all', or null for the child's default. */
  | { name: 'exerciseBrowse'; age: number | 'all' | null }
  | { name: 'activity'; id: string }
  | { name: 'exerciseItem'; id: string }
  | { name: 'exerciseEdit'; id: string }
  | { name: 'progressHistory'; view: 'milestones' | 'goals' | 'exercises' }
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
      if (b === 'progress') {
        if (parts[2] === 'history') return { name: 'progressHistory', view: parts[3] === 'goals' || parts[3] === 'exercises' ? parts[3] : 'milestones' };
        return { name: 'growthProgress' };
      }
      if (b === 'goals') return parseGoals(parts.slice(2));
      if (b === 'exercises') return parseExercises(parts.slice(2));
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

const dec = (v: string) => { try { return decodeURIComponent(v); } catch { return v; } };

function parseGoals(p: string[]): Route {
  const [c, d, e] = p;
  if (c === undefined) return { name: 'goals' };
  if (c === 'my') return { name: 'myGoals' };
  if (c === 'ideas') return d && /^r\d+-\d+$/.test(d) ? { name: 'goalIdeas', range: d } : { name: 'goalIdeas' };
  if (c === 'new') {
    if (d === 'milestone' && e) return { name: 'goalNew', milestone: dec(e) };
    if (d === 'idea' && e && /^gi-[a-z0-9-]+$/.test(e)) return { name: 'goalNew', idea: e };
    return { name: 'goalNew' };
  }
  if (c === 'achievement' && d === 'new') return { name: 'achievementNew' };
  if (c === 'item' && d) return e === 'edit' ? { name: 'goalEdit', id: dec(d) } : { name: 'goalItem', id: dec(d) };
  return { name: 'goals' };
}

function parseExercises(p: string[]): Route {
  const [c, d, e] = p;
  if (c === undefined) return { name: 'exercises' };
  if (c === 'today') return { name: 'exercises', focus: 'today' };
  if (c === 'new') return d ? { name: 'exerciseNew', activity: dec(d) } : { name: 'exerciseNew' };
  if (c === 'browse') {
    if (d === 'all') return { name: 'exerciseBrowse', age: 'all' };
    const n = d === undefined ? null : Number(d);
    return { name: 'exerciseBrowse', age: n !== null && Number.isInteger(n) && n > 0 && n <= 60 ? n : null };
  }
  if (c === 'activity' && d) return { name: 'activity', id: dec(d) };
  if (c === 'item' && d) return e === 'edit' ? { name: 'exerciseEdit', id: dec(d) } : { name: 'exerciseItem', id: dec(d) };
  return { name: 'exercises' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'goals':
      return '#/growth/goals';
    case 'myGoals':
      return '#/growth/goals/my';
    case 'goalNew':
      return route.milestone ? `#/growth/goals/new/milestone/${encodeURIComponent(route.milestone)}` : route.idea !== undefined ? `#/growth/goals/new/idea/${encodeURIComponent(route.idea)}` : '#/growth/goals/new';
    case 'achievementNew':
      return '#/growth/goals/achievement/new';
    case 'goalItem':
      return `#/growth/goals/item/${encodeURIComponent(route.id)}`;
    case 'goalEdit':
      return `#/growth/goals/item/${encodeURIComponent(route.id)}/edit`;
    case 'goalIdeas':
      return route.range ? `#/growth/goals/ideas/${route.range}` : '#/growth/goals/ideas';
    case 'exercises':
      return route.focus === 'today' ? '#/growth/exercises/today' : '#/growth/exercises';
    case 'exerciseNew':
      return route.activity ? `#/growth/exercises/new/${encodeURIComponent(route.activity)}` : '#/growth/exercises/new';
    case 'exerciseBrowse':
      return route.age === null ? '#/growth/exercises/browse' : `#/growth/exercises/browse/${route.age}`;
    case 'activity':
      return `#/growth/exercises/activity/${encodeURIComponent(route.id)}`;
    case 'exerciseItem':
      return `#/growth/exercises/item/${encodeURIComponent(route.id)}`;
    case 'exerciseEdit':
      return `#/growth/exercises/item/${encodeURIComponent(route.id)}/edit`;
    case 'progressHistory':
      return `#/growth/progress/history/${route.view}`;
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
