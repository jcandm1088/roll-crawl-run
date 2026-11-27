/**
 * R-010 (Checkpoint 2b-R): age-responsive goal ideas. Content validation, age boundaries, corrected age,
 * newborns, before the due date and older children. FICTIONAL children only.
 */
import { describe, expect, it } from 'vitest';
import { GOAL_IDEA_CONTENT, GOAL_IDEA_RANGES, getGoalIdea, ideaBasisLine, ideaRangeFor, ideaSafety, validateGoalIdeas, type GoalIdeaContent } from '../../src/domain/goalIdeas';
import { getMilestone } from '../../src/domain/milestones';
import { getActivity, recordsOf, splitRecord } from '../../src/domain/activities';
import { milestoneAgeFor } from '../../src/state/milestones';
import { SAMPLE_CHILD_A } from '../fixtures/children';
import type { Child } from '../../src/types';

const rangeOf = (m: number | null) => { const d = ideaRangeFor(m); return d.kind === 'range' ? d.range.id : d.kind; };
const clone = (): GoalIdeaContent => JSON.parse(JSON.stringify(GOAL_IDEA_CONTENT));

describe('R-010 goal idea content', () => {
  it('passes validation (also run at build time)', () => {
    expect(validateGoalIdeas()).toEqual([]);
  });

  it('has six ranges with 8–12 ideas each, unique ids, and variety across the five areas', () => {
    expect(GOAL_IDEA_RANGES.map((r) => r.label)).toEqual([
      'Birth to under 6 months', '6 to under 12 months', '12 to under 24 months', '24 to under 36 months', '36 to under 48 months', '48 to 60 months',
    ]);
    const ids = GOAL_IDEA_RANGES.flatMap((r) => r.ideas.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of GOAL_IDEA_RANGES) {
      expect(r.ideas.length).toBeGreaterThanOrEqual(8);
      expect(r.ideas.length).toBeLessThanOrEqual(12);
      expect(new Set(r.ideas.map((i) => i.appCategory)).size).toBe(5);
    }
  });

  it('every idea is traced to verified milestones or activities for its own age range', () => {
    for (const r of GOAL_IDEA_RANGES) {
      for (const i of r.ideas) {
        expect(i.milestoneIds.length + i.activityIds.length).toBeGreaterThan(0);
        for (const m of i.milestoneIds) expect(r.supportAges).toContain(getMilestone(m)!.referenceAgeMonths);
        for (const a of i.activityIds) expect(recordsOf(getActivity(a)!).some((x) => r.supportAges.includes(x.referenceAgeMonths))).toBe(true);
        expect(ideaBasisLine(i)).toMatch(/^Related (milestone|activity): /);
      }
    }
  });

  it('young babies get ideas for young babies (the 4-month-old test case), not ideas for older children', () => {
    const first = GOAL_IDEA_RANGES[0]!;
    const titles = first.ideas.map((i) => i.title).join(' | ');
    expect(titles).toMatch(/tummy time/i);
    expect(titles).not.toMatch(/library|art activity|other children|outdoor game|kindergarten/i);
    // None of the original generic examples remains.
    for (const old of ['Read a book together every day', 'Play outside together', 'Learn a new song', 'Try a new art activity', 'Visit the library', 'Play with other children', 'Practice a new word or sign', 'Try a new outdoor game']) {
      expect(GOAL_IDEA_RANGES.flatMap((r) => r.ideas).some((i) => i.title === old)).toBe(false);
    }
  });

  it('ideas are possibilities: no schedule, deadline or expectation wording, no CDC naming, gender-neutral', () => {
    for (const i of GOAL_IDEA_RANGES.flatMap((r) => r.ideas)) {
      expect(i.title).not.toMatch(/\b(every day|daily|must|should|deadline|by \d|CDC)\b/i);
      expect(i.title).not.toMatch(/\b(he|she|his|her|him|boy|girl)\b/i);
    }
  });

  it('safety qualifications from supporting activities are carried with the idea', () => {
    const tummy = getGoalIdea('gi-r0-6-01')!;
    const s = ideaSafety(tummy);
    expect(s.map((x) => x.activity.id)).toContain('cdc22-act-a004');
    expect(s.flatMap((x) => x.sentences).join(' ')).toContain('Do not leave your baby alone');
    // Every safety-sensitive supporting activity is surfaced, with its exact safety sentences.
    for (const i of GOAL_IDEA_RANGES.flatMap((r) => r.ideas)) {
      for (const aid of i.activityIds) {
        const a = getActivity(aid)!;
        if (!a.safetySensitive) continue;
        const shown = ideaSafety(i).find((x) => x.activity.id === aid)!;
        expect(shown).toBeDefined();
        for (const r of recordsOf(a)) for (const sentence of splitRecord(r).safety) expect(shown.sentences).toContain(sentence);
      }
    }
  });

  it('validation detects an unsupported, mis-aged, gendered, prescriptive or duplicated idea', () => {
    const c1 = clone(); c1.ranges[0]!.ideas[0]!.milestoneIds = ['cdc22-m60-mp-02']; // a 5-year milestone in the baby range
    expect(validateGoalIdeas(c1).join()).toMatch(/for another age/);
    const c2 = clone(); c2.ranges[0]!.ideas[0]!.title = 'Help her roll over';
    expect(validateGoalIdeas(c2).join()).toMatch(/gendered/);
    const c3 = clone(); c3.ranges[0]!.ideas[0]!.title = 'Tummy time every day';
    expect(validateGoalIdeas(c3).join()).toMatch(/prescriptive/);
    const c4 = clone(); c4.ranges[0]!.ideas[0]!.title = 'Holds head up when on tummy';
    expect(validateGoalIdeas(c4).join()).toMatch(/duplicates/);
    const c5 = clone(); c5.ranges[0]!.ideas[0]!.milestoneIds = []; c5.ranges[0]!.ideas[0]!.activityIds = [];
    expect(validateGoalIdeas(c5).join()).toMatch(/no supporting records/);
    const c6 = clone(); c6.ranges[0]!.ideas[0]!.activityIds = ['cdc22-act-a999'];
    expect(validateGoalIdeas(c6).join()).toMatch(/unknown activity/);
    const c7 = clone(); c7.ranges[1]!.fromMonths = 7;
    expect(validateGoalIdeas(c7).join()).toMatch(/boundaries/);
  });
});

