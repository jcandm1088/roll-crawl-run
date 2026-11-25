/**
 * Date-only utilities. All calendar dates are stored as local "YYYY-MM-DD"
 * strings and computed with UTC arithmetic so that time zones and daylight
 * saving transitions can never shift a date by one day.
 */

export type LocalDate = string; // "YYYY-MM-DD"

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export interface DateParts {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Parses a "YYYY-MM-DD" string. Returns null for malformed or impossible dates (e.g. 2023-02-29). */
export function parseLocalDate(value: string): DateParts | null {
  const match = DATE_RE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isValidLocalDate(value: string): boolean {
  return parseLocalDate(value) !== null;
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function formatLocalDate(parts: DateParts): LocalDate {
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`;
}

function mustParse(value: LocalDate): DateParts {
  const parts = parseLocalDate(value);
  if (!parts) throw new Error(`Invalid date: ${value}`);
  return parts;
}

/** Day number since the Unix epoch (UTC), used for exact day arithmetic. */
export function toDayNumber(value: LocalDate): number {
  const { year, month, day } = mustParse(value);
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function fromDayNumber(dayNumber: number): LocalDate {
  const d = new Date(dayNumber * MS_PER_DAY);
  return formatLocalDate({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
}

export function addDays(value: LocalDate, days: number): LocalDate {
  return fromDayNumber(toDayNumber(value) + days);
}

export function daysBetween(from: LocalDate, to: LocalDate): number {
  return toDayNumber(to) - toDayNumber(from);
}

export function compareDates(a: LocalDate, b: LocalDate): number {
  return toDayNumber(a) - toDayNumber(b);
}

/**
 * Adds whole calendar months. When the target month is shorter than the
 * original day (e.g. Jan 31 + 1 month), the result is the target month's
 * last day (Feb 28 or Feb 29).
 */
export function addMonthsClamped(value: LocalDate, months: number): LocalDate {
  const { year, month, day } = mustParse(value);
  const zeroBased = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(zeroBased / 12);
  const targetMonth = (zeroBased % 12) + 1;
  return formatLocalDate({
    year: targetYear,
    month: targetMonth,
    day: Math.min(day, daysInMonth(targetYear, targetMonth)),
  });
}

/** Today's date in the device's local time zone. */
export function todayLocal(now: Date = new Date()): LocalDate {
  return formatLocalDate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "March 4, 2025" — locale-independent so output is deterministic. */
export function formatLongDate(value: LocalDate): string {
  const { year, month, day } = mustParse(value);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}
