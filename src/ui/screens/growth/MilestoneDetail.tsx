import { useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { keyFromTarget, notifyMilestonesChanged, targetFromKey, useChildMilestones } from '../../../state/milestones';
import { href, navigate } from '../../../router';
import { STATUS_LABEL, appCategoryLabel, getMilestone, isApplicable, referenceAgeLabel, sourceFor, type MilestoneStatus } from '../../../domain/milestones';
import { formatLongDate } from '../../../domain/dates';
import { observationsFor } from '../../../domain/milestoneHistory';
import {
  addObservation, correctAchievedDate, createPersonalVersion, eraseEntryText, removeObservation, setHidden, setNote, setStatus, updatePersonalVersion,
  type MilestoneTarget, type WriteContext,
} from '../../../data/repositories/milestonesRepo';
import type { MilestoneEvent } from '../../../types';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { ErrorText } from '../../components/ChildFields';
import { childNameInline } from '../../components/Avatar';
import { radioGroupKeyDown, rovingTabIndex } from '../../a11y';
import { ExternalLink, StatusBadge } from './parts';
import { confirmationFor, type Confirmation, type SavedAction } from '../../../domain/confirmations';
import { bareAge } from '../../../domain/guide';

const STATUSES: MilestoneStatus[] = ['not-yet', 'emerging', 'achieved'];

function describe(e: MilestoneEvent): string {
  switch (e.type) {
    case 'status':
      return `${STATUS_LABEL[e.fromStatus!]} → ${STATUS_LABEL[e.toStatus!]}`;
    case 'achieved-date-corrected':
      return `Achievement date corrected from ${e.fromDate ? formatLongDate(e.fromDate) : '—'} to ${e.toDate ? formatLongDate(e.toDate) : '—'}`;
    case 'observation':
      return 'Observation';
    case 'observation-removed':
      return 'Observation removed from view';
    case 'note':
      return 'Note updated';
    case 'hidden':
      return 'Hidden (not counted in progress)';
    case 'restored':
      return 'Restored';
    case 'personal-version-created':
      return 'Personal version created';
    case 'personal-version-edited':
      return 'Personal version edited';
    case 'entry-erased':
      return 'An entry’s text was permanently erased';
  }
}

export function MilestoneDetailScreen({ routeKey }: { routeKey: string }) {
  const app = useApp();
  const child = app.activeChild;
  const m = useChildMilestones(child);
  const target: MilestoneTarget = targetFromKey(routeKey);
  const def = target.kind === 'sourced' ? getMilestone(target.defId) : undefined;
  const personal = target.kind === 'personal' ? m.data?.personal.find((p) => p.id === target.customId) : undefined;
  const rec = m.recordFor(target);
  const status: MilestoneStatus = rec?.status ?? 'not-yet';

  const [draftStatus, setDraftStatus] = useState<MilestoneStatus | null>(null);
  const [statusDate, setStatusDate] = useState(m.today);
  const [fixDate, setFixDate] = useState('');
  const [note, setNoteDraft] = useState<string | null>(null);
  const [obsDate, setObsDate] = useState(m.today);
  const [obsText, setObsText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Confirmation | null>(null);
  const [sheet, setSheet] = useState<null | { kind: 'personal' } | { kind: 'edit' } | { kind: 'remove'; id: string } | { kind: 'erase'; id: string; step: 1 | 2 }>(null);

  if (!child || !m.ctx || !m.age) return null;
  if (m.loading) return <p class="muted small">Loading…</p>;
  if (!def && !personal) {
    return (
      <div class="card stack">
        <p>This milestone isn’t available for {childNameInline(child)}.</p>
        <a class="btn btn-secondary" href={href({ name: 'growthLibrary', preset: null })}>Open the Milestone Library</a>
      </div>
    );
  }
  const ctx: WriteContext = m.ctx;
  const name = childNameInline(child);
  // The confirmation describes the RESULTING record (owner rule): applicability uses the same rule
  // as Progress, and hidden/status are those after the save.
  const applicableNow = def ? isApplicable(def, m.age.months) : false;
  const confirm = (action: SavedAction, after: { hidden?: boolean; status?: MilestoneStatus } = {}) =>
    confirmationFor(action, {
      personal: !!personal,
      applicable: applicableNow,
      hidden: after.hidden ?? !!rec?.hidden,
      status: after.status ?? status,
      childName: name,
      basis: child.correctedAge.enabled && child.ageBasis === 'corrected' ? 'corrected' : 'chronological',
      ageWords: def ? bareAge(def.referenceAgeMonths) : '',
    });
  const run = async (fn: () => Promise<void>, message: Confirmation) => {
    setError(null);
    setSaved(null);
    try {
      await fn();
      notifyMilestonesChanged();
      setSaved(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That couldn’t be saved.');
    }
  };
  const chosen = draftStatus ?? status;
  const events = rec ? m.data!.events.filter((e) => e.recordId === rec.id) : [];
  const observations = rec ? observationsFor(m.data!.events, rec.id) : [];
  const visibleObs = observations.filter((o) => !o.removed);
  const src = def ? sourceFor(def) : undefined;
  const basedOn = personal?.derivedFromDefId ? getMilestone(personal.derivedFromDefId) : undefined;

  return (
    <div class="stack-lg" data-testid="milestone-detail">
      <section class="card stack">
        {personal && <span class="badge" style={{ alignSelf: 'flex-start' }}>Your version</span>}
        <h2 class="title-2" data-testid="milestone-title">{def ? def.text : personal!.title}</h2>
        {personal?.description && <p class="small">{personal.description}</p>}
        {def && (
          <>
            <p class="small muted">
              {def.referenceAgeLabel} · CDC area: {def.cdcCategory}
              {def.cdcCategory === 'Movement/Physical' && <> · App group: {appCategoryLabel(def.appCategory)}*</>}
            </p>
            {def.cdcCategory === 'Movement/Physical' && <p class="xsmall muted">*Gross and fine motor are this app’s own grouping of CDC’s Movement/Physical milestones, not a CDC or clinical classification.</p>}
            <p class="attribution">Source: CDC, <ExternalLink url={src!.url}>{src!.title}</ExternalLink>. Not endorsed by CDC, HHS, or the U.S. Government.</p>
            <p class="small" data-testid="applicability">
              {isApplicable(def, m.age.months)
                ? `This milestone applies to ${name} now.`
                : `Upcoming — ${def.referenceAgeLabel.toLowerCase()}. You can record it early; it counts in progress once ${name} reaches that age.`}
            </p>
          </>
        )}
        {personal && (
          <p class="xsmall muted" data-testid="provenance">
            Customized by you{basedOn ? <> · based on CDC’s “{basedOn.text}” ({basedOn.referenceAgeLabel})</> : personal.referenceAgeMonths ? ` · ${referenceAgeLabel(personal.referenceAgeMonths)}` : ''}. Not counted in CDC progress.
          </p>
        )}
        <div class="row"><span class="small muted">Status</span><StatusBadge status={status} /></div>
        {rec?.achievedDate && <p class="small">Achieved on <strong>{formatLongDate(rec.achievedDate)}</strong></p>}
        {rec?.firstObservedDate && <p class="small muted">First noticed {formatLongDate(rec.firstObservedDate)}</p>}
      </section>

      {rec?.hidden && (
        <div class="banner neutral" role="status" data-testid="hidden-banner">
          <Icon name="eyeOff" size={18} />
          <span class="grow">Hidden — not counted in progress. Its status and history are kept.</span>
          <button type="button" class="btn btn-secondary btn-sm" onClick={() => run(() => setHidden(app.db, ctx, target, false), confirm({ kind: 'restored' }, { hidden: false }))}>Restore</button>
        </div>
      )}

      {error && <ErrorText id="ms-error">{error}</ErrorText>}
      {saved && (
        <p class="banner" role="status" data-testid="saved">
          <Icon name="check" size={18} />
          <span data-testid="saved-text">{saved.text}{saved.showProgressLink && <> <a class="text-link" href={href({ name: 'growthProgress' })}>See Progress</a></>}</span>
        </p>
      )}

      <section class="card stack" aria-labelledby="status-heading">
        <h2 class="title-3" id="status-heading">Update status</h2>
        <div role="radiogroup" aria-labelledby="status-heading" onKeyDown={radioGroupKeyDown}>
          {STATUSES.map((s, i) => (
            <button type="button" key={s} class="choice" role="radio" aria-checked={chosen === s} tabIndex={rovingTabIndex(chosen === s, i, true)} onClick={() => setDraftStatus(s)}>
              <span>{STATUS_LABEL[s]}</span>
              {chosen === s && <span class="check"><Icon name="check" /></span>}
            </button>
          ))}
        </div>
        {chosen !== status && (
          <div class="stack">
            <div class="field">
              <label class="label" for="status-date">{chosen === 'achieved' ? 'Date achieved' : 'Date'}</label>
              <input id="status-date" class="input" type="date" min={child.dob} max={m.today} value={statusDate} onInput={(e) => setStatusDate((e.target as HTMLInputElement).value)} />
            </div>
            <button type="button" class="btn btn-primary btn-block" onClick={() => run(async () => { await setStatus(app.db, ctx, target, chosen, statusDate); setDraftStatus(null); }, confirm({ kind: 'status', from: status, to: chosen }, { status: chosen }))}>
              Save status
            </button>
          </div>
        )}
        {status === 'achieved' && chosen === 'achieved' && (
          <details>
            <summary class="small text-link" style={{ cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Correct the achievement date</summary>
            <div class="stack" style={{ marginTop: 'var(--space-2)' }}>
              <label class="label" for="fix-date">Correct date</label>
              <input id="fix-date" class="input" type="date" min={child.dob} max={m.today} value={fixDate || rec!.achievedDate!} onInput={(e) => setFixDate((e.target as HTMLInputElement).value)} />
              <button type="button" class="btn btn-outline btn-block" onClick={() => run(() => correctAchievedDate(app.db, ctx, target, fixDate || rec!.achievedDate!), confirm({ kind: 'date-corrected' }))}>Save corrected date</button>
              <p class="xsmall muted">The earlier date stays in the history.</p>
            </div>
          </details>
        )}
      </section>

      <section class="card stack" aria-labelledby="note-heading">
        <h2 class="title-3" id="note-heading">Note</h2>
        <label class="visually-hidden" for="ms-note">Note</label>
        <textarea id="ms-note" class="textarea" maxLength={1000} value={note ?? rec?.note ?? ''} onInput={(e) => setNoteDraft((e.target as HTMLTextAreaElement).value)} />
        <button type="button" class="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} disabled={note === null || note.trim() === (rec?.note ?? '')} onClick={() => run(async () => { await setNote(app.db, ctx, target, note ?? ''); setNoteDraft(null); }, confirm({ kind: 'note' }))}>
          Save note
        </button>
      </section>

      <section class="card stack" aria-labelledby="obs-heading">
        <h2 class="title-3" id="obs-heading">Observations</h2>
        <p class="xsmall muted">Dated notes about what you noticed. Adding one doesn’t change the status.</p>
        <div class="input-row">
          <label style={{ flex: '0 0 auto' }}>
            <span class="label">Date</span>
            <input class="input" type="date" min={child.dob} max={m.today} value={obsDate} onInput={(e) => setObsDate((e.target as HTMLInputElement).value)} aria-label="Observation date" />
          </label>
        </div>
        <label class="label" for="obs-text">What you noticed</label>
        <textarea id="obs-text" class="textarea" maxLength={1000} value={obsText} onInput={(e) => setObsText((e.target as HTMLTextAreaElement).value)} />
        <button type="button" class="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={!obsText.trim()} onClick={() => run(async () => { await addObservation(app.db, ctx, target, obsDate, obsText); setObsText(''); }, confirm({ kind: 'observation-added' }))}>
          <Icon name="plus" size={16} /> Add observation
        </button>
        {visibleObs.length > 0 && (
          <ul class="list" data-testid="observations">
            {visibleObs.map((o) => (
              <li key={o.id} class="row-between" style={{ padding: 'var(--space-3) 0', borderTop: '1px solid var(--border)', alignItems: 'flex-start' }}>
                <span class="small"><span class="history-date" style={{ display: 'block' }}>{o.date ? formatLongDate(o.date) : ''}</span>{o.text}</span>
                <button type="button" class="btn btn-quiet btn-sm" onClick={() => setSheet({ kind: 'remove', id: o.id })} aria-label={`Remove observation from ${o.date ? formatLongDate(o.date) : ''}`}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section class="card stack" aria-labelledby="history-heading" data-testid="history">
        <h2 class="title-3" id="history-heading">History</h2>
        {events.length === 0 ? (
          <p class="small muted">Nothing recorded yet.</p>
        ) : (
          <ol class="history-list">
            {[...events].reverse().map((e) => {
              const removed = e.type === 'observation' && observations.find((o) => o.id === e.id)?.removed;
              return (
                <li key={e.id} data-testid="history-entry" data-type={e.type}>
                  <span class="history-date">{e.eventDate ? formatLongDate(e.eventDate) : ''} · recorded {formatLongDate(e.recordedAt.slice(0, 10))}</span>
                  <p class="small" style={{ fontWeight: 600 }}>{describe(e)}</p>
                  {(e.type === 'observation' || e.type === 'note') && (
                    e.erasedAt ? <p class="small muted">Text permanently erased.</p> : e.text ? (
                      <>
                        <p class={`small${removed ? ' removed-text' : ''}`}>{e.text}</p>
                        {removed && <p class="xsmall muted">Removed from view. This text is still stored in this device’s history.</p>}
                        <button type="button" class="btn btn-quiet btn-sm" style={{ marginTop: '6px' }} onClick={() => setSheet({ kind: 'erase', id: e.id, step: 1 })}>Erase permanently…</button>
                      </>
                    ) : null
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section class="card stack">
        {def && (
          <button type="button" class="btn btn-outline btn-block" onClick={() => setSheet({ kind: 'personal' })}>
            <Icon name="copyPlus" size={18} /> Make a personal version
          </button>
        )}
        {personal && (
          <button type="button" class="btn btn-outline btn-block" onClick={() => setSheet({ kind: 'edit' })}>
            <Icon name="pencil" size={18} /> Edit your version
          </button>
        )}
        {!rec?.hidden && (
          <button type="button" class="btn btn-quiet btn-block" onClick={() => run(() => setHidden(app.db, ctx, target, true), confirm({ kind: 'hidden' }, { hidden: true }))}>
            <Icon name="eyeOff" size={18} /> Hide this milestone
          </button>
        )}
        <p class="xsmall muted">Hidden milestones aren’t counted in progress. Their status and history are kept, and you can restore them from the Milestone Library.</p>
      </section>

      {sheet?.kind === 'personal' && def && (
        <PersonalVersionSheet
          title="Make a personal version"
          initial={{ title: def.text, description: '' }}
          note={`Creates your own copy, marked “Your version.” CDC’s milestone stays exactly as published, and your version isn’t counted in CDC progress.`}
          onClose={() => setSheet(null)}
          onSave={async (v) => {
            const item = await createPersonalVersion(app.db, ctx, { ...v, derivedFromDefId: def.id, appCategory: def.appCategory, referenceAgeMonths: def.referenceAgeMonths });
            notifyMilestonesChanged();
            setSheet(null);
            navigate({ name: 'growthMilestone', key: keyFromTarget({ kind: 'personal', customId: item.id }) });
          }}
        />
      )}
      {sheet?.kind === 'edit' && personal && (
        <PersonalVersionSheet
          title="Edit your version"
          initial={{ title: personal.title, description: personal.description }}
          onClose={() => setSheet(null)}
          onSave={async (v) => {
            await updatePersonalVersion(app.db, ctx, personal.id, v);
            notifyMilestonesChanged();
            setSheet(null);
            setSaved(confirm({ kind: 'personal-saved' }));
          }}
        />
      )}
      {sheet?.kind === 'remove' && (
        <Sheet title="Remove this observation?" onClose={() => setSheet(null)}>
          <p class="small">It will be removed from this list. Its text stays in this milestone’s history on this device, marked as removed. To remove the text completely, use “Erase permanently” in the history.</p>
          <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
            <button type="button" class="btn btn-primary btn-block" onClick={() => setSheet(null)}>Cancel</button>
            <button type="button" class="btn btn-quiet btn-block" onClick={async () => { const id = sheet.id; setSheet(null); await run(() => removeObservation(app.db, ctx, target, id), confirm({ kind: 'observation-removed' })); }}>Remove</button>
          </div>
        </Sheet>
      )}
      {sheet?.kind === 'erase' && (
        <Sheet title={sheet.step === 1 ? 'Erase this text permanently?' : 'Final confirmation'} onClose={() => setSheet(null)}>
          <p class="small">{sheet.step === 1 ? 'The text of this entry will be permanently deleted from this device. The history will only show that something was erased. This can’t be undone.' : 'Erase it now?'}</p>
          <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
            <button type="button" class="btn btn-primary btn-block" onClick={() => setSheet(null)}>Cancel — keep it</button>
            {sheet.step === 1 ? (
              <button type="button" class="btn btn-quiet btn-block" onClick={() => setSheet({ ...sheet, step: 2 })}>Continue</button>
            ) : (
              <button type="button" class="btn btn-danger btn-block" onClick={async () => { const id = sheet.id; setSheet(null); await run(() => eraseEntryText(app.db, ctx, target, id), confirm({ kind: 'text-erased' })); }}>Yes, erase permanently</button>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function PersonalVersionSheet({ title, initial, note, onClose, onSave }: { title: string; initial: { title: string; description: string }; note?: string; onClose: () => void; onSave: (v: { title: string; description: string }) => Promise<void> }) {
  const [t, setT] = useState(initial.title);
  const [d, setD] = useState(initial.description);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet title={title} onClose={onClose}>
      <div class="stack">
        {note && <p class="small muted">{note}</p>}
        <div class="field">
          <label class="label" for="pv-title">Title</label>
          <input id="pv-title" class="input" maxLength={200} value={t} onInput={(e) => setT((e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label class="label" for="pv-desc">Description (optional)</label>
          <textarea id="pv-desc" class="textarea" maxLength={1000} value={d} onInput={(e) => setD((e.target as HTMLTextAreaElement).value)} />
        </div>
        {err && <ErrorText id="pv-error">{err}</ErrorText>}
        <button type="button" class="btn btn-primary btn-block" onClick={async () => { try { await onSave({ title: t, description: d }); } catch (e) { setErr(e instanceof Error ? e.message : 'That couldn’t be saved.'); } }}>Save</button>
        <button type="button" class="btn btn-ghost btn-block" onClick={onClose}>Cancel</button>
      </div>
    </Sheet>
  );
}
