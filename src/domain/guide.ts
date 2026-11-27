/**
 * What to Expect at Every Age — the read-only developmental guide (pure; no storage, no UI).
 *
 * Owner-approved Option A: original explanatory text written for this app, derived only from the
 * verified CDC milestones and registered CDC sources (src/content/guide.cdc-2022.json). The milestone
 * descriptions come from the milestone catalog; the screen shows them in the gender-neutral display
 * wording (milestoneDisplay.ts), which never changes the catalog.
 *
 * STRUCTURAL INDEPENDENCE: nothing here accepts child records, statuses, hidden flags or personal
 * versions. The guide for a range is a function of the range alone, so it is identical for every
 * child and can never change a record.
 */
import guideJson from '../content/guide.cdc-2022.json';
import { GENDERED_WORDS } from './milestoneDisplay';
import { INTERVALS, type AgeInterval } from './intervals';
import {
  APP_CATEGORIES, MILESTONES, PAGE_SOURCES, REFERENCE_SOURCES, getMilestone, intervalOf, isEmptyInterval, milestonesInInterval,
  neighbouringReferenceIntervals, referenceAgeLabel, referenceAgesIn, type AppCategory, type MilestoneDef,
} from './milestones';

export type GuideTextKind = 'original' | 'app';

export interface GuideParagraphs { kind: GuideTextKind; sources: string[]; paragraphs: string[] }
export interface GuideArea { category: AppCategory; kind: GuideTextKind; text: string; basis: string[] }
export interface GuideOverview { id: string; intervalIndex: number; referenceAges: number[]; kind: GuideTextKind; text: string; basis: string[] }
export interface GuideEmptyRange { intervalIndex: number; previousReferenceAge: number; nextReferenceAge: number }
export interface GuideContent {
  contentVersion: string;
  basis: string;
  movementHeading: string;
  shared: { about: GuideParagraphs; ranges: GuideParagraphs; motor: GuideParagraphs; overviewLabel: string; lastAge: string };
  areas: GuideArea[];
  overviews: GuideOverview[];
  emptyRanges: GuideEmptyRange[];
}

export const GUIDE: GuideContent = guideJson as GuideContent;

/** "By 18 months" → "by 18 months" (for use inside a sentence). */
export const inlineAge = (months: number) => referenceAgeLabel(months).replace(/^By /, 'by ');
/** "By 2 years" → "2 years" (for "reaches 2 years"). */
export const bareAge = (months: number) => referenceAgeLabel(months).replace(/^By /, '');

export interface GuideAreaBlock { category: AppCategory; label: string; explanation: string | null; milestones: MilestoneDef[] }
export interface GuideAgeGroup { referenceAgeMonths: number; label: string; areas: GuideAreaBlock[] }
export interface NeighbourAge { referenceAgeMonths: number; label: string; interval: AgeInterval }

export type GuideRange =
  | { kind: 'populated'; interval: AgeInterval; referenceAges: number[]; overview: GuideOverview; groups: GuideAgeGroup[]; next: NeighbourAge | null; isLast: boolean }
  | { kind: 'empty'; interval: AgeInterval; previous: NeighbourAge; next: NeighbourAge };

function neighbour(months: number): NeighbourAge {
  return { referenceAgeMonths: months, label: referenceAgeLabel(months), interval: intervalOf({ referenceAgeMonths: months }) };
}

