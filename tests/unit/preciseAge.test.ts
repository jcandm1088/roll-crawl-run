import { describe, expect, it } from 'vitest';
import { ageBetween, correctedAge, formatPreciseAge } from '../../src/domain/age';
import { msUntilNextLocalMidnight } from '../../src/state/today';

/** Precise personal age shown on Home (years, months, days — to the calendar day). */
const age = (dob: string, on: string) => formatPreciseAge(ageBetween(dob, on));

describe('precise personal age', () => {
  it('matches the reviewer’s examples', () => {
    const on = '2026-11-25';
    expect(age('2026-11-08', on)).toBe('17 days');
    expect(age('2026-10-28', on)).toBe('28 days');
    expect(age('2026-05-13', on)).toBe('6 months, 12 days');
    expect(age('2025-05-20', on)).toBe('1 year, 6 months, 5 days');
    expect(age('2024-11-25', on)).toBe('2 years');
    expect(age('2024-08-11', on)).toBe('2 years, 3 months, 14 days');
    expect(age('2023-11-24', on)).toBe('3 years, 1 day');
    expect(age('2022-03-24', on)).toBe('4 years, 8 months, 1 day');
  });

  it('newborn: “0 days” on the date of birth, then single days (never weeks)', () => {
    expect(age('2026-03-10', '2026-03-10')).toBe('0 days');
    expect(age('2026-03-10', '2026-03-11')).toBe('1 day');
    expect(age('2026-03-10', '2026-03-17')).toBe('7 days');
    expect(age('2026-03-10', '2026-03-24')).toBe('14 days');
  });

  it('younger than one month', () => {
    expect(age('2026-01-31', '2026-02-27')).toBe('27 days');
    expect(age('2026-02-01', '2026-02-28')).toBe('27 days');
  });

  it('younger than one year', () => {
    expect(age('2026-01-15', '2026-02-15')).toBe('1 month');
    expect(age('2026-01-15', '2026-08-27')).toBe('7 months, 12 days');
    expect(age('2026-01-15', '2027-01-14')).toBe('11 months, 30 days');
  });

  it('first birthday starts counting years (not months)', () => {
    expect(age('2025-06-01', '2026-06-01')).toBe('1 year');
    expect(age('2025-06-01', '2026-06-02')).toBe('1 year, 1 day');
    expect(age('2025-06-01', '2026-07-01')).toBe('1 year, 1 month');
  });

  it('between one and two years (no “months-only” such as 18 months)', () => {
    expect(age('2024-11-25', '2026-05-25')).toBe('1 year, 6 months');
    expect(age('2024-11-25', '2026-11-24')).toBe('1 year, 11 months, 30 days');
  });

  it('older than two years, including the reviewer’s 27-month case', () => {
    expect(age('2024-08-25', '2026-11-25')).toBe('2 years, 3 months'); // previously shown as "27 months"
    expect(age('2021-02-10', '2026-06-20')).toBe('5 years, 4 months, 10 days');
  });

  it('exact birthdays omit zero months and days', () => {
    for (const y of [1, 2, 3, 4, 5]) expect(age('2020-04-30', `${2020 + y}-04-30`)).toBe(`${y} year${y === 1 ? '' : 's'}`);
  });

  it('leap years and leap-day birthdays', () => {
    expect(age('2024-02-29', '2025-02-28')).toBe('1 year'); // non-leap year: birthday counted on Feb 28
    expect(age('2024-02-29', '2025-02-27')).toBe('11 months, 29 days');
    expect(age('2024-02-29', '2025-03-01')).toBe('1 year, 1 day');
    expect(age('2024-02-29', '2028-02-29')).toBe('4 years');
    expect(age('2024-02-29', '2028-02-28')).toBe('3 years, 11 months, 30 days');
    expect(age('2024-01-29', '2024-02-29')).toBe('1 month'); // leap February
    expect(age('2023-12-31', '2024-03-01')).toBe('2 months, 1 day'); // Jan 31 → Feb 29 → Mar 1
  });

  it('month-end birthdays', () => {
    expect(age('2026-01-31', '2026-02-28')).toBe('1 month');
    expect(age('2026-01-31', '2026-03-30')).toBe('1 month, 30 days');
    expect(age('2026-01-31', '2026-03-31')).toBe('2 months');
    expect(age('2025-08-31', '2026-09-30')).toBe('1 year, 1 month');
  });

  it('singular and plural wording', () => {
    expect(formatPreciseAge({ years: 1, months: 1, days: 1 })).toBe('1 year, 1 month, 1 day');
    expect(formatPreciseAge({ years: 2, months: 2, days: 2 })).toBe('2 years, 2 months, 2 days');
  });

  it('omits every zero-valued component', () => {
    expect(formatPreciseAge({ years: 0, months: 0, days: 5 })).toBe('5 days');
    expect(formatPreciseAge({ years: 0, months: 3, days: 0 })).toBe('3 months');
    expect(formatPreciseAge({ years: 3, months: 0, days: 0 })).toBe('3 years');
    expect(formatPreciseAge({ years: 3, months: 0, days: 4 })).toBe('3 years, 4 days');
    expect(formatPreciseAge({ years: 0, months: 0, days: 0 })).toBe('0 days');
  });

  it('corrected age uses the same precise formatting', () => {
    // Born 2025-01-01 at 32 weeks → due 2025-02-26.
    const c = correctedAge('2025-01-01', '2025-02-26', '2026-05-10');
    expect(c.status).toBe('corrected');
    if (c.status === 'corrected') expect(formatPreciseAge(c.age)).toBe('1 year, 2 months, 14 days');
    // Chronological age remains available and precise.
    expect(age('2025-01-01', '2026-05-10')).toBe('1 year, 4 months, 9 days');
    const due = correctedAge('2025-01-01', '2025-02-26', '2025-02-26');
    if (due.status === 'corrected') expect(formatPreciseAge(due.age)).toBe('0 days');
  });

  it('changes when the local calendar date changes', () => {
    expect(age('2025-06-01', '2026-05-31')).toBe('11 months, 30 days');
    expect(age('2025-06-01', '2026-06-01')).toBe('1 year');
  });
});

describe('midnight scheduling', () => {
  it('targets just after the next local midnight', () => {
    const now = new Date(2026, 10, 25, 23, 59, 30);
    expect(msUntilNextLocalMidnight(now)).toBe(31_000);
    expect(msUntilNextLocalMidnight(new Date(2026, 10, 25, 12, 0, 0))).toBe(12 * 3600_000 + 1000);
  });
  it('handles month and year boundaries', () => {
    expect(msUntilNextLocalMidnight(new Date(2026, 11, 31, 23, 0, 0))).toBe(3600_000 + 1000);
    expect(msUntilNextLocalMidnight(new Date(2028, 1, 28, 23, 0, 0))).toBe(3600_000 + 1000); // leap year Feb 28 → 29
  });
});
