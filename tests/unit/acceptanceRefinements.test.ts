/**
 * Checkpoint 2a human acceptance refinements (R-004 to R-008): unit coverage.
 * Fictional data only.
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import lock from '../../src/content/milestone-ids.lock.json';
import catalogJson from '../../src/content/milestones.cdc-2022.json';
import { openRcrDb, type RcrDB } from '../../src/data/db';
import { ensureMeta } from '../../src/data/repositories/metaRepo';
import { createChild } from '../../src/data/repositories/childrenRepo';
import {
  MilestoneInputError, addObservation, createPersonalVersion, editObservation, eraseEntryText, loadChildMilestones, removeObservation, setNote, setStatus,
  type WriteContext,
} from '../../src/data/repositories/milestonesRepo';
import { CONTENT_VERSION, MILESTONES, PAGE_SOURCES, currentProgress, getMilestone, validateContent, type RecordState } from '../../src/domain/milestones';
import { DISPLAY, GENDERED_WORDS, applyReplacements, displayTextOf, isWordingAdapted, validateDisplay, type DisplayContent } from '../../src/domain/milestoneDisplay';
import { notesAndObservationsFor, observationsFor, stateAsRecordedAt } from '../../src/domain/milestoneHistory';
import { DEFAULT_FILTERS, selectSourced } from '../../src/domain/library';
import { GUIDE, guideFor, validateGuide, type GuideContent } from '../../src/domain/guide';
import { href, parseHash } from '../../src/router';
import { SAMPLE_CHILD_A, SAMPLE_CHILD_B } from '../fixtures/children';

const h = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const clone = (c: DisplayContent): DisplayContent => JSON.parse(JSON.stringify(c));

// ---------------------------------------------------------------------------
// R-004 — gender-neutral display wording
// ---------------------------------------------------------------------------
describe('R-004: gender-neutral display wording', () => {
  it('the display layer validates against the current CDC catalog', () => {
    expect(validateDisplay(DISPLAY, MILESTONES, CONTENT_VERSION)).toEqual([]);
    expect(DISPLAY.adaptations).toHaveLength(41);
  });

  it('the CDC source catalog is unchanged: verbatim text, pronouns, locked ids and hashes', () => {
    expect(validateContent(MILESTONES, PAGE_SOURCES, lock as Record<string, string>, h)).toEqual([]);
    expect(MILESTONES).toHaveLength(159);
    expect(getMilestone('cdc22-m04-se-01')!.text).toBe('Smiles on his own to get your attention');
    expect(getMilestone('cdc22-m48-mp-02')!.text).toBe('Serves herself food or pours water, with adult supervision');
    // The in-memory catalog is exactly the JSON file (no display wording mixed in).
    expect(MILESTONES.map((m) => m.text)).toEqual(catalogJson.items.map((i) => i.text));
    expect(MILESTONES.filter((m) => GENDERED_WORDS.test(m.text))).toHaveLength(41);
  });

  it('every milestone the parent sees is free of gendered wording', () => {
    for (const m of MILESTONES) expect(displayTextOf(m), m.id).not.toMatch(GENDERED_WORDS);
  });

  it('only gendered milestones are adapted; the others are shown exactly as CDC wrote them', () => {
    for (const m of MILESTONES) {
      if (GENDERED_WORDS.test(m.text)) expect(isWordingAdapted(m), m.id).toBe(true);
      else {
        expect(isWordingAdapted(m), m.id).toBe(false);
        expect(displayTextOf(m)).toBe(m.text);
      }
    }
  });

  it('meaning is preserved: numbers, quoted speech, examples and qualifiers are character-for-character CDC’s', () => {
    const qualifiers = /\b(at least|without|with adult supervision|by (?:himself|herself|themselves)|on (?:his|her|their) own|some|a few|one at a time|within \d+ minutes|both|not yet|, like|for example|more|two|one)\b/gi; // “, like” = an example (not the verb)
    for (const a of DISPLAY.adaptations) {
      const src = getMilestone(a.id)!.text;
      const shown = displayTextOf({ id: a.id, text: src });
      expect(shown.match(/\d+/g) ?? [], a.id).toEqual(src.match(/\d+/g) ?? []);
      expect(shown.match(/“[^”]*”/g) ?? [], a.id).toEqual(src.match(/“[^”]*”/g) ?? []);
      expect(shown.match(/\([^)]*\)/g)?.length ?? 0, a.id).toBe(src.match(/\([^)]*\)/g)?.length ?? 0);
      const norm = (t: string) => (t.match(qualifiers) ?? []).map((q) => q.toLowerCase().replace(/himself|herself/, 'themselves').replace(/\b(his|her)\b/, 'their'));
      expect(norm(shown), a.id).toEqual(norm(src));
      // Same number of words: only words were swapped, none added or dropped.
      expect(shown.split(/\s+/).length, a.id).toBe(src.split(/\s+/).length);
    }
  });

  it('reference ages, categories, sources and ids come only from the catalog (the display layer holds wording only)', () => {
    for (const a of DISPLAY.adaptations) expect(Object.keys(a).sort()).toEqual(['display', 'id', 'replacements', 'source']);
    const d = getMilestone('cdc22-m60-cg-05')!;
    expect(d).toMatchObject({ referenceAgeMonths: 60, cdcCategory: 'Cognitive', sourceId: 'cdc-ltsae-5-years' });
    expect(displayTextOf(d)).toBe('Writes some letters in their name');
  });

  it('specific adaptations read naturally, including verb agreement and pronoun-free wording', () => {
    const t = (id: string) => displayTextOf(getMilestone(id)!);
    expect(t('cdc22-m04-cg-01')).toBe('If hungry, opens mouth when they see breast or bottle');
    expect(t('cdc22-m06-cg-03')).toBe('Closes lips to show they don’t want more food');
    expect(t('cdc22-m48-se-06')).toBe('Changes behavior based on where they are (place of worship, library, playground)');
    expect(t('cdc22-m09-mp-02')).toBe('Moves things from one hand to the other hand');
    expect(t('cdc22-m09-cg-01')).toBe('Looks for objects when dropped out of sight (like a spoon or toy)');
    expect(t('cdc22-m18-mp-04')).toBe('Feeds themselves with their fingers');
  });

  describe('validation rejects unsafe adaptations', () => {
    const first = (c: DisplayContent) => c.adaptations[0]!;
    const cases: Array<[string, (c: DisplayContent) => void, RegExp]> = [
      ['changed qualifier', (c) => { first(c).display = first(c).display.replace('walk up', 'run up'); }, /not exactly the source/],
      ['added word', (c) => { first(c).display += ' often'; }, /not exactly the source/],
      ['non-pronoun replacement', (c) => { first(c).replacements.push(['walk', 'run']); }, /not a pronoun or verb-agreement change/],
      ['gendered result', (c) => { first(c).replacements = [['her', 'him']]; first(c).display = applyReplacements(first(c).source, [['her', 'him']])!; }, /must become a neutral word/],
      ['stale source wording', (c) => { first(c).source += '!'; }, /no longer matches CDC/],
      ['unknown milestone', (c) => { first(c).id = 'cdc22-m99-se-01'; }, /unknown milestone/],
      ['duplicate', (c) => { c.adaptations.push(clone(c).adaptations[0]!); }, /duplicate adaptation/],
      ['missing coverage', (c) => { c.adaptations.splice(5, 1); }, /has no gender-neutral display wording/],
      ['no pronoun changed', (c) => { first(c).replacements = [['walk', 'walk']]; }, /no gendered pronoun replaced/],
    ];
    for (const [name, mutate, re] of cases) {
      it(name, () => {
        const c = clone(DISPLAY);
        mutate(c);
        expect(validateDisplay(c, MILESTONES).join('\n')).toMatch(re);
      });
    }
    it('a different catalog version', () => expect(validateDisplay(DISPLAY, MILESTONES, 'cdc-2099').join()).toMatch(/different catalog version/));
  });

  it('the guide lists every milestone by id (catalog defs) and its own text is gender-neutral', () => {
    expect(validateGuide()).toEqual([]);
    const ids = Array.from({ length: 20 }, (_, i) => guideFor(i)).flatMap((g) => (g.kind === 'populated' ? g.groups.flatMap((x) => x.areas.flatMap((a) => a.milestones.map((m) => m.id))) : []));
    expect(new Set(ids).size).toBe(159);
    const bad: GuideContent = JSON.parse(JSON.stringify(GUIDE));
    bad.overviews[0]!.text += ' She smiles.';
    expect(validateGuide(bad).join()).toMatch(/gendered wording/);
  });

  it('Library search matches the shown wording', () => {
    const q = (query: string) => selectSourced({ ...DEFAULT_FILTERS, view: 'all', query }, 60, new Map()).map((d) => d.id);
    expect(q('on their own')).toEqual(['cdc22-m04-se-01', 'cdc22-m15-mp-01']);
    expect(q('on his own')).toEqual([]);
    expect(q('cup')).toHaveLength(4); // unchanged for neutral wording
  });
});

// ---------------------------------------------------------------------------
// R-007 — Notes & Observations storage (existing stores; no schema change)
// ---------------------------------------------------------------------------
describe('R-007: Notes & Observations', () => {
  let db: RcrDB;
  let ctx: WriteContext;
  let ctxB: WriteContext;
  let n = 0;
  const def = { kind: 'sourced' as const, defId: 'cdc22-m12-lc-01' };
  beforeEach(async () => {
    db = await openRcrDb(`acc-${++n}`);
    const { deviceId } = await ensureMeta(db);
    const a = await createChild(db, deviceId, { ...SAMPLE_CHILD_A, dob: '2025-01-10' });
    const b = await createChild(db, deviceId, SAMPLE_CHILD_B);
    ctx = { deviceId, childId: a.id, dob: '2025-01-10', today: '2026-11-26', ageBasis: { basis: 'chronological', milestoneAgeMonths: 22 } };
    ctxB = { ...ctx, childId: b.id, dob: SAMPLE_CHILD_B.dob };
  });
  afterEach(() => db.close());
  const load = async () => {
    const d = await loadChildMilestones(db, ctx.childId);
    return { d, entries: notesAndObservationsFor(d.events, d.records[0]!) };
  };

  it('the database version is unchanged (no schema change)', () => expect(db.version).toBe(2));

  it('dated entries are listed newest first and never change the status', async () => {
    await addObservation(db, ctx, def, '2026-10-01', 'Fictional entry one');
    await addObservation(db, ctx, def, '2026-11-20', 'Fictional entry two');
    const { d, entries } = await load();
    expect(entries.map((e) => (e.kind === 'observation' ? e.date : null))).toEqual(['2026-11-20', '2026-10-01']);
    expect(d.records[0]!.status).toBe('not-yet');
  });

  it('editing is append-only: the original stays in history and the latest wording and date are shown', async () => {
    await addObservation(db, ctx, def, '2026-10-01', 'Fictional original');
    let { d } = await load();
    const id = d.events.find((e) => e.type === 'observation')!.id;
    await editObservation(db, ctx, def, id, '2026-09-28', 'Fictional edited');
    ({ d } = await load());
    expect(d.events.find((e) => e.id === id)!.text).toBe('Fictional original'); // untouched
    const edit = d.events.find((e) => e.type === 'observation-edited')!;
    expect(edit).toMatchObject({ refEventId: id, eventDate: '2026-09-28', fromDate: '2026-10-01', text: 'Fictional edited' });
    expect(observationsFor(d.events, d.records[0]!.id)[0]).toMatchObject({ id, date: '2026-09-28', text: 'Fictional edited', edited: true });
    // No-op edit adds nothing
    await editObservation(db, ctx, def, id, '2026-09-28', 'Fictional edited');
    expect((await load()).d.events.filter((e) => e.type === 'observation-edited')).toHaveLength(1);
    // History reconstruction is unaffected by the new entry type
    expect(stateAsRecordedAt(d.events, '9999').get('def:cdc22-m12-lc-01')).toMatchObject({ status: 'not-yet' });
  });

  it('edits are validated: real dates only, not empty, not removed or erased entries', async () => {
    await addObservation(db, ctx, def, '2026-10-01', 'Fictional entry');
    let { d } = await load();
    const id = d.events.find((e) => e.type === 'observation')!.id;
    await expect(editObservation(db, ctx, def, id, '2026-12-01', 'x')).rejects.toThrow(/can’t be in the future/);
    await expect(editObservation(db, ctx, def, id, '2024-01-01', 'x')).rejects.toThrow(/before your child was born/);
    await expect(editObservation(db, ctx, def, id, '2026-10-01', '   ')).rejects.toThrow(MilestoneInputError);
    await removeObservation(db, ctx, def, id);
    await expect(editObservation(db, ctx, def, id, '2026-10-01', 'y')).rejects.toThrow(/Entry not found/);
    ({ d } = await load());
    expect((await load()).entries).toEqual([]);
  });

  it('permanent erase removes every version of an edited entry, from the original or from an edit', async () => {
    for (const from of ['original', 'edit'] as const) {
      await addObservation(db, ctx, def, '2026-10-01', `Fictional secret ${from} v1`);
      let { d } = await load();
      const id = d.events.filter((e) => e.type === 'observation').at(-1)!.id;
      await editObservation(db, ctx, def, id, '2026-10-02', `Fictional secret ${from} v2`);
      await editObservation(db, ctx, def, id, '2026-10-03', `Fictional secret ${from} v3`);
      ({ d } = await load());
      const target = from === 'original' ? id : d.events.filter((e) => e.type === 'observation-edited' && e.refEventId === id)[0]!.id;
      await eraseEntryText(db, ctx, def, target);
      ({ d } = await load());
      expect(JSON.stringify(d.events)).not.toContain(`Fictional secret ${from}`);
      expect(d.events.filter((e) => (e.id === id || e.refEventId === id) && e.type !== 'entry-erased').every((e) => e.text === null && !!e.erasedAt)).toBe(true);
      expect(d.events.at(-1)).toMatchObject({ type: 'entry-erased', refEventId: id });
      expect(observationsFor(d.events, d.records[0]!.id).find((o) => o.id === id)).toMatchObject({ erased: true, text: null });
    }
  });

  it('an undated note from an earlier version is shown as undated, first, with the date it was saved — no date is invented', async () => {
    await setNote(db, ctx, def, 'Fictional legacy note v1');
    await setNote(db, ctx, def, 'Fictional legacy note v2');
    await addObservation(db, ctx, def, '2026-11-01', 'Fictional dated');
    const { entries } = await load();
    expect(entries[0]).toEqual({ kind: 'undated-note', text: 'Fictional legacy note v2', savedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
    expect(entries[0]).not.toHaveProperty('date');
    expect(entries[1]).toMatchObject({ kind: 'observation', date: '2026-11-01' });
  });

  it('removing the undated note keeps its text in history; erasing a version also erases identical versions', async () => {
    await setNote(db, ctx, def, 'Fictional repeated note');
    await setNote(db, ctx, def, 'Fictional other note');
    await setNote(db, ctx, def, 'Fictional repeated note');
    let { d, entries } = await load();
    expect(entries[0]).toMatchObject({ kind: 'undated-note', text: 'Fictional repeated note' });
    const latest = d.events.filter((e) => e.type === 'note').at(-1)!;
    await eraseEntryText(db, ctx, def, latest.id);
    ({ d, entries } = await load());
    expect(JSON.stringify(d.events)).not.toContain('Fictional repeated note');
    expect(d.records[0]!.note).toBe('');
    expect(entries).toEqual([]);
    expect(JSON.stringify(d.events)).toContain('Fictional other note'); // a different version is left for the parent to decide
    // Removing (not erasing) keeps the text recoverable in history, as before.
    await setNote(db, ctx, def, 'Fictional kept note');
    await setNote(db, ctx, def, '');
    ({ d, entries } = await load());
    expect(entries).toEqual([]);
    expect(d.events.some((e) => e.type === 'note' && e.text === 'Fictional kept note')).toBe(true);
  });

  it('entries stay with their own child', async () => {
    await addObservation(db, ctx, def, '2026-10-01', 'Fictional for A');
    await addObservation(db, ctxB, def, '2026-10-01', 'Fictional for B');
    const a = await loadChildMilestones(db, ctx.childId);
    const b = await loadChildMilestones(db, ctxB.childId);
    expect(notesAndObservationsFor(a.events, a.records[0]!).map((e) => e.text)).toEqual(['Fictional for A']);
    expect(notesAndObservationsFor(b.events, b.records[0]!).map((e) => e.text)).toEqual(['Fictional for B']);
    const idA = a.events[0]!.id;
    await expect(editObservation(db, ctxB, def, idA, '2026-10-01', 'cross-child')).rejects.toThrow(/Entry not found/);
    await expect(eraseEntryText(db, ctxB, def, idA)).rejects.toThrow(/Entry not found/);
  });
});

// ---------------------------------------------------------------------------
// R-005 — legacy personal entries are preserved and never counted
// ---------------------------------------------------------------------------
describe('R-005: legacy personal entries', () => {
  it('records are kept and Progress is unchanged by them', async () => {
    const db = await openRcrDb('acc-personal');
    const { deviceId } = await ensureMeta(db);
    const a = await createChild(db, deviceId, { ...SAMPLE_CHILD_A, dob: '2025-01-10' });
    const ctx: WriteContext = { deviceId, childId: a.id, dob: '2025-01-10', today: '2026-11-26', ageBasis: { basis: 'chronological', milestoneAgeMonths: 22 } };
    await setStatus(db, ctx, { kind: 'sourced', defId: 'cdc22-m12-lc-01' }, 'achieved', '2026-02-01');
    const before = await loadChildMilestones(db, a.id);
    const states = (d: typeof before) => new Map(d.records.filter((r) => r.milestoneDefId).map((r) => [r.milestoneDefId!, { status: r.status, hidden: r.hidden } as RecordState]));
    const p0 = currentProgress(22, states(before));
    const pv = await createPersonalVersion(db, ctx, { title: 'Fictional legacy entry', description: '', derivedFromDefId: 'cdc22-m12-lc-01', appCategory: 'language-communication', referenceAgeMonths: 12 });
    await setStatus(db, ctx, { kind: 'personal', customId: pv.id }, 'achieved', '2026-03-01');
    const after = await loadChildMilestones(db, a.id);
    expect(after.personal).toHaveLength(1);
    expect(currentProgress(22, states(after))).toEqual(p0);
    expect(p0.overall).toMatchObject({ achieved: 1, applicable: currentProgress(22, new Map()).overall.applicable });
    db.close();
  });
});

// ---------------------------------------------------------------------------
// R-008 — age settings route
// ---------------------------------------------------------------------------
describe('R-008: Manage age settings route', () => {
  it('round-trips the profile age-settings address for a given child', () => {
    const r = { name: 'profileEdit', id: 'abc-123', section: 'age' } as const;
    expect(href(r)).toBe('#/profiles/abc-123/age');
    expect(parseHash('#/profiles/abc-123/age')).toEqual(r);
    expect(parseHash('#/profiles/abc-123')).toEqual({ name: 'profileEdit', id: 'abc-123' });
    expect(href({ name: 'profileEdit', id: 'abc-123' })).toBe('#/profiles/abc-123');
  });
});
