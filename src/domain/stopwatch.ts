/**
 * Count-up stopwatch arithmetic (Checkpoint 2b, owner-approved stopwatch design). Pure functions.
 *
 * Elapsed time is never accumulated by a repeating timer. It is always computed from stored numbers:
 *   elapsed = accumulatedMs + (time since the last Start/Resume, while running).
 * Within one page session the time since Start/Resume is measured with the monotonic clock
 * (`performance.now()`), which ignores device clock changes. Monotonic clocks may pause while a phone
 * is asleep or the page is suspended, so the stored wall-clock start is used to recover that time, and
 * after a reload it is the only measure available. Disagreements that can't be explained safely are
 * reported as anomalies, and the UI then requires the parent to review the duration before saving.
 *
 * Reaching a target never stops the stopwatch and never records anything.
 */

export interface StopwatchState {
  running: boolean;
  accumulatedMs: number;
  /** Wall clock (ms since epoch) at the last Start/Resume; null while paused or idle. */
  runningSinceEpochMs: number | null;
}

/** A monotonic reference taken in THIS page when the stopwatch was started or resumed (or the page loaded). */
export interface MonotonicAnchor {
  perfAt: number;
  epochAt: number;
}

export type StopwatchAnomaly =
  /** The device clock moved backwards while running. */
  | 'clock-back'
  /** Much more wall-clock time passed than this page measured (suspension or a clock change; can't tell which). */
  | 'clock-jump'
  /** The stopwatch has been running for an implausibly long time. */
  | 'very-long';

export interface Elapsed {
  ms: number;
  anomaly: StopwatchAnomaly | null;
  /** Time was recovered from the wall clock (page suspended, phone asleep, or app reopened). */
  recovered: boolean;
}

/** Background time up to this much is accepted silently (a short lock screen or app switch). */
export const SILENT_RECOVERY_MS = 60 * 60 * 1000;
/** Tolerance between the two clocks before they are considered to disagree. */
export const CLOCK_TOLERANCE_MS = 5000;
/** Running longer than this is treated as uncertain. */
export const VERY_LONG_MS = 12 * 60 * 60 * 1000;

export function computeElapsed(s: StopwatchState, nowEpoch: number, anchor: MonotonicAnchor | null, perfNow: number | null): Elapsed {
  if (!s.running || s.runningSinceEpochMs === null) return { ms: Math.max(0, s.accumulatedMs), anomaly: null, recovered: false };
  const wallDelta = nowEpoch - s.runningSinceEpochMs;
  let delta: number;
  let anomaly: StopwatchAnomaly | null = null;
  let recovered = false;
  if (anchor && perfNow !== null) {
    // Time before this page's anchor comes from the wall clock (e.g. a reload); after it, monotonic.
    const beforeAnchor = Math.max(0, anchor.epochAt - s.runningSinceEpochMs);
    const perfDelta = Math.max(0, perfNow - anchor.perfAt);
    const wallSinceAnchor = nowEpoch - anchor.epochAt;
    if (wallSinceAnchor < perfDelta - CLOCK_TOLERANCE_MS) {
      anomaly = 'clock-back';
      delta = beforeAnchor + perfDelta;
    } else if (wallSinceAnchor > perfDelta + CLOCK_TOLERANCE_MS) {
      // The page measured less time than passed on the wall clock: suspended, asleep, or the clock jumped.
      recovered = true;
      delta = beforeAnchor + wallSinceAnchor;
      if (wallSinceAnchor - perfDelta > SILENT_RECOVERY_MS) anomaly = 'clock-jump';
    } else delta = beforeAnchor + perfDelta;
    if (beforeAnchor > 0) recovered = true;
  } else {
    recovered = true;
    if (wallDelta < 0) {
      anomaly = 'clock-back';
      delta = 0;
    } else delta = wallDelta;
  }
  const ms = Math.max(0, s.accumulatedMs + delta);
  if (!anomaly && ms > VERY_LONG_MS) anomaly = 'very-long';
  return { ms, anomaly, recovered };
}

export function start(s: StopwatchState, nowEpoch: number): StopwatchState {
  if (s.running) return s;
  return { running: true, accumulatedMs: s.accumulatedMs, runningSinceEpochMs: nowEpoch };
}

/** Pauses, banking the elapsed time computed by the caller (so the same rule is used everywhere). */
export function pause(elapsedMs: number): StopwatchState {
  return { running: false, accumulatedMs: Math.max(0, Math.round(elapsedMs)), runningSinceEpochMs: null };
}

export const RESET: StopwatchState = { running: false, accumulatedMs: 0, runningSinceEpochMs: null };

/** "4:05" or "1:02:09" — fixed format so the width stays stable. */
export function formatStopwatch(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** Plain-language duration: "4 minutes, 5 seconds". */
export function describeDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (m) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  if (s || parts.length === 0) parts.push(`${s} second${s === 1 ? '' : 's'}`);
  return parts.join(', ');
}

/** Whole seconds for a stored session (rounded down: never more than was measured). */
export const toSeconds = (ms: number) => Math.floor(Math.max(0, ms) / 1000);

/** Manual duration entry: minutes and seconds (hours optional). Null if invalid. Max 24 hours. */
export function parseManualDuration(hours: string, minutes: string, seconds: string): number | null {
  const parts = [hours, minutes, seconds].map((v) => (v.trim() === '' ? 0 : Number(v)));
  if (parts.some((n) => !Number.isInteger(n) || n < 0)) return null;
  const [h, m, s] = parts as [number, number, number];
  if (m > 59 || s > 59) return null;
  const total = h * 3600 + m * 60 + s;
  if (total <= 0 || total > 24 * 3600) return null;
  return total;
}
