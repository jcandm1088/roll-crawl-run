/**
 * Journal rules (Checkpoint 4): validation, tags, ordering, search and filtering, and the routes.
 * FICTIONAL data only.
 */
import { describe, expect, it } from 'vitest';
import type { JournalEntry } from '../../src/types';
import {
  allTags, compareEntries, EMPTY_FILTER, filterEntries, formatTags, isFiltering, isJournalEntry, isUnansweredQuestion, JOURNAL_BODY_MAX, JOURNAL_TAG_MAX, JOURNAL_TAGS_MAX,
  JOURNAL_TITLE_MAX, JournalInputError, moreFilterCount, parseTags, sortEntries, typeSingular, validateJournalInput, type JournalFilter, type JournalInput,
} from '../../src/domain/journal';
import { href, parseHash } from '../../src/router';

const TODAY = '2026-11-27';
const input = (over: Partial<JournalInput> = {}): JournalInput => ({ type: 'reflection', date: TODAY, title: '', body: 'Fictional entry', tags: '', isProviderQuestion: false, answered: false, ...over });
let seq = 0;
const entry = (over: Partial<JournalEntry> = {}): JournalEntry => {
  seq++;
  const ts = `2026-11-27T10:00:${String(seq).padStart(2, '0')}.000Z`;
  return {
    id: `e${String(seq).padStart(3, '0')}`, createdAt: ts, updatedAt: ts, deletedAt: null, rev: 1, originDeviceId: 'd', lastModifiedBy: 'd',
    recordType: 'journalEntry', childId: 'child-a', type: 'reflection', date: TODAY, title: '', body: 'Fictional entry', tags: [], isProviderQuestion: false, answered: false, ...over,
  };
};
const filter = (over: Partial<JournalFilter>): JournalFilter => ({ ...EMPTY_FILTER, ...over });
const bodies = (list: JournalEntry[]) => list.map((e) => e.body);

describe('validation', () => {
  it('needs only a type, a date and some writing: the title and tags are optional', () => {
    expect(validateJournalInput(input(), TODAY)).toEqual({ type: 'reflection', date: TODAY, title: '', body: 'Fictional entry', tags: [], isProviderQuestion: false, answered: false });
    expect(validateJournalInput(input({ type: 'care', title: '  Fictional   title ', tags: 'sleep, Feeding' }), TODAY)).toMatchObject({ type: 'care', title: 'Fictional title', tags: ['sleep', 'Feeding'] });
  });

  it('refuses an empty or whitespace-only entry, with a plain message', () => {
    for (const body of ['', '   ', '\n\n \t']) expect(() => validateJournalInput(input({ body }), TODAY)).toThrow(new JournalInputError('Please write something before saving.'));
  });

  it('keeps the writing as written: line breaks and inner spacing survive, only the ends are trimmed', () => {
    const body = 'Fictional first line.\n\n  Indented second paragraph.\r\nThird line.';
    expect(validateJournalInput(input({ body: `\n${body}  \n` }), TODAY).body).toBe('Fictional first line.\n\n  Indented second paragraph.\nThird line.');
  });

  it('accepts a long entry up to the limit and refuses one beyond it', () => {
    const long = 'Fictional. '.repeat(1800).trim(); // about 19,800 characters
    expect(validateJournalInput(input({ body: long }), TODAY).body).toBe(long);
    expect(validateJournalInput(input({ body: 'x'.repeat(JOURNAL_BODY_MAX) }), TODAY).body).toHaveLength(JOURNAL_BODY_MAX);
    expect(() => validateJournalInput(input({ body: 'x'.repeat(JOURNAL_BODY_MAX + 1) }), TODAY)).toThrow(/20,000 characters or fewer/);
  });

  it('dates: today and earlier are accepted exactly as entered; future, impossible and very old dates are refused', () => {
    for (const date of [TODAY, '2026-11-26', '2024-02-29', '1990-01-01']) expect(validateJournalInput(input({ date }), TODAY).date).toBe(date);
    expect(() => validateJournalInput(input({ date: '2026-11-28' }), TODAY)).toThrow('Please choose today or an earlier date.');
    for (const date of ['', '2026-02-30', '2025-02-29', '2026-13-01', 'yesterday', '26-11-2026']) expect(() => validateJournalInput(input({ date }), TODAY)).toThrow('Please enter a valid date.');
    expect(() => validateJournalInput(input({ date: '1989-12-31' }), TODAY)).toThrow('Please enter a date in 1990 or later.');
  });

  it('limits the title, the number of tags and the length of a tag', () => {
    expect(validateJournalInput(input({ title: 't'.repeat(JOURNAL_TITLE_MAX) }), TODAY).title).toHaveLength(JOURNAL_TITLE_MAX);
    expect(() => validateJournalInput(input({ title: 't'.repeat(JOURNAL_TITLE_MAX + 1) }), TODAY)).toThrow(/title to 120 characters/);
    const many = Array.from({ length: JOURNAL_TAGS_MAX + 1 }, (_, i) => `tag${i}`).join(',');
    expect(() => validateJournalInput(input({ tags: many }), TODAY)).toThrow(/10 tags or fewer/);
    expect(() => validateJournalInput(input({ tags: 'x'.repeat(JOURNAL_TAG_MAX + 1) }), TODAY)).toThrow(/each tag to 30 characters/);
  });

  it('refuses an unknown entry type', () => {
    expect(() => validateJournalInput(input({ type: 'medical' as never }), TODAY)).toThrow('Please choose Personal Reflection or Care Note.');
  });

  it('only a Care Note can be a provider question, and only a question can be answered', () => {
    expect(validateJournalInput(input({ type: 'care', isProviderQuestion: true, answered: true }), TODAY)).toMatchObject({ isProviderQuestion: true, answered: true });
    expect(validateJournalInput(input({ type: 'care', isProviderQuestion: true }), TODAY)).toMatchObject({ isProviderQuestion: true, answered: false });
    expect(validateJournalInput(input({ type: 'care', isProviderQuestion: false, answered: true }), TODAY)).toMatchObject({ isProviderQuestion: false, answered: false });
    // A Personal Reflection never keeps the flag, even if the form still held it from before the type was changed.
    expect(validateJournalInput(input({ type: 'reflection', isProviderQuestion: true, answered: true }), TODAY)).toMatchObject({ isProviderQuestion: false, answered: false });
  });
});

