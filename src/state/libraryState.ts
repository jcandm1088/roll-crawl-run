/**
 * In-memory Milestone Library state (view, filters, search, scroll position) so returning from a
 * milestone restores the Library as it was left. Never written to storage; cleared on reload.
 * Kept for one child only: another child always starts from the default view.
 */
import type { LibraryFilters } from '../domain/library';

export interface LibraryState { childId: string; filters: LibraryFilters; scrollY: number }
let saved: LibraryState | null = null;

export function loadLibraryState(childId: string): LibraryState | null {
  return saved && saved.childId === childId ? saved : null;
}
export function saveLibraryState(s: LibraryState): void {
  saved = s;
}
export function clearLibraryState(): void {
  saved = null;
}