/** The guide for one three-month viewing range. Takes no records: educational content is record-independent. */
export function guideFor(intervalIndex: number): GuideRange {
  const interval = INTERVALS[intervalIndex];
  if (!interval) throw new Error(`No viewing range ${intervalIndex}`);
  if (isEmptyInterval(intervalIndex)) {
    const e = GUIDE.emptyRanges.find((x) => x.intervalIndex === intervalIndex);
    if (!e) throw new Error(`Missing empty-range mapping for ${interval.label}`);
    return { kind: 'empty', interval, previous: neighbour(e.previousReferenceAge), next: neighbour(e.nextReferenceAge) };
  }
  const overview = GUIDE.overviews.find((o) => o.intervalIndex === intervalIndex);
  if (!overview) throw new Error(`Missing overview for ${interval.label}`);
  const ages = referenceAgesIn(intervalIndex);
  const inRange = milestonesInInterval(intervalIndex);
  const groups: GuideAgeGroup[] = ages.map((age, i) => ({
    referenceAgeMonths: age,
    label: referenceAgeLabel(age),
    // Area explanations appear once per range: with the first CDC age only (owner decision Q-2).
    areas: APP_CATEGORIES.map((c) => ({
      category: c.id,
      label: c.label,
      explanation: i === 0 ? GUIDE.areas.find((a) => a.category === c.id)!.text : null,
      milestones: inRange.filter((m) => m.referenceAgeMonths === age && m.appCategory === c.id).sort((a, b) => a.order - b.order),
    })),
  }));
  const later = MILESTONES.map((m) => m.referenceAgeMonths).filter((a) => a > Math.max(...ages));
  const nextAge = later.length ? Math.min(...later) : null;
  return { kind: 'populated', interval, referenceAges: ages, overview, groups, next: nextAge === null ? null : neighbour(nextAge), isLast: nextAge === null };
}

/** Every piece of guide text, for wording checks. */
export function allGuideText(content: GuideContent = GUIDE): string[] {
  const s = content.shared;
  return [
    ...s.about.paragraphs, ...s.ranges.paragraphs, ...s.motor.paragraphs, s.overviewLabel, s.lastAge,
    ...content.areas.map((a) => a.text), ...content.overviews.map((o) => o.text),
  ];
}

/** Wording the guide must never use (grading, diagnostic or prescriptive language). */
export const FORBIDDEN_GUIDE_WORDS = /\b(should|must|normal|abnormal|typical|on track|behind|delay(ed)?|red flag|warning sign|lagging|advanced|ahead of)\b/i;

/**
 * Build-time and unit-tested validation of the guide content. Traceability only: valid ids prove a
 * statement is linked to a verified milestone, not that it is accurate — the sentence-by-sentence
 * meaning review is documented in docs/reviews/CHECKPOINT_2A_GUIDE_CONTENT.md.
 */
