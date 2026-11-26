/**
 * Milestone catalog and pure calculations (no storage, no UI).
 *
 * Content: the 159 CDC "Learn the Signs. Act Early." milestones (2022 revision,
 * CDC web pages content-reviewed May 15, 2026), copied verbatim — wording and
 * pronouns unchanged. See docs/SOURCE_REGISTER.md.
 */
import catalogJson from '../content/milestones.cdc-2022.json';
import sourcesJson from '../content/sources.json';
import { INTERVALS, intervalForReferenceAge, type AgeInterval } from './intervals';

export type CdcCategory = 'Social/Emotional' | 'Language/Communication' | 'Cognitive' | 'Movement/Physical';
export type AppCategory = 'gross-motor' | 'fine-motor' | 'cognitive' | 'language-communication' | 'social-emotional';
export type MilestoneStatus = 'not-yet' | 'emerging' | 'achieved';

export interface MilestoneDef {
  id: string;
  sourceId: string;
  referenceAgeMonths: number;
  referenceAgeLabel: string;
  cdcCategory: CdcCategory;
  appCategory: AppCategory;
  order: number;
  text: string;
  classificationNote?: string;
}

export interface PageSource {
  id: string;
  organization: string;
  program: string;
  title: string;
  url: string;
  referenceAgeMonths: number;
  contentLastReviewed: string;
  pageFirstPublished: string;
  pageLastUpdated: string;
  milestoneRevision: string;
  retrieved: string;
  printableChecklist: string;
  license: string;
}

export const MILESTONES: readonly MilestoneDef[] = (catalogJson.items as MilestoneDef[]).slice();
export const CONTENT_VERSION: string = catalogJson.contentVersion;
export const PAGE_SOURCES: readonly PageSource[] = sourcesJson.pageSources as PageSource[];
export const REFERENCE_SOURCES = sourcesJson.referenceSources;

/** The twelve published CDC reference ages (months). */
export const REFERENCE_AGES = [2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60] as const;
export const SOURCED_MAX_MONTHS = 60;

/** Approved counts (owner-reviewed inventory). Build-time validation enforces these. */
export const EXPECTED_COUNTS: Record<AppCategory, number> = {
  'gross-motor': 20,
  'fine-motor': 24,
  cognitive: 33,
  'language-communication': 40,
  'social-emotional': 42,
};
export const EXPECTED_TOTAL = 159;

/** Display order and labels. Gross/fine is an app classification of CDC's Movement/Physical category. */
export const APP_CATEGORIES: ReadonlyArray<{ id: AppCategory; label: string; short: string }> = [
  { id: 'gross-motor', label: 'Gross motor', short: 'Gross motor' },
  { id: 'fine-motor', label: 'Fine motor', short: 'Fine motor' },
  { id: 'cognitive', label: 'Cognitive', short: 'Cognitive' },
  { id: 'language-communication', label: 'Language & communication', short: 'Language' },
  { id: 'social-emotional', label: 'Social & emotional', short: 'Social' },
];
export const appCategoryLabel = (c: AppCategory) => APP_CATEGORIES.find((x) => x.id === c)!.label;

export const CDC_CATEGORY_FOR_APP: Record<AppCategory, CdcCategory> = {
  'gross-motor': 'Movement/Physical',
  'fine-motor': 'Movement/Physical',
  cognitive: 'Cognitive',
  'language-communication': 'Language/Communication',
  'social-emotional': 'Social/Emotional',
};

export const STATUS_LABEL: Record<MilestoneStatus, string> = {
  'not-yet': 'Not yet observed',
  emerging: 'Emerging',
  achieved: 'Achieved',
};

const byId = new Map(MILESTONES.map((m) => [m.id, m]));
export const getMilestone = (id: string) => byId.get(id);
export const sourceFor = (def: Pick<MilestoneDef, 'sourceId'>) => PAGE_SOURCES.find((s) => s.id === def.sourceId);

export function referenceAgeLabel(months: number): string {
  return MILESTONES.find((m) => m.referenceAgeMonths === months)?.referenceAgeLabel ?? `By ${months} months`;
}

// ---------------------------------------------------------------------------
// Intervals
// ---------------------------------------------------------------------------

