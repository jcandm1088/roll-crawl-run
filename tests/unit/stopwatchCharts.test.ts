/**
 * Stopwatch arithmetic and Progress-over-time calculations (Checkpoint 2b). Pure functions; fictional data.
 */
import { describe, expect, it } from 'vitest';
import { CLOCK_TOLERANCE_MS, RESET, SILENT_RECOVERY_MS, VERY_LONG_MS, computeElapsed, formatStopwatch, parseManualDuration, pause, start, toSeconds } from '../../src/domain/stopwatch';
import { chartMonths, exercisesChart, goalsChart, milestoneChart } from '../../src/domain/personalProgress';
import type { Achievement, Exercise, ExerciseSession, MilestoneRecord, PersonalGoal } from '../../src/types';

describe('stopwatch', () => {
  const T0 = 1_000_000;
  it('counts up from zero; pause banks the time; resume continues; no target needed', () => {
    let s = start(RESET, T0);
    const anchor = { perfAt: 50, epochAt: T0 };
    expect(computeElapsed(s, T0 + 20_000, anchor, 20_050).ms).toBe(20_000);
    s = pause(computeElapsed(s, T0 + 20_000, anchor, 20_050).ms);
    expect(s).toEqual({ running: false, accumulatedMs: 20_000, runningSinceEpochMs: null });
    expect(computeElapsed(s, T0 + 999_999, null, null).ms).toBe(20_000); // paused: never changes
    s = start(s, T0 + 60_000);
    const a2 = { perfAt: 70_000, epochAt: T0 + 60_000 };
    expect(computeElapsed(s, T0 + 75_000, a2, 85_000)).toEqual({ ms: 35_000, anomaly: null, recovered: false });
  });

  it('ignores a device clock change while the page is open (monotonic time) and reports it', () => {
    const s = start(RESET, T0);
    const anchor = { perfAt: 0, epochAt: T0 };
    // 30 s measured by the page, but the wall clock went back 10 minutes.
    const e = computeElapsed(s, T0 + 30_000 - 600_000, anchor, 30_000);
    expect(e).toEqual({ ms: 30_000, anomaly: 'clock-back', recovered: false });
  });

  it('recovers time while the page was suspended (monotonic clock paused) and flags long gaps for review', () => {
    const s = start(RESET, T0);
    const anchor = { perfAt: 0, epochAt: T0 };
    const short = computeElapsed(s, T0 + 120_000, anchor, 10_000); // locked for ~2 minutes
    expect(short).toEqual({ ms: 120_000, anomaly: null, recovered: true });
    const long = computeElapsed(s, T0 + SILENT_RECOVERY_MS + 60_000, anchor, 10_000);
    expect(long.anomaly).toBe('clock-jump');
    expect(computeElapsed(s, T0 + CLOCK_TOLERANCE_MS, anchor, 0).recovered).toBe(false); // within tolerance
  });

  it('after a reload only wall time exists: recovered; negative time is clamped and flagged; very long is flagged', () => {
    const s = { running: true, accumulatedMs: 5_000, runningSinceEpochMs: T0 };
    expect(computeElapsed(s, T0 + 10_000, null, null)).toEqual({ ms: 15_000, anomaly: null, recovered: true });
    expect(computeElapsed(s, T0 - 50_000, null, null)).toEqual({ ms: 5_000, anomaly: 'clock-back', recovered: true });
    expect(computeElapsed(s, T0 + VERY_LONG_MS + 1, null, null).anomaly).toBe('very-long');
    // Reload while running: the time before the new page's anchor comes from the wall clock.
    const anchor = { perfAt: 0, epochAt: T0 + 10_000 };
    expect(computeElapsed(s, T0 + 12_000, anchor, 2_000)).toEqual({ ms: 17_000, anomaly: null, recovered: true });
  });

  it('formats with a stable width and parses manual durations', () => {
    expect(formatStopwatch(0)).toBe('00:00');
    expect(formatStopwatch(65_999)).toBe('01:05');
    expect(formatStopwatch(3_725_000)).toBe('1:02:05');
    expect(toSeconds(1_999)).toBe(1);
    expect(parseManualDuration('', '4', '30')).toBe(270);
    expect(parseManualDuration('1', '', '')).toBe(3600);
    expect(parseManualDuration('', '60', '0')).toBeNull();
    expect(parseManualDuration('', '0', '0')).toBeNull();
    expect(parseManualDuration('25', '0', '0')).toBeNull();
    expect(parseManualDuration('', '-1', '0')).toBeNull();
  });
});

