/**
 * Shared pieces for My Goals and Exercises (Checkpoint 2b).
 */
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import type { ItemEvent, PersonalCategory } from '../../../types';
import { APP_CATEGORIES, getMilestone } from '../../../domain/milestones';
import { displayTextOf } from '../../../domain/milestoneDisplay';
import { formatLongDate } from '../../../domain/dates';
import { itemHistory, itemNotesAndObservations, itemObservations } from '../../../domain/itemHistory';
import { describeDuration } from '../../../domain/stopwatch';
import { addItemObservation, editItemObservation, eraseItemEntry, removeItemObservation, setItemNote, type PersonalContext } from '../../../data/repositories/personalRepo';
import type { RcrDB } from '../../../data/db';
import { Sheet } from '../../components/Sheet';
import { Icon } from '../../components/Icon';
import { ErrorText } from '../../components/ChildFields';
import { NotesAndObservations } from '../../components/NotesAndObservations';
import { notifyPersonalChanged } from '../../../state/personal';

export const categoryLabel = (c: PersonalCategory) => (c ? APP_CATEGORIES.find((x) => x.id === c)?.label ?? 'Uncategorized' : 'Uncategorized');

export function CategorySelect({ id, value, onChange }: { id: string; value: PersonalCategory; onChange: (c: PersonalCategory) => void }) {
  return (
    <div class="field">
      <label class="label" for={id}>Area</label>
      <select id={id} class="select" value={value ?? ''} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; onChange(v === '' ? null : (v as PersonalCategory)); }}>
        <option value="">Uncategorized</option>
        {APP_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
    </div>
  );
}

/** A collapsed "More details" disclosure for optional fields (progressive disclosure). */
export function MoreDetails({ children, label = 'More details', defaultOpen = false, testId }: { children: ComponentChildren; label?: string; defaultOpen?: boolean; testId?: string }) {
  return (
    <details class="more-details" open={defaultOpen} data-testid={testId}>
      <summary class="small text-link">{label}</summary>
      <div class="stack" style={{ marginTop: 'var(--space-3)' }}>{children}</div>
    </details>
  );
}

export function SavedBanner({ text }: { text: string }) {
  return (
    <p class="banner" role="status" data-testid="saved">
      <Icon name="check" size={18} />
      <span data-testid="saved-text">{text}</span>
    </p>
  );
}

/**
 * Two-step confirmation for permanent deletion (D10): Cancel is the primary button; a second step
 * confirms. Typed confirmation stays reserved for profile deletion and full reset.
 */
export function TwoStepDelete({ title, effects, onConfirm, onClose }: { title: string; effects: string[]; onConfirm: () => Promise<void>; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet title={step === 1 ? title : 'Final confirmation'} onClose={onClose}>
      {step === 1 ? (
        <ul class="plain-list small stack" data-testid="delete-effects">{effects.map((e) => <li key={e}>{e}</li>)}</ul>
      ) : (
        <p class="small">This can’t be undone. Delete it now?</p>
      )}
      {error && <ErrorText id="delete-error">{error}</ErrorText>}
      <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
        <button type="button" class="btn btn-primary btn-block" onClick={onClose}>Cancel — keep it</button>
        {step === 1 ? (
          <button type="button" class="btn btn-quiet btn-block" onClick={() => setStep(2)}>Continue</button>
        ) : (
          <button type="button" class="btn btn-danger btn-block" data-testid="confirm-delete" onClick={async () => { try { await onConfirm(); } catch (e) { setError(e instanceof Error ? e.message : 'That couldn’t be deleted.'); } }}>Yes, delete permanently</button>
        )}
      </div>
    </Sheet>
  );
}

/** Related CDC milestone line (linking never changes the milestone). */
export function RelatedMilestone({ defId, note }: { defId: string; note: string }) {
  const def = getMilestone(defId);
  if (!def) return null;
  return (
    <div class="stack" style={{ gap: '4px' }} data-testid="related-milestone">
      <p class="small">Related milestone: <a class="text-link" href={`#/growth/milestone/${encodeURIComponent(def.id)}`}>{displayTextOf(def)}</a> <span class="xsmall muted">({def.referenceAgeLabel.toLowerCase()})</span></p>
      <p class="xsmall muted">{note}</p>
    </div>
  );
}

