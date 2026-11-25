import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { href } from '../../../router';
import { Icon, type IconName } from '../../components/Icon';
import { ThemePicker } from '../../components/ThemePicker';
import { PlannedTag } from '../../components/Placeholder';
import { Sheet } from '../../components/Sheet';
import { ErrorText } from '../../components/ChildFields';
import { childDisplayName } from '../../components/Avatar';
import { deleteAllData, getPersistenceStatus, getStorageEstimate, requestPersistence, type PersistenceStatus, type StorageEstimate } from '../../../data/storage';
import { APP_FULL_NAME } from '../../components/Brand';

declare const __APP_VERSION__: string;
export const APP_VERSION = __APP_VERSION__;

function LinkRow({ to, icon, title, detail }: { to: string; icon: IconName; title: string; detail?: string }) {
  return (
    <li>
      <a class="list-item" href={to}>
        <span class="icon-wrap"><Icon name={icon} size={20} /></span>
        <span class="grow">
          <span style={{ display: 'block', fontWeight: 600 }}>{title}</span>
          {detail && <span class="small muted">{detail}</span>}
        </span>
        <span class="chev"><Icon name="chevronRight" size={20} /></span>
      </a>
    </li>
  );
}

function PlannedRow({ icon, title, checkpoint }: { icon: IconName; title: string; checkpoint: number }) {
  return (
    <li>
      <div class="list-item" style={{ cursor: 'default' }} aria-disabled="true">
        <span class="icon-wrap" style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}><Icon name={icon} size={20} /></span>
        <span class="grow">
          <span style={{ display: 'block', fontWeight: 600 }}>{title}</span>
          <PlannedTag checkpoint={checkpoint} />
        </span>
      </div>
    </li>
  );
}

export function Settings() {
  const app = useApp();
  const [label, setLabel] = useState(app.meta.deviceLabel);
  const [savedLabel, setSavedLabel] = useState(false);
  const [resetting, setResetting] = useState(false);

  return (
    <div>
      <section class="section" style={{ marginTop: 'var(--space-2)' }}>
        <h2 class="title-2 section-title">Profiles</h2>
        <ul class="list card list-card">
          <LinkRow to={href({ name: 'profiles' })} icon="users" title="Child profiles" detail={`${app.children.length} profile${app.children.length === 1 ? '' : 's'}${app.activeChild ? ` · viewing ${childDisplayName(app.activeChild)}` : ''}`} />
        </ul>
      </section>

      <section class="section">
        <h2 class="title-2 section-title">Appearance</h2>
        <div class="card">
          <ThemePicker value={app.settings.theme} onChange={(theme) => app.setSettings({ theme })} />
        </div>
      </section>

      <section class="section">
        <h2 class="title-2 section-title">Your data</h2>
        <ul class="list card list-card">
          <LinkRow to={href({ name: 'storage' })} icon="hardDrive" title="Storage on this device" detail="Where your information is kept and how safe it is from being cleared" />
          <LinkRow to={href({ name: 'privacy' })} icon="shield" title="Privacy" />
          <PlannedRow icon="download" title="Backup, partner sharing & import" checkpoint={5} />
          <PlannedRow icon="fileText" title="Provider reports" checkpoint={5} />
        </ul>
      </section>

      <section class="section">
        <h2 class="title-2 section-title">Calendar & reminders</h2>
        <ul class="list card list-card">
          <PlannedRow icon="calendar" title="Calendar layers & vaccination reference source" checkpoint={3} />
          <PlannedRow icon="bell" title="Notifications (off)" checkpoint={4} />
          <PlannedRow icon="share" title="Export to phone calendar (.ics)" checkpoint={5} />
        </ul>
      </section>

      <section class="section">
        <h2 class="title-2 section-title">This device</h2>
        <div class="card">
          <div class="field">
            <label class="label" for="device-label">Device name (optional)</label>
            <input id="device-label" class="input" maxLength={40} placeholder="e.g. Phone A" value={label} onInput={(e) => { setLabel((e.target as HTMLInputElement).value); setSavedLabel(false); }} />
            <span class="hint">Used later to show which device recorded an entry after sharing with a partner. Leave blank if you prefer.</span>
          </div>
          <button class="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-3)' }} disabled={label === app.meta.deviceLabel} onClick={async () => { await app.setMeta({ deviceLabel: label.trim() }); setLabel(label.trim()); setSavedLabel(true); }}>
            Save device name
          </button>
          {savedLabel && <span class="small muted" role="status" style={{ marginLeft: 'var(--space-3)' }}>Saved</span>}
        </div>
      </section>

      <section class="section">
        <h2 class="title-2 section-title">About</h2>
        <ul class="list card list-card">
          <LinkRow to={href({ name: 'install' })} icon="smartphone" title="Install on your phone" />
          <LinkRow to={href({ name: 'about' })} icon="info" title="About, sources & version" detail={`Version ${APP_VERSION}`} />
          <PlannedRow icon="sprout" title="Developmental viewing preferences" checkpoint={2} />
        </ul>
      </section>

      <section class="section">
        <div class="card">
          <h2 class="title-3">Reset the app</h2>
          <p class="small muted" style={{ marginTop: 'var(--space-2)' }}>Erases every profile and setting on this device and starts over.</p>
          <button class="btn btn-danger btn-block" style={{ marginTop: 'var(--space-4)' }} onClick={() => setResetting(true)}>
            <Icon name="rotate" size={18} /> Reset and erase all data…
          </button>
        </div>
      </section>
      {resetting && <ResetSheet onClose={() => setResetting(false)} />}
    </div>
  );
}

