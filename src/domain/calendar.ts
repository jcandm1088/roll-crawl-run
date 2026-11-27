/**
 * Simplified Calendar (Checkpoint 3): month grid arithmetic, parent-entered event rules and ordering.
 * Record-keeping only: no recurrence, reminders, scheduling logic or links to goals and exercises.
 * Dates are local "YYYY-MM-DD" strings handled with the UTC day arithmetic in dates.ts, so a time zone
 * or daylight-saving change can never move an event to another day.
 */
import type { CalendarEvent, CalendarEventKind } from '../types';
import { compareDates, daysInMonth, formatLocalDate, isValidLocalDate, parseLocalDate, toDayNumber, type LocalDate } from './dates';

export interface YearMonth {
  year: number;
  month: number; // 1–12
}

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Supported calendar years (keeps navigation and typed dates inside a sensible, testable span). */
export const MIN_YEAR = 1990;
export const MAX_YEAR = 2100;

export const yearMonthOf = (date: LocalDate): YearMonth => {
  const p = parseLocalDate(date);
  if (!p) throw new Error(`Invalid date: ${date}`);
  return { year: p.year, month: p.month };
};

export function shiftMonth(ym: YearMonth, delta: number): YearMonth {
  const zero = ym.year * 12 + (ym.month - 1) + delta;
  return { year: Math.floor(zero / 12), month: (((zero % 12) + 12) % 12) + 1 };
}

export const canShiftMonth = (ym: YearMonth, delta: number): boolean => {
  const y = shiftMonth(ym, delta).year;
  return y >= MIN_YEAR && y <= MAX_YEAR;
};

export const formatMonthYear = (ym: YearMonth): string => `${MONTH_NAMES[ym.month - 1]} ${ym.year}`;

/** 0 = Sunday … 6 = Saturday. (Day 0 of the epoch, January 1, 1970, was a Thursday.) */
export function weekdayOf(date: LocalDate): number {
  return (((toDayNumber(date) + 4) % 7) + 7) % 7;
}

export const firstOfMonth = (ym: YearMonth): LocalDate => formatLocalDate({ year: ym.year, month: ym.month, day: 1 });
export const lastOfMonth = (ym: YearMonth): LocalDate => formatLocalDate({ year: ym.year, month: ym.month, day: daysInMonth(ym.year, ym.month) });

/** Weeks (Sunday first) of a month; null for the blank cells before the 1st and after the last day. */
export function monthGrid(ym: YearMonth): Array<Array<LocalDate | null>> {
  const lead = weekdayOf(firstOfMonth(ym));
  const days = daysInMonth(ym.year, ym.month);
  const cells: Array<LocalDate | null> = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) cells.push(formatLocalDate({ year: ym.year, month: ym.month, day: d }));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<LocalDate | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** "Thursday, November 26, 2026" */
export function formatFullDate(date: LocalDate): string {
  const p = parseLocalDate(date);
  if (!p) return date;
  return `${WEEKDAY_NAMES[weekdayOf(date)]}, ${MONTH_NAMES[p.month - 1]} ${p.day}, ${p.year}`;
}

