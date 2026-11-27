/**
 * Recommended vaccine schedule reference (Checkpoint 3, Simplified Calendar). Content and date display only.
 *
 * - Source: CDC's "Recommended Immunizations for Birth Through 6 Years Old, United States, 2025"
 *   (July 2, 2025), cross-checked against CDC's schedule, notes and addendum for health care providers.
 *   The approved snapshot is bundled in vaccines.cdc-2025.json so it is available offline.
 * - Only recommendations CDC's parent schedule marks for ALL children at a stated age are placed on the
 *   calendar. Product-dependent, seasonal and individually decided recommendations are never dated: they
 *   are listed, undated, for a conversation with the child's provider.
 * - Dates are an app display convention worked out from the chronological date of birth (never the
 *   corrected age): a single age is one marker on that age's anniversary; an age range is shown from the
 *   anniversary of its first age through the last day of its last age (CDC: "a dash should be read as
 *   through"). They are not appointments, due dates or clinical deadlines.
 * - Nothing here works out eligibility, catch-up timing, minimum intervals, vaccination status or
 *   compliance. The child's healthcare provider determines the child's vaccination schedule.
 */
import json from '../content/vaccines.cdc-2025.json';
import { addDays, addMonthsClamped, compareDates, isValidLocalDate, type LocalDate } from './dates';

export type ReferenceAge =
  | { kind: 'birth' }
  /** One stated age (for example "2 months"). */
  | { kind: 'single'; months: number }
  /** An inclusive age range (for example 15 through 18 months; 4–6 years is 48 through 83 months). */
  | { kind: 'range'; fromMonths: number; throughMonths: number };

export interface VaccineReference {
  id: string;
  vaccine: string;
  dose: string;
  age: ReferenceAge;
  ageLabel: string;
  /** The words in CDC's parent schedule cell, and the age columns that cell spans. */
  cdcCell: string;
  cdcColumns: string[];
  /** A qualification from CDC's schedule or its notes for health care providers, kept with the reference. */
  qualification?: string;
}

export interface DiscussionItem {
  id: string;
  label: string;
  ageLabel: string;
  cdcText: string;
  cdcKey: string;
  appNote: string | null;
}

export interface VaccineSource {
  id: string;
  role: 'display' | 'cross-check';
  title: string;
  url: string;
}

export interface VaccineContent {
  contentVersion: string;
  schedule: { organization: string; title: string; pageTitle: string; scheduleDate: LocalDate; retrieved: LocalDate; currencyChecked: LocalDate };
  sources: VaccineSource[];
  vaccines: Array<{ id: string; label: string }>;
  references: VaccineReference[];
  discussion: DiscussionItem[];
  moreGuidance: { cdcIntro: string; cdcItems: string[] };
}

export const VACCINE_CONTENT = json as VaccineContent;
export const VACCINE_REFERENCES: VaccineReference[] = VACCINE_CONTENT.references;
export const VACCINE_DISCUSSION: DiscussionItem[] = VACCINE_CONTENT.discussion;
export const VACCINE_DISPLAY_SOURCE: VaccineSource = VACCINE_CONTENT.sources.find((s) => s.role === 'display')!;

export const vaccineLabel = (id: string): string => VACCINE_CONTENT.vaccines.find((v) => v.id === id)?.label ?? id;

/** "2 months", "15–18 months", "4–6 years", "Birth": the source's age wording, rebuilt from the numbers. */
export function ageLabelOf(age: ReferenceAge): string {
  if (age.kind === 'birth') return 'Birth';
  if (age.kind === 'single') return age.months === 1 ? '1 month' : `${age.months} months`;
  const wholeYears = age.fromMonths % 12 === 0 && (age.throughMonths + 1) % 12 === 0 && age.fromMonths >= 24;
  if (wholeYears) return `${age.fromMonths / 12}–${(age.throughMonths + 1) / 12 - 1} years`;
  return `${age.fromMonths}–${age.throughMonths} months`;
}

