/**
 * Service worker registration and update flow.
 * A new version installs in the background and waits; the app shows a
 * "Refresh" banner, and only activates the new version when the user taps
 * it. App data lives in IndexedDB, which updates never clear.
 */
type Listener = () => void;
const listeners = new Set<Listener>();
let waiting: ServiceWorker | null = null;

function notify(worker: ServiceWorker) {
  waiting = worker;
  listeners.forEach((l) => l());
}

export function onUpdateAvailable(listener: Listener): () => void {
  listeners.add(listener);
  if (waiting) listener();
  return () => listeners.delete(listener);
}

export function applyUpdate(): void {
  if (!waiting) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
      if (reg.waiting && navigator.serviceWorker.controller) notify(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          // Only an update if a previous version already controls the page.
          if (worker.state === 'installed' && navigator.serviceWorker.controller) notify(worker);
        });
      });
      // Check for updates when the app returns to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => undefined);
      });
    } catch {
      // Registration can fail in private modes or unsupported contexts; the app still works online.
    }
  });
}
