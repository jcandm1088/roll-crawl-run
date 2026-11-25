import { useEffect, useState } from 'preact/hooks';
import { todayLocal, type LocalDate } from '../domain/dates';

/** Milliseconds until the next local midnight (plus a small margin). */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return Math.max(1000, next.getTime() - now.getTime());
}

/**
 * Today's local calendar date, kept current:
 * - re-checked at local midnight while the app is open,
 * - re-checked whenever the app becomes visible again or regains focus
 *   (e.g. resuming after the phone slept past midnight; timers may not fire
 *   while suspended), and once a minute as a fallback.
 */
export function useToday(): LocalDate {
  const [today, setToday] = useState<LocalDate>(() => todayLocal());
  useEffect(() => {
    const check = () => setToday((current) => {
      const now = todayLocal();
      return now === current ? current : now;
    });
    let midnight = 0;
    const scheduleMidnight = () => {
      window.clearTimeout(midnight);
      midnight = window.setTimeout(() => {
        check();
        scheduleMidnight();
      }, msUntilNextLocalMidnight());
    };
    const onResume = () => {
      if (document.visibilityState === 'visible') {
        check();
        scheduleMidnight();
      }
    };
    scheduleMidnight();
    const fallback = window.setInterval(check, 60_000);
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', onResume);
    window.addEventListener('pageshow', onResume);
    return () => {
      window.clearTimeout(midnight);
      window.clearInterval(fallback);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', onResume);
      window.removeEventListener('pageshow', onResume);
    };
  }, []);
  return today;
}
