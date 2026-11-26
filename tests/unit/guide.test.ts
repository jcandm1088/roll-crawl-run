/**
 * Growth UX refinement (Checkpoint 2a): the read-only guide, Library selection, by-age progress and
 * recording confirmations. Pure functions only; fictional data.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GUIDE, allGuideText, guideFor, validateGuide, type GuideContent } from '../../src/domain/guide';
import { DEFAULT_FILTERS, matchesElsewhere, selectSourced, sortForView, viewCounts } from '../../src/domain/library';
import { confirmationFor, type ConfirmationContext } from '../../src/domain/confirmations';
import { APP_CATEGORIES, MILESTONES, REFERENCE_AGES, currentProgress, getMilestone, progressByReferenceAge, type RecordState } from '../../src/domain/milestones';
import { INTERVALS } from '../../src/domain/intervals';

const recMap = (entries: Array<[string, Partial<RecordState>]>) => new Map(entries.map(([k, v]) => [k, { status: 'not-yet', hidden: false, ...v } as RecordState]));
const clone = (): GuideContent => JSON.parse(JSON.stringify(GUIDE));

describe('guide content validation (traceability)', () => {
  it('the approved guide content is valid', () => {
    expect(validateGuide()).toEqual([]);
  });

  it('has 11 overviews, 5 area explanations and 9 empty-range mappings', () => {
    expect(GUIDE.overviews).toHaveLength(11);
    expect(GUIDE.areas.map((a) => a.category).sort()).toEqual(APP_CATEGORIES.map((c) => c.id).sort());
    expect(GUIDE.emptyRanges.map((e) => e.intervalIndex)).toEqual([6, 8, 10, 12, 13, 14, 16, 17, 18]);
  });

  it('every overview basis milestone exists, belongs to that CDC age, and is cited once', () => {
    const cited = GUIDE.overviews.flatMap((o) => o.basis);
    expect(new Set(cited).size).toBe(cited.length);
    for (const o of GUIDE.overviews) for (const id of o.basis) expect(o.referenceAges).toContain(getMilestone(id)!.referenceAgeMonths);
  });

  it('catches each kind of content error', () => {
    const cases: Array<[string, (c: GuideContent) => void, RegExp]> = [
      ['unknown milestone', (c) => { c.overviews[0]!.basis.push('cdc22-m02-xx-99'); }, /unknown milestone/],
      ['wrong age', (c) => { c.overviews[0]!.basis.push('cdc22-m04-se-02'); }, /is not a 2-month milestone/],
      ['duplicate citation', (c) => { c.overviews[1]!.basis.push('cdc22-m02-se-01'); }, /cited more than once|is not a/],
      ['missing area', (c) => { c.overviews[0]!.basis = c.overviews[0]!.basis.filter((id) => !id.includes('-mp-')); }, /no example from/],
      ['missing overview', (c) => { c.overviews.pop(); }, /overviews: expected ranges/],
      ['wrong ages for range', (c) => { c.overviews[1]!.referenceAges = [4]; }, /reference ages/],
      ['invented quote', (c) => { c.overviews[2]!.text += ' “says ten words”'; }, /not exact CDC wording/],
      ['bad neighbour', (c) => { c.emptyRanges[0]!.nextReferenceAge = 30; }, /emptyRange 6/],
      ['missing empty range', (c) => { c.emptyRanges.pop(); }, /emptyRanges: expected/],
      ['unknown source', (c) => { c.shared.about.sources.push('aap-anything'); }, /unknown source/],
      ['area basis in wrong category', (c) => { c.areas[0]!.basis.push('cdc22-m02-se-01'); }, /belongs to/],
      ['grading word', (c) => { c.overviews[3]!.text += ' Children should do this.'; }, /forbidden wording/],
      ['development terms', (c) => { c.shared.lastAge += ' (Checkpoint 2b)'; }, /development terminology/],
    ];
    for (const [name, mutate, re] of cases) {
      const c = clone();
      mutate(c);
      expect(validateGuide(c).join('\n'), name).toMatch(re);
    }
  });

  it('uses only approved sources (no AAP, HealthyChildren or Pathways)', () => {
    const raw = readFileSync(new URL('../../src/content/guide.cdc-2022.json', import.meta.url), 'utf8');
    expect(raw).not.toMatch(/aap|healthychildren|pathways/i);
    expect(allGuideText().join(' ')).not.toMatch(/checkpoint|phase \d/i);
  });
});

describe('guideFor (record-independent educational ranges)', () => {
  it('covers all 20 viewing ranges', () => {
    for (const iv of INTERVALS) expect(() => guideFor(iv.index)).not.toThrow();
    expect(INTERVALS.filter((iv) => guideFor(iv.index).kind === 'empty')).toHaveLength(9);
  });

  it('shows every one of the 159 CDC milestones exactly once across the guide, verbatim', () => {
    const shown: string[] = [];
    for (const iv of INTERVALS) {
      const g = guideFor(iv.index);
      if (g.kind === 'populated') for (const grp of g.groups) for (const a of grp.areas) for (const d of a.milestones) {
        expect(d.text).toBe(getMilestone(d.id)!.text);
        shown.push(d.id);
      }
    }
    expect(shown).toHaveLength(159);
    expect(new Set(shown).size).toBe(159);
  });

  it('empty ranges carry no milestones and name the real neighbouring CDC ages', () => {
    const g = guideFor(6); // 18–21 months
    expect(g.kind).toBe('empty');
    if (g.kind !== 'empty') return;
    expect([g.previous.referenceAgeMonths, g.next.referenceAgeMonths]).toEqual([18, 24]);
    expect([g.previous.interval.label, g.next.interval.label]).toEqual(['15–18 months', '21–24 months']);
    const g2 = guideFor(13); // 39–42
    if (g2.kind === 'empty') expect([g2.previous.referenceAgeMonths, g2.next.referenceAgeMonths]).toEqual([36, 48]);
  });

  it('3–6 months has two CDC ages; area explanations appear once per range', () => {
    const g = guideFor(1);
    if (g.kind !== 'populated') throw new Error('expected populated');
    expect(g.referenceAges).toEqual([4, 6]);
    expect(g.groups[0]!.areas.every((a) => a.explanation)).toBe(true);
    expect(g.groups[1]!.areas.every((a) => a.explanation === null)).toBe(true);
    expect(g.groups[1]!.areas.find((a) => a.category === 'fine-motor')!.milestones).toHaveLength(0); // CDC 6 months: none in this group
  });

  it('the last range says it is the last CDC age; others point to the next CDC age', () => {
    const last = guideFor(19);
    expect(last.kind === 'populated' && last.isLast && last.next === null).toBe(true);
    const first = guideFor(0);
    expect(first.kind === 'populated' && first.next?.referenceAgeMonths).toBe(4);
  });

  it('takes no records: the output is identical regardless of any application state', () => {
    expect(guideFor.length).toBe(1);
    expect(JSON.stringify(guideFor(5))).toBe(JSON.stringify(guideFor(5)));
  });

  it('the guide screen imports no repository, transaction, write function or record hook', () => {
    const src = readFileSync(new URL('../../src/ui/screens/growth/Growth.tsx', import.meta.url), 'utf8');
    const expect_ = src.slice(src.indexOf('// What to Expect at Every Age'));
    expect(expect_).not.toMatch(/useChildMilestones|sourcedStates|recordFor|setStatus|setHidden|StatusBadge|growthMilestone|growthLibrary/);
    expect(expect_).toMatch(/useMilestoneAge/);
    const imports = src.slice(0, src.indexOf('// ---'));
    expect(imports).not.toMatch(/data\/repositories|transactions|data\/db/);
  });
});

describe('Library selection', () => {
  it('Up to now = applicable visible milestones, most recent CDC age first', () => {
    const list = selectSourced(DEFAULT_FILTERS, 15, new Map());
    expect(list).toHaveLength(MILESTONES.filter((m) => m.referenceAgeMonths <= 15).length);
    expect(list.length).toBe(currentProgress(15, new Map()).overall.applicable);
    expect(list[0]!.referenceAgeMonths).toBe(15);
    expect(list[list.length - 1]!.referenceAgeMonths).toBe(2);
  });

  it('Upcoming = not yet applicable, nearest CDC age first; All = youngest first', () => {
    const up = selectSourced({ ...DEFAULT_FILTERS, view: 'upcoming' }, 15, new Map());
    expect(up[0]!.referenceAgeMonths).toBe(18);
    const ages = up.map((d) => d.referenceAgeMonths);
    expect(ages).toEqual([...ages].sort((a, b) => a - b));
    const all = selectSourced({ ...DEFAULT_FILTERS, view: 'all' }, 15, new Map());
    expect(all).toHaveLength(159);
    expect(all[0]!.referenceAgeMonths).toBe(2);
    expect(all[158]!.referenceAgeMonths).toBe(60);
  });

  it('within a CDC age: app areas in established order, then CDC order', () => {
    const order = APP_CATEGORIES.map((c) => c.id);
    const at4 = sortForView(MILESTONES.filter((m) => m.referenceAgeMonths === 4), 'all');
    const ranks = at4.map((d) => order.indexOf(d.appCategory));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    const gross = at4.filter((d) => d.appCategory === 'gross-motor').map((d) => d.order);
    expect(gross).toEqual([...gross].sort((a, b) => a - b));
  });

  it('hidden milestones leave the views and the catalog label counts them separately', () => {
    const records = recMap([['cdc22-m02-se-01', { hidden: true }], ['cdc22-m60-cg-01', { hidden: true }]]);
    const c = viewCounts(15, records);
    expect(c).toEqual({ catalog: 159, visible: 157, hidden: 2, now: 71, upcoming: 86 }); // 72 apply at 15 months, one of them hidden
    expect(selectSourced({ ...DEFAULT_FILTERS, showHidden: true, view: 'all' }, 15, records).map((d) => d.id).sort()).toEqual(['cdc22-m02-se-01', 'cdc22-m60-cg-01']);
  });

  it('newborn, before the due date, and over five', () => {
    expect(selectSourced(DEFAULT_FILTERS, 0, new Map())).toHaveLength(0);
    expect(selectSourced(DEFAULT_FILTERS, null, new Map())).toHaveLength(0);
    expect(selectSourced(DEFAULT_FILTERS, 61, new Map())).toHaveLength(159);
  });

  it('search, area, age and status filters combine; matches in other views are reported', () => {
    const records = recMap([['cdc22-m12-mp-03', { status: 'achieved' }]]);
    expect(selectSourced({ ...DEFAULT_FILTERS, query: 'cup' }, 15, records).map((d) => d.id)).toEqual(['cdc22-m15-cg-01', 'cdc22-m12-mp-03', 'cdc22-m12-cg-01']); // 15 months first; at 1 year fine motor before cognitive
    expect(selectSourced({ ...DEFAULT_FILTERS, query: 'cup', status: 'achieved' }, 15, records).map((d) => d.id)).toEqual(['cdc22-m12-mp-03']);
    expect(selectSourced({ ...DEFAULT_FILTERS, area: 'fine-motor', age: 12 }, 15, records)).toHaveLength(2);
    const f = { ...DEFAULT_FILTERS, query: 'hops on one foot' };
    expect(selectSourced(f, 15, records)).toHaveLength(0);
    expect(matchesElsewhere(f, 15, records)).toEqual({ now: 0, upcoming: 1, all: 1 });
  });
});

describe('progress by CDC reference age', () => {
  it('includes applicable ages only, and totals equal current progress', () => {
    const records = recMap([['cdc22-m02-se-01', { status: 'achieved' }], ['cdc22-m04-se-01', { hidden: true }], ['cdc22-m18-se-01', { status: 'achieved' }]]);
    const rows = progressByReferenceAge(15, records);
    expect(rows.map((r) => r.referenceAgeMonths)).toEqual([2, 4, 6, 9, 12, 15]);
    const sum = rows.reduce((a, r) => ({ achieved: a.achieved + r.progress.achieved, applicable: a.applicable + r.progress.applicable }), { achieved: 0, applicable: 0 });
    const overall = currentProgress(15, records).overall;
    expect(sum).toEqual({ achieved: overall.achieved, applicable: overall.applicable });
    expect(sum.achieved).toBe(1); // the 18-month achievement is early: not counted
    expect(progressByReferenceAge(null, records)).toEqual([]);
    expect(progressByReferenceAge(61, records).map((r) => r.referenceAgeMonths)).toEqual([...REFERENCE_AGES]);
  });
});

describe('recording confirmations describe the actual effect', () => {
  const base: ConfirmationContext = { personal: false, applicable: true, hidden: false, status: 'achieved', childName: 'Sam', basis: 'chronological', ageWords: '2 years' };
  const msg = (a: Parameters<typeof confirmationFor>[0], c: Partial<ConfirmationContext> = {}) => confirmationFor(a, { ...base, ...c }).text;

  it('new achievement: applicable, early (conditional, basis named), hidden', () => {
    expect(msg({ kind: 'status', from: 'not-yet', to: 'achieved' })).toBe('Saved as Achieved. It now counts in Sam’s progress.');
    const early = msg({ kind: 'status', from: 'emerging', to: 'achieved' }, { applicable: false, basis: 'corrected' });
    expect(early).toContain('once Sam’s corrected age reaches 2 years');
    expect(early).toContain('as long as it’s still marked Achieved and isn’t hidden');
    expect(early).not.toMatch(/reaches by/);
    expect(msg({ kind: 'status', from: 'not-yet', to: 'achieved' }, { hidden: true })).toMatch(/Hidden milestones aren’t counted/);
  });

  it('edits to an existing achievement never claim a new achievement', () => {
    for (const a of [{ kind: 'date-corrected' }, { kind: 'note' }, { kind: 'observation-added' }] as const) {
      const t = msg(a);
      expect(t).not.toMatch(/now counts|Saved as Achieved/);
    }
    expect(msg({ kind: 'date-corrected' })).toMatch(/doesn’t add another achievement/);
    expect(msg({ kind: 'note' })).toBe('Note saved.');
  });

  it('emerging never claims to appear in current progress when upcoming or hidden', () => {
    expect(msg({ kind: 'status', from: 'not-yet', to: 'emerging' }, { status: 'emerging' })).toMatch(/Progress shows it as emerging/);
    expect(msg({ kind: 'status', from: 'not-yet', to: 'emerging' }, { status: 'emerging', applicable: false })).toBe('Saved as Emerging. It isn’t part of current progress yet.');
    expect(msg({ kind: 'status', from: 'not-yet', to: 'emerging' }, { status: 'emerging', hidden: true })).not.toMatch(/shows it/);
  });

  it('reversals say whether the milestone had counted', () => {
    expect(msg({ kind: 'status', from: 'achieved', to: 'emerging' }, { status: 'emerging' })).toMatch(/no longer counts as achieved in Sam’s progress/);
    expect(msg({ kind: 'status', from: 'achieved', to: 'not-yet' }, { status: 'not-yet', applicable: false })).toMatch(/wasn’t counted in current progress, so progress is unchanged/);
    expect(msg({ kind: 'status', from: 'achieved', to: 'not-yet' }, { status: 'not-yet', hidden: true })).toMatch(/progress is unchanged/);
  });

  it('hide and restore reflect applicability and status; personal versions stay separate; erase is final', () => {
    expect(msg({ kind: 'hidden' }, { hidden: true })).toMatch(/no longer included in progress/);
    expect(msg({ kind: 'hidden' }, { hidden: true, applicable: false })).toMatch(/won’t be included/);
    expect(msg({ kind: 'restored' })).toBe('Restored. It counts as achieved in progress again.');
    expect(msg({ kind: 'restored' }, { status: 'emerging' })).toBe('Restored. It’s included in progress again, as emerging.');
    expect(msg({ kind: 'restored' }, { applicable: false })).toMatch(/will be included in progress once Sam’s chronological age reaches 2 years/);
    expect(msg({ kind: 'status', from: 'not-yet', to: 'achieved' }, { personal: true, applicable: false })).toMatch(/Your versions aren’t counted in CDC progress/);
    const erased = msg({ kind: 'text-erased' });
    expect(erased).toBe('Text permanently erased.');
    expect(msg({ kind: 'observation-removed' })).toMatch(/until you erase it permanently/);
  });
});
