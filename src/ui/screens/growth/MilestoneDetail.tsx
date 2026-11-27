import { useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { notifyMilestonesChanged, targetFromKey, useChildMilestones } from '../../../state/milestones';
import { href } from '../../../router';
import { STATUS_LABEL, appCategoryLabel, getMilestone, isApplicable, referenceAgeLabel, sourceFor, type MilestoneStatus } from '../../../domain/milestones';
import { displayTextOf, isWordingAdapted } from '../../../domain/milestoneDisplay';
import { formatLongDate } from '../../../domain/dates';
import { notesAndObservationsFor, observationsFor } from '../../../domain/milestoneHistory';
import { NotesAndObservations } from '../../components/NotesAndObservations';
import {
  addObservation, correctAchievedDate, editObservation, eraseEntryText, removeObservation, setHidden, setNote, setStatus, updatePersonalVersion,
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
import { LegacyEntryManagement } from '../personal/Legacy';

const STATUSES: MilestoneStatus[] = ['not-yet', 'emerging', 'achieved'];

function describe(e: MilestoneEvent): string {
  switch (e.type) {
    case 'status':
      return `${STATUS_LABEL[e.fromStatus!]} → ${STATUS_LABEL[e.toStatus!]}`;
    case 'achieved-date-corrected':
      return `Achievement date corrected from ${e.fromDate ? formatLongDate(e.fromDate) : '—'} to ${e.toDate ? formatLongDate(e.toDate) : '—'}`;
    case 'observation':
      return 'Entry added';
    case 'observation-edited':
      return e.fromDate && e.eventDate && e.fromDate !== e.eventDate
        ? `Entry edited · date changed from ${formatLongDate(e.fromDate)} to ${formatLongDate(e.eventDate)}`
        : 'Entry edited';
    case 'observation-removed':
      return 'Entry removed from view';
    case 'note':
      return e.text === '' ? 'Note removed from view' : 'Note saved (no observation date)';
    case 'hidden':
      return 'Hidden (not counted in progress)';
    case 'restored':
      return 'Restored';
    case 'personal-version-created':
      return 'Personal entry created';
    case 'personal-version-edited':
      return 'Personal entry edited';
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
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Confirmation | null>(null);
  const [sheet, setSheet] = useState<null | { kind: 'edit' } | { kind: 'remove'; id: string } | { kind: 'remove-note' } | { kind: 'erase'; id: string; step: 1 | 2 }>(null);

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
  /** Runs a save; returns whether it succeeded (a failed save keeps whatever the parent typed). */
  const run = async (fn: () => Promise<void>, message: Confirmation): Promise<boolean> => {
    setError(null);
    setSaved(null);
    try {
      await fn();
      notifyMilestonesChanged();
      setSaved(message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That couldn’t be saved.');
      return false;
    }
  };
  const chosen = draftStatus ?? status;
  const events = rec ? m.data!.events.filter((e) => e.recordId === rec.id) : [];
  const observations = rec ? observationsFor(m.data!.events, rec.id) : [];
  const removedIds = new Set(observations.filter((o) => o.removed).map((o) => o.id));
  const entries = rec ? notesAndObservationsFor(m.data!.events, rec) : [];
  const src = def ? sourceFor(def) : undefined;
  const basedOn = personal?.derivedFromDefId ? getMilestone(personal.derivedFromDefId) : undefined;

  return (
    <div class="stack-lg" data-testid="milestone-detail">
      <section class="card stack">
        {personal && <span class="badge" style={{ alignSelf: 'flex-start' }}>Personal entry</span>}
        <h2 class="title-2" data-testid="milestone-title">{def ? displayTextOf(def) : personal!.title}</h2>
        {personal?.description && <p class="small">{personal.description}</p>}
        {def && (
          <>
            <p class="small muted" data-testid="milestone-meta">
              {def.referenceAgeLabel} · {appCategoryLabel(def.appCategory)}
            </p>
            {def.cdcCategory === 'Movement/Physical' && <p class="xsmall muted" data-testid="motor-grouping-note">Gross and fine motor are this app’s own grouping of movement milestones, not a clinical classification.</p>}
            <p class="small" data-testid="applicability">
              {isApplicable(def, m.age.months)
                ? `This milestone applies to ${name} now.`
                : `Upcoming — ${def.referenceAgeLabel.toLowerCase()}. You can record it early; it counts in progress once ${name} reaches that age.`}
            </p>
            {isWordingAdapted(def) && (
              <details class="original-wording" data-testid="original-wording">
                <summary class="xsmall text-link">Wording adapted to be gender-neutral</summary>
                <p class="xsmall muted">CDC’s original wording: “{def.text}”</p>
              </details>
            )}
            <p class="attribution" data-testid="detail-source">From CDC’s <ExternalLink url={src!.url}>{src!.title}</ExternalLink> checklist. Not endorsed by CDC, HHS, or the U.S. Government.</p>
          </>
        )}
        {personal && (
          <p class="xsmall muted" data-testid="provenance">
            A personal entry you added with an earlier version of the app{basedOn ? <>, based on the milestone {displayTextOf(basedOn)} ({basedOn.referenceAgeLabel.toLowerCase()})</> : personal.referenceAgeMonths ? ` (${referenceAgeLabel(personal.referenceAgeMonths).toLowerCase()})` : ''}. It’s kept as you left it and isn’t counted in Progress.
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

      <NotesAndObservations
        entries={entries}
        dob={child.dob}
        today={m.today}
        onAdd={(date, text) => run(() => addObservation(app.db, ctx, target, date, text), confirm({ kind: 'observation-added' }))}
        onEdit={(id, date, text) => run(() => editObservation(app.db, ctx, target, id, date, text), confirm({ kind: 'observation-edited' }))}
        onEditNote={(text) => run(() => setNote(app.db, ctx, target, text), confirm({ kind: 'note' }))}
        onRemove={(id) => setSheet({ kind: 'remove', id })}
        onRemoveNote={() => setSheet({ kind: 'remove-note' })}
      />

      <section class="card stack" aria-labelledby="history-heading" data-testid="history">
        <h2 class="title-3" id="history-heading">History</h2>
        {events.length === 0 ? (
          <p class="small muted">Nothing recorded yet.</p>
        ) : (
          <ol class="history-list">
            {[...events].reverse().map((e) => {
              const isText = e.type === 'observation' || e.type === 'observation-edited' || e.type === 'note';
              const removed = (e.type === 'observation' && removedIds.has(e.id)) || (e.type === 'observation-edited' && removedIds.has(e.refEventId!));
              return (
                <li key={e.id} data-testid="history-entry" data-type={e.type}>
                  <span class="history-date">{e.eventDate && e.type !== 'note' ? `${formatLongDate(e.eventDate)} · ` : ''}recorded {formatLongDate(e.recordedAt.slice(0, 10))}</span>
                  <p class="small" style={{ fontWeight: 600 }}>{describe(e)}</p>
                  {isText && (
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
        {personal && (
          <button type="button" class="btn btn-outline btn-block" onClick={() => setSheet({ kind: 'edit' })}>
            <Icon name="pencil" size={18} /> Edit this personal entry
          </button>
        )}
        {!rec?.hidden && (
          <button type="button" class="btn btn-quiet btn-block" onClick={() => run(() => setHidden(app.db, ctx, target, true), confirm({ kind: 'hidden' }, { hidden: true }))}>
            <Icon name="eyeOff" size={18} /> Hide this milestone
          </button>
        )}
        <p class="xsmall muted">{personal ? 'Hiding keeps its status and history. You can find it again under Your personal entries in the Milestone Library.' : 'Hidden milestones aren’t counted in progress. Their status and history are kept, and you can restore them from the Milestone Library.'}</p>
      </section>

      {personal && <LegacyEntryManagement customId={personal.id} />}

      {sheet?.kind === 'edit' && personal && (
        <PersonalVersionSheet
          title="Edit this personal entry"
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
        <Sheet title="Remove this entry?" onClose={() => setSheet(null)}>
          <p class="small">It will be removed from Notes & Observations. Its text stays in this milestone’s history on this device, marked as removed. To remove the text completely, use “Erase permanently” in the history.</p>
          <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
            <button type="button" class="btn btn-primary btn-block" onClick={() => setSheet(null)}>Cancel</button>
            <button type="button" class="btn btn-quiet btn-block" onClick={async () => { const id = sheet.id; setSheet(null); await run(() => removeObservation(app.db, ctx, target, id), confirm({ kind: 'observation-removed' })); }}>Remove</button>
          </div>
        </Sheet>
      )}
      {sheet?.kind === 'remove-note' && (
        <Sheet title="Remove this note?" onClose={() => setSheet(null)}>
          <p class="small">It will be removed from Notes & Observations. Its text stays in this milestone’s history on this device. To remove the text completely, use “Erase permanently” in the history.</p>
          <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
            <button type="button" class="btn btn-primary btn-block" onClick={() => setSheet(null)}>Cancel</button>
            <button type="button" class="btn btn-quiet btn-block" onClick={async () => { setSheet(null); await run(() => setNote(app.db, ctx, target, ''), confirm({ kind: 'note-removed' })); }}>Remove</button>
          </div>
        </Sheet>
      )}
      {sheet?.kind === 'erase' && (
        <Sheet title={sheet.step === 1 ? 'Erase this text permanently?' : 'Final confirmation'} onClose={() => setSheet(null)}>
          <p class="small">{sheet.step === 1 ? 'The text of this entry, including any earlier wording of it, will be permanently deleted from this device. The history will only show that something was erased. This can’t be undone.' : 'Erase it now?'}</p>
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
