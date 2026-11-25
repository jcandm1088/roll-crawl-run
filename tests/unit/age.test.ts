import { describe, expect, it } from 'vitest';
import {
  ageBetween,
  correctedAge,
  dueDateFromGestationalAge,
  formatAge,
  formatBeforeDueDate,
  validateDob,
  validateDueDate,
  viewingAge,
} from '../../src/domain/age';
import { addMonthsClamped, daysInMonth, isLeapYear, isValidLocalDate, todayLocal } from '../../src/domain/dates';
import { INTERVALS, intervalForAge, intervalForReferenceAge } from '../../src/domain/intervals';

describe('dates', () => {
  it('knows leap years (including century rules)', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2025, 4)).toBe(30);
  });

  it('rejects impossible dates', () => {
    expect(isValidLocalDate('2023-02-29')).toBe(false);
    expect(isValidLocalDate('2024-02-29')).toBe(true);
    expect(isValidLocalDate('2025-04-31')).toBe(false);
    expect(isValidLocalDate('2025-13-01')).toBe(false);
    expect(isValidLocalDate('2025-1-01')).toBe(false);
    expect(isValidLocalDate('')).toBe(false);
  });

  it('adds months clamping to the last day of shorter months', () => {
    expect(addMonthsClamped('2025-01-31', 1)).toBe('2025-02-28');
    expect(addMonthsClamped('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonthsClamped('2024-02-29', 12)).toBe('2025-02-28');
    expect(addMonthsClamped('2025-11-30', 3)).toBe('2026-02-28');
    expect(addMonthsClamped('2025-12-15', 1)).toBe('2026-01-15');
  });

  it('uses the device’s local calendar date for “today”', () => {
    expect(todayLocal(new Date(2025, 6, 4, 23, 59))).toBe('2025-07-04');
    expect(todayLocal(new Date(2025, 0, 1, 0, 0))).toBe('2025-01-01');
  });
});

describe('chronological age', () => {
  it('is zero on the day of birth', () => {
    const a = ageBetween('2025-03-10', '2025-03-10');
    expect(a).toMatchObject({ years: 0, months: 0, days: 0, totalMonths: 0, totalDays: 0 });
    expect(formatAge(a)).toBe('0 days');
  });

  it('counts days and weeks in the first month', () => {
    expect(formatAge(ageBetween('2025-03-10', '2025-03-11'))).toBe('1 day');
    expect(formatAge(ageBetween('2025-03-10', '2025-03-17'))).toBe('1 week');
    expect(formatAge(ageBetween('2025-03-10', '2025-03-27'))).toBe('2 weeks, 3 days');
  });

  it('counts completed months and remaining days', () => {
    const a = ageBetween('2025-01-15', '2025-08-27');
    expect(a).toMatchObject({ totalMonths: 7, days: 12 });
    expect(formatAge(a)).toBe('7 months, 12 days');
    expect(formatAge(ageBetween('2025-01-15', '2025-02-15'))).toBe('1 month');
  });

  it('handles month-end birthdays', () => {
    // Born Jan 31: one month old on Feb 28 in a non-leap year…
    expect(ageBetween('2025-01-31', '2025-02-27')).toMatchObject({ totalMonths: 0, days: 27 });
    expect(ageBetween('2025-01-31', '2025-02-28')).toMatchObject({ totalMonths: 1, days: 0 });
    // …and on Feb 29 in a leap year.
    expect(ageBetween('2024-01-31', '2024-02-28')).toMatchObject({ totalMonths: 0, days: 28 });
    expect(ageBetween('2024-01-31', '2024-02-29')).toMatchObject({ totalMonths: 1, days: 0 });
    // Two months on Mar 31.
    expect(ageBetween('2025-01-31', '2025-03-30')).toMatchObject({ totalMonths: 1, days: 30 });
    expect(ageBetween('2025-01-31', '2025-03-31')).toMatchObject({ totalMonths: 2, days: 0 });
  });

  it('handles February 29 birthdays', () => {
    expect(ageBetween('2024-02-29', '2025-02-27')).toMatchObject({ years: 0, months: 11 });
    expect(ageBetween('2024-02-29', '2025-02-28')).toMatchObject({ years: 1, months: 0, days: 0 });
    expect(ageBetween('2024-02-29', '2028-02-29')).toMatchObject({ years: 4, months: 0, days: 0 });
    expect(ageBetween('2024-02-29', '2028-02-28')).toMatchObject({ years: 3, months: 11, days: 30 });
  });

  it('crosses year boundaries', () => {
    expect(ageBetween('2024-12-20', '2025-01-05')).toMatchObject({ totalMonths: 0, totalDays: 16 });
    expect(ageBetween('2024-11-30', '2025-01-01')).toMatchObject({ totalMonths: 1, days: 2 });
  });

  it('switches to years and months from 2 years', () => {
    expect(formatAge(ageBetween('2023-05-01', '2025-04-30'))).toBe('23 months, 29 days');
    expect(formatAge(ageBetween('2023-05-01', '2025-05-01'))).toBe('2 years');
    expect(formatAge(ageBetween('2021-02-10', '2025-06-20'))).toBe('4 years, 4 months');
  });

  it('throws for a date before birth', () => {
    expect(() => ageBetween('2025-05-01', '2025-04-30')).toThrow();
  });
});

