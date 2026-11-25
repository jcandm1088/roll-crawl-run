import { useEffect, useState } from 'preact/hooks';
import {
  GA_MAX_WEEKS,
  GA_MIN_WEEKS,
  ageBetween,
  correctedAge,
  dueDateFromGestationalAge,
  formatAge,
  formatBeforeDueDate,
  validateDob,
  validateDueDate,
  type AgeBasis,
} from '../../domain/age';
import { formatLongDate, todayLocal } from '../../domain/dates';
import type { CorrectedAgeSettings } from '../../types';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { resizePhoto } from '../photo';

export function ErrorText({ id, children }: { id: string; children: string }) {
  return (
    <p class="error-text" id={id} role="alert">
      <Icon name="info" size={16} />
      <span>{children}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Date of birth
// ---------------------------------------------------------------------------

export function DobField({ value, onInput, showError, label = 'Date of birth' }: { value: string; onInput: (v: string) => void; showError: boolean; label?: string }) {
  const today = todayLocal();
  const validation = validateDob(value, today);
  const invalid = showError && !validation.ok;
  return (
    <div class="field">
      <label class="label" for="dob">{label}</label>
      <input
        id="dob"
        class="input"
        type="date"
        required
        min="1900-01-01"
        max={today}
        value={value}
        aria-invalid={invalid}
        aria-describedby={invalid ? 'dob-error' : value && validation.ok ? 'dob-age' : undefined}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
      />
      {invalid && !validation.ok && <ErrorText id="dob-error">{validation.message}</ErrorText>}
      {value && validation.ok && (
        <p class="hint" id="dob-age" aria-live="polite">
          Age today: <strong style={{ color: 'var(--text)' }}>{formatAge(ageBetween(value, today))}</strong>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Corrected age
// ---------------------------------------------------------------------------

export interface CorrectedAgeDraft {
  bornEarly: 'no' | 'yes' | null;
  method: 'dueDate' | 'gestationalAge';
  dueDate: string;
  weeks: string;
  days: string;
  basis: AgeBasis;
}

export function draftFromSettings(s: CorrectedAgeSettings, basis: AgeBasis): CorrectedAgeDraft {
  return {
    bornEarly: s.enabled ? 'yes' : null,
    method: s.inputMethod,
    dueDate: s.inputMethod === 'dueDate' ? s.dueDate ?? '' : '',
    weeks: s.gestationalWeeks?.toString() ?? '',
    days: s.gestationalDays?.toString() ?? '0',
    basis,
  };
}

export type CorrectedAgeEvaluation =
  | { kind: 'off' }
  | { kind: 'incomplete'; message: string }
  | { kind: 'invalid'; message: string }
  | { kind: 'notApplicable'; message: string }
  | { kind: 'ok'; settings: CorrectedAgeSettings };

/** Turns the form draft into validated settings. Never alters what the parent typed. */
export function evaluateCorrectedAge(dob: string, d: CorrectedAgeDraft): CorrectedAgeEvaluation {
  if (d.bornEarly !== 'yes') return { kind: 'off' };
  if (!validateDob(dob, todayLocal()).ok) return { kind: 'incomplete', message: 'Enter a valid date of birth first.' };
  if (d.method === 'dueDate') {
    if (!d.dueDate) return { kind: 'incomplete', message: 'Please enter the estimated due date.' };
    const v = validateDueDate(dob, d.dueDate);
    if (!v.ok) return { kind: 'invalid', message: v.message };
    if (!v.applicable) return { kind: 'notApplicable', message: v.message };
    return { kind: 'ok', settings: { enabled: true, inputMethod: 'dueDate', dueDate: d.dueDate, gestationalWeeks: null, gestationalDays: null } };
  }
  if (d.weeks === '') return { kind: 'incomplete', message: 'Please choose the weeks of pregnancy at birth.' };
  const weeks = Number(d.weeks);
  const days = Number(d.days || '0');
  const v = dueDateFromGestationalAge(dob, weeks, days);
  if (!v.ok) return { kind: 'invalid', message: v.message };
  if (!v.applicable) return { kind: 'notApplicable', message: v.message };
  return { kind: 'ok', settings: { enabled: true, inputMethod: 'gestationalAge', dueDate: v.dueDate, gestationalWeeks: weeks, gestationalDays: days } };
}

export function CorrectedAgeInfo({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="About corrected age" onClose={onClose}>
      <div class="stack small">
        <p>
          <strong>Chronological age</strong> counts from your child’s date of birth.
        </p>
        <p>
          <strong>Corrected age</strong> (sometimes called adjusted age) counts from the estimated due date instead. It equals chronological age minus the
          number of weeks your child was born before 40 weeks of pregnancy.
        </p>
        <p>
          <strong>How this app calculates it:</strong> if you enter weeks of pregnancy at birth, the due date is estimated as the birth date plus (40 weeks
          minus the weeks and days entered). Before the due date, the app shows the time remaining instead of a negative age.
        </p>
        <p>
          <strong>Limitations:</strong> this is a simple date calculation. The app doesn’t decide whether corrected age is right for your child, or for how
          long to use it — your child’s healthcare provider can advise you. You choose which age the app uses for viewing milestones, and you can change it
          at any time. Both ages are always labeled.
        </p>
        <p class="muted">
          The input limits (20 weeks 0 days to 41 weeks 6 days, or a due date up to 20 weeks after birth) exist only to catch typing mistakes. They are not
          medical guidance.
        </p>
      </div>
      <button class="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-6)' }} onClick={onClose}>
        Close
      </button>
    </Sheet>
  );
}

export function CorrectedAgeFields({ dob, draft, onChange, showErrors }: { dob: string; draft: CorrectedAgeDraft; onChange: (d: CorrectedAgeDraft) => void; showErrors: boolean }) {
  const [info, setInfo] = useState(false);
  const evaluation = evaluateCorrectedAge(dob, draft);
  const set = (patch: Partial<CorrectedAgeDraft>) => onChange({ ...draft, ...patch });
  const today = todayLocal();

  return (
    <div>
      <div class="field">
        <span class="label" id="early-label">Was your child born before their due date?</span>
        <div role="radiogroup" aria-labelledby="early-label">
          {(
            [
              ['no', 'No, or I’d rather not use corrected age'],
              ['yes', 'Yes — I’d like to see corrected age'],
            ] as const
          ).map(([value, text]) => (
            <button type="button" key={value} class="choice" role="radio" aria-checked={draft.bornEarly === value} onClick={() => set({ bornEarly: value })}>
              <span>{text}</span>
              {draft.bornEarly === value && <span class="check"><Icon name="check" /></span>}
            </button>
          ))}
        </div>
        <button type="button" class="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-2)', paddingLeft: 0 }} onClick={() => setInfo(true)}>
          <Icon name="info" size={18} /> What is corrected age?
        </button>
      </div>

      {draft.bornEarly === 'yes' && (
        <div class="card" style={{ marginTop: 'var(--space-3)', boxShadow: 'none', background: 'var(--surface-sunken)', borderColor: 'transparent' }}>
          <div class="segmented" role="group" aria-label="How would you like to enter it?">
            <button type="button" aria-pressed={draft.method === 'dueDate'} onClick={() => set({ method: 'dueDate' })}>
              Due date
            </button>
            <button type="button" aria-pressed={draft.method === 'gestationalAge'} onClick={() => set({ method: 'gestationalAge' })}>
              Weeks at birth
            </button>
          </div>

          {draft.method === 'dueDate' ? (
            <div class="field" style={{ marginTop: 'var(--space-4)' }}>
              <label class="label" for="due-date">Estimated due date</label>
              <input
                id="due-date"
                class="input"
                type="date"
                value={draft.dueDate}
                aria-invalid={showErrors && evaluation.kind === 'invalid'}
                onInput={(e) => set({ dueDate: (e.target as HTMLInputElement).value })}
              />
            </div>
          ) : (
            <div class="field" style={{ marginTop: 'var(--space-4)' }}>
              <span class="label" id="ga-label">Weeks of pregnancy at birth</span>
              <div class="input-row" role="group" aria-labelledby="ga-label">
                <label>
                  <span class="visually-hidden">Weeks</span>
                  <select class="select" value={draft.weeks} onChange={(e) => set({ weeks: (e.target as HTMLSelectElement).value })} aria-label="Weeks">
                    <option value="">Weeks</option>
                    {Array.from({ length: GA_MAX_WEEKS - GA_MIN_WEEKS + 1 }, (_, i) => GA_MIN_WEEKS + i).map((w) => (
                      <option key={w} value={String(w)}>{w} weeks</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span class="visually-hidden">Days</span>
                  <select class="select" value={draft.days} onChange={(e) => set({ days: (e.target as HTMLSelectElement).value })} aria-label="Days">
                    {Array.from({ length: 7 }, (_, d) => (
                      <option key={d} value={String(d)}>{d} {d === 1 ? 'day' : 'days'}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {(evaluation.kind === 'invalid' || (showErrors && evaluation.kind === 'incomplete')) && <ErrorText id="ca-error">{evaluation.message}</ErrorText>}
          {evaluation.kind === 'notApplicable' && (
            <p class="banner neutral" style={{ marginTop: 'var(--space-3)' }}>
              <Icon name="info" size={18} />
              <span>{evaluation.message}</span>
            </p>
          )}
          {evaluation.kind === 'ok' && (
            <CorrectedPreview dob={dob} dueDate={evaluation.settings.dueDate!} today={today} showDueDate={draft.method === 'gestationalAge'} />
          )}

          {evaluation.kind === 'ok' && (
            <div class="field" style={{ marginTop: 'var(--space-5)' }}>
              <span class="label" id="basis-label">Age to use for viewing milestones</span>
              <div role="radiogroup" aria-labelledby="basis-label">
                {(
                  [
                    ['chronological', 'Chronological age (from date of birth)'],
                    ['corrected', 'Corrected age (from due date)'],
                  ] as const
                ).map(([value, text]) => (
                  <button type="button" key={value} class="choice" role="radio" aria-checked={draft.basis === value} onClick={() => set({ basis: value })}>
                    <span>{text}</span>
                    {draft.basis === value && <span class="check"><Icon name="check" /></span>}
                  </button>
                ))}
              </div>
              <p class="hint">You can change this later. Calendar care references always use chronological age.</p>
            </div>
          )}
        </div>
      )}
      {info && <CorrectedAgeInfo onClose={() => setInfo(false)} />}
    </div>
  );
}

function CorrectedPreview({ dob, dueDate, today, showDueDate }: { dob: string; dueDate: string; today: string; showDueDate: boolean }) {
  const c = correctedAge(dob, dueDate, today);
  return (
    <dl class="kv" style={{ marginTop: 'var(--space-4)' }} aria-live="polite">
      {showDueDate && (
        <>
          <dt>Estimated due date</dt>
          <dd>{formatLongDate(dueDate)}</dd>
        </>
      )}
      <dt>Chronological age</dt>
      <dd>{formatAge(ageBetween(dob, today))}</dd>
      <dt>Corrected age</dt>
      <dd>{c.status === 'corrected' ? formatAge(c.age) : c.status === 'beforeDueDate' ? formatBeforeDueDate(c) : '—'}</dd>
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Photo
// ---------------------------------------------------------------------------

export type PhotoDraft = { kind: 'unchanged' } | { kind: 'remove' } | { kind: 'new'; blob: Blob; width: number; height: number; url: string };

export function PhotoField({ existingUrl, draft, onChange }: { existingUrl: string | null; draft: PhotoDraft; onChange: (d: PhotoDraft) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const url = draft.kind === 'new' ? draft.url : draft.kind === 'remove' ? null : existingUrl;
  useEffect(() => () => {
    if (draft.kind === 'new') URL.revokeObjectURL(draft.url);
  }, [draft]);

  return (
    <div class="field">
      <span class="label">Photo (optional)</span>
      <div class="photo-picker">
        <span class="avatar" style={{ width: '72px', height: '72px', background: 'var(--surface-sunken)', color: 'var(--text-muted)' }} aria-hidden="true">
          {url ? <img src={url} alt="" /> : <Icon name="camera" size={26} />}
        </span>
        <div class="stack" style={{ marginTop: 0 }}>
          <label class="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
            {busy ? 'Preparing…' : url ? 'Change photo' : 'Choose photo'}
            <input
              type="file"
              accept="image/*"
              class="visually-hidden"
              data-testid="photo-input"
              onChange={async (e) => {
                const input = e.target as HTMLInputElement;
                const file = input.files?.[0];
                input.value = '';
                if (!file) return;
                setError(null);
                setBusy(true);
                try {
                  const r = await resizePhoto(file);
                  onChange({ kind: 'new', ...r, url: URL.createObjectURL(r.blob) });
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'The photo couldn’t be used.');
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {url && (
            <button type="button" class="btn btn-ghost btn-sm" onClick={() => onChange({ kind: 'remove' })}>
              Remove photo
            </button>
          )}
        </div>
      </div>
      <p class="hint">Photos are resized and stored only on this device.</p>
      {error && <ErrorText id="photo-error">{error}</ErrorText>}
    </div>
  );
}
