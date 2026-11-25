import { useEffect, useState } from 'preact/hooks';

/**
 * Minimal hash router. Hash URLs (#/growth) never hit the server, so they
 * work on GitHub Pages (no SPA rewrite rules) and offline.
 */
export type Route =
  | { name: 'home' }
  | { name: 'growth' }
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
  | { name: 'profileEdit'; id: string };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [a, b] = parts;
  switch (a) {
    case undefined:
    case 'home':
      return { name: 'home' };
    case 'growth':
    case 'calendar':
    case 'journal':
    case 'resources':
      return { name: a };
    case 'settings':
      if (b === 'privacy' || b === 'storage' || b === 'install' || b === 'about') return { name: b };
      return { name: 'settings' };
    case 'profiles':
      if (b === 'new') return { name: 'profileNew' };
      if (b) return { name: 'profileEdit', id: decodeURIComponent(b) };
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
    case 'profileEdit':
      return `#/profiles/${encodeURIComponent(route.id)}`;
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
