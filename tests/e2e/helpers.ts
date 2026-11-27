import { expect, type Page } from '@playwright/test';

/** Fictional test data only. */
export async function completeOnboarding(page: Page, opts: { dob?: string; name?: string; theme?: string } = {}) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(opts.dob ?? '2025-03-14');
  await page.getByRole('button', { name: 'Continue' }).click();
  if (opts.name) await page.getByLabel('Name or nickname').fill(opts.name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click(); // corrected age: left unanswered = not used
  if (opts.theme) await page.getByTestId(`theme-${opts.theme}`).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** From a profile's edit screen: open Advanced profile management and delete through both confirmation steps. */
export async function deleteProfile(page: Page, phrase = 'DELETE PROFILE') {
  await page.getByRole('button', { name: 'Advanced profile management' }).click();
  await page.getByRole('button', { name: 'Delete this profile…' }).click();
  const cont = page.getByRole('button', { name: 'Continue' });
  await expect(cont).toBeDisabled();
  await expect(page.getByRole('checkbox')).toBeChecked(); // remove from internal copies: checked by default
  await page.getByLabel('Type DELETE PROFILE to continue').fill(phrase);
  await cont.click();
  await page.getByRole('button', { name: /^Yes, delete/ }).click();
}

export async function addChild(page: Page, name: string, dob: string) {
  await page.goto('./#/profiles/new');
  await page.getByLabel('Name or nickname (optional)').fill(name);
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
}

/**
 * Writes a LEGACY personal entry for the active child straight into IndexedDB, in exactly the shape the
 * removed “Make a personal version” action produced (customItems record + milestone record +
 * `personal-version-created` history entry). Since R-005 the app can't create these any more, so tests
 * that need pre-existing personal data seed it this way, then reload. Fictional data only.
 */
export async function seedLegacyPersonalEntry(page: Page, opts: { title: string; derivedFromDefId: string; appCategory: string; referenceAgeMonths: number; description?: string }) {
  const id = await page.evaluate((o) => new Promise<string>((resolve, reject) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onerror = () => reject(r.error);
    r.onsuccess = () => {
      const db = r.result;
      const tx = db.transaction(['meta', 'settings', 'customItems', 'milestoneRecords', 'milestoneEvents'], 'readwrite');
      const m = tx.objectStore('meta').get('meta');
      m.onsuccess = () => {
        const deviceId = (m.result as { deviceId: string }).deviceId;
        const s = tx.objectStore('settings').get('settings');
        s.onsuccess = () => {
          const childId = (s.result as { activeChildId: string }).activeChildId;
          const ts = new Date().toISOString();
          const env = () => ({ id: crypto.randomUUID(), createdAt: ts, updatedAt: ts, deletedAt: null, rev: 1, originDeviceId: deviceId, lastModifiedBy: deviceId });
          const item = { ...env(), childId, kind: 'milestone', title: o.title, description: o.description ?? '', appCategory: o.appCategory, derivedFromDefId: o.derivedFromDefId, referenceAgeMonths: o.referenceAgeMonths };
          const rec = { ...env(), childId, customItemId: item.id, status: 'not-yet', firstObservedDate: null, achievedDate: null, note: '', hidden: false };
          const ev = { ...env(), childId, recordId: rec.id, recordKey: `custom:${item.id}`, type: 'personal-version-created', eventDate: ts.slice(0, 10), recordedAt: ts, deviceId, text: o.title, ageBasis: { basis: 'chronological', milestoneAgeMonths: null }, hiddenAtTime: false, statusAfter: 'not-yet' };
          tx.objectStore('customItems').add(item);
          tx.objectStore('milestoneRecords').add(rec);
          tx.objectStore('milestoneEvents').add(ev);
          tx.oncomplete = () => { db.close(); resolve(item.id); };
        };
      };
      tx.onerror = () => reject(tx.error);
    };
  }), opts);
  await page.reload();
  return id;
}

/**
 * Writes a LEGACY undated note for the active child's milestone straight into IndexedDB, in exactly
 * the shape the removed standalone Note box produced (record.note + a `note` history entry). Since
 * R-007 new entries are always dated, so tests of the undated state seed it this way, then reload.
 */
export async function seedLegacyNote(page: Page, defId: string, text: string) {
  await page.evaluate((o) => new Promise<void>((resolve, reject) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onerror = () => reject(r.error);
    r.onsuccess = () => {
      const db = r.result;
      const tx = db.transaction(['meta', 'settings', 'milestoneRecords', 'milestoneEvents'], 'readwrite');
      const m = tx.objectStore('meta').get('meta');
      m.onsuccess = () => {
        const deviceId = (m.result as { deviceId: string }).deviceId;
        const s = tx.objectStore('settings').get('settings');
        s.onsuccess = () => {
          const childId = (s.result as { activeChildId: string }).activeChildId;
          const ts = new Date().toISOString();
          const env = () => ({ id: crypto.randomUUID(), createdAt: ts, updatedAt: ts, deletedAt: null, rev: 1, originDeviceId: deviceId, lastModifiedBy: deviceId });
          const g = tx.objectStore('milestoneRecords').index('byChildAndDefinition').get([childId, o.defId]);
          g.onsuccess = () => {
            const rec = g.result ? { ...g.result, note: o.text, updatedAt: ts, rev: g.result.rev + 1 } : { ...env(), childId, milestoneDefId: o.defId, status: 'not-yet', firstObservedDate: null, achievedDate: null, note: o.text, hidden: false };
            tx.objectStore('milestoneRecords').put(rec);
            tx.objectStore('milestoneEvents').add({ ...env(), childId, recordId: rec.id, recordKey: `def:${o.defId}`, type: 'note', eventDate: ts.slice(0, 10), recordedAt: ts, deviceId, text: o.text, ageBasis: { basis: 'chronological', milestoneAgeMonths: null }, hiddenAtTime: rec.hidden, statusAfter: rec.status });
          };
          tx.oncomplete = () => { db.close(); resolve(); };
        };
      };
      tx.onerror = () => reject(tx.error);
    };
  }), { defId, text });
  await page.reload();
}
