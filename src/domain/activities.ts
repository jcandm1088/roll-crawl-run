/**
 * Recommended activities: CDC's “Tips and activities” from the 12 registered milestone pages
 * (Checkpoint 2b, owner-approved D2, D3, D4). Content and validation only — no storage, no UI.
 *
 * - `source` is CDC's exact wording and is never changed. `display` is that text with ONLY the declared
 *   gender-neutral replacements (pronouns, “his or her”, and verb agreement) and one declared, disclosed
 *   typographical correction. `validateActivities` proves this for every display field, at build time.
 * - `segments` split the display text into its sentences (joined, they equal it exactly) so a page can
 *   show CDC's purpose sentence and highlight safety sentences without repeating any sentence.
 * - Titles, areas, grouping, materials phrases, segment roles and `safetySensitive` are the app's
 *   editorial organization, labelled as such. Ids are locked (activity-ids.lock.json).
 * - Reference ages are CDC's 12 ages. They give context, not individual readiness or suitability.
 * Nothing here prescribes a frequency, duration or repetition: time words in CDC's text stay in the text.
 */
import json from '../content/activities.cdc-2022.json';
import { PAGE_SOURCES, REFERENCE_AGES, type AppCategory, type PageSource } from './milestones';
import { GENDERED_WORDS } from './milestoneDisplay';

export type SegmentRole = 'step' | 'purpose' | 'safety';
export interface Segment { role: SegmentRole; text: string }

export interface ActivityRecord {
  id: string;
  sourceId: string;
  referenceAgeMonths: number;
  source: string;
  replacements: Array<[string, string]>;
  corrections?: Array<[string, string]>;
  display: string;
  segments: Segment[];
  timingLanguage?: string[];
}

export interface ActivityMaterial { phrase: string; example: boolean }

export interface Activity {
  id: string;
  title: string;
  appCategory: AppCategory;
  recordIds: string[];
  materials?: ActivityMaterial[];
  safetySensitive: boolean;
}

export interface PageGuidance { referenceAgeMonths: number; source: string; replacements: Array<[string, string]>; display: string }

export interface ActivityContent {
  format: string;
  version: number;
  contentVersion: string;
  retrieved: string;
  basis: string;
  pageGuidance: Record<string, PageGuidance>;
  records: ActivityRecord[];
  activities: Activity[];
}

export const ACTIVITY_CONTENT = json as unknown as ActivityContent;
export const ACTIVITIES: readonly Activity[] = ACTIVITY_CONTENT.activities;
export const ACTIVITY_RECORDS: readonly ActivityRecord[] = ACTIVITY_CONTENT.records;
export const ACTIVITY_CONTENT_VERSION = ACTIVITY_CONTENT.contentVersion;

const recordById = new Map(ACTIVITY_RECORDS.map((r) => [r.id, r]));
const activityById = new Map(ACTIVITIES.map((a) => [a.id, a]));

export const getActivity = (id: string) => activityById.get(id);
export const getActivityRecord = (id: string) => recordById.get(id);
export const recordsOf = (a: Activity): ActivityRecord[] => a.recordIds.map((id) => recordById.get(id)!).filter(Boolean);
export const pageSourceOf = (r: ActivityRecord): PageSource | undefined => PAGE_SOURCES.find((s) => s.id === r.sourceId);
export const guidanceFor = (r: ActivityRecord): PageGuidance | undefined => ACTIVITY_CONTENT.pageGuidance[r.sourceId];

/** CDC ages at which an activity appears. */
export const agesOf = (a: Activity) => [...new Set(recordsOf(a).map((r) => r.referenceAgeMonths))].sort((x, y) => x - y);

/** CDC's age wording for its tips pages: “2-month-olds”, “1-year-olds”, “30-month-olds”. */
export function ageOlds(months: number): string {
  if (months === 12) return '1-year-olds';
  if (months >= 24 && months % 12 === 0) return `${months / 12}-year-olds`;
  return `${months}-month-olds`;
}
/** Singular, as on CDC's pages: “2-month-old”, “1-year-old”. */
export const ageOld = (months: number) => ageOlds(months).slice(0, -1);
export function ageName(months: number): string {
  if (months === 12) return '1 year';
  if (months >= 24 && months % 12 === 0) return `${months / 12} years`;
  return `${months} months`;
}

/** The record to show for an activity at a selected age (the record from that page, else the first). */
export function recordForAge(a: Activity, age: number | 'all' | null): ActivityRecord {
  const rs = recordsOf(a);
  return (typeof age === 'number' ? rs.find((r) => r.referenceAgeMonths === age) : undefined) ?? rs[0]!;
}

