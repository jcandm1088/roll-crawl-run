/**
 * Exercises (Checkpoint 2b): Create exercise · Browse Exercises · Today's routine · My exercises,
 * plus the exercise form (create, adopt, edit) and the exercise page.
 *
 * Three origins: CDC activity tips (provenance kept), the parent's own, and a doctor's or specialist's
 * instructions entered by the parent (never reviewed or changed by the app). Three tracking methods.
 * Nothing is recorded without an explicit action; recording never accomplishes a goal.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { notifyPersonalChanged, useChildPersonal } from '../../../state/personal';
import { setFlash, takeFlash } from '../../../state/flash';
import { href, navigate } from '../../../router';
import { compareDates, formatLongDate } from '../../../domain/dates';
import { MAX_SESSIONS_PER_DAY, WEEKDAY_LABELS, WEEKDAY_NAMES, currentOrNextVersion, describeRule, isExtraSlot, openSlotOn, routineFor, slotKeyFor, slotNumber, type RoutineItem } from '../../../domain/schedule';
import { describeDuration, parseManualDuration } from '../../../domain/stopwatch';
import { ACTIVITY_CONTENT_VERSION, getActivity, getActivityRecord, recordsOf } from '../../../domain/activities';
import { activeGoalsOf } from '../../../domain/personalProgress';
import { newId } from '../../../data/envelope';
import type { Exercise, ExerciseOrigin, ExerciseSession, PersonalCategory, ScheduleRule, TrackerState, Tracking, Weekday } from '../../../types';
import {
  createExercise, discardTracker, editSession, listTrackers, moveSession, recordSession, restoreSession, reverseSession, setPaused, updateExercise, MAX_REPS, SlotTakenError,
  type ExerciseInput, type ScheduleInput,
} from '../../../data/repositories/exercisesRepo';
import { deleteItemPermanently, setArchived, type PersonalContext } from '../../../data/repositories/personalRepo';
import type { RcrDB } from '../../../data/db';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { ErrorText } from '../../components/ChildFields';
import { ForChild } from '../growth/parts';
import { CategorySelect, ItemHistory, ItemNotes, MoreDetails, SavedBanner, TwoStepDelete, categoryLabel } from './parts';
import { DailyBar, TrackerSheet, type TrackerTarget } from './Tracker';
import { ActivityBody, ActivityInstructions, ActivitySafety } from './Browse';


export function originLine(e: Exercise): string {
  if (e.origin === 'recommended') return e.source?.instructionsEdited ? 'Adapted by you from a CDC activity' : 'From CDC’s activity tips';
  if (e.origin === 'provider') return e.providerName ? `From your provider: ${e.providerName}` : 'From your doctor or specialist';
  return 'Created by you';
}

function trackingLine(t: Tracking): string {
  if (t.method === 'stopwatch') return t.targetSeconds ? `Stopwatch · target ${describeDuration(t.targetSeconds)}` : 'Stopwatch';
  if (t.method === 'reps') return t.targetReps ? `Repetitions · target ${t.targetReps}` : 'Repetitions';
  return 'Simple';
}

/** Short status of sessions; for many sessions a count instead of a dot per session (D16). */
function SessionDots({ item }: { item: RoutineItem }) {
  if (item.scheduled > 6) return <span class="small muted" data-testid="session-count">{item.doneSlots.length} of {item.scheduled}</span>;
  return (
    <span class="session-dots" aria-label={`${item.doneSlots.length} of ${item.scheduled} sessions done`} data-testid="session-dots">
      {Array.from({ length: item.scheduled }, (_, i) => <span key={i} class={`dot${item.doneSlots.includes(i + 1) ? ' done' : ''}`} aria-hidden="true" />)}
    </span>
  );
}

interface UndoState { text: string; sessionId: string }

