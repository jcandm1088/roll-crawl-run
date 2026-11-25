import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { openRcrDb, type RcrDB } from '../../src/data/db';
import { ensureMeta, getSettings, setChildTheme, themeForChild } from '../../src/data/repositories/metaRepo';
import { createChild, deleteChild, saveChildProfile } from '../../src/data/repositories/childrenRepo';
import { newId } from '../../src/data/envelope';
import { SAMPLE_CHILD_A, SAMPLE_CHILD_B } from '../fixtures/children';
import art from '../../src/ui/brand/growing-together.json';

let n = 0;
const open: RcrDB[] = [];
afterEach(() => open.splice(0).forEach((d) => d.close()));
async function db(name: string, version?: number) {
  const d = await openRcrDb(name, version);
  open.push(d);
  return d;
}

/** Writes data exactly as the previous app version (schema v1, one app-wide theme) would have. */
async function legacyDatabase(name: string, appTheme: string | null) {
  const v1 = await openRcrDb(name, 1);
  const now = '2025-01-01T00:00:00.000Z';
  const env = { createdAt: now, updatedAt: now, rev: 3, originDeviceId: 'dev', lastModifiedBy: 'dev' };
  await v1.put('meta', { id: 'meta', schemaVersion: 1, deviceId: 'dev', deviceLabel: '', createdAt: now, onboardingComplete: true, lastBackupAt: null });
  if (appTheme) await v1.put('settings', { id: 'settings', theme: appTheme, activeChildId: 'child-a', layers: { personal: true, wellVisits: true, vaccines: false, therapy: true }, vaccineSchedule: null, notificationsEnabled: false, familyCalendar: false, updatedAt: now } as never);
  await v1.put('children', { ...env, id: 'child-a', deletedAt: null, ...SAMPLE_CHILD_A, color: 'clay', photoId: null } as never);
  await v1.put('children', { ...env, id: 'child-b', deletedAt: null, ...SAMPLE_CHILD_B, color: 'ocean', photoId: null } as never);
  await v1.put('children', { ...env, id: 'child-gone', deletedAt: now } as never);
  const before = await v1.getAll('children');
  v1.close();
  return before;
}

describe('migration from the app-wide theme (schema v1 → v2)', () => {
  it('gives every existing child the previously saved app-wide theme', async () => {
    const name = `mig-${++n}`;
    const childrenBefore = await legacyDatabase(name, 'lavender');
    const d = await db(name);
    expect(d.version).toBe(2);
    const s = await getSettings(d);
    expect(s.childThemes).toEqual({ 'child-a': 'lavender', 'child-b': 'lavender' }); // tombstone gets none
    expect(s.theme).toBe('lavender'); // legacy value kept
    expect(s.activeChildId).toBe('child-a'); // other settings preserved
    // Child records (and their revision history) are untouched.
    expect(await d.getAll('children')).toEqual(childrenBefore);
  });

  it('uses Earth when no app-wide theme was ever saved', async () => {
    const name = `mig-${++n}`;
    await legacyDatabase(name, null);
    const s = await getSettings(await db(name));
    expect(s.childThemes).toEqual({ 'child-a': 'earth', 'child-b': 'earth' });
  });

  it('is safe to run on a fresh install', async () => {
    const d = await db(`fresh-${++n}`);
    expect((await getSettings(d)).childThemes).toEqual({});
  });
});