export function activitiesAt(age: number | 'all'): Activity[] {
  if (age === 'all') return [...ACTIVITIES];
  return ACTIVITIES.filter((a) => recordsOf(a).some((r) => r.referenceAgeMonths === age));
}

export type BrowseDefault =
  | { kind: 'age'; age: number; olderThanFive: boolean }
  /** Younger than 2 months, or before the corrected due date: nothing is presented as for this child. */
  | { kind: 'too-young'; beforeDueDate: boolean };

/**
 * D2: default to the most recently reached CDC reference age, using the child's milestone age
 * (chronological or corrected, as the parent chose). 3 → 2, 5 → 4, 7 → 6, 10 → 9, 14 → 12, 20 → 18,
 * 40 → 36, over 60 → 60. Under 2 months (or before the due date): no default age.
 */
export function browseDefault(milestoneAgeMonths: number | null): BrowseDefault {
  if (milestoneAgeMonths === null) return { kind: 'too-young', beforeDueDate: true };
  if (milestoneAgeMonths < REFERENCE_AGES[0]) return { kind: 'too-young', beforeDueDate: false };
  let reached: number = REFERENCE_AGES[0];
  for (const a of REFERENCE_AGES) if (a <= milestoneAgeMonths) reached = a;
  return { kind: 'age', age: reached, olderThanFive: milestoneAgeMonths > 60 };
}

/** Purpose sentence(s), safety sentences and the instruction text of a record, without repetition. */
export function splitRecord(r: ActivityRecord) {
  return {
    purpose: r.segments.filter((s) => s.role === 'purpose').map((s) => s.text),
    instructions: r.segments.filter((s) => s.role !== 'purpose'),
    safety: r.segments.filter((s) => s.role === 'safety').map((s) => s.text),
  };
}

// ---------------------------------------------------------------------------
// Validation (build time and unit tests)
// ---------------------------------------------------------------------------

const PRONOUNS = new Set(['he', 'she', 'his', 'her', 'hers', 'him', 'himself', 'herself', 'his or her']);
const NEUTRAL = new Set(['they', 'them', 'their', 'theirs', 'themselves']);
/** Verb agreement for singular “they” (milestone rules plus the approved -ies → -y extension, D4). */
function isAgreement(from: string, to: string): boolean {
  const f = from.toLowerCase();
  const t = to.toLowerCase();
  if ((f === 'is' && t === 'are') || (f === 'has' && t === 'have') || (f === 'was' && t === 'were') || (f === 'does' && t === 'do')) return true;
  if ((f === 'doesn’t' || f === "doesn't") && (t === 'don’t' || t === "don't")) return true;
  if (f.endsWith('ies') && t === `${f.slice(0, -3)}y`) return true;
  return /^[a-z]+s$/.test(f) && (t === f.slice(0, -1) || (f.endsWith('es') && t === f.slice(0, -2)));
}
const isPronounSwap = (from: string, to: string) => PRONOUNS.has(from.toLowerCase()) && NEUTRAL.has(to.toLowerCase());
const isContraction = (from: string, to: string) => /^(he|she)['’]s$/i.test(from) && /^they['’]re$/i.test(to);

/** Applies whole-word/phrase replacements in order, each searched after the previous one. Null if one isn't found. */
export function applyOrdered(source: string, pairs: ReadonlyArray<readonly [string, string]>): string | null {
  let out = '';
  let rest = source;
  for (const [from, to] of pairs) {
    const re = new RegExp(`(?<![A-Za-z’'])${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z’'])`);
    const m = re.exec(rest);
    if (!m) return null;
    out += rest.slice(0, m.index) + to;
    rest = rest.slice(m.index + from.length);
  }
  return out + rest;
}

/** Declared typographical corrections (owner-approved D4; disclosed on the activity page). */
export const APPROVED_CORRECTIONS: ReadonlyArray<readonly [string, string]> = [['you child', 'your child']];