export function intervalOf(def: Pick<MilestoneDef, 'referenceAgeMonths'>): AgeInterval {
  return intervalForReferenceAge(def.referenceAgeMonths)!;
}

export function milestonesInInterval(index: number): MilestoneDef[] {
  return MILESTONES.filter((m) => intervalOf(m).index === index);
}

export function isEmptyInterval(index: number): boolean {
  return milestonesInInterval(index).length === 0;
}

/** Nearest earlier / later interval that contains published milestones (for empty-interval navigation). */
export function neighbouringReferenceIntervals(index: number): { previous: AgeInterval | null; next: AgeInterval | null } {
  let previous: AgeInterval | null = null;
  let next: AgeInterval | null = null;
  for (let i = index - 1; i >= 0; i--) if (!isEmptyInterval(i)) { previous = INTERVALS[i]!; break; }
  for (let i = index + 1; i < INTERVALS.length; i++) if (!isEmptyInterval(i)) { next = INTERVALS[i]!; break; }
  return { previous, next };
}

/** Published reference ages placed in an interval, e.g. [4, 6] for 3–6 months. */
export function referenceAgesIn(index: number): number[] {
  return [...new Set(milestonesInInterval(index).map((m) => m.referenceAgeMonths))].sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Applicability and progress
// ---------------------------------------------------------------------------

/**
 * A sourced milestone is APPLICABLE when the child's milestone age (completed calendar months,
 * chronological by default or corrected if chosen) has reached its published reference age.
 * Before a corrected due date the milestone age is null → nothing is applicable.
 * Early recordings are allowed but do not count until the milestone becomes applicable.
 */
export function isApplicable(def: Pick<MilestoneDef, 'referenceAgeMonths'>, milestoneAgeMonths: number | null): boolean {
  return milestoneAgeMonths !== null && def.referenceAgeMonths <= milestoneAgeMonths;
}

export interface RecordState {
  status: MilestoneStatus;
  hidden: boolean;
}

export type ProgressState = 'ok' | 'none-applicable' | 'all-hidden';

export interface CategoryProgress {
  category: AppCategory | 'all';
  /** Applicable and visible (the denominator). */
  applicable: number;
  achieved: number;
  emerging: number;
  notYet: number;
  /** Applicable but hidden by the parent (excluded from the calculation). */
  hidden: number;
  state: ProgressState;
  /** Whole-number percentage, or null when there is nothing to calculate. */
  percent: number | null;
}

function summarize(category: AppCategory | 'all', defs: readonly MilestoneDef[], records: ReadonlyMap<string, RecordState>): CategoryProgress {
  let applicable = 0, achieved = 0, emerging = 0, notYet = 0, hidden = 0;
  for (const d of defs) {
    const r = records.get(d.id);
    if (r?.hidden) { hidden++; continue; }
    applicable++;
    const s = r?.status ?? 'not-yet';
    if (s === 'achieved') achieved++;
    else if (s === 'emerging') emerging++;
    else notYet++;
  }
  const state: ProgressState = applicable > 0 ? 'ok' : hidden > 0 ? 'all-hidden' : 'none-applicable';
  return { category, applicable, achieved, emerging, notYet, hidden, state, percent: applicable > 0 ? Math.round((achieved / applicable) * 100) : null };
}

function byCategory(defs: readonly MilestoneDef[], records: ReadonlyMap<string, RecordState>) {
  const out = APP_CATEGORIES.map((c) => summarize(c.id, defs.filter((d) => d.appCategory === c.id), records));
  return { categories: out, overall: summarize('all', defs, records) };
}

/**
 * CURRENT (cumulative) progress for the child's actual milestone age.
 * Formula: achieved ÷ applicable, counting only visible, sourced milestones whose reference age
 * has been reached. Emerging gets no partial credit; hidden and future milestones are excluded.
 * Personal versions (custom milestones) are never included.
 */
export function currentProgress(milestoneAgeMonths: number | null, records: ReadonlyMap<string, RecordState>) {
  return byCategory(MILESTONES.filter((m) => isApplicable(m, milestoneAgeMonths)), records);
}

/** "In this interval": all visible milestones placed in the interval (descriptive; may be future ones). */
export function intervalProgress(index: number, records: ReadonlyMap<string, RecordState>) {
  return byCategory(milestonesInInterval(index), records);
}

/** "Cumulative through [interval end]": visible milestones with reference age ≤ the interval's end. */
export function cumulativeThroughInterval(index: number, records: ReadonlyMap<string, RecordState>) {
  const end = INTERVALS[index]!.endMonths;
  return byCategory(MILESTONES.filter((m) => m.referenceAgeMonths <= end), records);
}

// ---------------------------------------------------------------------------
// Content validation (run by unit tests AND at build time — see vite.config.ts)
// ---------------------------------------------------------------------------

export function validateContent(
  items: readonly MilestoneDef[],
  pageSources: readonly { id: string; url: string; organization: string; referenceAgeMonths: number; license: string }[],
  idLock: Record<string, string>,
  hash: (s: string) => string,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const texts = new Set<string>();
  const appForCdc: Record<CdcCategory, AppCategory[]> = {
    'Social/Emotional': ['social-emotional'],
    'Language/Communication': ['language-communication'],
    Cognitive: ['cognitive'],
    'Movement/Physical': ['gross-motor', 'fine-motor'],
  };
  const counts: Record<string, number> = {};
  for (const m of items) {
    if (!/^cdc22-m\d{2}-(se|lc|cg|mp)-\d{2}$/.test(m.id)) errors.push(`${m.id}: malformed id`);
    if (ids.has(m.id)) errors.push(`${m.id}: duplicate id`);
    ids.add(m.id);
    const key = `${m.referenceAgeMonths}|${m.text.trim().toLowerCase()}`;
    if (texts.has(key)) errors.push(`${m.id}: duplicate content`);
    texts.add(key);
    if (!m.text || m.text.trim() !== m.text) errors.push(`${m.id}: empty or untrimmed text`);
    if (!(REFERENCE_AGES as readonly number[]).includes(m.referenceAgeMonths)) errors.push(`${m.id}: unapproved reference age ${m.referenceAgeMonths}`);
    const src = pageSources.find((s) => s.id === m.sourceId);
    if (!src) errors.push(`${m.id}: unknown source ${m.sourceId}`);
    else {
      if (src.referenceAgeMonths !== m.referenceAgeMonths) errors.push(`${m.id}: source age mismatch`);
      if (!/^https:\/\/www\.cdc\.gov\//.test(src.url) || !/CDC/.test(src.organization)) errors.push(`${m.id}: source must be a CDC page with attribution`);
      if (src.license !== 'us-government-public-domain') errors.push(`${m.id}: source reuse basis missing`);
    }
    if (!appForCdc[m.cdcCategory]) errors.push(`${m.id}: unknown CDC category ${m.cdcCategory}`);
    else if (!appForCdc[m.cdcCategory].includes(m.appCategory)) errors.push(`${m.id}: app category ${m.appCategory} not allowed for ${m.cdcCategory}`);
    const iv = intervalForReferenceAge(m.referenceAgeMonths);
    if (!iv || !(iv.startMonths < m.referenceAgeMonths && m.referenceAgeMonths <= iv.endMonths)) errors.push(`${m.id}: interval mapping`);
    if (!m.referenceAgeLabel.startsWith('By ')) errors.push(`${m.id}: reference label`);
    counts[m.appCategory] = (counts[m.appCategory] ?? 0) + 1;
    const locked = idLock[m.id];
    if (!locked) errors.push(`${m.id}: not in milestone-ids.lock.json (new ids must be added deliberately)`);
    else if (locked !== hash(`${m.referenceAgeMonths}|${m.cdcCategory}|${m.text}`)) errors.push(`${m.id}: content changed for a locked id`);
  }
  for (const id of Object.keys(idLock)) if (!ids.has(id)) errors.push(`${id}: locked id missing from catalog (ids must never be removed or reused)`);
  if (items.length !== EXPECTED_TOTAL) errors.push(`expected ${EXPECTED_TOTAL} milestones, found ${items.length}`);
  for (const [c, n] of Object.entries(EXPECTED_COUNTS)) if (counts[c] !== n) errors.push(`expected ${n} ${c}, found ${counts[c] ?? 0}`);
  return errors;
}
