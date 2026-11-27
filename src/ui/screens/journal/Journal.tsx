/**
 * Journal (Checkpoint 4): a simple notebook for one child.
 *
 * - One feed, newest entry date first, holding two kinds of entry: Personal Reflections and Care Notes.
 *   Each has its own label, icon and a subtle treatment built from the theme's existing colors.
 * - Search (title and text) and filters (type, unanswered provider questions, dates, tags) only choose
 *   what is shown. They never change a record.
 * - A Care Note can be flagged as a question for the provider and marked answered or unanswered. Marking
 *   it answered changes that one field: the note stays in the feed exactly as written.
 * - All state is per child: the inner screen is keyed by the child's id, so switching profiles closes any
 *   open editor and discards its unsaved input rather than carrying it to another profile. The save path
 *   and the repository both refuse a write for any other child.
 * - Closing an editor with unsaved changes asks first. Nothing is saved automatically.
 * - No photographs, attachments, sharing, export, or links to Growth and the Calendar.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Child, JournalEntry, JournalEntryType } from '../../../types';
import { useApp } from '../../../state/app';
import { useToday } from '../../../state/today';
import { notifyJournalChanged, useChildJournal } from '../../../state/journal';
import { formatLongDate, type LocalDate } from '../../../domain/dates';
import { formatFullDate } from '../../../domain/calendar';
import {
  allTags, EMPTY_FILTER, filterEntries, formatTags, isFiltering, isUnansweredQuestion, JOURNAL_MIN_YEAR, JOURNAL_TITLE_MAX, JOURNAL_TYPES, JournalInputError, moreFilterCount,
  parseTags, sameTag, sortEntries, typeSingular, type JournalFilter, type JournalInput,
} from '../../../domain/journal';
import { createEntry, deleteEntry, setAnswered, updateEntry, type JournalContext } from '../../../data/repositories/journalRepo';
import { newId } from '../../../data/envelope';
import { PageHeader } from '../../components/PageHeader';
import { Sheet } from '../../components/Sheet';
import { Icon, type IconName } from '../../components/Icon';
import { ErrorText } from '../../components/ChildFields';
import { childDisplayName } from '../../components/Avatar';
import { SavedBanner } from '../personal/parts';

/** The one Journal privacy statement (shown once, on the Journal screen). */
export const JOURNAL_PRIVACY = 'Journal entries are kept on this device only. The app doesn’t encrypt or password-protect them, so anyone who can use this unlocked device may be able to read them. This version can’t back up or restore entries.';

const TYPE_ICON: Record<JournalEntryType, IconName> = { reflection: 'heart', care: 'fileText' };
const EXCERPT_CHARS = 320;

function TypeBadge({ type }: { type: JournalEntryType }) {
  return (
    <span class={`badge journal-type journal-type-${type}`} data-testid="entry-type">
      <Icon name={TYPE_ICON[type]} size={14} /> {typeSingular(type)}
    </span>
  );
}

/** What an entry is called in buttons and confirmations: its title, or its date when it has none. */
const entryName = (e: JournalEntry): string => e.title || `${typeSingular(e.type)}, ${formatLongDate(e.date)}`;

function excerpt(body: string): { text: string; cut: boolean } {
  if (body.length <= EXCERPT_CHARS) return { text: body, cut: false };
  const slice = body.slice(0, EXCERPT_CHARS);
  const stop = slice.lastIndexOf(' ');
  return { text: `${(stop > EXCERPT_CHARS * 0.6 ? slice.slice(0, stop) : slice).trimEnd()}…`, cut: true };
}

export function JournalScreen({ openNew = false }: { openNew?: boolean }) {
  const { activeChild } = useApp();
  if (!activeChild) return null;
  return <JournalInner key={activeChild.id} child={activeChild} openNew={openNew} />;
}

type SheetState =
  | null
  | { mode: 'new' }
  | { mode: 'view'; id: string }
  | { mode: 'edit'; id: string }
  | { mode: 'delete'; id: string };