/** The age a reference starts at, for a heading: "birth", "2 months", "4 years". */
export function startAgeLabel(age: ReferenceAge): string {
  const m = age.kind === 'birth' ? 0 : age.kind === 'single' ? age.months : age.fromMonths;
  if (m === 0) return 'birth';
  if (m >= 24 && m % 12 === 0) return `${m / 12} years`;
  return m === 1 ? '1 month' : `${m} months`;
}

export interface DatedReference {
  ref: VaccineReference;
  vaccineLabel: string;
  /** 'marker': one age anniversary. 'range': an inclusive age range. */
  shape: 'marker' | 'range';
  start: LocalDate;
  /** Same as start for a marker; the last day of the last age in the range otherwise. */
  end: LocalDate;
}

/**
 * Calendar dates for one reference age, from the chronological date of birth, with real calendar
 * arithmetic (month ends and leap days clamp to the last day of a shorter month).
 */
export function referenceDates(dob: LocalDate, age: ReferenceAge): { start: LocalDate; end: LocalDate } {
  if (age.kind === 'birth') return { start: dob, end: dob };
  if (age.kind === 'single') {
    const d = addMonthsClamped(dob, age.months);
    return { start: d, end: d };
  }
  return { start: addMonthsClamped(dob, age.fromMonths), end: addDays(addMonthsClamped(dob, age.throughMonths + 1), -1) };
}

/** Every dated reference for a child, in schedule order (by start date, then the content order). */
export function datedReferences(dob: LocalDate, refs: VaccineReference[] = VACCINE_REFERENCES): DatedReference[] {
  if (!isValidLocalDate(dob)) return [];
  return refs
    .map((ref, i) => ({ i, d: { ref, vaccineLabel: vaccineLabel(ref.vaccine), shape: ref.age.kind === 'range' ? ('range' as const) : ('marker' as const), ...referenceDates(dob, ref.age) } }))
    .sort((a, b) => compareDates(a.d.start, b.d.start) || a.i - b.i)
    .map((x) => x.d);
}

/** References whose single age, or whose range's first day, falls on this date (what the grid marks). */
export const referencesStartingOn = (dated: DatedReference[], date: LocalDate): DatedReference[] => dated.filter((d) => d.start === date);

/** Age ranges that include this date (shown as context for a selected day, never as a grid label). */
export const rangesCovering = (dated: DatedReference[], date: LocalDate): DatedReference[] =>
  dated.filter((d) => d.shape === 'range' && compareDates(d.start, date) <= 0 && compareDates(date, d.end) <= 0);

/** Age ranges that overlap [first, last] (a displayed month). */
export const rangesOverlapping = (dated: DatedReference[], first: LocalDate, last: LocalDate): DatedReference[] =>
  dated.filter((d) => d.shape === 'range' && compareDates(d.start, last) <= 0 && compareDates(first, d.end) <= 0);

/** The dates the grid marks for the vaccine overlay: age anniversaries and the first day of each range. */
export function markerDates(dated: DatedReference[]): Set<LocalDate> {
  return new Set(dated.map((d) => d.start));
}

/** The next reference age on or after `today`: all references that share that first date. Null when none remain. */
export function nextReferenceGroup(dated: DatedReference[], today: LocalDate): { date: LocalDate; items: DatedReference[] } | null {
  const next = dated.find((d) => compareDates(d.start, today) >= 0);
  return next ? { date: next.start, items: referencesStartingOn(dated, next.start) } : null;
}

const ID_RE = /^cdc25-[a-z0-9-]+$/;
const DATE_WORDS = /\b(?:19|20)\d{2}-\d{2}-\d{2}\b|\b(?:january|february|march|april|may|june|july|august|september|october|november|december) \d{1,2}\b/i;