const env = { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', deletedAt: null, rev: 1, originDeviceId: 'd', lastModifiedBy: 'd' };
const rec = (id: string, defId: string, status: MilestoneRecord['status'], achievedDate: string | null, hidden = false): MilestoneRecord => ({ ...env, id, childId: 'c', milestoneDefId: defId, status, firstObservedDate: null, achievedDate, note: '', hidden });

describe('Progress over time', () => {
  const TODAY = '2026-06-15';
  it('covers the last 6 or 12 calendar months, never before the birth month', () => {
    expect(chartMonths(TODAY, '2020-01-01', 6)).toEqual(['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']);
    expect(chartMonths(TODAY, '2020-01-01', 12)[0]).toBe('2025-07');
    expect(chartMonths(TODAY, '2026-04-20', 6)).toEqual(['2026-04', '2026-05', '2026-06']);
  });

  it('milestones: current achieved records by achievement date; hidden excluded with a count; emerging and reversed not counted', () => {
    const r = milestoneChart([
      rec('1', 'cdc22-m02-se-01', 'achieved', '2026-06-02'),
      rec('2', 'cdc22-m02-se-02', 'achieved', '2026-04-10'), // a corrected date counts in its corrected month
      rec('3', 'cdc22-m02-se-03', 'achieved', '2026-05-10', true), // hidden
      rec('4', 'cdc22-m02-se-04', 'emerging', null),
      rec('5', 'cdc22-m04-se-01', 'not-yet', null), // reversed achievement: current record no longer achieved
      rec('6', 'cdc22-m04-se-02', 'achieved', '2026-07-01'), // later than today (clock moved back)
      { ...rec('7', 'x', 'achieved', '2026-06-01'), milestoneDefId: undefined, customItemId: 'legacy' }, // legacy personal entry
    ], TODAY, '2025-01-01', 6);
    expect(Object.fromEntries(r.buckets.map((b) => [b.month, b.count]))).toEqual({ '2026-01': 0, '2026-02': 0, '2026-03': 0, '2026-04': 1, '2026-05': 0, '2026-06': 1 });
    expect(r.excludedHidden).toBe(1);
    expect(r.laterDated).toBe(1);
    expect(r.buckets.at(-1)!.current).toBe(true);
  });

  it('goals: accomplished goals + achievements, once each; reopened goals drop out; archived stay', () => {
    const g = (id: string, status: 'active' | 'accomplished', date: string | null, archivedAt: string | null = null): PersonalGoal => ({ ...env, id, childId: 'c', kind: 'goal', title: id, appCategory: null, description: '', startDate: '2026-01-01', targetDate: null, status, accomplishedDate: date, milestoneDefId: null, archivedAt });
    const a: Achievement = { ...env, id: 'a', childId: 'c', kind: 'achievement', title: 'a', appCategory: null, description: '', achievedDate: '2026-05-03', milestoneDefId: null, archivedAt: null };
    const r = goalsChart([g('g1', 'accomplished', '2026-05-01'), g('g2', 'active', null), g('g3', 'accomplished', '2026-06-01', '2026-06-02T00:00:00Z')], [a], TODAY, '2025-01-01', 6);
    expect(r.buckets.map((b) => b.count)).toEqual([0, 0, 0, 0, 2, 1]);
  });

  it('exercises: non-reversed sessions by date; deleted exercises dropped; months before tracking are “unavailable”, not zero', () => {
    const ex = { ...env, createdAt: '2026-04-20T10:00:00Z', id: 'e', childId: 'c', kind: 'exercise', deletedAt: null } as unknown as Exercise;
    const s = (id: string, date: string, reversedAt: string | null = null, customItemId = 'e'): ExerciseSession => ({ ...env, id, childId: 'c', customItemId, occurrenceDate: date, slotKey: `${date}#1`, method: 'simple', durationSeconds: null, reps: null, targetSnapshot: null, note: '', entry: 'manual', reversedAt });
    const r = exercisesChart([s('1', '2026-05-02'), s('2', '2026-05-03'), s('3', '2026-06-01', '2026-06-02'), s('4', '2026-06-03', null, 'deleted-exercise')], [ex], TODAY, '2025-01-01', 6);
    expect(r.buckets.map((b) => [b.month, b.count, b.unavailable])).toEqual([
      ['2026-01', 0, true], ['2026-02', 0, true], ['2026-03', 0, true], ['2026-04', 0, false], ['2026-05', 2, false], ['2026-06', 0, false],
    ]);
    // A backdated session before the exercise was created makes that month available.
    const r2 = exercisesChart([s('5', '2026-02-10')], [ex], TODAY, '2025-01-01', 6);
    expect(r2.buckets.find((b) => b.month === '2026-02')).toMatchObject({ count: 1, unavailable: false });
  });
});