function ResetSheet({ onClose }: { onClose: () => void }) {
  const { db } = useApp();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet title="Erase all data?" onClose={onClose}>
      <div class="stack small">
        <p>This permanently deletes <strong>every child profile, photo, setting, and internal backup</strong> stored by the app on this device. It can’t be undone.</p>
        <p class="muted">Backup export isn’t available yet (Checkpoint 5), so there’s currently no way to save a copy first.</p>
        <div class="field">
          <label class="label" for="confirm-reset">Type RESET to confirm</label>
          <input id="confirm-reset" class="input" autocomplete="off" autocapitalize="characters" value={typed} onInput={(e) => setTyped((e.target as HTMLInputElement).value)} />
        </div>
        {error && <ErrorText id="reset-error">{error}</ErrorText>}
      </div>
      <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
        <button
          class="btn btn-primary btn-block"
          disabled={typed.trim().toUpperCase() !== 'RESET' || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await deleteAllData(db);
              window.location.hash = '';
              window.location.reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Data couldn’t be erased.');
              setBusy(false);
            }
          }}
        >
          {busy ? 'Erasing…' : 'Erase everything'}
        </button>
        <button class="btn btn-ghost btn-block" onClick={onClose}>Cancel</button>
      </div>
    </Sheet>
  );
}

function formatBytes(n: number | null): string {
  if (n === null) return 'Unknown';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}

export function StorageInfo() {
  const [status, setStatus] = useState<PersistenceStatus | null>(null);
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    getPersistenceStatus().then(setStatus);
    getStorageEstimate().then(setEstimate);
  }, []);

  return (
    <div class="stack-lg">
      <div class="card stack">
        <p class="eyebrow">Storage protection</p>
        {status === null && <p>Checking…</p>}
        {status === 'persisted' && (
          <>
            <h2 class="title-3" data-testid="persist-status">Protected from automatic clearing</h2>
            <p class="small muted">This browser has agreed not to clear the app’s data automatically when space runs low. Data can still be lost if you clear browser data, remove the app, or lose the device.</p>
          </>
        )}
        {status === 'notPersisted' && (
          <>
            <h2 class="title-3" data-testid="persist-status">Not protected from automatic clearing</h2>
            <p class="small muted">
              The app works normally, but this browser may clear its data under some conditions — for example, when the device is low on storage or the app
              hasn’t been used for a long time. Installing the app to your home screen and keeping backups (available in a later update) reduce this risk.
            </p>
            <button
              class="btn btn-outline btn-sm"
              onClick={async () => {
                setStatus(await requestPersistence());
                setRequested(true);
              }}
            >
              Ask the browser to protect it
            </button>
            {requested && <p class="small muted" role="status">The browser decided not to grant protection right now. Some browsers decide automatically based on how often you use the app.</p>}
          </>
        )}
        {status === 'unsupported' && (
          <>
            <h2 class="title-3" data-testid="persist-status">Protection status isn’t available</h2>
            <p class="small muted">This browser doesn’t report whether it may clear the app’s data. The app works normally; keeping backups (available in a later update) is the best protection.</p>
          </>
        )}
      </div>

      <div class="card">
        <dl class="kv">
          <dt>Stored by this app</dt>
          <dd>{estimate ? formatBytes(estimate.usageBytes) : '…'}</dd>
          <dt>Where</dt>
          <dd>This browser on this device</dd>
        </dl>
      </div>

      <div class="card stack small">
        <h2 class="title-3">Good to know</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2em' }} class="stack">
          <li>Your information is saved in this browser’s storage on this device only (IndexedDB). It isn’t uploaded anywhere.</li>
          <li>It can be lost if you clear this browser’s data, uninstall the app, or lose or replace the device.</li>
          <li>On some phones, the installed app and the browser keep separate storage — information entered in one may not appear in the other. This will be confirmed on real devices and described here.</li>
          <li>Storage isn’t encrypted or password-protected by the app.</li>
        </ul>
      </div>
    </div>
  );
}

