/**
 * Personal Progress counts and Progress-over-time charts (Checkpoint 2b). Pure functions.
 *
 * Definitions (owner-approved; D5, D6, D7, D14):
 * - Personal accomplishments = accomplished goals + standalone achievements; each record once (a goal
 *   never creates an achievement record). Archived ones are included; deleted ones no longer exist.
 * - Active goals = goals working toward, not archived.
 * - Exercise sessions this month = non-reversed sessions dated in the current local calendar month,
 *   scheduled and additional alike, from exercises that still exist (archived included).
 * - Charts count CURRENT records by their current dates: corrections move an entry to its new month;
 *   reversals, reopenings and deletions remove it. Hidden milestones are excluded (with a count).
 * - R-017 (owner refinement, Checkpoint 2b-R): a period always shows exactly 6 or 12 calendar months
 *   ending with the current month. Months before the birth month are “before birth” (not applicable,
 *   never a zero). For exercises, months before tracking began are “not tracked”, but a month with a
 *   recorded session is always counted, even when the session was backdated before the exercise existed.
 * Personal goals and exercises never contribute to milestone progress (separate data, separate code).
 */
import type { Achievement, Exercise, ExerciseSession, MilestoneRecord, PersonalGoal } from '../types';
import { compareDates, parseLocalDate, type LocalDate } from './dates';
import { getMilestone } from './milestones';

export interface Accomplishment {
  kind: 'goal' | 'achievement';
  id: string;
  title: string;
  date: string;
  archived: boolean;
}

export function accomplishmentsOf(goals: readonly PersonalGoal[], achievements: readonly Achievement[]): Accomplishment[] {
  const out: Accomplishment[] = [];
  for (const g of goals) if (g.deletedAt === null && g.status === 'accomplished' && g.accomplishedDate) out.push({ kind: 'goal', id: g.id, title: g.title, date: g.accomplishedDate, archived: !!g.archivedAt });
  for (const a of achievements) if (a.deletedAt === null) out.push({ kind: 'achievement', id: a.id, title: a.title, date: a.achievedDate, archived: !!a.archivedAt });
  return out.sort((a, b) => compareDates(b.date, a.date) || a.title.localeCompare(b.title));
}

export const activeGoalsOf = (goals: readonly PersonalGoal[]) => goals.filter((g) => g.deletedAt === null && g.status === 'active' && !g.archivedAt);

const monthOf = (d: LocalDate) => d.slice(0, 7);

export function countingSessions(sessions: readonly ExerciseSession[], exercises: readonly Exercise[]): ExerciseSession[] {
  const live = new Set(exercises.filter((e) => e.deletedAt === null).map((e) => e.id));
  return sessions.filter((s) => s.deletedAt === null && s.reversedAt === null && live.has(s.customItemId));
}

export function personalSummary(data: { goals: readonly PersonalGoal[]; achievements: readonly Achievement[]; exercises: readonly Exercise[]; sessions: readonly ExerciseSession[] }, today: LocalDate) {
  const month = monthOf(today);
  return {
    accomplishments: accomplishmentsOf(data.goals, data.achievements).length,
    activeGoals: activeGoalsOf(data.goals).length,
    sessionsThisMonth: countingSessions(data.sessions, data.exercises).filter((s) => monthOf(s.occurrenceDate) === month).length,
  };
}

// ---------------------------------------------------------------------------
// Monthly charts
// ---------------------------------------------------------------------------

export type ChartPeriod = 6 | 12;
export type ChartView = 'milestones' | 'goals' | 'exercises';

export interface MonthBucket {
  /** "YYYY-MM" */
  month: string;
  label: string;
  /** Full month name and year, for the text table. */
  longLabel: string;
  count: number;
  /** True for the current month (counted so far). */
  current: boolean;
  /** Information isn't available for this month (before birth or not tracked yet); not the same as 0. */
  unavailable: boolean;
  /** Why a month is unavailable: 'before-birth' (not applicable) or 'not-tracked'; 'counted' otherwise. */
  status: MonthStatus;
}

export type MonthStatus = 'counted' | 'before-birth' | 'not-tracked';

