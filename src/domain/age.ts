import {
  addDays,
  addMonthsClamped,
  compareDates,
  daysBetween,
  isValidLocalDate,
  parseLocalDate,
  type LocalDate,
} from './dates';

/**
 * Age calculations.
 *
 * Rules (documented in docs/DECISIONS.md):
 * - Age is a calendar difference: completed months are counted from the
 *   date of birth, then the remaining days.
 * - A monthly "anniversary" that doesn't exist in a shorter month falls on
 *   that month's last day (born Jan 31 → one month old on Feb 28/29).
 *   February 29 birthdays therefore count on February 28 in non-leap years.
 */

export interface Age {
  years: number;
  months: number; // 0–11, months beyond whole years
  days: number; // days beyond whole months
  totalMonths: number; // completed months since the start date
  totalDays: number; // exact days since the start date
}

/** Earliest date accepted as a valid date of birth (input validation only). */
export const EARLIEST_DOB: LocalDate = '1900-01-01';

export function ageBetween(start: LocalDate, on: LocalDate): Age {
  const totalDays = daysBetween(start, on);
  if (totalDays < 0) throw new Error('Age cannot be calculated for a date before the start date.');

  const s = parseLocalDate(start)!;
  const o = parseLocalDate(on)!;
  // First estimate of completed months, then step back if that anniversary is after `on`.
  let totalMonths = (o.year - s.year) * 12 + (o.month - s.month);
  while (totalMonths > 0 && compareDates(addMonthsClamped(start, totalMonths), on) > 0) totalMonths--;
  if (totalMonths < 0) totalMonths = 0;

  const anniversary = addMonthsClamped(start, totalMonths);
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days: daysBetween(anniversary, on),
    totalMonths,
    totalDays,
  };
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

/**
 * PRECISE personal age, to the calendar day: completed years, remaining
 * months, remaining days (e.g. "2 years, 3 months, 14 days").
 * - Years start at the first birthday ("1 year, 6 months, 5 days", never "18 months").
 * - Zero-valued parts are omitted ("2 years", "3 years, 1 day").
 * - Never uses weeks, rounding, or ranges. On the date of birth: "0 days".
 * Used wherever the app shows a child's own age (Home, profiles, forms).
 */
export function formatPreciseAge(age: Pick<Age, 'years' | 'months' | 'days'>): string {
  const parts: string[] = [];
  if (age.years > 0) parts.push(plural(age.years, 'year'));
  if (age.months > 0) parts.push(plural(age.months, 'month'));
  if (age.days > 0) parts.push(plural(age.days, 'day'));
  return parts.length === 0 ? '0 days' : parts.join(', ');
}

/**
 * Compact age used for developmental groupings (not for personal age display):
 * - under 1 month: weeks and days ("2 weeks, 3 days") or days
 * - under 2 years: months and days ("7 months, 12 days")
 * - 2 years and older: years and months ("3 years, 4 months")
 */
export function formatAge(age: Age): string {
  if (age.totalMonths < 1) {
    if (age.totalDays < 7) return plural(age.totalDays, 'day');
    const weeks = Math.floor(age.totalDays / 7);
    const days = age.totalDays % 7;
    return days === 0 ? plural(weeks, 'week') : `${plural(weeks, 'week')}, ${plural(days, 'day')}`;
  }
  if (age.totalMonths < 24) {
    return age.days === 0 ? plural(age.totalMonths, 'month') : `${plural(age.totalMonths, 'month')}, ${plural(age.days, 'day')}`;
  }
  return age.months === 0 ? plural(age.years, 'year') : `${plural(age.years, 'year')}, ${plural(age.months, 'month')}`;
}

// ---------------------------------------------------------------------------
// Date of birth validation
// ---------------------------------------------------------------------------

export type DobValidation =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'invalid' | 'future' | 'tooEarly'; message: string };