describe('R-010 age ranges', () => {
  it('uses unambiguous whole-month boundaries', () => {
    expect([0, 1, 5].map(rangeOf)).toEqual(['r0-6', 'r0-6', 'r0-6']);
    expect([6, 11].map(rangeOf)).toEqual(['r6-12', 'r6-12']);
    expect([12, 23].map(rangeOf)).toEqual(['r12-24', 'r12-24']);
    expect([24, 35].map(rangeOf)).toEqual(['r24-36', 'r24-36']);
    expect([36, 47].map(rangeOf)).toEqual(['r36-48', 'r36-48']);
    expect([48, 59, 60].map(rangeOf)).toEqual(['r48-60', 'r48-60', 'r48-60']);
  });

  it('newborns use the first range; before the due date nothing is chosen; older than five uses the last range and says so', () => {
    expect(rangeOf(0)).toBe('r0-6');
    expect(ideaRangeFor(null)).toEqual({ kind: 'before-due-date' });
    const older = ideaRangeFor(61);
    expect(older.kind === 'range' && older.range.id === 'r48-60' && older.olderThanFive).toBe(true);
    const sixty = ideaRangeFor(60);
    expect(sixty.kind === 'range' && !sixty.olderThanFive).toBe(true);
  });

  it('follows the age the parent chose for milestones (corrected age when chosen)', () => {
    const child = (over: Partial<Child>): Child => ({ ...(SAMPLE_CHILD_A as unknown as Child), id: 'c', createdAt: '', updatedAt: '', deletedAt: null, rev: 1, originDeviceId: 'd', lastModifiedBy: 'd', photoId: null, color: 'clay', about: null, ...over });
    const today = '2026-11-27';
    const born = child({ dob: '2026-05-20', correctedAge: { enabled: true, inputMethod: 'dueDate', dueDate: '2026-07-25', gestationalWeeks: null, gestationalDays: null }, ageBasis: 'chronological' });
    expect(rangeOf(milestoneAgeFor(born, today).months)).toBe('r6-12'); // 6 months chronological
    expect(rangeOf(milestoneAgeFor({ ...born, ageBasis: 'corrected' }, today).months)).toBe('r0-6'); // 4 months corrected
    const early = child({ dob: '2026-11-01', correctedAge: { enabled: true, inputMethod: 'dueDate', dueDate: '2026-12-20', gestationalWeeks: null, gestationalDays: null }, ageBasis: 'corrected' });
    expect(milestoneAgeFor(early, today).months).toBeNull();
    expect(rangeOf(milestoneAgeFor(early, today).months)).toBe('before-due-date');
  });
});
