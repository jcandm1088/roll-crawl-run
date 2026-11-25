import { useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { validateDob } from '../../../domain/age';
import { todayLocal } from '../../../domain/dates';
import { requestPersistence } from '../../../data/storage';
import { AppMark, Wordmark } from '../../components/Brand';
import { CorrectedAgeFields, DobField, ErrorText, PhotoField } from '../../components/ChildFields';
import { Icon } from '../../components/Icon';
import { ThemePicker } from '../../components/ThemePicker';
import { EMPTY_CORRECTED, draftToInput, saveChild, type ChildDraft } from '../profiles/saveChild';
import { navigate } from '../../../router';
import { newId } from '../../../data/envelope';
import { applyTheme } from '../../../state/theme';
import { DEFAULT_THEME, type ThemeId } from '../../theme/themes';

type Step = 'welcome' | 'dob' | 'name' | 'corrected' | 'theme' | 'privacy';

/**
 * First-run onboarding. `mode="firstRun"` shows every step; `mode="addChild"`
 * (used when no profiles remain) skips the welcome and privacy steps but keeps
 * the theme step, because every child has their own theme.
 */
export function Onboarding({ mode = 'firstRun' }: { mode?: 'firstRun' | 'addChild' }) {
  const app = useApp();
  const steps: Step[] = mode === 'firstRun' ? ['welcome', 'dob', 'name', 'corrected', 'theme', 'privacy'] : ['dob', 'name', 'corrected', 'theme'];
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<ChildDraft>({ name: '', dob: '', about: '', corrected: EMPTY_CORRECTED, photo: { kind: 'unchanged' } });
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME); // this child's theme; Earth unless chosen
  const [childId] = useState(() => newId()); // one id per form, so a retried save never duplicates
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const step = steps[index]!;
  const isLast = index === steps.length - 1;
  const progressSteps = steps.filter((s) => s !== 'welcome');

  const next = async () => {
    if (step === 'dob' && !validateDob(draft.dob, todayLocal()).ok) {
      setShowErrors(true);
      return;
    }
    if (step === 'corrected') {
      const r = draftToInput(draft);
      if (!r.ok) {
        setShowErrors(true);
        return;
      }
    }
    setShowErrors(false);
    if (!isLast) {
      setIndex(index + 1);
      window.scrollTo(0, 0);
      return;
    }
    await finish();
  };

  const finish = async () => {
    const r = draftToInput(draft);
    if (!r.ok) {
      setSaveError(r.message);
      return;
    }
    setSaving(true);
    try {
      const child = await saveChild(app.db, app.meta.deviceId, childId, { ...r.input, theme }, draft.photo);
      if (mode === 'firstRun') await requestPersistence(); // after an explicit user action; result shown in Settings → Storage
      await app.setSettings({ activeChildId: child.id });
      await app.setMeta({ onboardingComplete: true });
      await app.refresh();
      navigate({ name: 'home' });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Something went wrong while saving.');
      setSaving(false);
    }
  };

  return (
    <div class="onboarding">
      <div class="onboarding-top">
        {index > 0 ? (
          <button class="icon-btn plain" aria-label="Back" onClick={() => setIndex(index - 1)}>
            <Icon name="chevronLeft" />
          </button>
        ) : (
          <span />
        )}
        {step !== 'welcome' && (
          <div class="progress-dots" aria-label={`Step ${progressSteps.indexOf(step) + 1} of ${progressSteps.length}`} role="img">
            {progressSteps.map((s) => (
              <span key={s} class={s === step ? 'on' : ''} />
            ))}
          </div>
        )}
        <span style={{ width: 'var(--touch)' }} />
      </div>

      <div class="onboarding-body screen-enter" key={step}>
        {step === 'welcome' && (
          <div class="welcome-mark">
            <AppMark size={88} class="app-mark" />
            <div class="stack-lg">
              <h1>
                <Wordmark size="lg" />
              </h1>
              <p class="muted" style={{ fontSize: 'var(--text-lg)', maxWidth: '30ch' }}>
                A calm place to notice, record, and celebrate your child’s growth — at your family’s own pace.
              </p>
            </div>
          </div>
        )}

        {step === 'dob' && (
          <div class="stack-lg">
            <div class="stack">
              <p class="eyebrow">{mode === 'firstRun' ? 'Let’s begin' : 'Add a child'}</p>
              <h1 class="title-1">When was your child born?</h1>
              <p class="muted">We use the date of birth to calculate age automatically. It stays on this device.</p>
            </div>
            <DobField value={draft.dob} onInput={(dob) => setDraft({ ...draft, dob })} showError={showErrors || (!!draft.dob && !validateDob(draft.dob, todayLocal()).ok)} />
          </div>
        )}

        {step === 'name' && (
          <div class="stack-lg">
            <div class="stack">
              <p class="eyebrow">Optional</p>
              <h1 class="title-1">What would you like to call them?</h1>
              <p class="muted">A name or nickname helps tell profiles apart. You can skip this.</p>
            </div>
            <div class="field">
              <label class="label" for="child-name">Name or nickname</label>
              <input id="child-name" class="input" type="text" autocomplete="off" maxLength={60} value={draft.name} onInput={(e) => setDraft({ ...draft, name: (e.target as HTMLInputElement).value })} />
            </div>
            <PhotoField existingUrl={null} draft={draft.photo} onChange={(photo) => setDraft({ ...draft, photo })} />
            <div class="field">
              <label class="label" for="child-about">Anything else you’d like to note? (optional)</label>
              <textarea id="child-about" class="textarea" maxLength={500} value={draft.about} onInput={(e) => setDraft({ ...draft, about: (e.target as HTMLTextAreaElement).value })} />
              <span class="hint">For example, a middle name or how they like to be called. No medical information is needed.</span>
            </div>
          </div>
        )}

        {step === 'corrected' && (
          <div class="stack-lg">
            <div class="stack">
              <p class="eyebrow">Optional</p>
              <h1 class="title-1">Corrected age</h1>
              <p class="muted">If your child was born early, you can also see their corrected age. Chronological age is always used unless you choose otherwise.</p>
            </div>
            <CorrectedAgeFields dob={draft.dob} draft={draft.corrected} onChange={(corrected) => setDraft({ ...draft, corrected })} showErrors={showErrors} />
          </div>
        )}

        {step === 'theme' && (
          <div class="stack-lg">
            <div class="stack">
              <h1 class="title-1">Choose your colors</h1>
              <p class="muted">{draft.name.trim() ? `Pick a palette for ${draft.name.trim()}.` : 'Pick a palette for this child.'} Each child can have their own. You can change it anytime in Settings.</p>
            </div>
            <ThemePicker
              value={theme}
              onChange={(t) => {
                setTheme(t);
                applyTheme(t); // live preview
              }}
            />
          </div>
        )}

        {step === 'privacy' && (
          <div class="stack-lg">
            <div class="stack">
              <h1 class="title-1">Your information stays with you</h1>
            </div>
            <ul class="list card list-card privacy-list">
              {[
                ['hardDrive', 'Stored on this device only', 'There’s no account, and nothing you enter is sent to us or anyone else.'],
                ['shield', 'Not a medical record', 'The app isn’t encrypted or password-protected, and anyone using this unlocked device could see it.'],
                ['download', 'Keep a backup', 'Clearing browser data or removing the app can erase what you’ve entered. Backups arrive in a later update.'],
                ['heart', 'A guide, not a test', 'Milestones are educational references, not deadlines or diagnoses. Your child’s provider is your best partner.'],
              ].map(([icon, title, body]) => (
                <li key={title}>
                  <div class="list-item" style={{ alignItems: 'flex-start', cursor: 'default' }}>
                    <span class="icon-wrap"><Icon name={icon as 'heart'} size={20} /></span>
                    <span class="grow">
                      <span class="title-3" style={{ display: 'block', fontSize: 'var(--text-md)' }}>{title}</span>
                      <span class="small muted">{body}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {saveError && <ErrorText id="save-error">{saveError}</ErrorText>}
      </div>

      <div class="onboarding-actions">
        <button class="btn btn-primary btn-block" onClick={next} disabled={saving}>
          {step === 'welcome' ? 'Get started' : isLast ? (saving ? 'Saving…' : mode === 'firstRun' ? 'Start using the app' : 'Save profile') : 'Continue'}
        </button>
        {(step === 'name' || step === 'corrected') && (
          <button
            class="btn btn-ghost btn-block"
            onClick={() => {
              if (step === 'name') setDraft({ ...draft, name: '', about: '', photo: { kind: 'unchanged' } });
              if (step === 'corrected') setDraft({ ...draft, corrected: EMPTY_CORRECTED });
              setShowErrors(false);
              if (isLast) void finishSkipping(step);
              else setIndex(index + 1);
            }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );

  async function finishSkipping(skipped: Step) {
    // When the last step is skipped (add-child mode), save with that step cleared.
    const cleared: ChildDraft = skipped === 'corrected' ? { ...draft, corrected: EMPTY_CORRECTED } : draft;
    const r = draftToInput(cleared);
    if (!r.ok) return setSaveError(r.message);
    setDraft(cleared);
    setSaving(true);
    try {
      const child = await saveChild(app.db, app.meta.deviceId, childId, { ...r.input, theme }, cleared.photo);
      await app.setSettings({ activeChildId: child.id });
      await app.setMeta({ onboardingComplete: true });
      await app.refresh();
      navigate({ name: 'home' });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Something went wrong while saving.');
      setSaving(false);
    }
  }
}
