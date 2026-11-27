/**
 * Exercise schedules, scheduled sessions and Today's routine (Checkpoint 2b). Pure functions.
 *
 * - A schedule is a list of versions; the version in force on a date is the latest one whose
 *   `effectiveFrom` is on or before it. Changes (including pause and resume) add a version from TODAY,
 *   so earlier days are always evaluated with the schedule that applied then (history is never rewritten).
 * - A scheduled day has slots 1..sessionsPerDay (`YYYY-MM-DD#n`). Each slot counts once. Additional
 *   sessions have their own keys (`extra:<uuid>`) and never enter the daily denominator.
 * - Today's routine = completed scheduled slots ÷ scheduled slots for the local day; never above 100%.
 *
 * `occurrencesBetween` is the hook for the future Calendar (Checkpoint 3). No clock times are stored.
 */
import type { Exercise, ExerciseSession, ScheduleRule, ScheduleVersion, Weekday } from '../types';
import { addDays, compareDates, parseLocalDate, type LocalDate } from './dates';

export const MAX_SESSIONS_PER_DAY = 24;
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Day of the week for a local date (0 = Sunday), computed in UTC so time zones can't shift it. */
export function weekdayOf(date: LocalDate): Weekday {
  const p = parseLocalDate(date);
  if (!p) throw new Error(`Invalid date: ${date}`);
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay() as Weekday;
}

export const slotKeyFor = (date: LocalDate, n: number) => `${date}#${n}`;
export const isExtraSlot = (slotKey: string) => slotKey.startsWith('extra:');
/** Scheduled slot number of a key on a given date, or null (an additional session or another day). */
export function slotNumber(slotKey: string, date: LocalDate): number | null {
  if (!slotKey.startsWith(`${date}#`)) return null;
  const n = Number(slotKey.slice(date.length + 1));
  return Number.isInteger(n) && n >= 1 ? n : null;
}

export function versionOn(schedule: readonly ScheduleVersion[], date: LocalDate): ScheduleVersion | null {
  let found: ScheduleVersion | null = null;
  for (const v of schedule) if (compareDates(v.effectiveFrom, date) <= 0 && (!found || compareDates(v.effectiveFrom, found.effectiveFrom) >= 0)) found = v;
  return found;
}

export function ruleMatches(rule: ScheduleRule, date: LocalDate): boolean {
  if (rule.kind === 'asNeeded') return false;
  if (rule.kind === 'daily') return true;
  return rule.days.includes(weekdayOf(date));
}

/** Number of scheduled sessions for an exercise on a date (0 when as needed, paused, archived or not that day). */
export function scheduledCountOn(exercise: Pick<Exercise, 'schedule' | 'archivedAt'>, date: LocalDate): number {
  if (exercise.archivedAt) return 0;
  const v = versionOn(exercise.schedule, date);
  if (!v || v.paused || !ruleMatches(v.rule, date)) return 0;
  return Math.max(1, Math.min(MAX_SESSIONS_PER_DAY, Math.floor(v.sessionsPerDay)));
}

/** The schedule a parent sees now (the version in force today, or the next one starting later). */
export function currentOrNextVersion(schedule: readonly ScheduleVersion[], today: LocalDate): ScheduleVersion | null {
  return versionOn(schedule, today) ?? [...schedule].sort((a, b) => compareDates(a.effectiveFrom, b.effectiveFrom)).find((v) => compareDates(v.effectiveFrom, today) > 0) ?? null;
}

/**
 * Adds a schedule version that applies from `from` (today). A second change on the same day replaces
 * that day's version. Versions for earlier days are kept unchanged. A pending future start is replaced.
 */
export function withScheduleChange(schedule: readonly ScheduleVersion[], change: ScheduleVersion): ScheduleVersion[] {
  return [...schedule.filter((v) => compareDates(v.effectiveFrom, change.effectiveFrom) < 0), change];
}

export function describeRule(v: ScheduleVersion | null): string {
  if (!v || v.rule.kind === 'asNeeded') return 'As needed';
  const per = v.sessionsPerDay > 1 ? ` · ${v.sessionsPerDay} sessions` : '';
  if (v.rule.kind === 'daily') return `Every day${per}`;
  const days = [...v.rule.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); // Monday first
  return `${days.map((d) => WEEKDAY_LABELS[d]).join(' ')}${per}`;
}

const counts = (s: ExerciseSession) => s.deletedAt === null && s.reversedAt === null;

export interface RoutineItem {
  exercise: Exercise;
  scheduled: number;
  /** Slot numbers (1..scheduled) with a recorded, non-reversed session. */
  doneSlots: number[];
  /** Sessions recorded today that are not one of today's scheduled slots (additional sessions). */
  additional: number;
  /** First open slot, or null when every scheduled session is done. */
  nextSlot: number | null;
}

export interface Routine {
  date: LocalDate;
  scheduledCount: number;
  doneCount: number;
  items: RoutineItem[];
}

/**
 * Today's routine for one child. Used by BOTH the Exercises page and the Home card (one calculation,
 * one set of records). doneCount ≤ scheduledCount by construction.
 */
export function routineFor(exercises: readonly Exercise[], sessions: readonly ExerciseSession[], date: LocalDate): Routine {
  const items: RoutineItem[] = [];
  for (const exercise of exercises) {
    if (exercise.deletedAt !== null) continue;
    const scheduled = scheduledCountOn(exercise, date);
    const mine = sessions.filter((s) => s.customItemId === exercise.id && s.occurrenceDate === date && counts(s));
    if (scheduled === 0) continue;
    const doneSlots = mine.map((s) => slotNumber(s.slotKey, date)).filter((n): n is number => n !== null && n <= scheduled).sort((a, b) => a - b);
    const unique = [...new Set(doneSlots)];
    let nextSlot: number | null = null;
    for (let n = 1; n <= scheduled; n++) if (!unique.includes(n)) { nextSlot = n; break; }
    items.push({ exercise, scheduled, doneSlots: unique, additional: mine.length - unique.length, nextSlot });
  }
  items.sort((a, b) => a.exercise.title.localeCompare(b.exercise.title) || a.exercise.id.localeCompare(b.exercise.id));
  const scheduledCount = items.reduce((t, i) => t + i.scheduled, 0);
  const doneCount = items.reduce((t, i) => t + i.doneSlots.length, 0);
  return { date, scheduledCount, doneCount, items };
}

/** First open scheduled slot of an exercise on a date (by the version in force then), or null. */
export function openSlotOn(exercise: Exercise, sessions: readonly ExerciseSession[], date: LocalDate): number | null {
  const scheduled = scheduledCountOn(exercise, date);
  const taken = new Set(sessions.filter((s) => s.customItemId === exercise.id && counts(s)).map((s) => slotNumber(s.slotKey, date)));
  for (let n = 1; n <= scheduled; n++) if (!taken.has(n)) return n;
  return null;
}

/** Dated scheduled slots between two dates (inclusive). For the future Calendar; nothing stores them. */
export function occurrencesBetween(exercise: Pick<Exercise, 'schedule' | 'archivedAt'>, from: LocalDate, to: LocalDate): Array<{ date: LocalDate; slot: number }> {
  const out: Array<{ date: LocalDate; slot: number }> = [];
  for (let d = from; compareDates(d, to) <= 0; d = addDays(d, 1)) {
    const n = scheduledCountOn(exercise, d);
    for (let i = 1; i <= n; i++) out.push({ date: d, slot: i });
  }
  return out;
}
