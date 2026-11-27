/**
 * Recording timestamps that always increase on this device, so history order is exact even when
 * several entries are recorded within the same millisecond. Shared by milestone history and by the
 * personal goal/exercise history (one sequence for the whole app).
 */
let lastRecordedMs = 0;
export function monotonicRecordedAt(): string {
  lastRecordedMs = Math.max(Date.now(), lastRecordedMs + 1);
  return new Date(lastRecordedMs).toISOString();
}
