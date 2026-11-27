// Checkpoint 2a human acceptance refinements (R-004 to R-008) screenshots.
// FICTIONAL data only; clock fixed to Nov 26, 2026 10:00 local.
// Usage: npm run build && (npx vite preview --port 4181 &) && node scripts/checkpoint-2a-acceptance-screenshots.mjs [baseUrl]
//
// Two kinds of data can't be created in this version, by design: an undated note (the standalone
// Note box was replaced by Notes & Observations, R-007) and a personal entry (creation removed,
// R-005). To show how such EXISTING records appear after updating, this script writes them straight
// into IndexedDB in exactly the shape the earlier version produced. (The upgrade itself is verified
// by tests/e2e/update.spec.ts with data created in the real 170cc99 build.)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4181/';
const DIR = 'docs/screenshots/checkpoint-2a-acceptance';
mkdirSync(DIR, { recursive: true });
const NOW = new Date('2026-11-26T10:00:00');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.clock.setFixedTime(NOW);
const shot = async (name, opts = { fullPage: true }) => {
  await page.waitForTimeout(450);
  const style = opts.fullPage ? await page.addStyleTag({ content: 'body{position:relative} .bottomnav{position:absolute !important;bottom:0 !important;top:auto !important}' }) : null;
  await page.screenshot({ path: `${DIR}/${name}.png`, ...opts });
  if (style) await style.evaluate((el) => el.remove());
  console.log('saved', name);
};
/** Element capture with the sticky top bar and bottom navigation hidden (they would be drawn over the element). */
const elShot = async (testId, name) => {
  const style = await page.addStyleTag({ content: '.topbar, header, .bottomnav { visibility: hidden !important; }' });
  await page.waitForTimeout(250);
  await page.getByTestId(testId).screenshot({ path: `${DIR}/${name}.png` });
  await style.evaluate((el) => el.remove());
  console.log('saved', name);
};
const go = async (hash) => {
  await page.goto(`${BASE}${hash}`);
  await page.waitForTimeout(300);
};

