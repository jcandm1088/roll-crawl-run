/**
 * Age-responsive goal ideas (Checkpoint 2b-R, owner refinement R-010). Content and validation only.
 *
 * - Ideas are app-written wording, NOT CDC content and NOT CDC milestones. Each one is traced to the
 *   verified CDC milestones and/or recommended activities that support it (reviewable mapping in
 *   goal-ideas.app-2026.json and docs/reviews/CHECKPOINT_2B_R_GOAL_IDEAS.md). No other source is used.
 * - Six browsing ranges with unambiguous whole-month boundaries on the child's milestone age
 *   (chronological or corrected, as the parent chose): [0,6) [6,12) [12,24) [24,36) [36,48) [48,60].
 *   Older than 60 months uses the last range, with an explanation. Before the due date: no default.
 * - Ideas are possibilities: never assigned, never dated, always editable before saving.
 * - Safety: ideas supported by a safety-sensitive activity show that activity's safety sentences.
 */
import json from '../content/goal-ideas.app-2026.json';
import { APP_CATEGORIES, getMilestone, type AppCategory } from './milestones';
import { displayTextOf, GENDERED_WORDS } from './milestoneDisplay';
import { ACTIVITIES, getActivity, recordsOf, splitRecord, type Activity } from './activities';

export interface GoalIdea {
  id: string;
  title: string;
  appCategory: AppCategory;
  milestoneIds: string[];
  activityIds: string[];
}

export interface GoalIdeaRange {
  id: string;
  label: string;
  /** Inclusive lower bound, completed months. */
  fromMonths: number;
  /** Exclusive upper bound (inclusive for the last range). */
  toMonths: number;
  /** CDC reference ages whose records may support ideas in this range. */
  supportAges: number[];
  ideas: GoalIdea[];
}

export interface GoalIdeaContent { format: string; version: number; written: string; basis: string; ranges: GoalIdeaRange[] }

export const GOAL_IDEA_CONTENT = json as unknown as GoalIdeaContent;
export const GOAL_IDEA_RANGES: readonly GoalIdeaRange[] = GOAL_IDEA_CONTENT.ranges;
const ideaById = new Map(GOAL_IDEA_RANGES.flatMap((r) => r.ideas.map((i) => [i.id, i] as const)));
export const getGoalIdea = (id: string) => ideaById.get(id);
export const getIdeaRange = (id: string) => GOAL_IDEA_RANGES.find((r) => r.id === id);
export const LAST_IDEA_MONTHS = 60;

export type IdeaDefault =
  | { kind: 'range'; range: GoalIdeaRange; olderThanFive: boolean }
  /** Before the (corrected) due date: nothing is presented as being for this child. */
  | { kind: 'before-due-date' };

/** The range for a milestone age in completed months (null = before the due date). */
export function ideaRangeFor(milestoneAgeMonths: number | null): IdeaDefault {
  if (milestoneAgeMonths === null) return { kind: 'before-due-date' };
  const m = Math.max(0, Math.floor(milestoneAgeMonths));
  const last = GOAL_IDEA_RANGES[GOAL_IDEA_RANGES.length - 1]!;
  if (m > LAST_IDEA_MONTHS) return { kind: 'range', range: last, olderThanFive: true };
  const range = GOAL_IDEA_RANGES.find((r) => m >= r.fromMonths && (r === last ? m <= r.toMonths : m < r.toMonths)) ?? last;
  return { kind: 'range', range, olderThanFive: false };
}

/** Supporting activities that carry safety qualifications, with their safety sentences (CDC wording, gender-neutral). */
export function ideaSafety(idea: GoalIdea): Array<{ activity: Activity; sentences: string[] }> {
  return idea.activityIds
    .map((id) => getActivity(id))
    .filter((a): a is Activity => !!a && a.safetySensitive)
    .map((a) => ({ activity: a, sentences: [...new Set(recordsOf(a).flatMap((r) => splitRecord(r).safety))] }));
}

