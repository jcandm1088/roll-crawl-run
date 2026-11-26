import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import lock from '../../src/content/milestone-ids.lock.json';
import {
  EXPECTED_COUNTS, MILESTONES, PAGE_SOURCES, REFERENCE_AGES, intervalOf, isEmptyInterval, milestonesInInterval,
  neighbouringReferenceIntervals, referenceAgesIn, validateContent, type MilestoneDef,
} from '../../src/domain/milestones';
import { INTERVALS } from '../../src/domain/intervals';

const h = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

describe('CDC milestone content integrity', () => {
  it('passes build-time validation', () => {
    expect(validateContent(MILESTONES, PAGE_SOURCES, lock, h)).toEqual([]);
  });

  it('has exactly 159 milestones with the approved category counts', () => {
    expect(MILESTONES).toHaveLength(159);
    const counts: Record<string, number> = {};
    for (const m of MILESTONES) counts[m.appCategory] = (counts[m.appCategory] ?? 0) + 1;
    expect(counts).toEqual(EXPECTED_COUNTS);
    expect(EXPECTED_COUNTS).toEqual({ 'gross-motor': 20, 'fine-motor': 24, cognitive: 33, 'language-communication': 40, 'social-emotional': 42 });
  });

  it('counts per reference age match the reviewed inventory', () => {
    const per: Record<number, number> = {};
    for (const m of MILESTONES) per[m.referenceAgeMonths] = (per[m.referenceAgeMonths] ?? 0) + 1;
    expect(per).toEqual({ 2: 11, 4: 13, 6: 12, 9: 13, 12: 10, 15: 13, 18: 15, 24: 13, 30: 15, 36: 12, 48: 17, 60: 15 });
    expect([...new Set(MILESTONES.map((m) => m.referenceAgeMonths))]).toEqual([...REFERENCE_AGES]);
  });

  it('keeps CDC’s original category; only Movement/Physical is split into gross/fine', () => {
    for (const m of MILESTONES) {
      if (m.cdcCategory === 'Movement/Physical') expect(['gross-motor', 'fine-motor']).toContain(m.appCategory);
      else expect(m.appCategory).toBe({ 'Social/Emotional': 'social-emotional', 'Language/Communication': 'language-communication', Cognitive: 'cognitive' }[m.cdcCategory]);
    }
    expect(MILESTONES.filter((m) => m.cdcCategory === 'Movement/Physical')).toHaveLength(44);
    expect(MILESTONES.filter((m) => m.classificationNote)).toHaveLength(10); // approved borderline items
  });

  it('preserves CDC wording exactly, including pronouns (spot checks)', () => {
    const t = (id: string) => MILESTONES.find((m) => m.id === id)!.text;
    expect(t('cdc22-m02-se-01')).toBe('Calms down when spoken to or picked up');
    expect(MILESTONES.some((m) => m.text === 'Feeds himself with his fingers')).toBe(true);
    expect(MILESTONES.some((m) => m.text === 'Serves herself food or pours water, with adult supervision')).toBe(true);
    expect(MILESTONES.some((m) => m.text === 'Likes to look at self in a mirror')).toBe(true);
  });

  it('every item has a valid CDC source with reuse basis and dates', () => {
    expect(PAGE_SOURCES).toHaveLength(12);
    for (const s of PAGE_SOURCES) {
      expect(s.url).toMatch(/^https:\/\/www\.cdc\.gov\/act-early\/milestones\//);
      expect(s.license).toBe('us-government-public-domain');
      expect(s.contentLastReviewed).toBe('2026-05-15');
      expect(s.retrieved).toBe('2026-11-26');
    }
  });

  it('ids are stable: the lock file pins every id to its content', () => {
    expect(Object.keys(lock)).toHaveLength(159);
    for (const m of MILESTONES) expect((lock as Record<string, string>)[m.id]).toBe(h(`${m.referenceAgeMonths}|${m.cdcCategory}|${m.text}`));
  });

  describe('validation catches problems', () => {
    const base = MILESTONES.map((m) => ({ ...m }));
    const run = (items: MilestoneDef[]) => validateContent(items, PAGE_SOURCES, lock, h);
    it('duplicate id', () => expect(run([...base.slice(0, -1), { ...base[0]! }]).join()).toMatch(/duplicate id/));
    it('unknown source', () => expect(run([{ ...base[0]!, sourceId: 'x' }, ...base.slice(1)]).join()).toMatch(/unknown source/));
    it('unapproved age', () => expect(run([{ ...base[0]!, referenceAgeMonths: 3 }, ...base.slice(1)]).join()).toMatch(/unapproved reference age/));
    it('wrong category pairing', () => expect(run([{ ...base[0]!, appCategory: 'gross-motor' }, ...base.slice(1)]).join()).toMatch(/not allowed/));
    it('changed wording on a locked id', () => expect(run([{ ...base[0]!, text: base[0]!.text + '!' }, ...base.slice(1)]).join()).toMatch(/content changed/));
    it('missing item / count', () => expect(run(base.slice(1)).join()).toMatch(/expected 159/));
    it('duplicate content', () => expect(run([...base, { ...base[0]!, id: 'cdc22-m02-se-99' }]).join()).toMatch(/duplicate content/));
  });
});

describe('reference-age → interval mapping', () => {
  it('maps every published age to exactly one interval (start < X ≤ end)', () => {
    const map = Object.fromEntries(REFERENCE_AGES.map((a) => [a, intervalOf({ referenceAgeMonths: a }).label]));
    expect(map).toEqual({
      2: '0–3 months', 4: '3–6 months', 6: '3–6 months', 9: '6–9 months', 12: '9–12 months', 15: '12–15 months',
      18: '15–18 months', 24: '21–24 months', 30: '27–30 months', 36: '33–36 months', 48: '45–48 months', 60: '57–60 months',
    });
    const placed = INTERVALS.reduce((n, iv) => n + milestonesInInterval(iv.index).length, 0);
    expect(placed).toBe(159); // nothing omitted or duplicated
  });

  it('empty intervals stay empty (no filler)', () => {
    const empty = INTERVALS.filter((iv) => isEmptyInterval(iv.index)).map((iv) => iv.label);
    expect(empty).toEqual(['18–21 months', '24–27 months', '30–33 months', '36–39 months', '39–42 months', '42–45 months', '48–51 months', '51–54 months', '54–57 months']);
  });

  it('empty intervals link to the nearest earlier and later reference groups', () => {
    const n = neighbouringReferenceIntervals(6); // 18–21
    expect(n.previous?.label).toBe('15–18 months');
    expect(n.next?.label).toBe('21–24 months');
    expect(neighbouringReferenceIntervals(0).previous).toBeNull();
    expect(neighbouringReferenceIntervals(19).next).toBeNull();
    expect(referenceAgesIn(1)).toEqual([4, 6]);
  });
});
