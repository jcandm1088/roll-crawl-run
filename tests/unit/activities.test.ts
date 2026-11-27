/**
 * Recommended activity content (Checkpoint 2b, D2–D4 and the inventory corrections §3).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ACTIVITIES, ACTIVITY_CONTENT, ACTIVITY_RECORDS, activitiesAt, browseDefault, getActivity, recordsOf, splitRecord, validateActivities, type ActivityContent } from '../../src/domain/activities';
import { REFERENCE_AGES } from '../../src/domain/milestones';
import { GENDERED_WORDS } from '../../src/domain/milestoneDisplay';

const lock = JSON.parse(readFileSync(new URL('../../src/content/activity-ids.lock.json', import.meta.url), 'utf8')) as Record<string, string>;
const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const clone = (): ActivityContent => JSON.parse(JSON.stringify(ACTIVITY_CONTENT));

describe('activity inventory', () => {
  it('passes validation against the lock file', () => {
    expect(validateActivities(undefined, lock, hash)).toEqual([]);
  });

  it('has the approved counts: 162 CDC records grouped into 153 activities, at all 12 CDC ages', () => {
    expect(ACTIVITY_RECORDS).toHaveLength(162);
    expect(ACTIVITIES).toHaveLength(153);
    expect(new Set(ACTIVITY_RECORDS.map((r) => r.referenceAgeMonths))).toEqual(new Set(REFERENCE_AGES));
    for (const a of REFERENCE_AGES) expect(activitiesAt(a).length).toBeGreaterThan(0);
  });

  it('every parent-facing field is gender-neutral (instructions, purpose, safety, page guidance, titles, materials)', () => {
    for (const r of ACTIVITY_RECORDS) {
      const s = splitRecord(r);
      for (const t of [r.display, ...s.purpose, ...s.safety, ...s.instructions.map((x) => x.text)]) expect(GENDERED_WORDS.test(t), `${r.id}: ${t}`).toBe(false);
    }
    for (const g of Object.values(ACTIVITY_CONTENT.pageGuidance)) expect(/\bhis or her\b/.test(g.display)).toBe(false);
    for (const a of ACTIVITIES) {
      expect(GENDERED_WORDS.test(a.title)).toBe(false);
      for (const m of a.materials ?? []) expect(GENDERED_WORDS.test(m.phrase)).toBe(false);
    }
  });

  it('keeps CDC’s exact source wording and only declared changes; detects tampering', () => {
    const c1 = clone();
    c1.records[0]!.display = c1.records[0]!.display.replace('Respond', 'Always respond');
    expect(validateActivities(c1).join()).toMatch(/display text/);
    const c2 = clone();
    c2.records[0]!.source += ' Extra.';
    expect(validateActivities(c2, lock, hash).join()).toMatch(/locked id/);
    const c3 = clone();
    c3.records[0]!.replacements.push(['positively', 'kindly']);
    expect(validateActivities(c3).join()).toMatch(/isn't a pronoun/);
    const c4 = clone();
    c4.activities[0]!.materials = [{ phrase: 'a trampoline', example: false }];
    expect(validateActivities(c4).join()).toMatch(/isn't in the CDC text/);
  });

  it('the one typographical correction is declared, disclosed and the original kept (D4)', () => {
    const r = ACTIVITY_RECORDS.find((x) => x.corrections?.length)!;
    expect(r.id).toBe('cdc22-act-m48-08');
    expect(r.source).toContain('helps you child');
    expect(r.display).toContain('helps your child');
  });

  it('frequency and duration words in CDC’s text are kept as text and recorded, never turned into targets', () => {
    const timed = ACTIVITY_RECORDS.filter((r) => r.timingLanguage?.length).map((r) => r.id);
    expect(timed).toEqual(expect.arrayContaining(['cdc22-act-m4-11', 'cdc22-act-m4-17', 'cdc22-act-m6-02']));
    for (const id of timed) expect(ACTIVITY_RECORDS.find((r) => r.id === id)!.display).toMatch(/every day|each day|a few/);
  });

  it('safety sentences are kept for every safety-sensitive activity and grouped records never collapse different ones', () => {
    const tummy = getActivity('cdc22-act-a004')!;
    expect(tummy.title).toBe('Tummy time with toys');
    expect(splitRecord(recordsOf(tummy)[0]!).safety.join(' ')).toContain('Do not leave your baby alone');
    for (const a of ACTIVITIES) {
      const sets = recordsOf(a).map((r) => splitRecord(r).safety.join('|'));
      expect(new Set(sets).size, a.id).toBe(1);
    }
    expect(ACTIVITIES.filter((a) => a.safetySensitive).length).toBeGreaterThan(10);
  });

  it('segments rebuild the instructions exactly; the purpose sentence is not repeated in the instructions (3.5)', () => {
    for (const r of ACTIVITY_RECORDS) {
      const s = splitRecord(r);
      expect(r.segments.map((x) => x.text).join(' ')).toBe(r.display);
      for (const p of s.purpose) expect(s.instructions.some((x) => x.text === p)).toBe(false);
    }
  });

  it('materials use meaningful phrases with qualifiers (3.3)', () => {
    const toys = getActivity(ACTIVITIES.find((a) => a.recordIds.includes('cdc22-act-m4-07'))!.id)!;
    expect(toys.materials).toEqual([
      { phrase: 'safe toys to play with that are easy to hold', example: false },
      { phrase: 'rattles or cloth books with colorful pictures for their age', example: true },
    ]);
  });
});

describe('Browse default reference age (D2)', () => {
  const cases: Array<[number, number]> = [[2, 2], [3, 2], [5, 4], [7, 6], [10, 9], [14, 12], [20, 18], [29, 24], [40, 36], [59, 48], [60, 60]];
  it.each(cases)('%i months → %i-month activities', (age, expected) => {
    expect(browseDefault(age)).toEqual({ kind: 'age', age: expected, olderThanFive: false });
  });
  it('older than five years → 5-year activities', () => expect(browseDefault(75)).toEqual({ kind: 'age', age: 60, olderThanFive: true }));
  it('younger than 2 months → no default; before the due date → no default', () => {
    expect(browseDefault(0)).toEqual({ kind: 'too-young', beforeDueDate: false });
    expect(browseDefault(1)).toEqual({ kind: 'too-young', beforeDueDate: false });
    expect(browseDefault(null)).toEqual({ kind: 'too-young', beforeDueDate: true });
  });
});