/** A short, parent-facing line naming what an idea relates to (one milestone or activity). */
export function ideaBasisLine(idea: GoalIdea): string {
  const m = idea.milestoneIds.map(getMilestone).find(Boolean);
  if (m) return `Related milestone: ${displayTextOf(m)}`;
  const a = idea.activityIds.map(getActivity).find(Boolean);
  return a ? `Related activity: ${a.title}` : '';
}

// ---------------------------------------------------------------------------
// Validation (build time and unit tests)
// ---------------------------------------------------------------------------

/** Words that would turn an idea into a schedule, a deadline or an expectation. */
const PRESCRIPTIVE = /\b(every day|daily|each day|times a|minutes?|hours?|weeks?|by \d|must|should|need to|on time|deadline)\b/i;

export function validateGoalIdeas(content: GoalIdeaContent = GOAL_IDEA_CONTENT): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const areas = new Set(APP_CATEGORIES.map((c) => c.id));
  const milestoneTexts = new Set<string>();
  for (const r of content.ranges) for (const i of r.ideas) for (const mid of i.milestoneIds) { const m = getMilestone(mid); if (m) milestoneTexts.add(displayTextOf(m).toLowerCase()); }
  const activityTitles = new Set(ACTIVITIES.map((a) => a.title.toLowerCase()));
  const expected: Array<[number, number]> = [[0, 6], [6, 12], [12, 24], [24, 36], [36, 48], [48, 60]];
  if (content.ranges.length !== expected.length) errors.push('there must be exactly six ranges');
  content.ranges.forEach((r, n) => {
    const [from, to] = expected[n] ?? [NaN, NaN];
    if (r.fromMonths !== from || r.toMonths !== to) errors.push(`${r.id}: boundaries must be ${from}–${to} months`);
    if (r.ideas.length < 8 || r.ideas.length > 12) errors.push(`${r.id}: ${r.ideas.length} ideas (8–12 expected)`);
    for (const a of r.supportAges) if (a < r.fromMonths || a > r.toMonths) errors.push(`${r.id}: support age ${a} outside the range`);
    for (const i of r.ideas) {
      if (ids.has(i.id)) errors.push(`${i.id}: duplicate id`);
      ids.add(i.id);
      if (!new RegExp(`^gi-${r.id}-\\d\\d$`).test(i.id)) errors.push(`${i.id}: malformed id`);
      const t = i.title.trim();
      if (!t || t !== i.title || t.length > 80) errors.push(`${i.id}: title must be 1–80 characters with no outer spaces`);
      if (GENDERED_WORDS.test(t) || /\bhis or her\b/i.test(t)) errors.push(`${i.id}: gendered wording`);
      if (/\bCDC\b/.test(t)) errors.push(`${i.id}: an app-written idea must not name CDC`);
      if (PRESCRIPTIVE.test(t)) errors.push(`${i.id}: prescriptive or time-bound wording`);
      if (milestoneTexts.has(t.toLowerCase()) || activityTitles.has(t.toLowerCase())) errors.push(`${i.id}: duplicates a milestone or activity title`);
      if (!areas.has(i.appCategory)) errors.push(`${i.id}: unknown area`);
      if (i.milestoneIds.length + i.activityIds.length === 0) errors.push(`${i.id}: no supporting records`);
      const supportAreas = new Set<string>();
      for (const mid of i.milestoneIds) {
        const m = getMilestone(mid);
        if (!m) { errors.push(`${i.id}: unknown milestone ${mid}`); continue; }
        if (!r.supportAges.includes(m.referenceAgeMonths)) errors.push(`${i.id}: milestone ${mid} is for another age`);
        supportAreas.add(m.appCategory);
      }
      for (const aid of i.activityIds) {
        const a = getActivity(aid);
        if (!a) { errors.push(`${i.id}: unknown activity ${aid}`); continue; }
        if (!recordsOf(a).some((x) => r.supportAges.includes(x.referenceAgeMonths))) errors.push(`${i.id}: activity ${aid} is for another age`);
        supportAreas.add(a.appCategory);
      }
      if (supportAreas.size && !supportAreas.has(i.appCategory)) errors.push(`${i.id}: area doesn't match any supporting record`);
    }
  });
  return errors;
}