describe('tags', () => {
  it('are separated by commas or line breaks, trimmed, and kept once without regard to capitals', () => {
    expect(parseTags('Sleep,  first   words , sleep,,\n#Feeding, SLEEP')).toEqual(['Sleep', 'first words', 'Feeding']);
    expect(parseTags('  ,  , ')).toEqual([]);
    expect(formatTags(['Sleep', 'first words'])).toBe('Sleep, first words');
    expect(parseTags(formatTags(['Sleep', 'first words']))).toEqual(['Sleep', 'first words']);
  });

  it('lists a child’s tags once each, A to Z', () => {
    const list = [entry({ tags: ['sleep', 'Feeding'] }), entry({ tags: ['Sleep', 'therapy'] }), entry()];
    expect(allTags(list).map((t) => t.toLowerCase())).toEqual(['feeding', 'sleep', 'therapy']);
    expect(allTags([])).toEqual([]);
  });
});

describe('feed order', () => {
  it('newest entry date first; on the same date the most recently written first; then by id', () => {
    const a = entry({ date: '2026-11-20', body: 'older date' });
    const b = entry({ date: '2026-11-27', body: 'today, written first' });
    const c = entry({ date: '2026-11-27', body: 'today, written second' });
    const d = entry({ date: '2026-11-25', body: 'backdated, written last' });
    expect(bodies(sortEntries([a, b, c, d]))).toEqual(['today, written second', 'today, written first', 'backdated, written last', 'older date']);
    // Deterministic whatever order the store returns them in.
    expect(bodies(sortEntries([d, c, b, a]))).toEqual(bodies(sortEntries([a, b, c, d])));
    const twinA = entry({ id: 'aaa', createdAt: '2026-11-27T09:00:00.000Z', body: 'twin a' });
    const twinB = entry({ id: 'bbb', createdAt: '2026-11-27T09:00:00.000Z', body: 'twin b' });
    expect(bodies(sortEntries([twinA, twinB]))).toEqual(bodies(sortEntries([twinB, twinA])));
    expect(compareEntries(twinA, twinA)).toBe(0);
  });

  it('sorting returns a new list and leaves the original alone', () => {
    const list = [entry({ date: '2026-01-01' }), entry({ date: '2026-06-01' })];
    const copy = [...list];
    sortEntries(list);
    expect(list).toEqual(copy);
  });
});