/** Notes & Observations for a goal, achievement or exercise, with removal and permanent erase. */
export function ItemNotes({ db, ctx, itemId, events, dob, today, onSaved, onError }: {
  db: RcrDB;
  ctx: PersonalContext;
  itemId: string;
  events: ItemEvent[];
  dob: string;
  today: string;
  onSaved: (text: string) => void;
  onError: (text: string) => void;
}) {
  const [sheet, setSheet] = useState<null | { kind: 'remove'; id: string } | { kind: 'remove-note' }>(null);
  const run = async (fn: () => Promise<void>, message: string) => {
    try {
      await fn();
      notifyPersonalChanged();
      onSaved(message);
      return true;
    } catch (e) {
      onError(e instanceof Error ? e.message : 'That couldn’t be saved.');
      return false;
    }
  };
  return (
    <>
      <NotesAndObservations
        intro="Write down what you notice. Entries are just for you; they don’t change anything else."
        entries={itemNotesAndObservations(events, itemId)}
        dob={dob}
        today={today}
        onAdd={(date, text) => run(() => addItemObservation(db, ctx, itemId, date, text), 'Entry added.')}
        onEdit={(id, date, text) => run(() => editItemObservation(db, ctx, itemId, id, date, text), 'Entry updated.')}
        onEditNote={(text) => run(() => setItemNote(db, ctx, itemId, text), 'Note updated.')}
        onRemove={(id) => setSheet({ kind: 'remove', id })}
        onRemoveNote={() => setSheet({ kind: 'remove-note' })}
      />
      {sheet && (
        <Sheet title={sheet.kind === 'remove' ? 'Remove this entry?' : 'Remove this note?'} onClose={() => setSheet(null)}>
          <p class="small">It will be removed from Notes & Observations. Its text stays in the history on this device, marked as removed. To remove the text completely, use “Erase permanently” in the history.</p>
          <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
            <button type="button" class="btn btn-primary btn-block" onClick={() => setSheet(null)}>Cancel</button>
            <button
              type="button"
              class="btn btn-quiet btn-block"
              onClick={async () => {
                const s = sheet;
                setSheet(null);
                await run(() => (s.kind === 'remove' ? removeItemObservation(db, ctx, itemId, s.id) : setItemNote(db, ctx, itemId, '')), 'Entry removed from view.');
              }}
            >
              Remove
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}

function describeEvent(e: ItemEvent): string {
  switch (e.type) {
    case 'created': return 'Created';
    case 'edited': return e.fromDate !== e.toDate && e.toDate !== undefined ? `Edited · start date ${e.toDate ? formatLongDate(e.toDate) : 'not recorded'}` : 'Edited';
    case 'status': return e.toStatus === 'accomplished' ? 'Marked as accomplished' : 'Reopened (working toward again)';
    case 'date-corrected': return `Date corrected from ${e.fromDate ? formatLongDate(e.fromDate) : '—'} to ${e.toDate ? formatLongDate(e.toDate) : '—'}`;
    case 'archived': return 'Archived';
    case 'restored': return 'Restored from archive';
    case 'schedule-changed': return e.toStatus === 'paused' ? 'Paused' : e.toStatus === 'resumed' ? 'Resumed' : 'Schedule changed';
    case 'session-recorded': return e.text === 'restored' ? 'Session restored' : 'Session recorded';
    case 'session-reversed': return 'Session removed';
    case 'session-deleted': return 'Session deleted';
    case 'session-edited': return e.fromDate && e.toDate ? `Session moved from ${formatLongDate(e.fromDate)} to ${formatLongDate(e.toDate)}` : 'Session corrected';
    case 'observation': return 'Entry added';
    case 'observation-edited': return 'Entry edited';
    case 'observation-removed': return 'Entry removed from view';
    case 'note': return e.text === '' ? 'Note removed from view' : 'Note saved (no observation date)';
    case 'entry-erased': return 'An entry’s text was permanently erased';
    case 'legacy-status': return `Recorded as ${e.toStatus === 'achieved' ? 'Achieved' : e.toStatus === 'emerging' ? 'Emerging' : 'Not yet observed'} (as a personal milestone entry)`;
    case 'legacy-event': return e.legacyType === 'hidden' ? 'Hidden (as a personal milestone entry)' : e.legacyType === 'restored' ? 'Restored (as a personal milestone entry)' : 'Updated (as a personal milestone entry)';
    case 'converted': return 'Moved to My Goals from your personal milestone entries';
  }
}

/**
 * Collapsed item history with permanent erase of text entries (same safeguards as milestones).
 * `sessionIds` (exercises): the sessions that still exist. Entries about deleted sessions, and the
 * deletion itself, aren't shown (R-015: a deleted session leaves no visible placeholder).
 */
export function ItemHistory({ db, ctx, itemId, events, sessionIds, onSaved, onError }: { db: RcrDB; ctx: PersonalContext; itemId: string; events: ItemEvent[]; sessionIds?: ReadonlySet<string>; onSaved: (t: string) => void; onError: (t: string) => void }) {
  const [erase, setErase] = useState<null | { id: string; step: 1 | 2 }>(null);
  const mine = itemHistory(events, itemId).filter((e) => e.type !== 'session-deleted' && !(sessionIds && e.sessionId && !sessionIds.has(e.sessionId)));
  const removedIds = new Set(itemObservations(events, itemId).filter((o) => o.removed).map((o) => o.id));
  return (
    <details class="card stack history-card" data-testid="item-history">
      <summary class="title-3" style={{ cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' }}>History</summary>
      <ol class="history-list">
        {[...mine].reverse().map((e) => {
          const isText = e.type === 'observation' || e.type === 'observation-edited' || e.type === 'note';
          const removed = (e.type === 'observation' && removedIds.has(e.id)) || (e.type === 'observation-edited' && removedIds.has(e.refEventId!));
          return (
            <li key={e.id} data-testid="history-entry" data-type={e.type}>
              <span class="history-date">{e.eventDate && e.type !== 'note' ? `${formatLongDate(e.eventDate)} · ` : ''}recorded {formatLongDate(e.recordedAt.slice(0, 10))}</span>
              <p class="small" style={{ fontWeight: 600 }}>{describeEvent(e)}</p>
              {isText && (e.erasedAt ? <p class="small muted">Text permanently erased.</p> : e.text ? (
                <>
                  <p class={`small${removed ? ' removed-text' : ''}`}>{e.text}</p>
                  {removed && <p class="xsmall muted">Removed from view. This text is still stored in this device’s history.</p>}
                  <button type="button" class="btn btn-quiet btn-sm" style={{ marginTop: '6px' }} onClick={() => setErase({ id: e.id, step: 1 })}>Erase permanently…</button>
                </>
              ) : null)}
            </li>
          );
        })}
      </ol>
      {erase && (
        <Sheet title={erase.step === 1 ? 'Erase this text permanently?' : 'Final confirmation'} onClose={() => setErase(null)}>
          <p class="small">{erase.step === 1 ? 'The text of this entry, including any earlier wording of it, will be permanently deleted from this device. The history will only show that something was erased. This can’t be undone.' : 'Erase it now?'}</p>
          <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
            <button type="button" class="btn btn-primary btn-block" onClick={() => setErase(null)}>Cancel — keep it</button>
            {erase.step === 1 ? (
              <button type="button" class="btn btn-quiet btn-block" onClick={() => setErase({ ...erase, step: 2 })}>Continue</button>
            ) : (
              <button type="button" class="btn btn-danger btn-block" onClick={async () => {
                const id = erase.id;
                setErase(null);
                try { await eraseItemEntry(db, ctx, itemId, id); notifyPersonalChanged(); onSaved('The text was permanently erased.'); } catch (err) { onError(err instanceof Error ? err.message : 'That couldn’t be erased.'); }
              }}>Yes, erase permanently</button>
            )}
          </div>
        </Sheet>
      )}
    </details>
  );
}

export const durationText = (s: number | null) => (s === null ? '' : describeDuration(s));

/**
 * Shared duration entry (R-013, R-014): Hours/Minutes/Seconds (or Minutes/Seconds) in one equal-width
 * grid, labels above each field, same field height, no overflow at 320 px. Used for the stopwatch target,
 * manual entry and session correction so the layout can't drift apart again. Values stay strings; the
 * caller keeps its own validation (parseManualDuration).
 */
export function DurationFields({ idPrefix, legend, hint, hours = true, value, onChange, testId }: {
  idPrefix: string;
  legend: string;
  hint?: string;
  hours?: boolean;
  value: { h?: string; m: string; s: string };
  onChange: (patch: Partial<{ h: string; m: string; s: string }>) => void;
  testId?: string;
}) {
  const fields: Array<['h' | 'm' | 's', string]> = [...(hours ? [['h', 'Hours'] as ['h', string]] : []), ['m', 'Minutes'], ['s', 'Seconds']];
  return (
    <fieldset class="choice-group duration-fields" data-testid={testId} aria-describedby={hint ? `${idPrefix}-hint` : undefined}>
      <legend class="label">{legend}</legend>
      <div class="duration-grid" style={{ gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))` }}>
        {fields.map(([k, label]) => (
          <div key={k} class="duration-field">
            <label class="duration-label" for={`${idPrefix}-${k}`}>{label}</label>
            <input id={`${idPrefix}-${k}`} class="input" inputMode="numeric" autoComplete="off" value={value[k] ?? ''} onInput={(e) => onChange({ [k]: (e.target as HTMLInputElement).value })} />
          </div>
        ))}
      </div>
      {hint && <p id={`${idPrefix}-hint`} class="xsmall muted" style={{ marginTop: 'var(--space-2)' }}>{hint}</p>}
    </fieldset>
  );
}