export function validateDob(dob: string, today: LocalDate): DobValidation {
  if (!dob) return { ok: false, reason: 'empty', message: 'Please enter a date of birth.' };
  if (!isValidLocalDate(dob)) return { ok: false, reason: 'invalid', message: 'Please enter a real calendar date.' };
  if (compareDates(dob, today) > 0)
    return { ok: false, reason: 'future', message: 'The date of birth can’t be in the future.' };
  if (compareDates(dob, EARLIEST_DOB) < 0)
    return { ok: false, reason: 'tooEarly', message: 'Please check the year — dates before 1900 aren’t accepted.' };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Corrected age
// ---------------------------------------------------------------------------

/**
 * Corrected (adjusted) age counts from the estimated due date instead of
 * the date of birth. Equivalently: chronological age minus the weeks the
 * child was born before 40 weeks of gestation.
 *
 * Input-validation limits below are NOT clinical guidance. They only catch
 * likely typing mistakes. Out-of-range input is rejected with an
 * explanation; it is never silently changed.
 */
export const FULL_TERM_DAYS = 40 * 7;
export const GA_MIN_WEEKS = 20;
export const GA_MAX_WEEKS = 41; // with up to 6 extra days (41w6d)
/** Largest accepted gap between birth and due date: 40w − 20w = 20 weeks. */
export const MAX_DUE_DATE_OFFSET_DAYS = FULL_TERM_DAYS - GA_MIN_WEEKS * 7;

export type DueDateValidation =
  | { ok: true; applicable: true }
  | { ok: true; applicable: false; message: string }
  | { ok: false; message: string };

export function validateDueDate(dob: LocalDate, dueDate: string): DueDateValidation {
  if (!dueDate) return { ok: false, message: 'Please enter the estimated due date.' };
  if (!isValidLocalDate(dueDate)) return { ok: false, message: 'Please enter a real calendar date.' };
  const offset = daysBetween(dob, dueDate);
  if (offset <= 0)
    return {
      ok: true,
      applicable: false,
      message: 'The due date is on or before the date of birth, so corrected age doesn’t apply.',
    };
  if (offset > MAX_DUE_DATE_OFFSET_DAYS)
    return {
      ok: false,
      message:
        'This due date is more than 20 weeks after the date of birth. Please check both dates. (This limit only catches typing mistakes; it isn’t medical guidance.)',
    };
  return { ok: true, applicable: true };
}

export type GestationalAgeValidation =
  | { ok: true; applicable: true; dueDate: LocalDate }
  | { ok: true; applicable: false; message: string }
  | { ok: false; message: string };

export function dueDateFromGestationalAge(dob: LocalDate, weeks: number, days: number): GestationalAgeValidation {
  if (!Number.isInteger(weeks) || !Number.isInteger(days) || days < 0 || days > 6)
    return { ok: false, message: 'Please choose whole weeks and 0–6 days.' };
  if (weeks < GA_MIN_WEEKS || weeks > GA_MAX_WEEKS)
    return {
      ok: false,
      message: `Please enter between ${GA_MIN_WEEKS} weeks 0 days and ${GA_MAX_WEEKS} weeks 6 days. (This range only catches typing mistakes; it isn’t medical guidance.)`,
    };
  const gaDays = weeks * 7 + days;
  if (gaDays >= FULL_TERM_DAYS)
    return {
      ok: true,
      applicable: false,
      message: 'At 40 weeks or later, corrected age is the same as chronological age, so it isn’t needed.',
    };
  return { ok: true, applicable: true, dueDate: addDays(dob, FULL_TERM_DAYS - gaDays) };
}

export type CorrectedAgeResult =
  | { status: 'notApplicable' }
  | { status: 'beforeDueDate'; daysUntilDue: number; weeks: number; days: number }
  | { status: 'corrected'; age: Age };

export function correctedAge(dob: LocalDate, dueDate: LocalDate | null, on: LocalDate): CorrectedAgeResult {
  if (!dueDate || daysBetween(dob, dueDate) <= 0) return { status: 'notApplicable' };
  const untilDue = daysBetween(on, dueDate);
  if (untilDue > 0) return { status: 'beforeDueDate', daysUntilDue: untilDue, weeks: Math.floor(untilDue / 7), days: untilDue % 7 };
  return { status: 'corrected', age: ageBetween(dueDate, on) };
}

export function formatBeforeDueDate(r: { weeks: number; days: number }): string {
  const parts: string[] = [];
  if (r.weeks > 0) parts.push(plural(r.weeks, 'week'));
  if (r.days > 0 || r.weeks === 0) parts.push(plural(r.days, 'day'));
  return `${parts.join(', ')} before due date`;
}

// ---------------------------------------------------------------------------
// Viewing age (drives milestone navigation in later checkpoints)
// ---------------------------------------------------------------------------

export type AgeBasis = 'chronological' | 'corrected';

export interface ViewingAge {
  basis: AgeBasis;
  /** Completed months used for intervals/progress; null when no milestone age applies yet (before due date). */
  months: number | null;
  label: string;
}

export function viewingAge(dob: LocalDate, dueDate: LocalDate | null, basis: AgeBasis, on: LocalDate): ViewingAge {
  if (basis === 'corrected') {
    const c = correctedAge(dob, dueDate, on);
    if (c.status === 'corrected') return { basis, months: c.age.totalMonths, label: formatAge(c.age) };
    if (c.status === 'beforeDueDate') return { basis, months: null, label: formatBeforeDueDate(c) };
    // Corrected age not applicable → fall back to chronological, and say so.
  }
  const a = ageBetween(dob, on);
  return { basis: 'chronological', months: a.totalMonths, label: formatAge(a) };
}
