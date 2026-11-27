import { useState } from 'preact/hooks';
import { formatLongDate } from '../../domain/dates';
import type { NoteEntry } from '../../domain/milestoneHistory';
import { Icon } from './Icon';

/**
 * Notes & Observations (R-007): the one place to write about a milestone. One text field, an
 * observation date (today by default) and "Add entry". Previous entries are listed below, newest first,
 * and can be edited or removed. A note saved by an earlier version of the app is shown honestly as a
 * note without an observation date. None of this changes the milestone's status.
 */
export function NotesAndObservations({ entries, dob, today, onAdd, onEdit, onEditNote, onRemove, onRemoveNote, intro = 'Write down what you notice. Adding an entry doesn’t change the status.' }: {
  entries: NoteEntry[];
  /** Shared since Checkpoint 2b (milestones, goals, achievements, exercises); the milestone wording is the default. */
  intro?: string;
  dob: string;
  today: string;
  onAdd: (date: string, text: string) => Promise<boolean>;
  onEdit: (id: string, date: string, text: string) => Promise<boolean>;
  onEditNote: (text: string) => Promise<boolean>;
  onRemove: (id: string) => void;
  onRemoveNote: () => void;
}) {
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<null | { id: string | null; date: string; text: string }>(null);
  const add = async () => {
    if (await onAdd(date, text)) {
      setText('');
      setDate(today); // each new entry starts from today again
    }
  };
  return (
    <section class="card stack" aria-labelledby="notes-heading" data-testid="notes-observations">
      <h2 class="title-3" id="notes-heading">Notes & Observations</h2>
      <p class="xsmall muted">{intro}</p>
      <div class="field">
        <label class="label" for="entry-date">Date observed</label>
        <input id="entry-date" class="input" type="date" min={dob} max={today} value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} />
      </div>
      <div class="field">
        <label class="label" for="entry-text">Note or observation</label>
        <textarea id="entry-text" class="textarea" maxLength={1000} value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} />
      </div>
      <button type="button" class="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={!text.trim()} onClick={add} data-testid="add-entry">
        <Icon name="plus" size={16} /> Add entry
      </button>

      {entries.length > 0 && (
        <div class="stack" style={{ marginTop: 'var(--space-2)' }}>
          <h3 class="label" id="entries-heading">Previous entries</h3>
          <ul class="list" aria-labelledby="entries-heading" data-testid="entries">
            {entries.map((en) => {
              const key = en.kind === 'observation' ? en.id : 'undated-note';
              const isEditing = editing && (en.kind === 'observation' ? editing.id === en.id : editing.id === null);
              const dateLabel = en.kind === 'observation' ? (en.date ? formatLongDate(en.date) : 'No observation date') : 'No observation date';
              return (
                <li key={key} class="entry" data-testid="entry" data-kind={en.kind}>
                  {isEditing ? (
                    <div class="stack">
                      {en.kind === 'observation' ? (
                        <div class="field">
                          <label class="label" for={`edit-date-${key}`}>Date observed</label>
                          <input id={`edit-date-${key}`} class="input" type="date" min={dob} max={today} value={editing!.date} onInput={(e) => setEditing({ ...editing!, date: (e.target as HTMLInputElement).value })} />
                        </div>
                      ) : (
                        <p class="xsmall muted">This note was saved without an observation date.</p>
                      )}
                      <div class="field">
                        <label class="label" for={`edit-text-${key}`}>Entry text</label>
                        <textarea id={`edit-text-${key}`} class="textarea" maxLength={1000} value={editing!.text} onInput={(e) => setEditing({ ...editing!, text: (e.target as HTMLTextAreaElement).value })} />
                      </div>
                      <div class="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          class="btn btn-primary btn-sm"
                          disabled={!editing!.text.trim()}
                          onClick={async () => {
                            const e = editing!;
                            const ok = en.kind === 'observation' ? await onEdit(en.id, e.date, e.text) : await onEditNote(e.text);
                            if (ok) setEditing(null);
                          }}
                        >
                          Save changes
                        </button>
                        <button type="button" class="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span class="history-date" data-testid="entry-date">
                        {dateLabel}
                        {en.kind === 'undated-note' && en.savedOn && <> · saved {formatLongDate(en.savedOn)}</>}
                        {en.kind === 'observation' && en.edited && <> · edited</>}
                      </span>
                      <p class="small entry-text" data-testid="entry-text">{en.text}</p>
                      <div class="row" style={{ gap: 'var(--space-2)' }}>
                        <button
                          type="button"
                          class="btn btn-quiet btn-sm"
                          aria-label={`Edit entry: ${dateLabel}`}
                          onClick={() => setEditing({ id: en.kind === 'observation' ? en.id : null, date: en.kind === 'observation' ? en.date ?? today : today, text: en.text ?? '' })}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="btn btn-quiet btn-sm"
                          aria-label={`Remove entry: ${dateLabel}`}
                          onClick={() => (en.kind === 'observation' ? onRemove(en.id) : onRemoveNote())}
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