/** "Thu, Nov 26" (adds the year when it differs from `relativeTo`'s year). */
export function formatShortDate(date: LocalDate, relativeTo?: LocalDate): string {
  const p = parseLocalDate(date);
  if (!p) return date;
  const base = `${WEEKDAY_SHORT[weekdayOf(date)]}, ${MONTH_NAMES[p.month - 1]!.slice(0, 3)} ${p.day}`;
  return relativeTo && parseLocalDate(relativeTo)?.year === p.year ? base : `${base}, ${p.year}`;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isValidTime = (value: string): boolean => TIME_RE.test(value);

/** "14:05" → "2:05 PM". Wall-clock text only: no time zone is attached to an event. */
export function formatTime(time: string): string {
  const m = TIME_RE.exec(time);
  if (!m) return time;
  const h = Number(m[1]);
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

export const EVENT_KINDS: Array<{ id: CalendarEventKind; label: string; singular: string }> = [
  { id: 'medical', label: 'Medical appointments', singular: 'Medical appointment' },
  { id: 'personal', label: 'Personal', singular: 'Personal event' },
];
export const kindSingular = (kind: CalendarEventKind): string => EVENT_KINDS.find((k) => k.id === kind)!.singular;

export const TITLE_MAX = 120;
export const LOCATION_MAX = 200;
export const NOTES_MAX = 2000;

export interface EventInput {
  kind: CalendarEventKind;
  title: string;
  date: string;
  /** "" or "HH:MM" */
  time: string;
  location: string;
  notes: string;
}

export interface CleanEvent {
  kind: CalendarEventKind;
  title: string;
  date: LocalDate;
  time: string | null;
  location: string;
  notes: string;
}

export class EventInputError extends Error {}

/** Validates what the parent typed. Throws EventInputError with a parent-friendly message; never alters a date. */
export function validateEventInput(input: EventInput): CleanEvent {
  if (input.kind !== 'medical' && input.kind !== 'personal') throw new EventInputError('Please choose Medical appointment or Personal.');
  const title = input.title.trim();
  if (!title) throw new EventInputError('Please enter a title.');
  if (title.length > TITLE_MAX) throw new EventInputError(`Please keep the title to ${TITLE_MAX} characters or fewer.`);
  const parts = parseLocalDate(input.date);
  if (!parts) throw new EventInputError('Please enter a valid date.');
  if (parts.year < MIN_YEAR || parts.year > MAX_YEAR) throw new EventInputError(`Please enter a date between ${MIN_YEAR} and ${MAX_YEAR}.`);
  const time = input.time.trim();
  if (time && !isValidTime(time)) throw new EventInputError('Please enter a valid time, or leave it blank.');
  const location = input.location.trim();
  if (location.length > LOCATION_MAX) throw new EventInputError(`Please keep the location to ${LOCATION_MAX} characters or fewer.`);
  const notes = input.notes.trim();
  if (notes.length > NOTES_MAX) throw new EventInputError(`Please keep the notes to ${NOTES_MAX} characters or fewer.`);
  return { kind: input.kind, title, date: input.date, time: time || null, location, notes };
}

/** A stored record this app can show as a calendar event (anything else in the store is ignored, never changed). */
export function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' && typeof v.childId === 'string' && v.recordType === 'calendarEvent' && (v.kind === 'medical' || v.kind === 'personal') &&
    typeof v.title === 'string' && v.title.trim() !== '' && typeof v.date === 'string' && isValidLocalDate(v.date) &&
    (v.time === null || (typeof v.time === 'string' && isValidTime(v.time))) && typeof v.location === 'string' && typeof v.notes === 'string'
  );
}

/** Date, then all-day before timed, then time, then title, then id (stable). */
export function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  return (
    compareDates(a.date, b.date) ||
    (a.time === null ? 0 : 1) - (b.time === null ? 0 : 1) ||
    (a.time ?? '').localeCompare(b.time ?? '') ||
    a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }) ||
    a.id.localeCompare(b.id)
  );
}

export interface OverlayVisibility {
  medical: boolean;
  personal: boolean;
  vaccines: boolean;
}

/** Events the visible overlays allow. Hiding an overlay only filters the view: records are untouched. */
export const visibleEvents = (events: CalendarEvent[], overlays: OverlayVisibility): CalendarEvent[] => events.filter((e) => overlays[e.kind]).sort(compareEvents);

export const eventsOn = (events: CalendarEvent[], date: LocalDate): CalendarEvent[] => events.filter((e) => e.date === date).sort(compareEvents);

/** Events dated today or later, soonest first. (Date-only: an earlier time today still counts as today.) */
export const upcomingEvents = (events: CalendarEvent[], today: LocalDate): CalendarEvent[] => events.filter((e) => compareDates(e.date, today) >= 0).sort(compareEvents);

/** Home's "Coming up" card: the next few visible events, soonest first. */
export const homeUpcoming = (events: CalendarEvent[], overlays: OverlayVisibility, today: LocalDate, limit = 3): CalendarEvent[] => upcomingEvents(visibleEvents(events, overlays), today).slice(0, limit);
