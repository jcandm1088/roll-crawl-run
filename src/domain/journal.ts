/**
 * Journal (Checkpoint 4): entry rules, ordering, search and filtering.
 *
 * Two kinds of entry share one feed: Personal Reflections (memories and everyday moments) and Care Notes
 * (observations, recommendations and questions for the child's provider). Only a Care Note can carry a
 * provider question, and only a provider question can be answered or unanswered.
 * Dates are local "YYYY-MM-DD" strings (dates.ts), so a time zone change can never move an entry.
 * No photographs, attachments, sharing or links to Growth and the Calendar.
 */
import type { JournalEntry, JournalEntryType } from '../types';
import { compareDates, isValidLocalDate, parseLocalDate, type LocalDate } from './dates';

export const JOURNAL_TYPES: Array<{ id: JournalEntryType; label: string; singular: string }> = [
  { id: 'reflection', label: 'Personal Reflections', singular: 'Personal Reflection' },
  { id: 'care', label: 'Care Notes', singular: 'Care Note' },
];
export const typeSingular = (type: JournalEntryType): string => JOURNAL_TYPES.find((t) => t.id === type)!.singular;

export const JOURNAL_MIN_YEAR = 1990;
export const JOURNAL_TITLE_MAX = 120;
/** Long enough for several pages of writing; a limit keeps one entry from exhausting the device's storage. */
export const JOURNAL_BODY_MAX = 20000;
export const JOURNAL_TAG_MAX = 30;
export const JOURNAL_TAGS_MAX = 10;

export interface JournalInput {
  type: JournalEntryType;
  date: string;
  title: string;
  body: string;
  /** What the parent typed: tags separated by commas. */
  tags: string;
  isProviderQuestion: boolean;
  answered: boolean;
}

export interface CleanJournalEntry {
  type: JournalEntryType;
  date: LocalDate;
  title: string;
  body: string;
  tags: string[];
  isProviderQuestion: boolean;
  answered: boolean;
}

export class JournalInputError extends Error {}

const tagKey = (tag: string): string => tag.toLocaleLowerCase('en');

/**
 * "Sleep,  first  words , sleep" → ["Sleep", "first words"]. Commas and line breaks separate tags; spaces
 * inside a tag are collapsed; a leading "#" is dropped; a tag repeated in different capitals is kept once
 * (as first typed).
 */
export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[,\n]/)) {
    const tag = raw.replace(/\s+/g, ' ').trim().replace(/^#+\s*/, '');
    if (!tag || seen.has(tagKey(tag))) continue;
    seen.add(tagKey(tag));
    out.push(tag);
  }
  return out;
}

export const formatTags = (tags: string[]): string => tags.join(', ');

/**
 * Validates what the parent typed. Throws JournalInputError with a parent-friendly message.
 * `today` is the device's current local date: an entry can be dated today or earlier, not in the future.
 * A Personal Reflection never keeps a provider-question flag, and "answered" only exists on a question.
 */
export function validateJournalInput(input: JournalInput, today: LocalDate): CleanJournalEntry {
  if (input.type !== 'reflection' && input.type !== 'care') throw new JournalInputError('Please choose Personal Reflection or Care Note.');
  const parts = parseLocalDate(input.date);
  if (!parts) throw new JournalInputError('Please enter a valid date.');
  if (parts.year < JOURNAL_MIN_YEAR) throw new JournalInputError(`Please enter a date in ${JOURNAL_MIN_YEAR} or later.`);
  if (compareDates(input.date, today) > 0) throw new JournalInputError('Please choose today or an earlier date.');
  const title = input.title.replace(/\s+/g, ' ').trim();
  if (title.length > JOURNAL_TITLE_MAX) throw new JournalInputError(`Please keep the title to ${JOURNAL_TITLE_MAX} characters or fewer.`);
  const body = input.body.replace(/\r\n?/g, '\n').trim();
  if (!body) throw new JournalInputError('Please write something before saving.');
  if (body.length > JOURNAL_BODY_MAX) throw new JournalInputError(`Please keep the entry to ${JOURNAL_BODY_MAX.toLocaleString('en-US')} characters or fewer.`);
  const tags = parseTags(input.tags);
  if (tags.length > JOURNAL_TAGS_MAX) throw new JournalInputError(`Please use ${JOURNAL_TAGS_MAX} tags or fewer.`);
  if (tags.some((t) => t.length > JOURNAL_TAG_MAX)) throw new JournalInputError(`Please keep each tag to ${JOURNAL_TAG_MAX} characters or fewer.`);
  const isProviderQuestion = input.type === 'care' && input.isProviderQuestion === true;
  return { type: input.type, date: input.date, title, body, tags, isProviderQuestion, answered: isProviderQuestion && input.answered === true };
}

