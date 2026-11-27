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
  /** Information isn't available for this month (e.g. before exercises were tracked); not the same as 0. */
  unavailable: boolean;
}

export interface ChartResult {
  buckets: MonthBucket[];
  /** Entries that can't be placed honestly, reported next to the chart. */
  excludedHidden: number;
  undated: number;
  laterDated: number;
}

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The last `period` calendar months ending with today's month, never before the birth month. */
export function chartMonths(today: LocalDate, dob: LocalDate, period: ChartPeriod): string[] {
  const t = parseLocalDate(today)!;
  const b = parseLocalDate(dob)!;
  const out: string[] = [];
  for (let i = period - 1; i >= 0; i--) {
    const z = t.year * 12 + (t.month - 1) - i;
    if (z < b.year * 12 + (b.month - 1)) continue;
    out.push(`${Math.floor(z / 12)}-${String((z % 12) + 1).padStart(2, '0')}`);
  }
  return out;
}

function bucketsFor(months: string[], dates: string[], today: LocalDate, unavailableBefore: string | null): MonthBucket[] {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(monthOf(d), (counts.get(monthOf(d)) ?? 0) + 1);
  return months.map((m) => {
    const [y, mo] = m.split('-').map(Number) as [number, number];
    const unavailable = unavailableBefore !== null && m < unavailableBefore;
    return { month: m, label: SHORT[mo - 1]!, longLabel: `${LONG[mo - 1]} ${y}`, count: unavailable ? 0 : counts.get(m) ?? 0, current: m === monthOf(today), unavailable };
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
  const months = chartMonths(today, dob, period);
  const achieved = records.filter((r) => r.deletedAt === null && r.milestoneDefId && getMilestone(r.milestoneDefId) && r.status === 'achieved');
  const visible = achieved.filter((r) => !r.hidden);
  const s = split(visible.map((r) => r.achievedDate), today);
  const inRange = new Set(months);
  return {
    buckets: bucketsFor(months, s.ok, today, null),
    excludedHidden: achieved.filter((r) => r.hidden && r.achievedDate && inRange.has(monthOf(r.achievedDate))).length,
    undated: s.undated,
    laterDated: s.laterDated,
  };
}

export function goalsChart(goals: readonly PersonalGoal[], achievements: readonly Achievement[], today: LocalDate, dob: LocalDate, period: ChartPeriod): ChartResult {
  const months = chartMonths(today, dob, period);
  const s = split(accomplishmentsOf(goals, achievements).map((a) => a.date), today);
  return { buckets: bucketsFor(months, s.ok, today, null), excludedHidden: 0, undated: s.undated, laterDated: s.laterDated };
}

/**
 * Recorded sessions by month. Months before the first exercise was added on this device are marked
 * unavailable, unless sessions were recorded (backdated) for them.
 */
export function exercisesChart(sessions: readonly ExerciseSession[], exercises: readonly Exercise[], today: LocalDate, dob: LocalDate, period: ChartPeriod): ChartResult {
  const months = chartMonths(today, dob, period);
  const live = countingSessions(sessions, exercises);
  const s = split(live.map((x) => x.occurrenceDate), today);
  const firstCreated = exercises.map((e) => e.createdAt.slice(0, 7)).sort()[0] ?? null;
  const firstSession = s.ok.map(monthOf).sort()[0] ?? null;
  const tracked = [firstCreated, firstSession].filter((x): x is string => !!x).sort()[0] ?? monthOf(today);
  return { buckets: bucketsFor(months, s.ok, today, tracked), excludedHidden: 0, undated: s.undated, laterDated: s.laterDated };
}