describe('per-child theme storage', () => {
  it('new profiles default to Earth; a chosen theme is stored with the profile atomically', async () => {
    const d = await db(`pc-${++n}`);
    const { deviceId } = await ensureMeta(d);
    const a = await createChild(d, deviceId, SAMPLE_CHILD_A);
    const b = await saveChildProfile(d, deviceId, { id: newId(), input: { ...SAMPLE_CHILD_B, theme: 'blush' }, photo: { kind: 'keep' } });
    const s = await getSettings(d);
    expect(themeForChild(s, a.id)).toBe('earth');
    expect(themeForChild(s, b.id)).toBe('blush');
  });

  it('changing one child’s theme never changes another’s', async () => {
    const d = await db(`pc-${++n}`);
    const { deviceId } = await ensureMeta(d);
    const a = await createChild(d, deviceId, SAMPLE_CHILD_A);
    const b = await createChild(d, deviceId, { ...SAMPLE_CHILD_B, theme: 'sky' });
    await setChildTheme(d, a.id, 'sage');
    const s = await getSettings(d);
    expect(themeForChild(s, a.id)).toBe('sage');
    expect(themeForChild(s, b.id)).toBe('sky');
    await expect(setChildTheme(d, 'no-such-child', 'sage')).rejects.toThrow();
  });

  it('editing a profile without choosing a theme keeps its theme; failed saves leave themes unchanged', async () => {
    const d = await db(`pc-${++n}`);
    const { deviceId } = await ensureMeta(d);
    const id = newId();
    await saveChildProfile(d, deviceId, { id, input: { ...SAMPLE_CHILD_A, theme: 'lavender' }, photo: { kind: 'keep' } });
    await saveChildProfile(d, deviceId, { id, input: { ...SAMPLE_CHILD_A, name: 'Renamed' }, photo: { kind: 'keep' } });
    expect(themeForChild(await getSettings(d), id)).toBe('lavender');
    const unstorable = { kind: 'set' as const, blob: (() => 0) as unknown as Blob, width: 1, height: 1 };
    await expect(saveChildProfile(d, deviceId, { id, input: { ...SAMPLE_CHILD_A, theme: 'sky' }, photo: unstorable })).rejects.toThrow();
    expect(themeForChild(await getSettings(d), id)).toBe('lavender');
  });

  it('a failed NEW profile save stores no theme entry', async () => {
    const d = await db(`pc-${++n}`);
    const { deviceId } = await ensureMeta(d);
    const id = newId();
    const unstorable = { kind: 'set' as const, blob: (() => 0) as unknown as Blob, width: 1, height: 1 };
    await expect(saveChildProfile(d, deviceId, { id, input: { ...SAMPLE_CHILD_A, theme: 'sky' }, photo: unstorable })).rejects.toThrow();
    expect((await getSettings(d)).childThemes[id]).toBeUndefined();
  });

  it('deleting a profile removes its theme and clears it as the active child; others are kept', async () => {
    const d = await db(`pc-${++n}`);
    const { deviceId } = await ensureMeta(d);
    const a = await createChild(d, deviceId, { ...SAMPLE_CHILD_A, theme: 'sage' });
    const b = await createChild(d, deviceId, { ...SAMPLE_CHILD_B, theme: 'blush' });
    await d.put('settings', { ...(await getSettings(d)), activeChildId: a.id });
    await deleteChild(d, deviceId, a.id, { purgeFromBackups: true });
    const s = await getSettings(d);
    expect(s.childThemes).toEqual({ [b.id]: 'blush' });
    expect(s.activeChildId).toBeNull();
  });

  it('with no child, the theme is Earth', async () => {
    const d = await db(`pc-${++n}`);
    expect(themeForChild(await getSettings(d), null)).toBe('earth');
  });

  it('unknown stored theme ids fall back safely', async () => {
    const d = await db(`pc-${++n}`);
    await d.put('settings', { ...(await getSettings(d)), childThemes: { x: 'neon' as never } });
    expect((await getSettings(d)).childThemes['x']).toBe('earth');
  });
});

describe('approved logo (Concept 5, Growing Together)', () => {
  const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
  it('favicon is generated from the approved artwork in fixed brand colors', () => {
    const fav = read('public/icons/favicon.svg');
    for (const shape of art.shapes) if (shape.type === 'path') expect(fav).toContain(shape.d);
    expect(fav).toContain(art.brandColors.primary);
    expect(fav).toContain(art.brandColors.background);
  });
  it('matches the concept artwork shown for approval exactly', () => {
    const board = read('scripts/logo-concepts.mjs');
    for (const shape of art.shapes) if (shape.type === 'path') expect(board).toContain(shape.d);
  });
  it('manifest lists versioned icons including a maskable icon', () => {
    const m = JSON.parse(read('public/manifest.webmanifest'));
    expect(m.icons.map((i: { src: string }) => i.src)).toEqual(['icons/icon-192.png?v=2', 'icons/icon-512.png?v=2', 'icons/icon-maskable-512.png?v=2']);
    for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512], ['apple-touch-icon.png', 180]] as const) {
      const png = readFileSync(new URL(`../../public/icons/${file}`, import.meta.url));
      expect(png.readUInt32BE(16)).toBe(size); // PNG width
      expect(png.readUInt32BE(20)).toBe(size); // PNG height
    }
  });
});