/** A stored record this app can show as a journal entry (anything else in the store is ignored, never changed). */
export function isJournalEntry(value: unknown): value is JournalEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' && typeof v.childId === 'string' && v.recordType === 'journalEntry' && (v.type === 'reflection' || v.type === 'care') &&
    typeof v.date === 'string' && isValidLocalDate(v.date) && typeof v.title === 'string' && typeof v.body === 'string' && v.body.trim() !== '' &&
    Array.isArray(v.tags) && v.tags.every((t) => typeof t === 'string') && typeof v.isProviderQuestion === 'boolean' && typeof v.answered === 'boolean' &&
    typeof v.createdAt === 'string'
  );
}

/** Newest entry date first; on the same date the most recently written first; then id, so the order never varies. */
export function compareEntries(a: JournalEntry, b: JournalEntry): number {
  return compareDates(b.date, a.date) || (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
}

export const sortEntries = (entries: JournalEntry[]): JournalEntry[] => [...entries].sort(compareEntries);

export const isUnansweredQuestion = (e: JournalEntry): boolean => e.type === 'care' && e.isProviderQuestion && !e.answered;

/**
 * The four primary views (R-024). Exactly one is selected at a time. They are ways of looking at the two
 * entry types, not a third type: “unanswered” is a subset of Care Notes, so a Care Note with a provider
 * question, answered or not, is always in “care” and “all” as well.
 */
export type JournalView = 'all' | JournalEntryType | 'unanswered';

export function inView(e: JournalEntry, view: JournalView): boolean {
  if (view === 'all') return true;
  if (view === 'unanswered') return isUnansweredQuestion(e);
  return e.type === view;
}

export interface JournalFilter {
  /** Words to find in the title or the text (every word must appear; capitals don't matter). */
  text: string;
  view: JournalView;
  /** Inclusive date range; "" leaves that side open. */
  from: string;
  to: string;
  /** Every selected tag must be on the entry. */
  tags: string[];
}

export const EMPTY_FILTER: JournalFilter = { text: '', view: 'all', from: '', to: '', tags: [] };

export const isFiltering = (f: JournalFilter): boolean => f.text.trim() !== '' || f.view !== 'all' || f.from !== '' || f.to !== '' || f.tags.length > 0;

/** How many of the filters behind “More filters” (dates and tags) are in use. */
export const moreFilterCount = (f: JournalFilter): number => (f.from ? 1 : 0) + (f.to ? 1 : 0) + f.tags.length;

const fold = (s: string): string => s.toLocaleLowerCase('en');

/** The entries in the selected view that the search, dates and tags also allow, in feed order. Never changes a record. */
export function filterEntries(entries: JournalEntry[], f: JournalFilter): JournalEntry[] {
  const words = fold(f.text).split(/\s+/).filter(Boolean);
  const from = isValidLocalDate(f.from) ? f.from : null;
  const to = isValidLocalDate(f.to) ? f.to : null;
  const wanted = f.tags.map(tagKey);
  return sortEntries(entries.filter((e) => {
    if (!inView(e, f.view)) return false;
    if (from && compareDates(e.date, from) < 0) return false;
    if (to && compareDates(e.date, to) > 0) return false;
    if (wanted.length) {
      const own = new Set(e.tags.map(tagKey));
      if (!wanted.every((t) => own.has(t))) return false;
    }
    if (words.length) {
      const hay = fold(`${e.title}\n${e.body}`);
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  }));
}

/** Every tag this child's entries use, once each (first capitalization seen, newest entry first), A to Z. */
export function allTags(entries: JournalEntry[]): string[] {
  const seen = new Map<string, string>();
  for (const e of sortEntries(entries)) for (const t of e.tags) if (!seen.has(tagKey(t))) seen.set(tagKey(t), t);
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

export const sameTag = (a: string, b: string): boolean => tagKey(a) === tagKey(b);