export function PrivacyInfo() {
  return (
    <div class="stack-lg">
      <div class="card stack small">
        <h2 class="title-3">What happens to your information</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2em' }} class="stack">
          <li><strong>It stays on this device.</strong> There’s no account and no server. Nothing you enter is sent to the app’s developer or any other service.</li>
          <li><strong>No tracking.</strong> The app contains no analytics, advertising, or tracking scripts, and doesn’t load fonts or code from other websites.</li>
          <li><strong>Not encrypted or password-protected.</strong> Anyone who can use this unlocked device and browser could open the app and see what’s stored.</li>
          <li><strong>Not a medical record.</strong> Local storage isn’t an authenticated, encrypted, or clinically compliant (for example, HIPAA) record system.</li>
          <li><strong>You decide what to share.</strong> Sharing features (coming later) will always show you what’s included first. Personal Reflections are excluded from sharing by default.</li>
        </ul>
      </div>
      <div class="card stack small">
        <h2 class="title-3">About the information in this app</h2>
        <p>Roll, Crawl, RUN is an organizing and documentation tool. It doesn’t diagnose conditions, identify developmental disorders, or replace advice from your child’s healthcare providers. Published milestone ages are educational references, not deadlines.</p>
      </div>
    </div>
  );
}

export function InstallInfo() {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return (
    <div class="stack-lg">
      {standalone && (
        <div class="banner" role="status">
          <Icon name="check" size={18} />
          <span>You’re using the installed app.</span>
        </div>
      )}
      <div class="card stack small">
        <h2 class="title-3">iPhone or iPad (Safari)</h2>
        <ol style={{ margin: 0, paddingLeft: '1.2em' }} class="stack">
          <li>Open this page in Safari.</li>
          <li>Tap the Share button, then <strong>Add to Home Screen</strong>.</li>
          <li>Open Roll, Crawl, RUN from your home screen.</li>
        </ol>
        {isIos && <p class="muted">Tip: install before entering information — the installed app may keep its own separate storage on iPhone.</p>}
      </div>
      <div class="card stack small">
        <h2 class="title-3">Android (Chrome)</h2>
        <ol style={{ margin: 0, paddingLeft: '1.2em' }} class="stack">
          <li>Open the menu (⋮).</li>
          <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
        </ol>
      </div>
      <div class="card stack small">
        <h2 class="title-3">Computer (Chrome or Edge)</h2>
        <p>Use the install icon in the address bar, or the browser menu’s <strong>Install</strong> option.</p>
      </div>
      <p class="small muted">After the first visit, the app opens without an internet connection. Fuller install guidance will be added after testing on real devices.</p>
    </div>
  );
}

export function AboutInfo() {
  return (
    <div class="stack-lg">
      <div class="card stack small">
        <h2 class="title-3">{APP_FULL_NAME}</h2>
        <dl class="kv">
          <dt>Version</dt>
          <dd data-testid="app-version">{APP_VERSION}</dd>
          <dt>Stage</dt>
          <dd>Checkpoint 1 — design & foundation</dd>
        </dl>
      </div>
      <div class="card stack small">
        <h2 class="title-3">Sources</h2>
        <p>No developmental or medical reference content has been added yet. Every milestone and care reference added later will show its source, publication or version date, and a link, and will be listed here.</p>
      </div>
      <div class="card stack small">
        <h2 class="title-3">Credits</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2em' }} class="stack">
          <li>Fonts: Fraunces and Inter (SIL Open Font License 1.1), included with the app.</li>
          <li>Icons: Lucide (ISC License), included with the app.</li>
          <li>Built with Preact (MIT) and idb (ISC).</li>
        </ul>
      </div>
    </div>
  );
}
