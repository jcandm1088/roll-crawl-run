/**
 * Milestone Library selection (pure). The Library is the place to RECORD milestones.
 *
 * Views (owner-approved):
 * - now      "Up to now": applicable milestones (reference age ≤ milestone age), most recent CDC age first.
 * - upcoming "Upcoming": not yet applicable, nearest CDC age first.
 * - all      "All 159": youngest CDC age first.
 * Within a CDC age: the five app areas in their established order, then CDC's own order.
 */
import { APP_CATEGORIES, MILESTONES, isApplicable, type AppCategory, type MilestoneDef, type MilestoneStatus, type RecordState } from './milestones';

export type LibraryView = 'now' | 'upcoming' | 'all';
export type LibraryArea = AppCategory | 'all' | 'personal';
export interface LibraryFilters { view: LibraryView; query: string; area: LibraryArea; age: number | 'all'; status: MilestoneStatus | 'all'; showHidden: boolean }

export const DEFAULT_FILTERS: LibraryFilters = { view: 'now', query: '', area: 'all', age: 'all', status: 'all', showHidden: false };

const areaRank = new Map(APP_CATEGORIES.map((c, i) => [c.id, i]));

export function inView(def: Pick<MilestoneDef, 'referenceAgeMonths'>, view: LibraryView, milestoneAgeMonths: number | null): boolean {
  if (view === 'all') return true;
  const applies = isApplicable(def, milestoneAgeMonths);
  return view === 'now' ? applies : !applies;
}

export function sortForView(defs: readonly MilestoneDef[], view: LibraryView): MilestoneDef[] {
  const dir = view === 'now' ? -1 : 1;
  return [...defs].sort((a, b) =>
    dir * (a.referenceAgeMonths - b.referenceAgeMonths) || areaRank.get(a.appCategory)! - areaRank.get(b.appCategory)! || a.order - b.order);
}

/** Sourced milestones matching the filters, in the view's order. */
export function selectSourced(filters: LibraryFilters, milestoneAgeMonths: number | null, records: ReadonlyMap<string, RecordState>): MilestoneDef[] {
  if (filters.area === 'personal') return [];
  const q = filters.query.trim().toLowerCase();
  const picked = MILESTONES.filter((d) => {
    const r = records.get(d.id);
    return inView(d, filters.view, milestoneAgeMonths) &&
      (filters.showHidden ? !!r?.hidden : !r?.hidden) &&
      (filters.area === 'all' || d.appCategory === filters.area) &&
      (filters.age === 'all' || d.referenceAgeMonths === filters.age) &&
      (filters.status === 'all' || (r?.status ?? 'not-yet') === filters.status) &&
      (!q || d.text.toLowerCase().includes(q));
  });
  return sortForView(picked, filters.view);
}

/** Counts for the view control and catalog label: totals never depend on filters. */
export function viewCounts(milestoneAgeMonths: number | null, records: ReadonlyMap<string, RecordState>) {
  const visible = (d: MilestoneDef) => !records.get(d.id)?.hidden;
  const now = MILESTONES.filter((d) => visible(d) && isApplicable(d, milestoneAgeMonths)).length;
  const hidden = MILESTONES.filter((d) => !visible(d)).length;
  return { catalog: MILESTONES.length, visible: MILESTONES.length - hidden, hidden, now, upcoming: MILESTONES.length - hidden - now };
}

/** When a search finds nothing in the current view, how many matches exist in the other views. */
export function matchesElsewhere(filters: LibraryFilters, milestoneAgeMonths: number | null, records: ReadonlyMap<string, RecordState>): Record<LibraryView, number> {
  const out = { now: 0, upcoming: 0, all: 0 } as Record<LibraryView, number>;
  for (const v of ['now', 'upcoming', 'all'] as const) out[v] = selectSourced({ ...filters, view: v }, milestoneAgeMonths, records).length;
  return out;
}