describe('date of birth validation', () => {
  const today = '2025-06-15';
  it('accepts today and any past date from 1900', () => {
    expect(validateDob('2025-06-15', today).ok).toBe(true);
    expect(validateDob('2019-01-01', today).ok).toBe(true);
    expect(validateDob('1900-01-01', today).ok).toBe(true);
  });
  it('rejects empty, impossible, future, and pre-1900 dates', () => {
    expect(validateDob('', today)).toMatchObject({ ok: false, reason: 'empty' });
    expect(validateDob('2023-02-29', today)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(validateDob('2025-06-16', today)).toMatchObject({ ok: false, reason: 'future' });
    expect(validateDob('1899-12-31', today)).toMatchObject({ ok: false, reason: 'tooEarly' });
  });
});

describe('corrected age', () => {
  const dob = '2025-01-01';

  it('computes the due date from gestational age (40 weeks = full term)', () => {
    expect(dueDateFromGestationalAge(dob, 32, 0)).toEqual({ ok: true, applicable: true, dueDate: '2025-02-26' });
    expect(dueDateFromGestationalAge(dob, 39, 6)).toEqual({ ok: true, applicable: true, dueDate: '2025-01-02' });
  });

  it('treats 40 weeks or later as not applicable (no error)', () => {
    expect(dueDateFromGestationalAge(dob, 40, 0)).toMatchObject({ ok: true, applicable: false });
    expect(dueDateFromGestationalAge(dob, 41, 6)).toMatchObject({ ok: true, applicable: false });
  });

  it('rejects out-of-range gestational age instead of altering it', () => {
    expect(dueDateFromGestationalAge(dob, 19, 6)).toMatchObject({ ok: false });
    expect(dueDateFromGestationalAge(dob, 42, 0)).toMatchObject({ ok: false });
    expect(dueDateFromGestationalAge(dob, 30, 7)).toMatchObject({ ok: false });
    expect(dueDateFromGestationalAge(dob, 30.5, 0)).toMatchObject({ ok: false });
    expect(dueDateFromGestationalAge(dob, 20, 0)).toMatchObject({ ok: true, applicable: true });
  });

  it('validates directly entered due dates', () => {
    expect(validateDueDate(dob, '2025-03-01')).toEqual({ ok: true, applicable: true });
    expect(validateDueDate(dob, '2025-01-01')).toMatchObject({ ok: true, applicable: false });
    expect(validateDueDate(dob, '2024-12-20')).toMatchObject({ ok: true, applicable: false });
    expect(validateDueDate(dob, '2025-05-21')).toEqual({ ok: true, applicable: true }); // exactly 20 weeks
    expect(validateDueDate(dob, '2025-05-22')).toMatchObject({ ok: false });
    expect(validateDueDate(dob, '2025-02-30')).toMatchObject({ ok: false });
    expect(validateDueDate(dob, '')).toMatchObject({ ok: false });
  });

  it('reports time before the due date instead of a negative age', () => {
    const r = correctedAge(dob, '2025-02-26', '2025-02-10');
    expect(r).toEqual({ status: 'beforeDueDate', daysUntilDue: 16, weeks: 2, days: 2 });
    expect(formatBeforeDueDate(r as { weeks: number; days: number })).toBe('2 weeks, 2 days before due date');
    expect(formatBeforeDueDate({ weeks: 0, days: 3 })).toBe('3 days before due date');
  });

  it('starts at zero on the due date', () => {
    expect(correctedAge(dob, '2025-02-26', '2025-02-26')).toMatchObject({ status: 'corrected', age: { totalDays: 0 } });
  });

  it('is chronological age shifted by the due date', () => {
    const r = correctedAge(dob, '2025-02-26', '2025-08-26');
    expect(r).toMatchObject({ status: 'corrected', age: { totalMonths: 6, days: 0 } });
    expect(ageBetween(dob, '2025-08-26').totalMonths).toBe(7);
  });

  it('is not applicable without a due date after birth', () => {
    expect(correctedAge(dob, null, '2025-03-01')).toEqual({ status: 'notApplicable' });
    expect(correctedAge(dob, '2025-01-01', '2025-03-01')).toEqual({ status: 'notApplicable' });
  });
});

describe('viewing age', () => {
  it('uses chronological age by default', () => {
    expect(viewingAge('2025-01-01', '2025-02-26', 'chronological', '2025-08-01')).toMatchObject({ basis: 'chronological', months: 7 });
  });
  it('uses corrected age when selected', () => {
    expect(viewingAge('2025-01-01', '2025-02-26', 'corrected', '2025-08-01')).toMatchObject({ basis: 'corrected', months: 5 });
  });
  it('has no milestone age before the due date (never negative)', () => {
    const v = viewingAge('2025-01-01', '2025-02-26', 'corrected', '2025-01-20');
    expect(v.months).toBeNull();
    expect(intervalForAge(v.months).label).toBe('0–3 months');
  });
  it('falls back to chronological when corrected age does not apply', () => {
    expect(viewingAge('2025-01-01', null, 'corrected', '2025-08-01')).toMatchObject({ basis: 'chronological', months: 7 });
  });
});

describe('three-month intervals', () => {
  it('has 20 non-overlapping intervals from 0–3 to 57–60 months', () => {
    expect(INTERVALS).toHaveLength(20);
    expect(INTERVALS[0]!.label).toBe('0–3 months');
    expect(INTERVALS[19]!.label).toBe('57–60 months');
    INTERVALS.forEach((iv, i) => {
      if (i > 0) expect(iv.startMonths).toBe(INTERVALS[i - 1]!.endMonths);
    });
  });

  it('places each age in exactly one interval using [start, end)', () => {
    for (let m = 0; m < 60; m++) {
      const matches = INTERVALS.filter((iv) => m >= iv.startMonths && m < iv.endMonths);
      expect(matches).toHaveLength(1);
      expect(intervalForAge(m)).toBe(matches[0]);
    }
    expect(intervalForAge(2).label).toBe('0–3 months'); // e.g. 2 months 30 days
    expect(intervalForAge(3).label).toBe('3–6 months'); // 3 months 0 days
    expect(intervalForAge(59).label).toBe('57–60 months');
    expect(intervalForAge(60).label).toBe('57–60 months');
    expect(intervalForAge(85).label).toBe('57–60 months');
    expect(intervalForAge(null).label).toBe('0–3 months');
    expect(intervalForAge(-1).label).toBe('0–3 months');
  });

  it('places “By X months” references in the interval ending at X', () => {
    expect(intervalForReferenceAge(2)!.label).toBe('0–3 months');
    expect(intervalForReferenceAge(4)!.label).toBe('3–6 months');
    expect(intervalForReferenceAge(6)!.label).toBe('3–6 months');
    expect(intervalForReferenceAge(9)!.label).toBe('6–9 months');
    expect(intervalForReferenceAge(30)!.label).toBe('27–30 months');
    expect(intervalForReferenceAge(60)!.label).toBe('57–60 months');
    expect(intervalForReferenceAge(0)).toBeNull();
    expect(intervalForReferenceAge(61)).toBeNull();
  });
});
