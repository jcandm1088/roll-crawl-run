import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { href, navigate } from '../../../router';
import { ageBetween, formatAge, validateDob } from '../../../domain/age';
import { todayLocal } from '../../../domain/dates';
import { countBackupsContainingChild, deleteChild } from '../../../data/repositories/childrenRepo';
import { Avatar, childDisplayName, usePhotoUrl } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { CorrectedAgeFields, DobField, ErrorText, PhotoField, draftFromSettings } from '../../components/ChildFields';
import { CHILD_COLORS } from '../../theme/themes';
import type { Child, ChildColor } from '../../../types';
import { EMPTY_CORRECTED, draftToInput, saveChild, type ChildDraft } from './saveChild';

export function ProfilesList() {
  const { children, activeChild, setActiveChild } = useApp();
  const today = todayLocal();
  return (
    <div>
      <p class="muted small" style={{ margin: 'var(--space-2) var(--space-1) var(--space-4)' }}>
        Each child has their own records. The highlighted profile is the one you’re currently viewing.
      </p>
      <ul class="list card list-card">
        {children.map((c) => (
          <li key={c.id}>
            <div class="list-item" style={{ cursor: 'default' }}>
              <Avatar child={c} size={44} />
              <span class="grow">
                <span class="title-3" style={{ display: 'block' }}>{childDisplayName(c)}</span>
                <span class="small muted">{formatAge(ageBetween(c.dob, today))}</span>
              </span>
              {c.id === activeChild?.id ? (
                <span class="badge">Viewing</span>
              ) : (
                <button class="btn btn-outline btn-sm" onClick={() => setActiveChild(c.id)}>
                  View
                </button>
              )}
              <a class="icon-btn plain" href={href({ name: 'profileEdit', id: c.id })} aria-label={`Edit ${childDisplayName(c)}`}>
                <Icon name="pencil" size={20} />
              </a>
            </div>
          </li>
        ))}
      </ul>
      <a class="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-4)' }} href={href({ name: 'profileNew' })}>
        <Icon name="plus" size={18} /> Add a child
      </a>
    </div>
  );
}

