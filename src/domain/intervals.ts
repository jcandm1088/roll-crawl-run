/**
 * Three-month viewing intervals from birth through 60 months (approved D2, option A).
 *
 * - Checkpoint 2a (owner-approved): the child's CURRENT interval uses the SAME
 *   rule as milestone placement — start < A ≤ end, where A is the milestone
 *   age in completed calendar months — so a milestone that has just become
 *   applicable (e.g. "By 6 months" at exactly 6 months) is always shown in the
 *   current interval and never "disappears" at a boundary. A = 0 (newborn, or
 *   no milestone age yet before a corrected due date) uses 0–3 months; ages of
 *   60 months and older use the last interval (57–60 months).
 *   (This replaces the Checkpoint 1 rule [start, end), which was not yet used by any screen.)
 * - A milestone published as "By X months" belongs to the interval that
 *   ENDS at X (start < X ≤ end): "By 6 months" → "3–6 months",
 *   "By 60 months (5 years)" → "57–60 months".
 *
 * Intervals are organizational only; they never change a milestone's
 * published reference age.
 */

export interface AgeInterval {
  index: number;
  startMonths: number;
  endMonths: number;
  label: string;
}

export const INTERVAL_MONTHS = 3;
export const MAX_MONTHS = 60;

export const INTERVALS: readonly AgeInterval[] = Array.from({ length: MAX_MONTHS / INTERVAL_MONTHS }, (_, index) => {
  const startMonths = index * INTERVAL_MONTHS;
  const endMonths = startMonths + INTERVAL_MONTHS;
  return { index, startMonths, endMonths, label: `${startMonths}–${endMonths} months` };
});

export function intervalForAge(completedMonths: number | null): AgeInterval {
  if (completedMonths === null || completedMonths <= 0) return INTERVALS[0]!;
  const index = Math.min(Math.ceil(completedMonths / INTERVAL_MONTHS) - 1, INTERVALS.length - 1);
  return INTERVALS[index]!;
}

/** Interval for a milestone with reference age "By X months"; null when outside 0 < X ≤ 60. */
export function intervalForReferenceAge(referenceMonths: number): AgeInterval | null {
  if (!(referenceMonths > 0) || referenceMonths > MAX_MONTHS) return null;
  return INTERVALS[Math.ceil(referenceMonths / INTERVAL_MONTHS) - 1] ?? null;
}