/** Build-time and unit-test validation of the bundled snapshot. Returns human-readable errors. */
export function validateVaccines(content: VaccineContent = VACCINE_CONTENT): string[] {
  const errors: string[] = [];
  const s = content.schedule;
  if (s.organization !== 'CDC') errors.push('schedule.organization must be CDC');
  for (const k of ['scheduleDate', 'retrieved', 'currencyChecked'] as const) if (!isValidLocalDate(s[k])) errors.push(`schedule.${k} is not a date`);
  if (!content.contentVersion.includes(s.scheduleDate)) errors.push('contentVersion must name the schedule date');
  const display = content.sources.filter((x) => x.role === 'display');
  if (display.length !== 1) errors.push('exactly one display source is required');
  for (const src of content.sources) {
    if (!/^https:\/\/www\.cdc\.gov\//.test(src.url)) errors.push(`${src.id}: source must be an https cdc.gov page`);
  }
  const vaccineIds = new Set(content.vaccines.map((v) => v.id));
  if (vaccineIds.size !== content.vaccines.length) errors.push('duplicate vaccine id');
  const seen = new Set<string>();
  for (const r of content.references) {
    if (!ID_RE.test(r.id)) errors.push(`${r.id}: bad id`);
    if (seen.has(r.id)) errors.push(`${r.id}: duplicate id`);
    seen.add(r.id);
    if (!vaccineIds.has(r.vaccine)) errors.push(`${r.id}: unknown vaccine ${r.vaccine}`);
    if (!r.dose.trim() || !r.cdcCell.trim() || r.cdcColumns.length === 0) errors.push(`${r.id}: dose, CDC cell and CDC columns are required`);
    const a = r.age;
    if (a.kind === 'single') {
      if (!Number.isInteger(a.months) || a.months < 1 || a.months > 83) errors.push(`${r.id}: single age out of range`);
      if (r.cdcColumns.length !== 1) errors.push(`${r.id}: a single age must come from one CDC column`);
    } else if (a.kind === 'range') {
      if (!Number.isInteger(a.fromMonths) || !Number.isInteger(a.throughMonths) || a.fromMonths < 0 || a.throughMonths <= a.fromMonths || a.throughMonths > 83) errors.push(`${r.id}: bad age range`);
    } else if (a.kind !== 'birth') errors.push(`${r.id}: unknown age kind`);
    if (r.ageLabel !== ageLabelOf(a)) errors.push(`${r.id}: age label “${r.ageLabel}” does not match its age (${ageLabelOf(a)})`);
    if (r.qualification !== undefined && !r.qualification.trim()) errors.push(`${r.id}: empty qualification`);
  }
  for (const v of vaccineIds) if (!content.references.some((r) => r.vaccine === v)) errors.push(`${v}: vaccine has no reference`);
  for (const d of content.discussion) {
    if (!ID_RE.test(d.id) || seen.has(d.id)) errors.push(`${d.id}: bad or duplicate id`);
    seen.add(d.id);
    if (!d.label.trim() || !d.ageLabel.trim() || !d.cdcText.trim() || !d.cdcKey.trim()) errors.push(`${d.id}: label, age, CDC text and CDC key are required`);
    // Undated by design: no calendar date may appear in a provider-discussion item.
    if ('age' in d || DATE_WORDS.test(`${d.ageLabel} ${d.cdcText} ${d.appNote ?? ''}`)) errors.push(`${d.id}: provider-discussion items must not carry a date`);
  }
  if (!content.moreGuidance.cdcIntro.trim() || content.moreGuidance.cdcItems.length === 0) errors.push('moreGuidance is required');
  // No stale seasonal product instructions (for example "2024–25 Moderna") anywhere in the snapshot.
  if (/20\d{2}[–-]\d{2}\b/.test(JSON.stringify({ r: content.references, d: content.discussion, m: content.moreGuidance }))) errors.push('seasonal product wording must not be included');
  return errors;
}