export function validateActivities(
  content: ActivityContent = ACTIVITY_CONTENT,
  lock?: Record<string, string>,
  hash?: (s: string) => string,
  sources: readonly PageSource[] = PAGE_SOURCES,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const sourceIds = new Set(sources.map((s) => s.id));
  const recIds = new Set(content.records.map((r) => r.id));
  const used = new Set<string>();
  const checkDisplayText = (id: string, source: string, display: string, replacements: Array<[string, string]>, corrections: Array<[string, string]> = []) => {
    for (const [from, to] of replacements) {
      if (!(isPronounSwap(from, to) || isAgreement(from, to) || isContraction(from, to))) errors.push(`${id}: replacement “${from}” → “${to}” isn't a pronoun or agreement change`);
    }
    for (const c of corrections) if (!APPROVED_CORRECTIONS.some(([f, t]) => f === c[0] && t === c[1])) errors.push(`${id}: undeclared correction “${c[0]}”`);
    // Corrections are applied after replacements, each from its own position in the text.
    let rebuilt = applyOrdered(source, replacements);
    for (const [f, t] of corrections) rebuilt = rebuilt?.replace(f, t) ?? null;
    if (rebuilt === null) errors.push(`${id}: a replacement wasn't found in the source`);
    else if (rebuilt !== display) errors.push(`${id}: display text isn't exactly the source with the declared changes`);
    if (GENDERED_WORDS.test(display) || /\bhis or her\b/i.test(display)) errors.push(`${id}: gendered wording in display text`);
    if ((source.match(/\d+/g) ?? []).join() !== (display.match(/\d+/g) ?? []).join()) errors.push(`${id}: numbers differ`);
  };
  for (const r of content.records) {
    if (ids.has(r.id)) errors.push(`${r.id}: duplicate id`);
    ids.add(r.id);
    if (!/^cdc22-act-m\d+-\d\d$/.test(r.id)) errors.push(`${r.id}: malformed id`);
    if (!sourceIds.has(r.sourceId)) errors.push(`${r.id}: unregistered source ${r.sourceId}`);
    const page = sources.find((s) => s.id === r.sourceId);
    if (page && page.referenceAgeMonths !== r.referenceAgeMonths) errors.push(`${r.id}: age doesn't match its page`);
    if (!(REFERENCE_AGES as readonly number[]).includes(r.referenceAgeMonths)) errors.push(`${r.id}: not a CDC reference age`);
    checkDisplayText(r.id, r.source, r.display, r.replacements, r.corrections);
    // Every display field shown to parents is a sentence of the validated display text.
    if (r.segments.map((s) => s.text).join(' ') !== r.display) errors.push(`${r.id}: segments don't rebuild the display text`);
    for (const s of r.segments) if (!['step', 'purpose', 'safety'].includes(s.role)) errors.push(`${r.id}: unknown segment role`);
    if (lock && hash) {
      if (!lock[r.id]) errors.push(`${r.id}: not in the lock file`);
      else if (lock[r.id] !== hash(`${r.referenceAgeMonths}|${r.source}`)) errors.push(`${r.id}: content changed for a locked id`);
    }
  }
  const areas = new Set(['gross-motor', 'fine-motor', 'cognitive', 'language-communication', 'social-emotional']);
  for (const a of content.activities) {
    if (ids.has(a.id)) errors.push(`${a.id}: duplicate id`);
    ids.add(a.id);
    if (!/^cdc22-act-a\d{3}$/.test(a.id)) errors.push(`${a.id}: malformed id`);
    if (!a.title.trim() || a.title.length > 60) errors.push(`${a.id}: title`);
    if (GENDERED_WORDS.test(a.title)) errors.push(`${a.id}: gendered title`);
    if (!areas.has(a.appCategory)) errors.push(`${a.id}: unknown area`);
    if (a.recordIds.length === 0) errors.push(`${a.id}: no source records`);
    for (const rid of a.recordIds) {
      if (!recIds.has(rid)) errors.push(`${a.id}: unknown record ${rid}`);
      if (used.has(rid)) errors.push(`${a.id}: record ${rid} used twice`);
      used.add(rid);
    }
    // Grouped records must carry the same safety sentences (distinct qualifications are never collapsed).
    const recs = a.recordIds.map((id) => content.records.find((r) => r.id === id)).filter((r): r is ActivityRecord => !!r);
    const safety = recs.map((r) => r.segments.filter((s) => s.role === 'safety').map((s) => s.text).join('|'));
    if (new Set(safety).size > 1) errors.push(`${a.id}: grouped records have different safety sentences`);
    for (const m of a.materials ?? []) {
      if (!recs.some((r) => r.display.toLowerCase().includes(m.phrase.toLowerCase()))) errors.push(`${a.id}: material “${m.phrase}” isn't in the CDC text`);
      if (GENDERED_WORDS.test(m.phrase)) errors.push(`${a.id}: gendered material phrase`);
    }
    if (lock && hash) {
      if (!lock[a.id]) errors.push(`${a.id}: not in the lock file`);
      else if (lock[a.id] !== hash(a.recordIds.join('|'))) errors.push(`${a.id}: records changed for a locked id`);
    }
  }
  for (const id of recIds) if (!used.has(id)) errors.push(`${id}: record not used by any activity`);
  for (const [pid, g] of Object.entries(content.pageGuidance)) {
    if (!sourceIds.has(pid)) errors.push(`${pid}: guidance for an unregistered page`);
    checkDisplayText(`guidance ${pid}`, g.source, g.display, g.replacements);
  }
  for (const r of content.records) if (!content.pageGuidance[r.sourceId]) errors.push(`${r.id}: no page guidance`);
  return errors;
}