export function validateGuide(content: GuideContent = GUIDE): string[] {
  const errors: string[] = [];
  const sourceIds = new Set<string>([...PAGE_SOURCES.map((p) => p.id), ...REFERENCE_SOURCES.map((r: { id: string }) => r.id), 'cdc-ltsae-pages', 'app']);
  for (const [name, block] of Object.entries({ about: content.shared.about, ranges: content.shared.ranges, motor: content.shared.motor })) {
    if (!block.paragraphs.length) errors.push(`shared.${name}: no text`);
    for (const id of block.sources) if (!sourceIds.has(id)) errors.push(`shared.${name}: unknown source ${id}`);
    if (block.kind !== 'original' && block.kind !== 'app') errors.push(`shared.${name}: kind must be original or app`);
  }

  // Areas: exactly the five app categories; basis milestones exist and belong to that category.
  const areaIds = content.areas.map((a) => a.category).sort();
  if (JSON.stringify(areaIds) !== JSON.stringify(APP_CATEGORIES.map((c) => c.id).sort())) errors.push('areas: must cover exactly the five app categories');
  for (const a of content.areas) {
    if (!a.basis.length) errors.push(`area ${a.category}: no basis`);
    for (const id of a.basis) {
      const m = getMilestone(id);
      if (!m) errors.push(`area ${a.category}: unknown milestone ${id}`);
      else if (m.appCategory !== a.category) errors.push(`area ${a.category}: ${id} belongs to ${m.appCategory}`);
    }
  }

  // Overviews: one per populated range, matching its CDC ages; basis traceable and covering every area present.
  const populated = INTERVALS.filter((iv) => !isEmptyInterval(iv.index)).map((iv) => iv.index);
  const ovIdx = content.overviews.map((o) => o.intervalIndex).sort((a, b) => a - b);
  if (JSON.stringify(ovIdx) !== JSON.stringify(populated)) errors.push(`overviews: expected ranges ${populated.join(',')}, found ${ovIdx.join(',')}`);
  const cited = new Set<string>();
  const allMilestoneText = MILESTONES.map((m) => m.text);
  for (const o of content.overviews) {
    const ages = referenceAgesIn(o.intervalIndex);
    if (JSON.stringify(o.referenceAges) !== JSON.stringify(ages)) errors.push(`${o.id}: reference ages ${o.referenceAges} ≠ range ages ${ages}`);
    if (o.kind !== 'original') errors.push(`${o.id}: overviews are original text`);
    const areasHere = new Set(MILESTONES.filter((m) => ages.includes(m.referenceAgeMonths)).map((m) => m.appCategory));
    const areasCited = new Set<string>();
    for (const id of o.basis) {
      const m = getMilestone(id);
      if (!m) { errors.push(`${o.id}: unknown milestone ${id}`); continue; }
      if (!ages.includes(m.referenceAgeMonths)) errors.push(`${o.id}: ${id} is not a ${ages.join('/')}-month milestone`);
      if (cited.has(id)) errors.push(`${o.id}: ${id} cited more than once`);
      cited.add(id);
      areasCited.add(m.appCategory);
    }
    for (const c of areasHere) if (!areasCited.has(c)) errors.push(`${o.id}: no example from ${c}`);
    // Quoted phrases inside original text must be exact CDC wording (age labels excepted).
    for (const q of o.text.match(/“[^”]+”/g) ?? []) {
      const inner = q.slice(1, -1);
      if (/^By \d/.test(inner)) continue;
      const basisText = o.basis.map((id) => getMilestone(id)?.text ?? '').join(' ');
      if (!basisText.includes(inner) && !allMilestoneText.some((t) => t.includes(inner))) errors.push(`${o.id}: quoted “${inner}” is not exact CDC wording`);
      else if (!basisText.includes(inner)) errors.push(`${o.id}: quoted “${inner}” is not from a cited milestone`);
    }
  }

  // Empty ranges: exactly the nine ranges without CDC milestones; neighbours are the real adjacent CDC ages.
  const empty = INTERVALS.filter((iv) => isEmptyInterval(iv.index)).map((iv) => iv.index);
  const emIdx = content.emptyRanges.map((e) => e.intervalIndex).sort((a, b) => a - b);
  if (JSON.stringify(emIdx) !== JSON.stringify(empty)) errors.push(`emptyRanges: expected ${empty.join(',')}, found ${emIdx.join(',')}`);
  for (const e of content.emptyRanges) {
    const n = neighbouringReferenceIntervals(e.intervalIndex);
    const prev = n.previous ? Math.max(...referenceAgesIn(n.previous.index)) : null;
    const next = n.next ? Math.min(...referenceAgesIn(n.next.index)) : null;
    if (e.previousReferenceAge !== prev || e.nextReferenceAge !== next) errors.push(`emptyRange ${e.intervalIndex}: expected ${prev}→${next}, found ${e.previousReferenceAge}→${e.nextReferenceAge}`);
  }

  for (const t of allGuideText(content)) {
    const bad = t.match(FORBIDDEN_GUIDE_WORDS);
    if (bad) errors.push(`forbidden wording “${bad[0]}” in: ${t.slice(0, 60)}…`);
    if (/checkpoint/i.test(t)) errors.push(`development terminology in: ${t.slice(0, 60)}…`);
    // R-004: the guide's own text is gender-neutral (milestone wording comes from the display layer).
    const gendered = t.match(GENDERED_WORDS);
    if (gendered) errors.push(`gendered wording “${gendered[0]}” in: ${t.slice(0, 60)}…`);
  }
  return errors;
}