export interface ChartResult {
  buckets: MonthBucket[];
  /** Entries that can't be placed honestly, reported next to the chart. */
  excludedHidden: number;
  undated: number;
  laterDated: number;
}

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Exactly `period` calendar months ending with today's month (R-017: months before birth included, marked by the caller). */
export function chartMonths(today: LocalDate, period: ChartPeriod): string[] {
  const t = parseLocalDate(today)!;
  const out: string[] = [];
  for (let i = period - 1; i >= 0; i--) {
    const z = t.year * 12 + (t.month - 1) - i;
    out.push(`${Math.floor(z / 12)}-${String((z % 12) + 1).padStart(2, '0')}`);
  }
  return out;
}

/**
 * Buckets for the period. Before the birth month: 'before-birth'. Before `trackedFrom` (exercises only)
 * and with nothing recorded: 'not-tracked'. A month with recorded entries is always counted.
 */
function bucketsFor(months: string[], dates: string[], today: LocalDate, dob: LocalDate, trackedFrom: string | null): MonthBucket[] {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(monthOf(d), (counts.get(monthOf(d)) ?? 0) + 1);
  const birthMonth = monthOf(dob);
  return months.map((m) => {
    const [y, mo] = m.split('-').map(Number) as [number, number];
    const n = counts.get(m) ?? 0;
    const status: MonthStatus = m < birthMonth ? 'before-birth' : n === 0 && trackedFrom !== null && m < trackedFrom ? 'not-tracked' : 'counted';
    return { month: m, label: SHORT[mo - 1]!, longLabel: `${LONG[mo - 1]} ${y}`, count: status === 'counted' ? n : 0, current: m === monthOf(today), unavailable: status !== 'counted', status };
  });
}

function split(dates: Array<string | null>, today: LocalDate) {
  let undated = 0;
  let laterDated = 0;
  const ok: string[] = [];
  for (const d of dates) {
    if (!d || !parseLocalDate(d)) undated++;
    else if (compareDates(d, today) > 0) laterDated++;
    else ok.push(d);
  }
  return { ok, undated, laterDated };
}

/** CDC milestones whose CURRENT record is Achieved, by achievement date. Hidden ones are excluded and counted. */
export function milestoneChart(records: readonly MilestoneRecord[], today: LocalDate, dob: LocalDate, period: ChartPeriod): ChartResult {
  const months = chartMonths(today, period);
  const achieved = records.filter((r) => r.deletedAt === null && r.milestoneDefId && getMilestone(r.milestoneDefId) && r.status === 'achieved');
  const visible = achieved.filter((r) => !r.hidden);
  const s = split(visible.map((r) => r.achievedDate), today);
  const inRange = new Set(months);
  return {
    buckets: bucketsFor(months, s.ok, today, dob, null),
    excludedHidden: achieved.filter((r) => r.hidden && r.achievedDate && inRange.has(monthOf(r.achievedDate))).length,
    undated: s.undated,
    laterDated: s.laterDated,
  };
}

export function goalsChart(goals: readonly PersonalGoal[], achievements: readonly Achievement[], today: LocalDate, dob: LocalDate, period: ChartPeriod): ChartResult {
  const months = chartMonths(today, period);
  const s = split(accomplishmentsOf(goals, achievements).map((a) => a.date), today);
  return { buckets: bucketsFor(months, s.ok, today, dob, null), excludedHidden: 0, undated: s.undated, laterDated: s.laterDated };
}

/**
 * Recorded sessions by month. Months before tracking began (the first exercise added on this device, or
 * an earlier backdated session) are “not tracked”, but any month with a recorded session is counted.
 */
export function exercisesChart(sessions: readonly ExerciseSession[], exercises: readonly Exercise[], today: LocalDate, dob: LocalDate, period: ChartPeriod): ChartResult {
  const months = chartMonths(today, period);
  const live = countingSessions(sessions, exercises);
  const s = split(live.map((x) => x.occurrenceDate), today);
  const firstCreated = exercises.map((e) => e.createdAt.slice(0, 7)).sort()[0] ?? null;
  const firstSession = s.ok.map(monthOf).sort()[0] ?? null;
  const tracked = [firstCreated, firstSession].filter((x): x is string => !!x).sort()[0] ?? monthOf(today);
  return { buckets: bucketsFor(months, s.ok, today, dob, tracked), excludedHidden: 0, undated: s.undated, laterDated: s.laterDated };
}