describe('search and filters', () => {
  const list = [
    entry({ date: '2026-11-27', type: 'reflection', title: 'First giggles', body: 'A whole afternoon of laughing at the kitchen table.', tags: ['firsts', 'family'] }),
    entry({ date: '2026-11-25', type: 'care', title: 'Sleep question', body: 'Waking twice most nights. Is that expected?', tags: ['sleep'], isProviderQuestion: true }),
    entry({ date: '2026-11-20', type: 'care', title: '', body: 'The provider suggested more floor time.', tags: ['therapy', 'sleep'] }),
    entry({ date: '2026-10-02', type: 'care', title: 'Feeding question', body: 'Asked about solid foods. Answer: start slowly.', tags: ['feeding'], isProviderQuestion: true, answered: true }),
    entry({ date: '2026-09-15', type: 'reflection', title: 'Park day', body: 'Giggles on the swings.', tags: ['Family'] }),
  ];
  const titles = (f: Partial<JournalFilter>) => filterEntries(list, filter(f)).map((e) => e.title || e.body);

  it('no filter shows everything, newest first', () => {
    expect(isFiltering(EMPTY_FILTER)).toBe(false);
    expect(titles({})).toEqual(['First giggles', 'Sleep question', 'The provider suggested more floor time.', 'Feeding question', 'Park day']);
  });

  it('text search looks in the title and the text, ignores capitals, and needs every word', () => {
    expect(titles({ text: 'GIGGLES' })).toEqual(['First giggles', 'Park day']);
    expect(titles({ text: 'giggles swings' })).toEqual(['Park day']);
    expect(titles({ text: '  floor   time ' })).toEqual(['The provider suggested more floor time.']);
    expect(titles({ text: 'question' })).toEqual(['Sleep question', 'Feeding question']);
    expect(titles({ text: 'no such words' })).toEqual([]);
    expect(isFiltering(filter({ text: '   ' }))).toBe(false);
  });

  it('filters by entry type', () => {
    expect(titles({ type: 'reflection' })).toEqual(['First giggles', 'Park day']);
    expect(titles({ type: 'care' })).toEqual(['Sleep question', 'The provider suggested more floor time.', 'Feeding question']);
  });

  it('filters by an inclusive date range, open on either side', () => {
    expect(titles({ from: '2026-11-20', to: '2026-11-25' })).toEqual(['Sleep question', 'The provider suggested more floor time.']);
    expect(titles({ from: '2026-11-25' })).toEqual(['First giggles', 'Sleep question']);
    expect(titles({ to: '2026-10-02' })).toEqual(['Feeding question', 'Park day']);
    expect(titles({ from: '2026-11-27', to: '2026-11-27' })).toEqual(['First giggles']);
    expect(titles({ from: 'not a date' })).toHaveLength(5); // an unusable date is ignored, never an error
  });

  it('filters by tags without regard to capitals; every chosen tag must be on the entry', () => {
    expect(titles({ tags: ['family'] })).toEqual(['First giggles', 'Park day']);
    expect(titles({ tags: ['sleep'] })).toEqual(['Sleep question', 'The provider suggested more floor time.']);
    expect(titles({ tags: ['sleep', 'THERAPY'] })).toEqual(['The provider suggested more floor time.']);
    expect(titles({ tags: ['sleep', 'family'] })).toEqual([]);
  });

  it('the unanswered-question filter shows only Care Notes flagged as questions and not yet answered', () => {
    expect(titles({ unansweredOnly: true })).toEqual(['Sleep question']);
    expect(list.filter(isUnansweredQuestion)).toHaveLength(1);
    expect(isUnansweredQuestion(entry({ type: 'reflection', isProviderQuestion: true }))).toBe(false); // never for a Personal Reflection
  });

  it('filters combine', () => {
    expect(titles({ text: 'question', type: 'care', from: '2026-11-01', tags: ['sleep'], unansweredOnly: true })).toEqual(['Sleep question']);
    expect(titles({ text: 'question', type: 'reflection' })).toEqual([]);
    expect(titles({ type: 'care', tags: ['sleep'], to: '2026-11-20' })).toEqual(['The provider suggested more floor time.']);
    expect(moreFilterCount(filter({ from: '2026-11-01', tags: ['a', 'b'] }))).toBe(3);
    expect(isFiltering(filter({ unansweredOnly: true }))).toBe(true);
  });

  it('filtering never changes the entries', () => {
    const before = JSON.stringify(list);
    filterEntries(list, filter({ text: 'giggles', type: 'reflection', tags: ['family'] }));
    expect(JSON.stringify(list)).toBe(before);
  });
});

describe('stored records', () => {
  it('recognises a journal entry and ignores anything else', () => {
    expect(isJournalEntry(entry())).toBe(true);
    expect(isJournalEntry({ id: 'j1', childId: 'c1' })).toBe(false); // a bare record from an earlier version's tests
    expect(isJournalEntry({ ...entry(), recordType: 'calendarEvent' })).toBe(false);
    expect(isJournalEntry({ ...entry(), type: 'medical' })).toBe(false);
    expect(isJournalEntry({ ...entry(), date: '2026-02-30' })).toBe(false);
    expect(isJournalEntry({ ...entry(), body: ' ' })).toBe(false);
    expect(isJournalEntry({ ...entry(), tags: [1] })).toBe(false);
    expect(isJournalEntry({ ...entry(), answered: undefined })).toBe(false);
    expect(isJournalEntry(null)).toBe(false);
  });

  it('names the two types', () => {
    expect(typeSingular('reflection')).toBe('Personal Reflection');
    expect(typeSingular('care')).toBe('Care Note');
  });
});

describe('routes', () => {
  it('the Journal and its new-entry shortcut have addresses', () => {
    expect(parseHash('#/journal')).toEqual({ name: 'journal' });
    expect(parseHash('#/journal/new')).toEqual({ name: 'journal', add: true });
    expect(href({ name: 'journal' })).toBe('#/journal');
    expect(href({ name: 'journal', add: true })).toBe('#/journal/new');
  });

  it('Resources is no longer a destination: its old address opens Home', () => {
    expect(parseHash('#/resources')).toEqual({ name: 'home' });
  });
});