async function onboard(name, dob, theme) {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  if (theme) await page.getByTestId(`theme-${theme}`).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
}
async function addChild(name, dob, theme, ga) {
  await go('#/profiles/new');
  await page.getByLabel('Name or nickname (optional)').fill(name);
  await page.getByLabel('Date of birth').fill(dob);
  if (theme) await page.getByTestId(`theme-${theme}`).click();
  if (ga) {
    await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
    await page.getByRole('button', { name: 'Weeks at birth' }).click();
    await page.getByLabel('Weeks', { exact: true }).selectOption(String(ga));
    await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
  }
  await page.getByRole('button', { name: 'Add child' }).click();
  await page.getByRole('heading', { name }).waitFor();
}
async function mark(id, status, date) {
  await go(`#/growth/milestone/${id}`);
  await page.getByRole('radio', { name: status }).click();
  await page.getByLabel(status === 'Achieved' ? 'Date achieved' : 'Date', { exact: true }).fill(date);
  await page.getByRole('button', { name: 'Save status' }).click();
  await page.getByTestId('saved').waitFor();
}
async function addEntry(id, date, text) {
  await go(`#/growth/milestone/${id}`);
  await page.getByLabel('Date observed').first().fill(date);
  await page.getByLabel('Note or observation').fill(text);
  await page.getByRole('button', { name: 'Add entry' }).click();
  await page.getByTestId('saved').waitFor();
}
async function switchTo(name) {
  await go('#/home');
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: new RegExp(name) }).click();
  await page.waitForTimeout(300);
}
/** Existing records from the earlier version (see header): an undated note and a personal entry. */
async function seedLegacy({ noteFor, noteText, personal }) {
  await page.evaluate((o) => new Promise((resolve, reject) => {
    const r = indexedDB.open('roll-crawl-run');
    r.onsuccess = () => {
      const db = r.result;
      const tx = db.transaction(['meta', 'settings', 'customItems', 'milestoneRecords', 'milestoneEvents'], 'readwrite');
      tx.objectStore('meta').get('meta').onsuccess = (em) => {
        const deviceId = em.target.result.deviceId;
        tx.objectStore('settings').get('settings').onsuccess = (es) => {
          const childId = es.target.result.activeChildId;
          const ts = '2026-10-14T15:30:00.000Z';
          const env = () => ({ id: crypto.randomUUID(), createdAt: ts, updatedAt: ts, deletedAt: null, rev: 1, originDeviceId: deviceId, lastModifiedBy: deviceId });
          const base = { ageBasis: { basis: 'chronological', milestoneAgeMonths: 15 }, hiddenAtTime: false, deviceId, recordedAt: ts, eventDate: ts.slice(0, 10), childId };
          tx.objectStore('milestoneRecords').index('byChildAndDefinition').get([childId, o.noteFor]).onsuccess = (eg) => {
            const prev = eg.target.result;
            const rec = prev ? { ...prev, note: o.noteText } : { ...env(), childId, milestoneDefId: o.noteFor, status: 'not-yet', firstObservedDate: null, achievedDate: null, note: o.noteText, hidden: false };
            tx.objectStore('milestoneRecords').put(rec);
            tx.objectStore('milestoneEvents').add({ ...env(), ...base, recordId: rec.id, recordKey: `def:${o.noteFor}`, type: 'note', text: o.noteText, statusAfter: rec.status });
          };
          const item = { ...env(), childId, kind: 'milestone', title: o.personal.title, description: '', appCategory: o.personal.appCategory, derivedFromDefId: o.personal.from, referenceAgeMonths: o.personal.age };
          const prec = { ...env(), childId, customItemId: item.id, status: 'emerging', firstObservedDate: '2026-10-14', achievedDate: null, note: '', hidden: false };
          tx.objectStore('customItems').add(item);
          tx.objectStore('milestoneRecords').add(prec);
          tx.objectStore('milestoneEvents').add({ ...env(), ...base, recordId: prec.id, recordKey: `custom:${item.id}`, type: 'personal-version-created', text: item.title, statusAfter: 'not-yet' });
          tx.objectStore('milestoneEvents').add({ ...env(), ...base, recordId: prec.id, recordKey: `custom:${item.id}`, type: 'status', fromStatus: 'not-yet', toStatus: 'emerging', fromDate: null, toDate: null, statusAfter: 'emerging' });
        };
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
  }), { noteFor, noteText, personal });
  await page.reload();
}

// --- Sample Child A: 16 months -------------------------------------------------
await onboard('Sample Child A', '2025-07-10', 'earth');
await mark('cdc22-m12-lc-01', 'Achieved', '2026-07-12');
await mark('cdc22-m15-mp-01', 'Achieved', '2026-10-20');
await mark('cdc22-m15-se-02', 'Emerging', '2026-11-02');
await mark('cdc22-m12-cg-02', 'Achieved', '2026-08-30');
await seedLegacy({ noteFor: 'cdc22-m12-lc-01', noteText: 'Says “dada” mostly at bath time (fictional).', personal: { title: 'Waves at the neighbour’s dog (fictional)', appCategory: 'social-emotional', from: 'cdc22-m12-se-01', age: 12 } });
await addEntry('cdc22-m12-lc-01', '2026-11-20', 'Called the cat “mama” and laughed (fictional).');
await addEntry('cdc22-m12-lc-01', '2026-11-24', 'Said “dada” when looking at a photo (fictional).');

// R-007 Notes & Observations
await go('#/growth/milestone/cdc22-m12-lc-01');
await shot('01-detail-notes-observations');
await elShot('notes-observations', '02-notes-observations-section');
await page.getByRole('button', { name: /^Edit entry: November 24/ }).click();
await elShot('notes-observations', '03-notes-entry-editing');
await page.getByRole('button', { name: 'Cancel' }).click();
await elShot('history', '04-history-with-entries');

// R-004 gender-neutral wording
await go('#/growth/milestone/cdc22-m15-lc-03');
await page.getByTestId('original-wording').locator('summary').click();
await shot('10-detail-adapted-wording-open', { fullPage: false });
await go('#/growth/expect/5');
await shot('11-guide-15-18-months');
await go('#/growth/expect/1');
await shot('12-guide-3-6-months-neutral-wording');

// R-005 / R-006 Library
await go('#/growth/library');
await shot('20-library-up-to-now');
await go('#/growth/library/all');
await shot('21-library-all', { fullPage: false });
await go('#/growth/library');
await page.getByRole('button', { name: /Your personal entries/ }).click();
await page.getByTestId('personal-entries').evaluate((el) => el.scrollIntoView({ block: 'center' }));
await shot('22-library-personal-entries-open', { fullPage: false });
await page.getByTestId('personal-entry-row').click();
await page.getByTestId('milestone-detail').waitFor();
await shot('23-personal-entry-detail');
await go('#/growth/about');
await shot('24-about-milestones');

// R-006 / R-008 Progress
await go('#/growth/progress');
await shot('30-progress');
await page.getByTestId('age-basis-card').scrollIntoViewIfNeeded();
await shot('31-progress-age-settings-chronological', { fullPage: false });
await page.getByRole('link', { name: 'Manage age settings' }).click();
await page.waitForTimeout(400);
await shot('32-profile-age-settings', { fullPage: false });

// --- Sample Child B: born early, corrected age used ---------------------------------
await addChild('Sample Child B', '2026-05-20', 'sky', 32);
await go('#/growth/progress');
await page.getByTestId('age-basis-card').scrollIntoViewIfNeeded();
await shot('33-progress-age-settings-corrected', { fullPage: false });

// --- Five themes (Sample Child A) ---------------------------------------------------
await switchTo('Sample Child A');
for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
  await go('#/settings');
  await page.getByTestId(`theme-${theme}`).click();
  await go('#/growth/milestone/cdc22-m12-lc-01');
  await page.getByTestId('notes-observations').scrollIntoViewIfNeeded();
  await shot(`40-theme-${theme}-notes`, { fullPage: false });
  await go('#/growth/progress');
  await page.getByTestId('age-basis-card').scrollIntoViewIfNeeded();
  await shot(`41-theme-${theme}-progress-age`, { fullPage: false });
}
await go('#/settings');
await page.getByTestId('theme-earth').click();

// --- Narrow phone (320 px) ----------------------------------------------------------
await page.setViewportSize({ width: 320, height: 640 });
await go('#/growth/milestone/cdc22-m12-lc-01');
await page.getByTestId('notes-observations').scrollIntoViewIfNeeded();
await shot('50-narrow-320-notes', { fullPage: false });
await go('#/growth/progress');
await page.getByTestId('age-basis-card').scrollIntoViewIfNeeded();
await shot('51-narrow-320-progress-age', { fullPage: false });
await go('#/growth/library');
await page.getByRole('button', { name: /Your personal entries/ }).click();
await page.getByTestId('personal-entries').evaluate((el) => el.scrollIntoView({ block: 'center' }));
await shot('52-narrow-320-library-personal', { fullPage: false });

await browser.close();