export function ProfileForm({ childId }: { childId: string | null }) {
  const app = useApp();
  const existing = childId ? app.children.find((c) => c.id === childId) ?? null : null;
  const existingPhotoUrl = usePhotoUrl(existing?.photoId ?? null);
  const [draft, setDraft] = useState<ChildDraft>(() =>
    existing
      ? { name: existing.name ?? '', dob: existing.dob, about: existing.about ?? '', corrected: { ...draftFromSettings(existing.correctedAge, existing.ageBasis), bornEarly: existing.correctedAge.enabled ? 'yes' : 'no' }, photo: { kind: 'unchanged' } }
      : { name: '', dob: '', about: '', corrected: EMPTY_CORRECTED, photo: { kind: 'unchanged' } },
  );
  const [color, setColor] = useState<ChildColor | undefined>(existing?.color);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (childId && !existing) {
    return (
      <div class="card">
        <p>This profile no longer exists.</p>
        <a class="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }} href={href({ name: 'profiles' })}>Back to profiles</a>
      </div>
    );
  }

  const submit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    if (!validateDob(draft.dob, todayLocal()).ok) {
      setShowErrors(true);
      return;
    }
    const r = draftToInput(draft);
    if (!r.ok) {
      setShowErrors(true);
      setError(r.message);
      return;
    }
    setSaving(true);
    try {
      const child = await saveChild(app.db, app.meta.deviceId, existing?.id ?? null, { ...r.input, color }, draft.photo);
      if (!existing) await app.setSettings({ activeChildId: child.id });
      await app.refresh();
      navigate(existing ? { name: 'profiles' } : { name: 'home' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The profile couldn’t be saved.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div class="card">
        <div class="field">
          <label class="label" for="child-name">Name or nickname (optional)</label>
          <input id="child-name" class="input" type="text" autocomplete="off" maxLength={60} value={draft.name} onInput={(e) => setDraft({ ...draft, name: (e.target as HTMLInputElement).value })} />
        </div>
        <DobField value={draft.dob} onInput={(dob) => setDraft({ ...draft, dob })} showError={showErrors || (!!draft.dob && !validateDob(draft.dob, todayLocal()).ok)} />
        <PhotoField existingUrl={existingPhotoUrl} draft={draft.photo} onChange={(photo) => setDraft({ ...draft, photo })} />
        {existing && (
          <div class="field">
            <span class="label" id="color-label">Profile color</span>
            <div class="row" role="radiogroup" aria-labelledby="color-label" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {(Object.keys(CHILD_COLORS) as ChildColor[]).map((c) => (
                <button
                  type="button"
                  key={c}
                  role="radio"
                  aria-checked={color === c}
                  aria-label={CHILD_COLORS[c].name}
                  onClick={() => setColor(c)}
                  style={{
                    width: '44px', height: '44px', borderRadius: '50%', background: CHILD_COLORS[c].hex, cursor: 'pointer', color: '#fff',
                    border: color === c ? '3px solid var(--text)' : '3px solid transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {color === c && <Icon name="check" size={18} />}
                </button>
              ))}
            </div>
            <span class="hint">Helps you see at a glance whose profile is active.</span>
          </div>
        )}
        <div class="field">
          <label class="label" for="child-about">Additional information (optional)</label>
          <textarea id="child-about" class="textarea" maxLength={500} value={draft.about} onInput={(e) => setDraft({ ...draft, about: (e.target as HTMLTextAreaElement).value })} />
        </div>
      </div>

      <div class="card">
        <h2 class="title-3" style={{ marginBottom: 'var(--space-3)' }}>Corrected age</h2>
        <CorrectedAgeFields dob={draft.dob} draft={draft.corrected} onChange={(corrected) => setDraft({ ...draft, corrected })} showErrors={showErrors} />
      </div>

      {error && <ErrorText id="form-error">{error}</ErrorText>}
      <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
        <button class="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Add child'}
        </button>
        <a class="btn btn-ghost btn-block" href={href({ name: existing ? 'profiles' : 'home' })}>Cancel</a>
      </div>

      {existing && (
        <div class="card" style={{ marginTop: 'var(--space-8)' }}>
          <h2 class="title-3">Delete this profile</h2>
          <p class="small muted" style={{ marginTop: 'var(--space-2)' }}>Permanently removes {childDisplayName(existing)}’s profile and all information recorded for them on this device.</p>
          <button type="button" class="btn btn-danger btn-block" style={{ marginTop: 'var(--space-4)' }} onClick={() => setDeleting(true)}>
            <Icon name="trash" size={18} /> Delete profile…
          </button>
        </div>
      )}
      {deleting && existing && <DeleteChildSheet child={existing} onClose={() => setDeleting(false)} />}
    </form>
  );
}

function DeleteChildSheet({ child, onClose }: { child: Child; onClose: () => void }) {
  const app = useApp();
  const [typed, setTyped] = useState('');
  const [purge, setPurge] = useState(true); // Q10: checked by default
  const [backupCount, setBackupCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    countBackupsContainingChild(app.db, child.id).then(setBackupCount);
  }, [app.db, child.id]);

  const confirmWord = 'DELETE';
  const ok = typed.trim().toUpperCase() === confirmWord;
  const name = childDisplayName(child);

  return (
    <Sheet title={`Delete ${name}’s profile?`} onClose={onClose}>
      <div class="stack small">
        <p>This permanently removes from this device:</p>
        <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
          <li>the profile, date of birth, and photo</li>
          <li>all milestones, goals, calendar events, journal entries, and history recorded for {name}</li>
        </ul>
        <p>
          <strong>Internal backups:</strong>{' '}
          {backupCount === null ? 'checking…' : backupCount === 0 ? 'no internal backups contain this profile.' : `${backupCount} internal backup${backupCount === 1 ? '' : 's'} contain this profile.`}
        </p>
        <label class="choice" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={purge} onChange={(e) => setPurge((e.target as HTMLInputElement).checked)} style={{ width: '22px', height: '22px', accentColor: 'var(--primary)' }} />
          <span>Also permanently remove {name} from internal backups</span>
        </label>
        <p class="muted">
          Files you’ve already exported or shared outside the app can’t be removed by the app. Data is removed from the app’s storage; the app can’t guarantee how
          your device’s storage erases it.
        </p>
        <div class="field">
          <label class="label" for="confirm-delete">Type {confirmWord} to confirm</label>
          <input id="confirm-delete" class="input" autocomplete="off" autocapitalize="characters" value={typed} onInput={(e) => setTyped((e.target as HTMLInputElement).value)} />
        </div>
        {error && <ErrorText id="delete-error">{error}</ErrorText>}
      </div>
      <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
        <button
          type="button"
          class="btn btn-primary btn-block"
          disabled={!ok || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await deleteChild(app.db, app.meta.deviceId, child.id, { purgeFromBackups: purge });
              await app.refresh();
              onClose();
              navigate({ name: 'profiles' });
            } catch (e) {
              setError(e instanceof Error ? e.message : 'The profile couldn’t be deleted.');
              setBusy(false);
            }
          }}
        >
          {busy ? 'Deleting…' : 'Permanently delete'}
        </button>
        <button type="button" class="btn btn-ghost btn-block" onClick={onClose}>Keep profile</button>
      </div>
    </Sheet>
  );
}
