import type { RecordEnvelope } from '../types';

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(clock: () => Date = () => new Date()): string {
  return clock().toISOString();
}

export function newEnvelope(deviceId: string, clock?: () => Date): RecordEnvelope {
  const ts = nowIso(clock);
  return { id: newId(), createdAt: ts, updatedAt: ts, deletedAt: null, rev: 1, originDeviceId: deviceId, lastModifiedBy: deviceId };
}

/** Returns a copy marked as modified by this device: new timestamp, incremented revision. */
export function touch<T extends RecordEnvelope>(record: T, deviceId: string, clock?: () => Date): T {
  return { ...record, updatedAt: nowIso(clock), rev: record.rev + 1, lastModifiedBy: deviceId };
}