function JournalInner({ child, openNew }: { child: Child; openNew: boolean }) {
  const app = useApp();
  const today = useToday();
  const { entries } = useChildJournal(child);
  const [filter, setFilter] = useState<JournalFilter>(EMPTY_FILTER);
  const [sheet, setSheet] = useState<SheetState>(openNew ? { mode: 'new' } : null);
  const [saved, setSaved] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const newButton = useRef<HTMLButtonElement>(null);
  const focusNew = useRef(false);
  const ctx: JournalContext = { deviceId: app.meta.deviceId, childId: child.id, today };

  // Opened from “Journal entry” on Home (#/journal/new): keep the address as the plain Journal afterwards.
  useEffect(() => {
    if (openNew) window.history.replaceState(null, '', '#/journal');
  }, [openNew]);

  // After a deletion the control that opened the entry is gone: move focus to a stable place.
  useEffect(() => {
    if (!focusNew.current || sheet !== null) return;
    focusNew.current = false;
    newButton.current?.focus();
  });

  const all = useMemo(() => sortEntries(entries ?? []), [entries]);
  const shown = useMemo(() => filterEntries(all, filter), [all, filter]);
  const tags = useMemo(() => allTags(all), [all]);
  const unanswered = all.filter(isUnansweredQuestion).length;
  const filtering = isFiltering(filter);
  const more = moreFilterCount(filter);
  const current = sheet && sheet.mode !== 'new' ? all.find((e) => e.id === sheet.id) : undefined;
  const patch = (p: Partial<JournalFilter>) => setFilter((f) => ({ ...f, ...p }));
  const toggleTag = (tag: string) => patch({ tags: filter.tags.some((t) => sameTag(t, tag)) ? filter.tags.filter((t) => !sameTag(t, tag)) : [...filter.tags, tag] });

  const open = (state: SheetState) => { setSaved(null); setToggleError(null); setSheet(state); };

  const afterSave = (entry: JournalEntry, text: string) => {
    notifyJournalChanged();
    setSheet(null);
    setSaved(filterEntries([entry], filter).length ? text : `${text} It doesn’t match the current search or filters, so it isn’t shown below.`);
  };

  const toggleAnswered = async (entry: JournalEntry) => {
    setSaved(null);
    setToggleError(null);
    if (app.activeChild?.id !== child.id) return;
    try {
      await setAnswered(app.db, ctx, entry.id, !entry.answered);
      notifyJournalChanged();
    } catch (e) {
      setToggleError(e instanceof JournalInputError ? e.message : 'That couldn’t be saved. Nothing was changed. Please try again.');
    }
  };

  return (
    <div data-testid="journal">
      <PageHeader title="Journal" intro={`Memories and care notes for ${childDisplayName(child)}.`} />
      {saved && <SavedBanner text={saved} />}

      <button type="button" ref={newButton} class="btn btn-primary btn-block" style={{ marginTop: 'var(--space-4)' }} data-testid="new-entry" onClick={() => open({ mode: 'new' })}>
        <Icon name="plus" size={18} /> New Journal Entry
      </button>

      {entries === null ? (
        <p class="muted small" style={{ marginTop: 'var(--space-5)' }}>Loading…</p>
      ) : all.length === 0 ? (
        <section class="card journal-empty" data-testid="journal-empty" aria-labelledby="journal-empty-h">
          <Icon name="notebook" size={28} />
          <h2 id="journal-empty-h" class="title-3">No journal entries yet</h2>
          <p class="small muted">Write down a memory, an everyday moment, or a note for your child’s next appointment.</p>
        </section>
      ) : (
        <>
          <section class="section journal-filters" aria-label="Search and filters" data-testid="journal-filters">
            <div class="search-field">
              <Icon name="search" size={20} />
              <input class="input" type="search" aria-label="Search journal" placeholder="Search titles and text" value={filter.text} data-testid="journal-search" onInput={(e) => patch({ text: (e.target as HTMLInputElement).value })} />
            </div>
            <div class="chips" role="group" aria-label="Show" style={{ marginTop: 'var(--space-3)' }}>
              <button type="button" class="chip" aria-pressed={filter.type === 'all'} data-testid="filter-type-all" onClick={() => patch({ type: 'all' })}>All</button>
              {JOURNAL_TYPES.map((t) => (
                <button key={t.id} type="button" class="chip" aria-pressed={filter.type === t.id} data-testid={`filter-type-${t.id}`} onClick={() => patch({ type: t.id })}>
                  <Icon name={TYPE_ICON[t.id]} size={16} /> {t.label}
                </button>
              ))}
              <button type="button" class="chip" aria-pressed={filter.unansweredOnly} data-testid="filter-unanswered" onClick={() => patch({ unansweredOnly: !filter.unansweredOnly })}>
                Unanswered questions ({unanswered})
              </button>
            </div>
            <details class="more-details" data-testid="more-filters">
              <summary class="small text-link">Dates and tags{more > 0 ? ` (${more} in use)` : ''}</summary>
              <div class="input-row" style={{ marginTop: 'var(--space-2)' }}>
                <div class="field">
                  <label class="label" for="journal-from">From</label>
                  <input id="journal-from" class="input" type="date" max={filter.to || today} value={filter.from} onInput={(e) => patch({ from: (e.target as HTMLInputElement).value })} />
                </div>
                <div class="field">
                  <label class="label" for="journal-to">To</label>
                  <input id="journal-to" class="input" type="date" min={filter.from || undefined} max={today} value={filter.to} onInput={(e) => patch({ to: (e.target as HTMLInputElement).value })} />
                </div>
              </div>
              <p class="label" id="journal-tags-l" style={{ marginTop: 'var(--space-4)' }}>Tags</p>
              {tags.length === 0 ? (
                <p class="small muted" data-testid="no-tags">No tags yet. Add tags when you write an entry.</p>
              ) : (
                <div class="chips" role="group" aria-labelledby="journal-tags-l" data-testid="filter-tags">
                  {tags.map((t) => (
                    <button key={t} type="button" class="chip" aria-pressed={filter.tags.some((x) => sameTag(x, t))} data-testid="filter-tag" onClick={() => toggleTag(t)}>
                      <Icon name="tag" size={14} /> {t}
                    </button>
                  ))}
                </div>
              )}
            </details>
            {filtering && (
              <div class="journal-count">
                <p class="small muted" role="status" data-testid="journal-count">Showing {shown.length} of {all.length} {all.length === 1 ? 'entry' : 'entries'}</p>
                <button type="button" class="btn btn-quiet btn-sm" data-testid="clear-filters" onClick={() => setFilter(EMPTY_FILTER)}>Clear search and filters</button>
              </div>
            )}
          </section>

          {toggleError && sheet === null && <ErrorText id="journal-toggle-error">{toggleError}</ErrorText>}

          {shown.length === 0 ? (
            <section class="card journal-empty" data-testid="journal-no-results" aria-labelledby="journal-none-h">
              <h2 id="journal-none-h" class="title-3">No matching entries</h2>
              <p class="small muted">{filter.unansweredOnly && unanswered === 0 ? 'There are no unanswered questions for the provider.' : 'Nothing matches the current search and filters.'}</p>
            </section>
          ) : (
            <ul class="list journal-feed" data-testid="journal-feed" aria-label="Journal entries">
              {shown.map((e) => {
                const ex = excerpt(e.body);
                return (
                  <li key={e.id}>
                    <article class={`card journal-card journal-card-${e.type}`} data-testid="journal-entry" data-type={e.type} data-id={e.id}>
                      <button type="button" class="journal-open" data-testid="entry-open" onClick={() => open({ mode: 'view', id: e.id })}>
                        <span class="journal-meta">
                          <TypeBadge type={e.type} />
                          <span class="xsmall muted" data-testid="entry-date">{e.date === today ? 'Today' : formatLongDate(e.date)}</span>
                        </span>
                        {e.title && <span class="journal-title" data-testid="entry-title">{e.title}</span>}
                        <span class="journal-excerpt small" data-testid="entry-excerpt">{ex.text}</span>
                        {ex.cut && <span class="xsmall text-link">Read the whole entry</span>}
                      </button>
                      {e.tags.length > 0 && (
                        <ul class="journal-tags" aria-label="Tags" data-testid="entry-tags">
                          {e.tags.map((t) => <li key={t} class="tag-mini">{t}</li>)}
                        </ul>
                      )}
                      {e.type === 'care' && e.isProviderQuestion && (
                        <div class="journal-question" data-testid="entry-question">
                          <span class="small" data-testid="question-status"><strong>Question for the provider</strong> · {e.answered ? 'Answered' : 'Unanswered'}</span>
                          <button type="button" class="btn btn-quiet btn-sm" data-testid="toggle-answered" onClick={() => void toggleAnswered(e)}>
                            {e.answered ? 'Mark unanswered' : 'Mark answered'}<span class="visually-hidden"> for {entryName(e)}</span>
                          </button>
                        </div>
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <section class="section" aria-label="Journal privacy">
        <p class="info-note" data-testid="journal-privacy"><Icon name="shield" size={18} /><span>{JOURNAL_PRIVACY}</span></p>
      </section>

      {sheet?.mode === 'new' && <EntryEditor ctx={ctx} today={today} knownTags={tags} onClose={() => setSheet(null)} onSaved={(e) => afterSave(e, 'Entry saved.')} />}
      {sheet?.mode === 'view' && current && (
        <EntryView
          entry={current}
          error={toggleError}
          onClose={() => setSheet(null)}
          onEdit={() => open({ mode: 'edit', id: current.id })}
          onDelete={() => open({ mode: 'delete', id: current.id })}
          onToggle={() => void toggleAnswered(current)}
        />
      )}
      {sheet?.mode === 'edit' && current && <EntryEditor ctx={ctx} today={today} knownTags={tags} existing={current} onClose={() => setSheet(null)} onSaved={(e) => afterSave(e, 'Entry updated.')} />}
      {sheet?.mode === 'delete' && current && (
        <DeleteEntry
          entry={current}
          onClose={() => setSheet({ mode: 'view', id: current.id })}
          onConfirm={async () => {
            await deleteEntry(app.db, ctx, current.id);
            notifyJournalChanged();
            focusNew.current = true;
            setSheet(null);
            setSaved('Entry deleted.');
          }}
        />
      )}
    </div>
  );
}

function EntryView({ entry, error, onClose, onEdit, onDelete, onToggle }: { entry: JournalEntry; error: string | null; onClose: () => void; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  return (
    <Sheet title={entry.title || typeSingular(entry.type)} onClose={onClose}>
      <div class="journal-view" data-testid="entry-view">
        <p class="journal-meta">
          <TypeBadge type={entry.type} />
          <span class="small muted" data-testid="entry-view-date">{formatFullDate(entry.date)}</span>
        </p>
        <p class="entry-text journal-body-text" data-testid="entry-view-body">{entry.body}</p>
        {entry.tags.length > 0 && (
          <ul class="journal-tags" aria-label="Tags" data-testid="entry-view-tags">
            {entry.tags.map((t) => <li key={t} class="tag-mini">{t}</li>)}
          </ul>
        )}
        {entry.type === 'care' && entry.isProviderQuestion && (
          <div class="journal-question" data-testid="entry-view-question">
            <span class="small" data-testid="view-question-status" role="status"><strong>Question for the provider</strong> · {entry.answered ? 'Answered' : 'Unanswered'}</span>
            <button type="button" class="btn btn-quiet btn-sm" data-testid="view-toggle-answered" onClick={onToggle}>{entry.answered ? 'Mark unanswered' : 'Mark answered'}</button>
          </div>
        )}
        {error && <ErrorText id="entry-view-error">{error}</ErrorText>}
        <div class="stack" style={{ marginTop: 'var(--space-2)' }}>
          <button type="button" class="btn btn-primary btn-block" data-testid="entry-edit" onClick={onEdit}><Icon name="pencil" size={18} /> Edit</button>
          <button type="button" class="btn btn-danger btn-block" data-testid="entry-delete" onClick={onDelete}><Icon name="trash" size={18} /> Delete</button>
          <button type="button" class="btn btn-quiet btn-block" data-testid="entry-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </Sheet>
  );
}

function DeleteEntry({ entry, onClose, onConfirm }: { entry: JournalEntry; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title="Delete this entry?" onClose={onClose}>
      <p class="small" data-testid="delete-entry-text">
        {entry.title ? `“${entry.title}”, the ${typeSingular(entry.type)} dated ${formatLongDate(entry.date)},` : `The ${typeSingular(entry.type)} dated ${formatLongDate(entry.date)}`} will be permanently removed from the journal. This can’t be undone.
      </p>
      {error && <ErrorText id="entry-delete-error">{error}</ErrorText>}
      <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
        <button type="button" class="btn btn-primary btn-block" data-testid="delete-entry-cancel" onClick={onClose}>Cancel — keep it</button>
        <button
          type="button"
          class="btn btn-danger btn-block"
          data-testid="delete-entry-confirm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try { await onConfirm(); } catch (e) { setError(e instanceof JournalInputError ? e.message : 'That couldn’t be deleted. Nothing was changed. Please try again.'); setBusy(false); }
          }}
        >Delete entry</button>
      </div>
    </Sheet>
  );
}

function EntryEditor({ ctx, today, knownTags, existing, onClose, onSaved }: { ctx: JournalContext; today: LocalDate; knownTags: string[]; existing?: JournalEntry; onClose: () => void; onSaved: (e: JournalEntry) => void }) {
  const app = useApp();
  const [formId] = useState(() => newId());
  const [initial] = useState<JournalInput>(() => ({
    type: existing?.type ?? 'reflection',
    date: existing?.date ?? today,
    title: existing?.title ?? '',
    body: existing?.body ?? '',
    tags: existing ? formatTags(existing.tags) : '',
    isProviderQuestion: existing?.isProviderQuestion ?? false,
    answered: existing?.answered ?? false,
  }));
  const [v, setV] = useState<JournalInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const set = (p: Partial<JournalInput>) => setV((cur) => ({ ...cur, ...p }));
  const dirty = (Object.keys(initial) as Array<keyof JournalInput>).some((k) => v[k] !== initial[k]);
  /** Cancel, Escape and a tap outside all come here: unsaved writing is never dropped without asking. */
  const requestClose = () => (dirty && !saving ? setConfirming(true) : onClose());
  // The sheet's Escape handler is attached once, when it opens, so it must reach the current state through a ref
  // (otherwise Escape would act on the form as it was when it opened, and close it without asking).
  const closeRef = useRef(requestClose);
  closeRef.current = requestClose;

  const save = async () => {
    if (saving) return;
    // The editor belongs to the child it was opened for. If another child is active now, nothing is written.
    if (app.activeChild?.id !== ctx.childId) return setError('The child profile changed while this was open, so nothing was saved. What you wrote is still here; copy it before closing.');
    setSaving(true);
    setError(null);
    try {
      const entry = existing ? await updateEntry(app.db, ctx, existing.id, v) : await createEntry(app.db, ctx, v, formId);
      onSaved(entry);
    } catch (e) {
      // What was typed stays in the form. Only the app's own plain-language messages are shown.
      setError(e instanceof JournalInputError ? e.message : 'That couldn’t be saved. What you wrote is still here. Please try again.');
      setSaving(false);
    }
  };

  if (confirming) {
    return (
      <Sheet key="discard" title="Discard your changes?" onClose={() => setConfirming(false)}>
        <p class="small" data-testid="discard-text">{existing ? 'The changes you made to this entry haven’t been saved.' : 'This entry hasn’t been saved.'}</p>
        <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
          <button type="button" class="btn btn-primary btn-block" data-testid="discard-keep" onClick={() => setConfirming(false)}>Keep writing</button>
          <button type="button" class="btn btn-danger btn-block" data-testid="discard-confirm" onClick={onClose}>Discard changes</button>
        </div>
      </Sheet>
    );
  }

  const typeRadio = (type: JournalEntryType, hint: string) => (
    <label class="choice" data-testid={`entry-type-${type}`}>
      <input type="radio" name="entry-type" value={type} checked={v.type === type} onChange={() => set({ type })} />
      <Icon name={TYPE_ICON[type]} size={18} />
      <span><span style={{ display: 'block', fontWeight: 600 }}>{typeSingular(type)}</span><span class="xsmall">{hint}</span></span>
    </label>
  );
  const typed = parseTags(v.tags);
  const unused = knownTags.filter((t) => !typed.some((x) => sameTag(x, t)));

  return (
    <Sheet key="editor" title={existing ? 'Edit entry' : 'New journal entry'} onClose={() => closeRef.current()}>
      <form class="stack" onSubmit={(e) => { e.preventDefault(); void save(); }} data-testid="entry-form" noValidate>
        <fieldset class="choice-group">
          <legend class="label">Type</legend>
          {typeRadio('reflection', 'Memories, moments and thoughts')}
          {typeRadio('care', 'Observations and questions for appointments')}
        </fieldset>
        <div class="field">
          <label class="label" for="entry-date">Date</label>
          <input id="entry-date" class="input" type="date" min={`${JOURNAL_MIN_YEAR}-01-01`} max={today} value={v.date} onInput={(e) => set({ date: (e.target as HTMLInputElement).value })} aria-required="true" />
        </div>
        <div class="field">
          <label class="label" for="entry-title">Title (optional)</label>
          <input id="entry-title" class="input" maxLength={JOURNAL_TITLE_MAX} value={v.title} onInput={(e) => set({ title: (e.target as HTMLInputElement).value })} />
        </div>
        <div class="field">
          <label class="label" for="entry-body">Entry</label>
          <textarea id="entry-body" class="textarea journal-body" value={v.body} onInput={(e) => set({ body: (e.target as HTMLTextAreaElement).value })} aria-required="true" aria-describedby={error ? 'entry-error' : undefined} />
        </div>
        <div class="field">
          <label class="label" for="entry-tags">Tags (optional)</label>
          <input id="entry-tags" class="input" value={v.tags} autocapitalize="none" aria-describedby="entry-tags-hint" onInput={(e) => set({ tags: (e.target as HTMLInputElement).value })} />
          <span class="hint" id="entry-tags-hint">Separate tags with commas, like “sleep, first words”.</span>
          {unused.length > 0 && (
            <div class="chips" role="group" aria-label="Add a tag you’ve used before" style={{ marginTop: 'var(--space-2)' }} data-testid="known-tags">
              {unused.map((t) => (
                <button key={t} type="button" class="chip" data-testid="known-tag" onClick={() => set({ tags: formatTags([...typed, t]) })}>
                  <Icon name="plus" size={14} /> {t}
                </button>
              ))}
            </div>
          )}
        </div>
        {v.type === 'care' && (
          <div data-testid="question-controls">
            <label class="choice" data-testid="entry-question-flag">
              <input type="checkbox" checked={v.isProviderQuestion} onChange={(e) => set({ isProviderQuestion: (e.target as HTMLInputElement).checked })} />
              <span>This includes a question for the provider</span>
            </label>
            {v.isProviderQuestion && (
              <label class="choice" data-testid="entry-answered-flag">
                <input type="checkbox" checked={v.answered} onChange={(e) => set({ answered: (e.target as HTMLInputElement).checked })} />
                <span>The question has been answered</span>
              </label>
            )}
          </div>
        )}
        {error && <ErrorText id="entry-error">{error}</ErrorText>}
        <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
          <button type="submit" class="btn btn-primary btn-block" data-testid="save-entry" disabled={saving}>{existing ? 'Save changes' : 'Save entry'}</button>
          <button type="button" class="btn btn-quiet btn-block" data-testid="cancel-entry" onClick={requestClose}>Cancel</button>
        </div>
      </form>
    </Sheet>
  );
}