/** Today's routine: scheduled sessions for the selected child and local day (same calculation as Home). */
function TodaysRoutine({ db, ctx, exercises, sessions, trackers, onOpenTracker, onUndoable, onError }: {
  db: RcrDB; ctx: PersonalContext; exercises: Exercise[]; sessions: ExerciseSession[]; trackers: TrackerState[];
  onOpenTracker: (t: TrackerTarget) => void; onUndoable: (u: UndoState) => void; onError: (t: string) => void;
}) {
  const routine = routineFor(exercises, sessions, ctx.today);
  const [busy, setBusy] = useState<string | null>(null);
  const recordSimple = async (ex: Exercise, extra: boolean) => {
    if (busy) return;
    setBusy(ex.id);
    try {
      const s = await recordSession(db, ctx, ex.id, { date: ctx.today, slot: extra ? 'extra' : 'auto', sessionId: newId() });
      notifyPersonalChanged();
      onUndoable({ text: extra ? `Additional session recorded for ${ex.title}.` : `${ex.title}: session recorded.`, sessionId: s.id });
    } catch (e) {
      onError(e instanceof SlotTakenError ? 'That session was already recorded.' : e instanceof Error ? e.message : 'That couldn’t be saved.');
    } finally {
      setBusy(null);
    }
  };
  return (
    <section aria-labelledby="today-title" data-testid="todays-routine" id="todays-routine" tabIndex={-1}>
      <h2 class="title-2 section-title" id="today-title">Today’s routine</h2>
      <div class="card stack">
        {routine.scheduledCount === 0 ? (
          <p class="small muted" data-testid="routine-empty">Nothing scheduled for today. You can still record any exercise from My exercises.</p>
        ) : (
          <>
            <DailyBar done={routine.doneCount} scheduled={routine.scheduledCount} />
            <ul class="ms-list" data-testid="routine-items">
              {routine.items.map((it) => {
                const ex = it.exercise;
                const allDone = it.nextSlot === null;
                const inProgress = it.nextSlot !== null ? trackers.find((t) => t.exerciseId === ex.id && t.slotKey === slotKeyFor(ctx.today, it.nextSlot!)) : undefined;
                return (
                  <li key={ex.id} class="routine-item" data-testid="routine-item" data-exercise={ex.title}>
                    <a class="grow routine-link" href={href({ name: 'exerciseItem', id: ex.id })}>
                      <span style={{ fontWeight: 600 }}>{ex.title}</span>
                      <span class="row" style={{ gap: 'var(--space-2)' }}>
                        <SessionDots item={it} />
                        {it.additional > 0 && <span class="xsmall muted">+{it.additional} more</span>}
                      </span>
                    </a>
                    {allDone ? (
                      <span class="row" style={{ gap: '4px' }}>
                        <span class="badge" data-testid="routine-done"><Icon name="check" size={14} /> Done</span>
                        {ex.tracking.method === 'simple' ? (
                          <button type="button" class="btn btn-quiet btn-sm" aria-label={`Record another session of ${ex.title}`} onClick={() => recordSimple(ex, true)} data-testid="routine-another">+</button>
                        ) : (
                          <button type="button" class="btn btn-quiet btn-sm" aria-label={`Record another session of ${ex.title}`} onClick={() => onOpenTracker({ exercise: ex, slotKey: `extra:${newId()}`, date: ctx.today, label: 'Additional session' })} data-testid="routine-another">+</button>
                        )}
                      </span>
                    ) : ex.tracking.method === 'simple' ? (
                      <button type="button" class="btn btn-secondary btn-sm routine-action" disabled={busy === ex.id} onClick={() => recordSimple(ex, false)} data-testid="routine-complete" aria-label={`Mark ${ex.title} done${it.scheduled > 1 ? `, session ${it.nextSlot} of ${it.scheduled}` : ''}`}>
                        <Icon name="check" size={16} /> Done
                      </button>
                    ) : (
                      <button type="button" class="btn btn-secondary btn-sm routine-action" onClick={() => onOpenTracker({ exercise: ex, slotKey: slotKeyFor(ctx.today, it.nextSlot!), date: ctx.today, label: it.scheduled > 1 ? `Session ${it.nextSlot} of ${it.scheduled}` : 'Today’s session' })} data-testid="routine-start">
                        {inProgress ? 'Continue' : ex.tracking.method === 'stopwatch' ? 'Start' : 'Count'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function useTrackers(db: RcrDB, childId: string | null, deps: unknown[]) {
  const [trackers, setTrackers] = useState<TrackerState[]>([]);
  useEffect(() => {
    if (childId) void listTrackers(db, childId).then(setTrackers);
  }, [db, childId, ...deps]);
  return trackers;
}

export function ExercisesScreen({ focus }: { focus?: 'today' }) {
  const app = useApp();
  const child = app.activeChild;
  const p = useChildPersonal(child);
  const [flash] = useState(() => takeFlash());
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [saved, setSaved] = useState<string | null>(flash);
  const [error, setError] = useState<string | null>(null);
  const [tracker, setTracker] = useState<TrackerTarget | null>(null);
  const trackers = useTrackers(app.db, child?.id ?? null, [p.data, tracker]);
  const focused = useRef(false);
  useEffect(() => {
    if (focus === 'today' && p.data && !focused.current) {
      focused.current = true;
      const el = document.getElementById('todays-routine');
      el?.scrollIntoView({ block: 'start' });
      el?.focus({ preventScroll: true });
    }
  }, [focus, p.data]);
  if (!child || !p.ctx) return null;
  if (!p.data) return <p class="muted small">Loading…</p>;
  const ctx = p.ctx;
  const live = p.data.exercises.filter((e) => !e.archivedAt).sort((a, b) => a.title.localeCompare(b.title));
  const archived = p.data.exercises.filter((e) => e.archivedAt);
  return (
    <div class="stack-lg" data-testid="exercises">
      <ForChild child={child} />
      {saved && <SavedBanner text={saved} />}
      {error && <ErrorText id="exercises-error">{error}</ErrorText>}
      {undo && (
        <p class="banner" role="status" data-testid="undo-banner">
          <Icon name="check" size={18} />
          <span class="grow">{undo.text}</span>
          <button type="button" class="btn btn-quiet btn-sm" data-testid="undo" onClick={async () => { const u = undo; setUndo(null); try { await reverseSession(app.db, ctx, u.sessionId); notifyPersonalChanged(); setSaved('Undone. That session was removed.'); } catch (e) { setError(e instanceof Error ? e.message : 'That couldn’t be undone.'); } }}>Undo</button>
        </p>
      )}
      <div class="stack">
        <a class="btn btn-primary btn-block" href={href({ name: 'exerciseNew' })} data-testid="create-exercise"><Icon name="plus" size={18} /> Create exercise</a>
        <a class="btn btn-secondary btn-block" href={href({ name: 'exerciseBrowse', age: null })} data-testid="browse-exercises"><Icon name="search" size={18} /> Browse Exercises</a>
      </div>
      <TodaysRoutine db={app.db} ctx={ctx} exercises={p.data.exercises} sessions={p.data.sessions} trackers={trackers} onOpenTracker={setTracker} onUndoable={(u) => { setSaved(null); setError(null); setUndo(u); }} onError={(t) => { setSaved(null); setError(t); }} />
      <section aria-labelledby="my-ex-title" data-testid="my-exercises">
        <h2 class="title-2 section-title" id="my-ex-title">My exercises ({live.length})</h2>
        <div class="card">
          {live.length === 0 ? (
            <p class="small muted" data-testid="exercises-empty">No exercises yet. Create your own, add one from Browse Exercises, or enter one a doctor or specialist gave you.</p>
          ) : (
            <ul class="ms-list">{live.map((e) => <ExerciseRow key={e.id} e={e} today={ctx.today} />)}</ul>
          )}
        </div>
      </section>
      {archived.length > 0 && (
        <details class="card" data-testid="archived-exercises">
          <summary class="small text-link" style={{ cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Show archived ({archived.length})</summary>
          <ul class="ms-list">{archived.map((e) => <ExerciseRow key={e.id} e={e} today={ctx.today} />)}</ul>
        </details>
      )}
      {tracker && (
        <TrackerSheet db={app.db} ctx={ctx} target={tracker} onClose={() => setTracker(null)} onSaved={(text, sessionId) => { setTracker(null); setSaved(null); setUndo({ text, sessionId }); }} />
      )}
    </div>
  );
}

function ExerciseRow({ e, today }: { e: Exercise; today: string }) {
  const v = currentOrNextVersion(e.schedule, today);
  const startsLater = v && compareDates(v.effectiveFrom, today) > 0;
  return (
    <li>
      <a class="ms-item" style={{ paddingLeft: 0, paddingRight: 0 }} href={href({ name: 'exerciseItem', id: e.id })} data-testid="exercise-row">
        <span class="ms-text">
          {e.title}
          <span class="ms-meta">
            {describeRule(v)}{v?.paused ? ' · Paused' : ''}{startsLater ? ` · starts ${formatLongDate(v!.effectiveFrom)}` : ''}
            {e.origin !== 'parent' && ` · ${originLine(e)}`}
          </span>
        </span>
        <Icon name="chevronRight" size={18} />
      </a>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Form (create, adopt a recommended activity, edit)
// ---------------------------------------------------------------------------

export function ExerciseFormScreen({ id, activity }: { id: string | null; activity?: string }) {
  const app = useApp();
  const p = useChildPersonal(app.activeChild);
  if (!app.activeChild || !p.ctx) return null;
  if (!p.data) return <p class="muted small">Loading…</p>;
  const existing = id ? p.data.exercises.find((e) => e.id === id) : undefined;
  if (id && !existing) return <MissingExercise />;
  const [actId, recId] = (activity ?? '').split('~');
  const act = actId ? getActivity(actId) : undefined;
  if (activity && !act) return <MissingExercise />;
  const rec = act ? (recId ? getActivityRecord(recId) : undefined) ?? recordsOf(act)[0]! : undefined;
  return <ExerciseForm key={id ?? activity ?? 'new'} existing={existing} adopt={act && rec ? { activityId: act.id, recordId: rec.id, title: act.title, area: act.appCategory, instructions: rec.display } : undefined} goals={activeGoalsOf(p.data.goals)} />;
}

function ExerciseForm({ existing, adopt, goals }: { existing?: Exercise; adopt?: { activityId: string; recordId: string; title: string; area: PersonalCategory; instructions: string }; goals: Array<{ id: string; title: string }> }) {
  const app = useApp();
  const child = app.activeChild!;
  const p = useChildPersonal(child);
  const today = p.today;
  const current = existing ? currentOrNextVersion(existing.schedule, today) : null;
  const [formId] = useState(() => newId());
  const [title, setTitle] = useState(existing?.title ?? adopt?.title ?? '');
  const [area, setArea] = useState<PersonalCategory>(existing?.appCategory ?? adopt?.area ?? null);
  const [origin, setOrigin] = useState<ExerciseOrigin>(existing?.origin ?? (adopt ? 'recommended' : 'parent'));
  const [provider, setProvider] = useState(existing?.providerName ?? '');
  const [instructions, setInstructions] = useState(existing?.instructions ?? adopt?.instructions ?? '');
  const [method, setMethod] = useState<Tracking['method']>(existing?.tracking.method ?? 'simple');
  const ts = existing?.tracking.method === 'stopwatch' ? existing.tracking.targetSeconds : null;
  const [tMin, setTMin] = useState(ts ? String(Math.floor(ts / 60)) : '');
  const [tSec, setTSec] = useState(ts ? String(ts % 60) : '');
  const [tReps, setTReps] = useState(existing?.tracking.method === 'reps' && existing.tracking.targetReps ? String(existing.tracking.targetReps) : '');
  const [rule, setRule] = useState<ScheduleRule['kind']>(current && !current.paused ? current.rule.kind : current?.rule.kind ?? 'asNeeded');
  const [days, setDays] = useState<Weekday[]>(current?.rule.kind === 'weekdays' ? current.rule.days : []);
  const [perDay, setPerDay] = useState(current && current.rule.kind !== 'asNeeded' ? current.sessionsPerDay : 1);
  const [start, setStart] = useState(current && compareDates(current.effectiveFrom, today) > 0 ? current.effectiveFrom : today);
  const [goalIds, setGoalIds] = useState<string[]>(existing?.goalIds ?? []);
  const [noteDate, setNoteDate] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fromCdc = origin === 'recommended';

  const tracking = (): Tracking | string => {
    if (method === 'stopwatch') {
      if (!tMin.trim() && !tSec.trim()) return { method: 'stopwatch', targetSeconds: null };
      const s = parseManualDuration('', tMin, tSec);
      return s === null ? 'Please enter a target time (minutes and seconds), or leave it empty.' : { method: 'stopwatch', targetSeconds: s };
    }
    if (method === 'reps') {
      if (!tReps.trim()) return { method: 'reps', targetReps: null };
      const n = Number(tReps);
      return Number.isInteger(n) && n > 0 && n <= MAX_REPS ? { method: 'reps', targetReps: n } : `Please enter a target between 1 and ${MAX_REPS}, or leave it empty.`;
    }
    return { method: 'simple' };
  };
  const save = async () => {
    if (!p.ctx || saving) return;
    const t = tracking();
    if (typeof t === 'string') return setError(t);
    const schedule: ScheduleInput = { rule: rule === 'daily' ? { kind: 'daily' } : rule === 'weekdays' ? { kind: 'weekdays', days } : { kind: 'asNeeded' }, sessionsPerDay: perDay, startDate: start };
    const input: ExerciseInput = {
      title, appCategory: area, instructions, origin, providerName: provider,
      source: adopt ? { activityId: adopt.activityId, sourceRecordId: adopt.recordId, contentVersion: ACTIVITY_CONTENT_VERSION, instructionsEdited: instructions.trim() !== adopt.instructions } : existing?.source ?? null,
      goalIds, tracking: t,
    };
    setSaving(true);
    setError(null);
    try {
      if (existing) {
        await updateExercise(app.db, p.ctx, existing.id, input, schedule);
        notifyPersonalChanged();
        setFlash('Exercise updated.');
        navigate({ name: 'exerciseItem', id: existing.id });
      } else {
        const ex = await createExercise(app.db, p.ctx, input, schedule, formId, note.trim() ? { date: noteDate, text: note } : null);
        notifyPersonalChanged();
        setFlash(schedule.rule.kind === 'asNeeded' ? 'Exercise saved under My exercises.' : 'Exercise saved. Its sessions will appear in Today’s routine on scheduled days.');
        navigate({ name: 'exerciseItem', id: ex.id });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That couldn’t be saved.');
    } finally {
      setSaving(false);
    }
  };
  const radio = (name: string, value: string, label: string, checked: boolean, onChange: () => void, testId?: string) => (
    <label class={`choice${checked ? ' is-checked' : ''}`} data-testid={testId}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
  return (
    <form class="stack-lg" onSubmit={(e) => { e.preventDefault(); void save(); }} data-testid="exercise-form">
      {adopt && <ActivitySafety activityId={adopt.activityId} recordId={adopt.recordId} />}
      <div class="card stack">
        <div class="field">
          <label class="label" for="ex-title">Exercise name</label>
          <input id="ex-title" class="input" maxLength={120} value={title} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} required aria-required="true" />
        </div>
        <CategorySelect id="ex-area" value={area} onChange={setArea} />
        {!fromCdc && !existing && (
          <fieldset class="stack" style={{ border: 0, padding: 0, margin: 0 }} data-testid="ex-origin">
            <legend class="label">Where is it from?</legend>
            {radio('origin', 'parent', 'My own activity', origin === 'parent', () => setOrigin('parent'))}
            {radio('origin', 'provider', 'From a doctor or specialist', origin === 'provider', () => setOrigin('provider'), 'origin-provider')}
          </fieldset>
        )}
        {origin === 'provider' && (
          <div class="field">
            <label class="label" for="ex-provider">Provider name or specialty (optional)</label>
            <input id="ex-provider" class="input" maxLength={120} value={provider} onInput={(e) => setProvider((e.target as HTMLInputElement).value)} />
            <p class="xsmall muted">Enter the instructions you were given. This app doesn’t review or change them.</p>
          </div>
        )}
        <div class="field">
          <label class="label" for="ex-instr">Instructions (optional)</label>
          <textarea id="ex-instr" class="textarea" maxLength={2000} value={instructions} onInput={(e) => setInstructions((e.target as HTMLTextAreaElement).value)} />
          {fromCdc && <p class="xsmall muted">These are CDC’s words. If you change them, they become your own instructions; CDC’s original stays available on the exercise’s page.</p>}
        </div>
      </div>

      <fieldset class="card stack" style={{ margin: 0 }} data-testid="ex-tracking">
        <legend class="title-3" style={{ padding: 0 }}>How do you want to track it?</legend>
        {radio('method', 'simple', 'Simple — one tap when done', method === 'simple', () => setMethod('simple'), 'method-simple')}
        {radio('method', 'stopwatch', 'Stopwatch — time each session', method === 'stopwatch', () => setMethod('stopwatch'), 'method-stopwatch')}
        {radio('method', 'reps', 'Repetitions — count each session', method === 'reps', () => setMethod('reps'), 'method-reps')}
        {method === 'stopwatch' && (
          <div class="stack" data-testid="target-time">
            <span class="label">Target time (optional)</span>
            <div class="input-row">
              <div class="field"><label class="label" for="t-min">Minutes</label><input id="t-min" class="input" inputMode="numeric" value={tMin} onInput={(e) => setTMin((e.target as HTMLInputElement).value)} /></div>
              <div class="field"><label class="label" for="t-sec">Seconds</label><input id="t-sec" class="input" inputMode="numeric" value={tSec} onInput={(e) => setTSec((e.target as HTMLInputElement).value)} /></div>
            </div>
            <p class="xsmall muted">The stopwatch always counts up. A target only shows a gentle reminder; it never stops or saves a session.</p>
          </div>
        )}
        {method === 'reps' && (
          <div class="field" data-testid="target-reps">
            <label class="label" for="t-reps">Target repetitions (optional)</label>
            <input id="t-reps" class="input" inputMode="numeric" value={tReps} onInput={(e) => setTReps((e.target as HTMLInputElement).value)} />
          </div>
        )}
        {existing && existing.tracking.method !== method && <p class="xsmall muted">Sessions already recorded keep how they were tracked.</p>}
      </fieldset>

      <fieldset class="card stack" style={{ margin: 0 }} data-testid="ex-schedule">
        <legend class="title-3" style={{ padding: 0 }}>How often?</legend>
        {radio('rule', 'asNeeded', 'As needed — no schedule', rule === 'asNeeded', () => setRule('asNeeded'), 'rule-asNeeded')}
        {radio('rule', 'daily', 'Every day', rule === 'daily', () => setRule('daily'), 'rule-daily')}
        {radio('rule', 'weekdays', 'Selected days', rule === 'weekdays', () => setRule('weekdays'), 'rule-weekdays')}
        {rule === 'weekdays' && (
          <div class="chips" role="group" aria-label="Days" data-testid="weekdays">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button key={d} type="button" class="chip" aria-pressed={days.includes(d as Weekday)} aria-label={WEEKDAY_NAMES[d]} onClick={() => setDays(days.includes(d as Weekday) ? days.filter((x) => x !== d) : [...days, d as Weekday])}>{WEEKDAY_LABELS[d]}</button>
            ))}
          </div>
        )}
        {rule !== 'asNeeded' && (
          <>
            <div class="field">
              <label class="label" for="per-day">Sessions on each scheduled day</label>
              <div class="stepper">
                <button type="button" class="btn btn-outline btn-sm" aria-label="Fewer sessions" disabled={perDay <= 1} onClick={() => setPerDay(Math.max(1, perDay - 1))}>−</button>
                <input id="per-day" class="input" inputMode="numeric" value={String(perDay)} onInput={(e) => { const n = Number((e.target as HTMLInputElement).value); if (Number.isInteger(n)) setPerDay(Math.max(1, Math.min(MAX_SESSIONS_PER_DAY, n))); }} data-testid="per-day" />
                <button type="button" class="btn btn-outline btn-sm" aria-label="More sessions" disabled={perDay >= MAX_SESSIONS_PER_DAY} onClick={() => setPerDay(Math.min(MAX_SESSIONS_PER_DAY, perDay + 1))}>+</button>
              </div>
              <p class="xsmall muted">Up to {MAX_SESSIONS_PER_DAY}. This is just a limit of the app, not a recommendation.</p>
            </div>
            <div class="field">
              <label class="label" for="ex-start">Starts</label>
              <input id="ex-start" class="input" type="date" min={today} value={start} onInput={(e) => setStart((e.target as HTMLInputElement).value)} />
              {existing && <p class="xsmall muted">Schedule changes apply from today. Earlier days and sessions you’ve recorded stay as they were.</p>}
            </div>
          </>
        )}
      </fieldset>

      <MoreDetails testId="ex-more" defaultOpen={goalIds.length > 0}>
        {goals.length > 0 && (
          <fieldset class="stack" style={{ border: 0, padding: 0, margin: 0 }} data-testid="ex-goals">
            <legend class="label">Related goals (optional)</legend>
            {goals.map((g) => (
              <label key={g.id} class="row small" style={{ gap: 'var(--space-2)', minHeight: '44px' }}>
                <input type="checkbox" checked={goalIds.includes(g.id)} onChange={(ev) => setGoalIds((ev.target as HTMLInputElement).checked ? [...goalIds, g.id] : goalIds.filter((x) => x !== g.id))} />
                {g.title}
              </label>
            ))}
            <p class="xsmall muted">Recording this exercise never marks a goal accomplished.</p>
          </fieldset>
        )}
        {!existing && (
          <fieldset class="stack" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend class="label">Notes & Observations (optional)</legend>
            <input aria-label="Date observed" class="input" type="date" min={child.dob} max={today} value={noteDate} onInput={(e) => setNoteDate((e.target as HTMLInputElement).value)} />
            <textarea aria-label="Note or observation" class="textarea" maxLength={2000} value={note} onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} />
          </fieldset>
        )}
      </MoreDetails>

      {error && <ErrorText id="ex-error">{error}</ErrorText>}
      <button type="submit" class="btn btn-primary btn-block" disabled={saving} data-testid="save-exercise">{existing ? 'Save changes' : 'Save exercise'}</button>
      <a class="btn btn-ghost btn-block" href={existing ? href({ name: 'exerciseItem', id: existing.id }) : href({ name: 'exercises' })}>Cancel</a>
    </form>
  );
}

function MissingExercise() {
  return (
    <div class="card stack" data-testid="item-missing">
      <p>This exercise is no longer here.</p>
      <a class="btn btn-secondary" href={href({ name: 'exercises' })}>Open Exercises</a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exercise page
// ---------------------------------------------------------------------------

function sessionValue(s: ExerciseSession): string {
  if (s.method === 'stopwatch' && s.durationSeconds !== null) return describeDuration(s.durationSeconds);
  if (s.method === 'reps' && s.reps !== null) return `${s.reps} repetition${s.reps === 1 ? '' : 's'}`;
  return 'Done';
}

export function ExerciseDetailScreen({ id }: { id: string }) {
  const app = useApp();
  const child = app.activeChild;
  const p = useChildPersonal(child);
  const [flash] = useState(() => takeFlash());
  const [saved, setSaved] = useState<string | null>(flash);
  const [error, setError] = useState<string | null>(null);
  const [tracker, setTracker] = useState<TrackerTarget | null>(null);
  const [sheet, setSheet] = useState<null | 'record' | 'delete' | { edit: ExerciseSession }>(null);
  const trackers = useTrackers(app.db, child?.id ?? null, [p.data, tracker]);
  if (!child || !p.ctx) return null;
  if (!p.data) return <p class="muted small">Loading…</p>;
  const ex = p.data.exercises.find((e) => e.id === id);
  if (!ex) return <MissingExercise />;
  const ctx = p.ctx;
  const run = async (fn: () => Promise<unknown>, message: string) => {
    setError(null);
    setSaved(null);
    try {
      await fn();
      notifyPersonalChanged();
      setSaved(message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That couldn’t be saved.');
      return false;
    }
  };
  const v = currentOrNextVersion(ex.schedule, p.today);
  const sessions = p.data.sessions.filter((s) => s.customItemId === ex.id).sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate) || b.createdAt.localeCompare(a.createdAt));
  const counting = sessions.filter((s) => !s.reversedAt);
  const goals = p.data.goals.filter((g) => ex.goalIds.includes(g.id));
  const act = ex.source ? getActivity(ex.source.activityId) : undefined;
  const rec = ex.source ? getActivityRecord(ex.source.sourceRecordId) : undefined;
  const openSlot = openSlotOn(ex, p.data.sessions, p.today);
  const pending = trackers.filter((t) => t.exerciseId === ex.id);
  const startTracked = () => {
    const resume = pending[0];
    if (resume) return setTracker({ exercise: ex, slotKey: resume.slotKey, date: resume.occurrenceDate, label: isExtraSlot(resume.slotKey) ? 'Additional session' : `Session ${slotNumber(resume.slotKey, resume.occurrenceDate)}` });
    if (openSlot !== null) return setTracker({ exercise: ex, slotKey: slotKeyFor(p.today, openSlot), date: p.today, label: 'Today’s session' });
    return setTracker({ exercise: ex, slotKey: `extra:${newId()}`, date: p.today, label: v && v.rule.kind !== 'asNeeded' ? 'Additional session' : 'Session' });
  };
  return (
    <div class="stack-lg" data-testid="exercise-detail">
      <section class="card stack">
        <div class="row-between" style={{ alignItems: 'flex-start' }}>
          <span class="badge" data-testid="exercise-origin">{originLine(ex)}</span>
          <a class="btn btn-quiet btn-sm" href={href({ name: 'exerciseEdit', id: ex.id })} data-testid="edit-exercise"><Icon name="pencil" size={16} /> Edit</a>
        </div>
        <h2 class="title-2" data-testid="exercise-title">{ex.title}</h2>
        <p class="small muted">{categoryLabel(ex.appCategory)} · {trackingLine(ex.tracking)}{ex.archivedAt ? ' · Archived' : ''}</p>
        <p class="small" data-testid="exercise-schedule">{describeRule(v)}{v?.paused ? ' · Paused' : ''}{v && compareDates(v.effectiveFrom, p.today) > 0 ? ` · starts ${formatLongDate(v.effectiveFrom)}` : ''}</p>
        {ex.origin === 'provider' && <p class="xsmall muted" data-testid="provider-note">Follow the instructions you were given. This app doesn’t check or change them.</p>}
        {ex.instructions && (ex.origin === 'recommended' && !ex.source?.instructionsEdited && rec ? (
          <div class="stack" style={{ gap: '4px' }}><span class="label">How to do it (CDC)</span><ActivityInstructions record={rec} /></div>
        ) : (
          <div class="stack" style={{ gap: '4px' }}>
            <span class="label">{ex.origin === 'recommended' ? 'Your instructions (adapted from a CDC activity)' : 'Instructions'}</span>
            <p class="small activity-text" data-testid="exercise-instructions">{ex.instructions}</p>
          </div>
        ))}
        {goals.length > 0 && (
          <p class="small" data-testid="exercise-goals">Related goals: {goals.map((g, i) => <span key={g.id}>{i > 0 && ', '}<a class="text-link" href={href({ name: 'goalItem', id: g.id })}>{g.title}</a></span>)}</p>
        )}
        {!ex.archivedAt && (
          ex.tracking.method === 'simple' ? (
            <button type="button" class="btn btn-primary btn-block" data-testid="record-now" onClick={() => run(() => recordSession(app.db, ctx, ex.id, { date: p.today, slot: openSlot !== null ? 'auto' : 'extra', sessionId: newId() }), openSlot !== null ? 'Session recorded for today.' : 'Session recorded.')}>
              <Icon name="check" size={18} /> {openSlot !== null ? 'Done for today' : 'Record a session'}
            </button>
          ) : (
            <button type="button" class="btn btn-primary btn-block" data-testid="start-tracker" onClick={startTracked}>
              {pending.length ? 'Continue session' : ex.tracking.method === 'stopwatch' ? 'Start stopwatch' : 'Start counting'}
            </button>
          )
        )}
        <button type="button" class="btn btn-outline btn-block" onClick={() => setSheet('record')} data-testid="record-past">Record a session manually</button>
      </section>

      {ex.origin === 'recommended' && ex.source && (
        <>
          <ActivitySafety activityId={ex.source.activityId} recordId={ex.source.sourceRecordId} />
          {act && rec && (
            <details class="card stack" data-testid="cdc-original">
              <summary class="small text-link" style={{ cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' }}>CDC’s original activity</summary>
              <div class="stack" style={{ marginTop: 'var(--space-3)' }}><ActivityBody activity={act} record={rec} showSafety={false} /></div>
            </details>
          )}
        </>
      )}

      {error && <ErrorText id="exercise-error">{error}</ErrorText>}
      {saved && <SavedBanner text={saved} />}

      <section class="card stack" aria-labelledby="sessions-title" data-testid="sessions">
        <h2 class="title-3" id="sessions-title">Sessions ({counting.length})</h2>
        {sessions.length === 0 ? <p class="small muted">No sessions recorded yet.</p> : (
          <ul class="list">
            {sessions.slice(0, 30).map((s) => (
              <li key={s.id} class="entry" data-testid="session-row" data-reversed={s.reversedAt ? 'true' : 'false'}>
                <span class="history-date">{formatLongDate(s.occurrenceDate)}{isExtraSlot(s.slotKey) ? ' · additional' : ''}{s.entry === 'manual' ? ' · entered manually' : ''}</span>
                <p class={`small${s.reversedAt ? ' removed-text' : ''}`}>{s.reversedAt ? `Removed (${sessionValue(s)})` : sessionValue(s)}{s.note && !s.reversedAt ? ` — ${s.note}` : ''}</p>
                <div class="row" style={{ gap: 'var(--space-2)' }}>
                  {s.reversedAt ? (
                    <button type="button" class="btn btn-quiet btn-sm" onClick={() => run(() => restoreSession(app.db, ctx, s.id), 'Session restored.')}>Restore</button>
                  ) : (
                    <>
                      <button type="button" class="btn btn-quiet btn-sm" aria-label={`Correct session of ${formatLongDate(s.occurrenceDate)}`} onClick={() => setSheet({ edit: s })}>Correct</button>
                      <button type="button" class="btn btn-quiet btn-sm" aria-label={`Remove session of ${formatLongDate(s.occurrenceDate)}`} onClick={() => run(() => reverseSession(app.db, ctx, s.id), 'Session removed. It no longer counts.')} data-testid="remove-session">Remove</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p class="xsmall muted">Sessions show participation you’ve recorded, not ability.</p>
      </section>

      <ItemNotes db={app.db} ctx={ctx} itemId={ex.id} events={p.data.events} dob={child.dob} today={p.today} onSaved={(t) => { setError(null); setSaved(t); }} onError={(t) => { setSaved(null); setError(t); }} />
      <ItemHistory db={app.db} ctx={ctx} itemId={ex.id} events={p.data.events} onSaved={(t) => { setError(null); setSaved(t); }} onError={(t) => { setSaved(null); setError(t); }} />

      <details class="card stack" data-testid="manage-exercise">
        <summary class="small text-link" style={{ cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Manage this exercise</summary>
        <div class="stack" style={{ marginTop: 'var(--space-3)' }}>
          {v && v.rule.kind !== 'asNeeded' && !ex.archivedAt && (
            <button type="button" class="btn btn-outline btn-block" data-testid="pause-exercise" onClick={() => run(() => setPaused(app.db, ctx, ex.id, !v.paused), v.paused ? 'Resumed from today.' : 'Paused from today. Nothing is scheduled until you resume.')}>
              {v.paused ? 'Resume' : 'Pause'}
            </button>
          )}
          <button type="button" class="btn btn-outline btn-block" data-testid="archive-exercise" onClick={() => run(() => setArchived(app.db, ctx, ex.id, 'exercise', !ex.archivedAt), ex.archivedAt ? 'Restored from the archive.' : 'Archived. Its sessions and history are kept.')}>
            {ex.archivedAt ? 'Restore from archive' : 'Archive'}
          </button>
          {pending.length > 0 && <button type="button" class="btn btn-quiet btn-block" onClick={() => run(async () => { for (const t of pending) await discardTracker(app.db, t.id); }, 'Unsaved session discarded.')}>Discard unsaved session</button>}
          <button type="button" class="btn btn-quiet btn-block" data-testid="delete-exercise" onClick={() => setSheet('delete')}><Icon name="trash" size={18} /> Delete permanently…</button>
        </div>
      </details>

      {sheet === 'record' && <ManualSessionSheet db={app.db} ctx={ctx} ex={ex} sessions={p.data.sessions} dob={child.dob} onClose={() => setSheet(null)} onSaved={(t) => { setSheet(null); setError(null); setSaved(t); }} />}
      {sheet && typeof sheet === 'object' && <EditSessionSheet db={app.db} ctx={ctx} session={sheet.edit} dob={child.dob} onClose={() => setSheet(null)} onSaved={(t) => { setSheet(null); setError(null); setSaved(t); }} />}
      {sheet === 'delete' && (
        <TwoStepDelete
          title="Delete this exercise permanently?"
          effects={[
            `“${ex.title}”, its ${counting.length} recorded session${counting.length === 1 ? '' : 's'}, its Notes & Observations and its history will be permanently deleted from this device.`,
            'Its sessions will no longer be counted in Personal Progress or shown in the charts.',
            ...(goals.length ? ['Related goals are kept; only their link to this exercise is removed.'] : []),
            'To keep its history instead, use Archive.',
          ]}
          onClose={() => setSheet(null)}
          onConfirm={async () => {
            await deleteItemPermanently(app.db, ctx, ex.id, 'exercise');
            notifyPersonalChanged();
            setFlash('The exercise was permanently deleted.');
            navigate({ name: 'exercises' });
          }}
        />
      )}
      {tracker && <TrackerSheet db={app.db} ctx={ctx} target={tracker} onClose={() => setTracker(null)} onSaved={(text) => { setTracker(null); setError(null); setSaved(text); }} />}
    </div>
  );
}

function ValueFields({ method, h, m, s, reps, set }: { method: Tracking['method']; h: string; m: string; s: string; reps: string; set: (patch: Partial<{ h: string; m: string; s: string; reps: string }>) => void }) {
  if (method === 'stopwatch') {
    return (
      <div class="input-row">
        <div class="field"><label class="label" for="v-h">Hours</label><input id="v-h" class="input" inputMode="numeric" value={h} onInput={(e) => set({ h: (e.target as HTMLInputElement).value })} /></div>
        <div class="field"><label class="label" for="v-m">Minutes</label><input id="v-m" class="input" inputMode="numeric" value={m} onInput={(e) => set({ m: (e.target as HTMLInputElement).value })} /></div>
        <div class="field"><label class="label" for="v-s">Seconds</label><input id="v-s" class="input" inputMode="numeric" value={s} onInput={(e) => set({ s: (e.target as HTMLInputElement).value })} /></div>
      </div>
    );
  }
  if (method === 'reps') return <div class="field"><label class="label" for="v-reps">Repetitions</label><input id="v-reps" class="input" inputMode="numeric" value={reps} onInput={(e) => set({ reps: (e.target as HTMLInputElement).value })} /></div>;
  return null;
}

function parseValues(method: Tracking['method'], v: { h: string; m: string; s: string; reps: string }): { durationSeconds?: number; reps?: number } | string {
  if (method === 'stopwatch') {
    const sec = parseManualDuration(v.h, v.m, v.s);
    return sec === null ? 'Please enter a duration (minutes 0–59, seconds 0–59, up to 24 hours).' : { durationSeconds: sec };
  }
  if (method === 'reps') {
    const n = Number(v.reps);
    return v.reps.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= MAX_REPS ? { reps: n } : `Please enter a whole number from 0 to ${MAX_REPS}.`;
  }
  return {};
}

/** Manual (including backdated) recording: fills an open scheduled slot of that day, otherwise an additional session. */
function ManualSessionSheet({ db, ctx, ex, sessions, dob, onClose, onSaved }: { db: RcrDB; ctx: PersonalContext; ex: Exercise; sessions: ExerciseSession[]; dob: string; onClose: () => void; onSaved: (t: string) => void }) {
  const [date, setDate] = useState(ctx.today);
  const [v, setV] = useState({ h: '', m: '', s: '', reps: '' });
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => newId());
  const open = openSlotOn(ex, sessions, date);
  return (
    <Sheet title="Record a session" onClose={onClose}>
      <div class="stack" data-testid="manual-session">
        <div class="field">
          <label class="label" for="ms-date">Date</label>
          <input id="ms-date" class="input" type="date" min={dob} max={ctx.today} value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} />
          <p class="xsmall muted">{open !== null ? 'This fills a scheduled session for that day.' : 'This is recorded as an additional session.'}</p>
        </div>
        <ValueFields method={ex.tracking.method} {...v} set={(patch) => setV({ ...v, ...patch })} />
        <div class="field"><label class="label" for="ms-note">Note (optional)</label><textarea id="ms-note" class="textarea" maxLength={2000} value={note} onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} /></div>
        {error && <ErrorText id="ms-error">{error}</ErrorText>}
        <button type="button" class="btn btn-primary btn-block" data-testid="save-manual-session" onClick={async () => {
          const values = parseValues(ex.tracking.method, v);
          if (typeof values === 'string') return setError(values);
          try {
            await recordSession(db, ctx, ex.id, { date, slot: open !== null ? 'auto' : 'extra', ...values, note, entry: 'manual', sessionId });
            notifyPersonalChanged();
            onSaved(`Session recorded for ${formatLongDate(date)}.`);
          } catch (e) { setError(e instanceof Error ? e.message : 'That couldn’t be saved.'); }
        }}>Save session</button>
        <button type="button" class="btn btn-ghost btn-block" onClick={onClose}>Cancel</button>
      </div>
    </Sheet>
  );
}

function EditSessionSheet({ db, ctx, session, dob, onClose, onSaved }: { db: RcrDB; ctx: PersonalContext; session: ExerciseSession; dob: string; onClose: () => void; onSaved: (t: string) => void }) {
  const d = session.durationSeconds ?? 0;
  const [v, setV] = useState({ h: d >= 3600 ? String(Math.floor(d / 3600)) : '', m: String(Math.floor((d % 3600) / 60)), s: String(d % 60), reps: String(session.reps ?? '') });
  const [date, setDate] = useState(session.occurrenceDate);
  const [note, setNote] = useState(session.note);
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet title="Correct this session" onClose={onClose}>
      <div class="stack" data-testid="edit-session">
        <div class="field">
          <label class="label" for="es-date">Date</label>
          <input id="es-date" class="input" type="date" min={dob} max={ctx.today} value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} />
        </div>
        <ValueFields method={session.method} {...v} set={(patch) => setV({ ...v, ...patch })} />
        <div class="field"><label class="label" for="es-note">Note (optional)</label><textarea id="es-note" class="textarea" maxLength={2000} value={note} onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} /></div>
        {error && <ErrorText id="es-error">{error}</ErrorText>}
        <button type="button" class="btn btn-primary btn-block" data-testid="save-session-correction" onClick={async () => {
          const values = parseValues(session.method, v);
          if (typeof values === 'string') return setError(values);
          try {
            // One atomic change: a move to another day carries the corrected values with it.
            if (date !== session.occurrenceDate) await moveSession(db, ctx, session.id, date, { ...values, note });
            else await editSession(db, ctx, session.id, { ...values, note });
            notifyPersonalChanged();
            onSaved('Session corrected.');
          } catch (e) { setError(e instanceof Error ? e.message : 'That couldn’t be saved.'); }
        }}>Save correction</button>
        <button type="button" class="btn btn-ghost btn-block" onClick={onClose}>Cancel</button>
      </div>
    </Sheet>
  );
}
