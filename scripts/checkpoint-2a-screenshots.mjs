// Checkpoint 2a screenshots (FICTIONAL data, clock fixed to Nov 26, 2026 10:00 local).
// Usage: npm run build && (npx vite preview --port 4181 &) && node scripts/checkpoint-2a-screenshots.mjs [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4181/';
const DIR = 'docs/screenshots/checkpoint-2a';
mkdirSync(DIR, { recursive: true });
const NOW = new Date('2026-11-26T10:00:00');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.clock.setFixedTime(NOW);
const shot = async (name, opts = {}) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${DIR}/${name}.png`, ...opts });
  console.log('saved', name);
};
const go = async (hash) => {
  await page.goto(`${BASE}${hash}`);
  await page.waitForTimeout(250);
};

async function onboard(name, dob, theme, corrected) {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Date of birth').fill(dob);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name or nickname').fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  if (corrected) {
    await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
    await page.getByRole('button', { name: 'Weeks at birth' }).click();
    await page.getByLabel('Weeks', { exact: true }).selectOption(String(corrected));
    await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
  }
  await page.getByRole('button', { name: 'Continue' }).click();
  if (theme) await page.getByTestId(`theme-${theme}`).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start using the app' }).click();
  await page.getByRole('navigation', { name: 'Main' }).waitFor();
}
async function addChild(name, dob, theme) {
  await go('#/profiles/new');
  await page.getByLabel('Name or nickname (optional)').fill(name);
  await page.getByLabel('Date of birth').fill(dob);
  if (theme) await page.getByTestId(`theme-${theme}`).click();
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

// --- Newborn: empty states --------------------------------------------------
await onboard('Sample Newborn', '2026-11-10', null, null);
await shot('01-home-newborn-empty');
await go('#/growth');
await shot('02-growth-landing-newborn');
await go('#/growth/progress');
await shot('03-progress-newborn-empty');

// --- Toddler (16 months, Sage): populated --------------------------------------
await addChild('Sample Toddler', '2025-07-10', 'sage');
for (const [id, s, d] of [
  ['cdc22-m02-se-01', 'Achieved', '2025-08-20'], ['cdc22-m02-mp-01', 'Achieved', '2025-09-01'], ['cdc22-m04-mp-02', 'Achieved', '2025-11-05'],
  ['cdc22-m06-lc-03', 'Achieved', '2026-01-02'], ['cdc22-m09-mp-04', 'Achieved', '2026-04-11'], ['cdc22-m12-mp-01', 'Achieved', '2026-07-01'],
  ['cdc22-m12-lc-01', 'Emerging', '2026-08-15'], ['cdc22-m15-mp-01', 'Achieved', '2026-10-30'], ['cdc22-m15-lc-01', 'Emerging', '2026-11-20'],
  ['cdc22-m18-mp-02', 'Emerging', '2026-11-22'],
]) await mark(id, s, d);
// observation, then remove it; correct a date; hide one
await go('#/growth/milestone/cdc22-m15-mp-01');
await page.getByLabel('What you noticed').fill('Took four steps from the couch to the toy box (fictional).');
await page.getByRole('button', { name: 'Add observation' }).click();
await page.getByTestId('saved').waitFor();
await page.getByText('Correct the achievement date').click();
await page.getByLabel('Correct date').fill('2026-10-28');
await page.getByRole('button', { name: 'Save corrected date' }).click();
await page.getByTestId('saved').waitFor();
await shot('20-detail-populated', { fullPage: true });
await go('#/growth/milestone/cdc22-m02-lc-02');
await page.getByRole('button', { name: 'Hide this milestone' }).click();
await page.getByTestId('hidden-banner').waitFor();
await shot('21-detail-hidden');
await go('#/growth/milestone/cdc22-m24-mp-01');
await shot('22-detail-upcoming');
// personal version
await go('#/growth/milestone/cdc22-m15-se-03');
await page.getByRole('button', { name: 'Make a personal version' }).click();
await page.getByLabel('Title').fill('Claps along to the bath-time song');
await page.getByRole('button', { name: 'Save', exact: true }).click();
await page.getByTestId('provenance').waitFor();
await shot('23-personal-version');

await go('#/home');
await shot('10-home-populated', { fullPage: true });
await go('#/growth');
await shot('11-growth-landing');
await go('#/growth/progress');
await shot('12-progress-populated', { fullPage: true });
await go('#/growth/expect');
await shot('13-expect-current', { fullPage: true });
await go('#/growth/expect/6');
await shot('14-expect-empty-interval-preview', { fullPage: true });
await go('#/growth/expect/all');
await page.getByRole('button', { name: 'Emerging', exact: true }).click();
await shot('15-expect-everything-filtered-emerging');
await go('#/growth/library');
await shot('16-library', { fullPage: false });
await page.getByLabel('Search milestones').fill('cup');
await shot('17-library-search-cup');
await page.getByLabel('Search milestones').fill('');
await page.getByRole('button', { name: 'Fine motor' }).click();
await page.getByLabel('Reference age').selectOption('18');
await shot('18-library-filtered-fine-18m');
await go('#/growth/library');
await page.getByTestId('toggle-hidden').click();
await shot('19-library-hidden');
await go('#/growth/about');
await shot('24-about-milestones', { fullPage: true });
await go('#/settings');
await page.getByRole('button', { name: /^Milestone Viewing Preferences/ }).click();
await page.getByTestId('milestone-prefs').scrollIntoViewIfNeeded();
await shot('25-settings-milestone-prefs');

// --- Corrected age (born at 30 weeks, 4 weeks old: before due date) -----------------
await addChild('Sample Early', '2026-10-29', null);
await go('#/profiles');
await page.getByRole('link', { name: 'Edit Sample Early' }).click();
await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
await page.getByRole('button', { name: 'Weeks at birth' }).click();
await page.getByLabel('Weeks', { exact: true }).selectOption('30');
await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
await page.getByRole('button', { name: 'Save changes' }).click();
await page.getByRole('heading', { name: 'Child profiles' }).waitFor();
await go('#/growth/progress');
await shot('30-corrected-before-due-progress');
await go('#/home');
await shot('31-corrected-before-due-home', { fullPage: true });
// Corrected child after due date: 6 months chronological, 4 months corrected (born 32 weeks)
await addChild('Sample Preterm', '2026-05-20', null);
await go('#/profiles');
await page.getByRole('link', { name: 'Edit Sample Preterm' }).click();
await page.getByRole('radio', { name: /Yes — I’d like to see corrected age/ }).click();
await page.getByRole('button', { name: 'Weeks at birth' }).click();
await page.getByLabel('Weeks', { exact: true }).selectOption('32');
await page.getByRole('radio', { name: /Corrected age \(from due date\)/ }).click();
await page.getByRole('button', { name: 'Save changes' }).click();
await page.getByRole('heading', { name: 'Child profiles' }).waitFor();
await go('#/growth/progress');
await shot('32-corrected-after-due-progress');

// --- Older than five ------------------------------------------------------------
await addChild('Sample Six', '2020-09-01', null);
await go('#/growth/expect');
await shot('33-older-than-five', { fullPage: false });

// --- Five themes (Toddler's populated Progress) -----------------------------------
const themed = [];
for (const theme of ['earth', 'sky', 'blush', 'lavender', 'sage']) {
  await switchChild('Sample Toddler');
  await go('#/settings');
  await page.getByTestId(`theme-${theme}`).click();
  await go('#/growth/progress');
  await shot(`40-theme-${theme}-progress`);
  themed.push([theme, `${DIR}/40-theme-${theme}-progress.png`]);
}
async function switchChild(name) {
  await go('#/home');
  await page.getByTestId('child-chip').click();
  await page.getByRole('radio', { name: new RegExp(name) }).click();
}
await ctx.close();

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const p2 = await browser.newPage({ viewport: { width: 1800, height: 900 } });
await p2.setContent(`<body style="margin:0;padding:24px;background:#EDE6DD;font-family:system-ui"><h2 style="margin:0 0 12px;color:#2E241C">Progress in all five themes (fictional toddler)</h2><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px">${themed.map(([t, f]) => `<figure style="margin:0"><figcaption style="font:600 13px system-ui;text-transform:uppercase;color:#67564A;margin-bottom:6px">${t}</figcaption><img src="${b64(f)}" style="width:100%;border-radius:12px"></figure>`).join('')}</div></body>`);
await p2.screenshot({ path: `${DIR}/41-board-five-themes.png`, fullPage: true });
await browser.close();
