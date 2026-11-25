import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { openRcrDb, type RcrDB } from '../../src/data/db';
import { ensureMeta } from '../../src/data/repositories/metaRepo';
import { listChildren, saveChildProfile } from '../../src/data/repositories/childrenRepo';
import { newId } from '../../src/data/envelope';
import { THEMES } from '../../src/ui/theme/themes';
import { SAMPLE_CHILD_A } from '../fixtures/children';

let db: RcrDB;
let deviceId: string;
let n = 0;
beforeEach(async () => {
  db = await openRcrDb(`profile-save-${++n}`);
  deviceId = (await ensureMeta(db)).deviceId;
});
afterEach(() => db.close());

/** A value IndexedDB cannot store (functions can't be cloned) → simulates a storage failure mid-save. */
const UNSTORABLE_PHOTO = { kind: 'set' as const, blob: (() => undefined) as unknown as Blob, width: 1, height: 1 };

describe('atomic profile + photo saving', () => {
  it('saves a new profile and its photo together', async () => {
    const id = newId();
    const child = await saveChildProfile(db, deviceId, { id, input: SAMPLE_CHILD_A, photo: { kind: 'set', blob: new Blob(['p']), width: 2, height: 2 } });
    expect(child.id).toBe(id);
    expect(child.photoId).not.toBeNull();
    expect(await db.count('photos')).toBe(1);
  });

  it('leaves NOTHING behind when the photo fails to save for a new profile', async () => {
    const id = newId();
    await expect(saveChildProfile(db, deviceId, { id, input: SAMPLE_CHILD_A, photo: UNSTORABLE_PHOTO })).rejects.toThrow();
    expect(await db.count('children')).toBe(0);
    expect(await db.count('photos')).toBe(0);
  });

  it('keeps the previous profile and photo intact when an update fails', async () => {
    const id = newId();
    const original = await saveChildProfile(db, deviceId, { id, input: SAMPLE_CHILD_A, photo: { kind: 'set', blob: new Blob(['old']), width: 1, height: 1 } });
    await expect(
      saveChildProfile(db, deviceId, { id, input: { ...SAMPLE_CHILD_A, name: 'Changed Name' }, photo: UNSTORABLE_PHOTO }),
    ).rejects.toThrow();
    const after = await db.get('children', id);
    expect(after).toEqual(original);
    expect(await db.get('photos', original.photoId!)).toBeDefined();
    expect(await db.count('photos')).toBe(1);
  });

  it('retrying a failed save with the same form id creates exactly one profile', async () => {
    const id = newId();
    await expect(saveChildProfile(db, deviceId, { id, input: SAMPLE_CHILD_A, photo: UNSTORABLE_PHOTO })).rejects.toThrow();
    await saveChildProfile(db, deviceId, { id, input: SAMPLE_CHILD_A, photo: { kind: 'set', blob: new Blob(['ok']), width: 1, height: 1 } });
    // A double tap / repeated submit also must not duplicate.
    await saveChildProfile(db, deviceId, { id, input: SAMPLE_CHILD_A, photo: { kind: 'keep' } });
    const kids = await listChildren(db);
    expect(kids).toHaveLength(1);
    expect(kids[0]!.rev).toBe(2);
    expect(await db.count('photos')).toBe(1);
  });

  it('removes the photo when asked, atomically', async () => {
    const id = newId();
    await saveChildProfile(db, deviceId, { id, input: SAMPLE_CHILD_A, photo: { kind: 'set', blob: new Blob(['x']), width: 1, height: 1 } });
    const c = await saveChildProfile(db, deviceId, { id, input: SAMPLE_CHILD_A, photo: { kind: 'remove' } });
    expect(c.photoId).toBeNull();
    expect(await db.count('photos')).toBe(0);
  });

  it('refuses to bring back a deleted profile', async () => {
    const id = newId();
    await db.put('children', { id, createdAt: 't', updatedAt: 't', deletedAt: 't', rev: 2, originDeviceId: deviceId, lastModifiedBy: deviceId });
    await expect(saveChildProfile(db, deviceId, { id, input: SAMPLE_CHILD_A, photo: { kind: 'keep' } })).rejects.toThrow(/deleted/);
  });
});

describe('Blush theme revision', () => {
  it('keeps the review’s proposed palette values', () => {
    const t = THEMES.find((x) => x.id === 'blush')!.tokens;
    expect([t.bg, t.surface, t.accent, t.primary, t.text]).toEqual(['#FDE8F1', '#FFF7FB', '#F5A5C8', '#A93669', '#492437']);
  });
  it('Earth remains the default theme', () => {
    expect(THEMES[0]!.id).toBe('earth');
  });
});

describe('deployment workflow', () => {
  const wf = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  const triggers = wf.slice(wf.indexOf('\non:'), wf.indexOf('\npermissions:'));
  it('can only be started manually (no push, pull request, or schedule triggers)', () => {
    expect(triggers).toContain('workflow_dispatch');
    expect(triggers).not.toMatch(/\bpush\s*:/);
    expect(triggers).not.toMatch(/\bpull_request/);
    expect(triggers).not.toMatch(/\bschedule\s*:/);
  });
  it('requires a typed confirmation before building', () => {
    expect(wf).toContain("inputs.confirm == 'deploy'");
  });
});
