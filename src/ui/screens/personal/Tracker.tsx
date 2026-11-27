/**
 * Stopwatch and repetition counter (Checkpoint 2b, owner-approved stopwatch design §4).
 *
 * - The stopwatch counts UP from zero. Start, Pause, Resume, Reset, Save session, Enter duration manually,
 *   optional note. A target (optional) only shows a subtle indication; it never stops or saves anything.
 * - Elapsed time is computed from stored numbers (domain/stopwatch.ts); the interval below only redraws.
 * - In-progress state is saved in `trackerState` on every change (device-local), with revision checks so
 *   a second open copy can't silently overwrite newer state. Saving is atomic and idempotent (pre-generated
 *   session id), and a failed save keeps the measured time and the typed note.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Exercise, TrackerState } from '../../../types';
import type { RcrDB } from '../../../data/db';
import { newId } from '../../../data/envelope';
import { discardTracker, getTracker, recordSession, saveTracker, SlotTakenError, TrackerConflictError, trackerIdFor, MAX_REPS } from '../../../data/repositories/exercisesRepo';
import type { PersonalContext } from '../../../data/repositories/personalRepo';
import { RESET, computeElapsed, describeDuration, formatStopwatch, parseManualDuration, toSeconds, type MonotonicAnchor, type StopwatchAnomaly } from '../../../domain/stopwatch';
import { formatLongDate } from '../../../domain/dates';
import { Sheet } from '../../components/Sheet';
import { Icon } from '../../components/Icon';
import { ErrorText } from '../../components/ChildFields';
import { notifyPersonalChanged } from '../../../state/personal';
import { ActivitySafety } from './Browse';
import { DurationFields } from './parts';

/** Trackers started or resumed in THIS page session (others found running were recovered after a reload). */
const startedHere = new Map<string, MonotonicAnchor>();

export interface TrackerTarget {
  exercise: Exercise;
  /** `${date}#n` for a scheduled session, or `extra:<id>` for an additional session. */
  slotKey: string;
  date: string;
  /** "Session 1 of 2" / "Additional session" */
  label: string;
}

const anomalyText: Record<StopwatchAnomaly, string> = {
  'clock-back': 'The device clock changed while the stopwatch was running, so this time may not be right.',
  'clock-jump': 'Much more time passed than the app could measure (the device clock may have changed, or the app was closed for a long time).',
  'very-long': 'This stopwatch has been running for a very long time.',
};

function emptyTracker(ctx: PersonalContext, t: TrackerTarget, method: 'stopwatch' | 'reps'): Omit<TrackerState, 'rev' | 'updatedAt'> {
  return { id: trackerIdFor(t.exercise.id, t.slotKey), childId: ctx.childId, exerciseId: t.exercise.id, slotKey: t.slotKey, occurrenceDate: t.date, method, ...RESET, count: 0, sessionId: newId() };
}

export function TrackerSheet({ db, ctx, target, onClose, onSaved }: { db: RcrDB; ctx: PersonalContext; target: TrackerTarget; onClose: () => void; onSaved: (text: string, sessionId: string) => void }) {
  const method = target.exercise.tracking.method === 'reps' ? 'reps' : 'stopwatch';
  const id = trackerIdFor(target.exercise.id, target.slotKey);
  const [state, setState] = useState<TrackerState | null>(null); // persisted state (null = nothing saved yet)
  const [draft, setDraft] = useState(() => emptyTracker(ctx, target, method));
  const [loaded, setLoaded] = useState(false);
  const [recoveredNotice, setRecoveredNotice] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [manual, setManual] = useState<{ h: string; m: string; s: string; reps: string } | null>(null);
  const [review, setReview] = useState<{ seconds: number; anomaly: StopwatchAnomaly } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, tick] = useState(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const anchor = useRef<MonotonicAnchor | null>(startedHere.get(id) ?? null);

  const load = async () => {
    const t = await getTracker(db, id);
    stateRef.current = t ?? null;
    setState(t ?? null);
    if (t) setDraft(t);
    return t;
  };

  useEffect(() => {
    void load().then((t) => {
      setLoaded(true);
      if (t?.running && !startedHere.has(id)) {
        // Found running after a reload or reopen: recover from the stored wall-clock start and say so.
        anchor.current = { perfAt: performance.now(), epochAt: Date.now() };
        startedHere.set(id, anchor.current);
        setRecoveredNotice(true);
      }
    });
    const timer = window.setInterval(() => tick((n) => n + 1), 250); // redraw only
    const onVisible = () => { if (document.visibilityState === 'visible') { void load(); tick((n) => n + 1); } };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [id]);

  // Latest persisted revision, for chained writes (state updates are asynchronous).
  const stateRef = useRef<TrackerState | null>(state);
  stateRef.current = stateRef.current && state && stateRef.current.rev > state.rev ? stateRef.current : state;

  /** Persists the next state (sequentially, with a revision check). */
  const persist = (next: Omit<TrackerState, 'rev' | 'updatedAt'>) => {
    setDraft(next);
    const run = queue.current.then(async () => {
      try {
        const saved = await saveTracker(db, next, stateRef.current?.rev ?? 0);
        stateRef.current = saved;
        setState(saved);
        return saved;
      } catch (e) {
        if (e instanceof TrackerConflictError) {
          const latest = await load();
          stateRef.current = latest ?? null;
          setNotice(latest ? 'This was changed in another window. Showing the latest.' : 'This session was saved or discarded in another window.');
          return null;
        }
        setError('This couldn’t be saved on this device. Please try again.');
        return null;
      }
    });
    queue.current = run;
    return run;
  };

  const elapsed = computeElapsed(draft, Date.now(), anchor.current, performance.now());
  const targetSeconds = target.exercise.tracking.method === 'stopwatch' ? target.exercise.tracking.targetSeconds : null;
  const targetReps = target.exercise.tracking.method === 'reps' ? target.exercise.tracking.targetReps : null;
  const reached = method === 'stopwatch' ? targetSeconds !== null && elapsed.ms >= targetSeconds * 1000 : targetReps !== null && draft.count >= targetReps;

  const startOrResume = () => {
    const now = Date.now();
    anchor.current = { perfAt: performance.now(), epochAt: now };
    startedHere.set(id, anchor.current);
    setRecoveredNotice(false);
    void persist({ ...draft, running: true, runningSinceEpochMs: now });
  };
  const pauseNow = () => {
    const e = computeElapsed(draft, Date.now(), anchor.current, performance.now());
    return persist({ ...draft, running: false, accumulatedMs: Math.round(e.ms), runningSinceEpochMs: null });
  };
  const reset = () => {
    setConfirmReset(false);
    anchor.current = null;
    startedHere.delete(id);
    void persist({ ...draft, ...RESET, count: 0 });
  };
  const setCount = (n: number) => void persist({ ...draft, count: Math.max(0, Math.min(MAX_REPS, n)) });

  const doSave = async (values: { durationSeconds?: number; reps?: number }, entry: 'live' | 'manual') => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await queue.current;
      const s = await recordSession(db, ctx, target.exercise.id, {
        date: draft.occurrenceDate,
        slot: { key: target.slotKey },
        ...values,
        note,
        entry,
        sessionId: draft.sessionId,
        trackerId: id,
      });
      startedHere.delete(id);
      notifyPersonalChanged();
      onSaved(method === 'stopwatch' ? `Session saved: ${describeDuration(values.durationSeconds ?? 0)}.` : `Session saved: ${values.reps} repetition${values.reps === 1 ? '' : 's'}.`, s.id);
    } catch (e) {
      // The measured time, count and note stay exactly as they were.
      setError(e instanceof SlotTakenError ? 'This session was already recorded (perhaps in another window). You can save this as an additional session from the exercise’s page.' : e instanceof Error ? e.message : 'That couldn’t be saved. Your time and note are kept.');
    } finally {
      setSaving(false);
    }
  };

  /** Save session: capture and stop the elapsed time at this moment, then save it (or ask for a review). */
  const saveLive = async () => {
    if (method === 'reps') return doSave({ reps: draft.count }, 'live');
    const e = computeElapsed(draft, Date.now(), anchor.current, performance.now());
    if (draft.running) await pauseNow();
    const seconds = toSeconds(e.ms);
    if (seconds <= 0) return setError('Start the stopwatch, or enter the duration manually.');
    if (e.anomaly) return setReview({ seconds, anomaly: e.anomaly });
    return doSave({ durationSeconds: seconds }, 'live');
  };

  const saveManual = () => {
    if (!manual) return;
    if (method === 'reps') {
      const n = Number(manual.reps);
      if (!Number.isInteger(n) || n < 0 || n > MAX_REPS || manual.reps.trim() === '') return setError(`Please enter a whole number from 0 to ${MAX_REPS}.`);
      return doSave({ reps: n }, 'manual');
    }
    const seconds = parseManualDuration(manual.h, manual.m, manual.s);
    if (seconds === null) return setError('Please enter a duration (minutes 0–59, seconds 0–59, up to 24 hours).');
    return doSave({ durationSeconds: seconds }, 'manual');
  };

  const discard = async () => {
    await queue.current;
    await discardTracker(db, id);
    startedHere.delete(id);
    onClose();
  };

  const idle = !draft.running && draft.accumulatedMs === 0;
  const oldDay = draft.occurrenceDate !== ctx.today;
  const recommended = target.exercise.source;
  return (
    <Sheet title={target.exercise.title} onClose={onClose}>
      <div class="stack tracker" data-testid="tracker" data-method={method}>
        <p class="small muted" data-testid="tracker-label">{target.label}{oldDay ? ` · ${formatLongDate(draft.occurrenceDate)}` : ''}</p>
        {oldDay && <p class="banner neutral" data-testid="old-day">Started on {formatLongDate(draft.occurrenceDate)}. Saving records it for that day.</p>}
        {recoveredNotice && (
          <div class="notice-panel" role="status" data-testid="recovery-notice">
            <p>The stopwatch kept running while the app was closed or in the background.</p>
            <div class="notice-actions">
              <button type="button" class="btn btn-primary" onClick={() => setRecoveredNotice(false)} data-testid="recovery-keep">Keep running</button>
              <button type="button" class="btn btn-outline" onClick={() => { setRecoveredNotice(false); void pauseNow(); }} data-testid="recovery-pause">Pause</button>
              <button type="button" class="btn btn-ghost" onClick={() => { setRecoveredNotice(false); void pauseNow(); setManual({ h: '', m: '', s: '', reps: '' }); }} data-testid="recovery-manual">Enter duration manually</button>
            </div>
          </div>
        )}
        {notice && <p class="banner neutral" role="status" data-testid="tracker-notice">{notice}</p>}
        {recommended && target.exercise.source && <ActivitySafety activityId={target.exercise.source.activityId} compact />}

        {method === 'stopwatch' ? (
          <>
            <p class={`stopwatch-display${reached ? ' reached' : ''}`} data-testid="stopwatch" aria-hidden="true">{formatStopwatch(elapsed.ms)}</p>
            <p class="visually-hidden" aria-live="polite">{draft.running ? 'Stopwatch running' : idle ? 'Stopwatch at zero' : `Stopwatch paused at ${describeDuration(toSeconds(elapsed.ms))}`}</p>
            <p class="small muted center" data-testid="stopwatch-sub">
              {targetSeconds !== null ? (reached ? 'Target reached — you can save this session or keep going.' : `Target ${describeDuration(targetSeconds)} (optional)`) : 'Elapsed time'}
            </p>
            {elapsed.anomaly && <p class="notice-panel small" data-testid="anomaly">{anomalyText[elapsed.anomaly]} You’ll be asked to check the time before it’s saved.</p>}
            <div class="tracker-controls">
              <button type="button" class="btn btn-outline" onClick={() => (idle ? undefined : elapsed.ms > 5000 ? setConfirmReset(true) : reset())} disabled={idle} data-testid="sw-reset"><Icon name="rotate" size={18} /> Reset</button>
              {draft.running ? (
                <button type="button" class="btn btn-secondary tracker-main" onClick={() => void pauseNow()} data-testid="sw-pause">Pause</button>
              ) : (
                <button type="button" class="btn btn-secondary tracker-main" onClick={startOrResume} data-testid={idle ? 'sw-start' : 'sw-resume'}>{idle ? 'Start' : 'Resume'}</button>
              )}
            </div>
          </>
        ) : (
          <>
            <p class={`counter-display${reached ? ' reached' : ''}`} data-testid="counter" aria-live="polite" aria-atomic="true">
              <span class="visually-hidden">Count: </span>{draft.count}{targetReps !== null && <span class="counter-target"> / {targetReps}</span>}
            </p>
            <p class="small muted center" data-testid="counter-sub">{targetReps !== null ? (reached ? 'Target reached — you can save this session or keep counting.' : 'Target (optional)') : 'Repetitions'}</p>
            <div class="tracker-controls">
              <button type="button" class="btn btn-outline" aria-label="Subtract one repetition" onClick={() => setCount(draft.count - 1)} disabled={draft.count <= 0} data-testid="rep-minus">−1</button>
              <button type="button" class="btn btn-secondary tracker-main" aria-label="Add one repetition" onClick={() => setCount(draft.count + 1)} data-testid="rep-plus">+1</button>
            </div>
            <button type="button" class="btn btn-quiet btn-sm" style={{ alignSelf: 'center' }} disabled={draft.count === 0} onClick={() => setConfirmReset(true)} data-testid="rep-reset"><Icon name="rotate" size={16} /> Reset count</button>
          </>
        )}

        {confirmReset && (
          <div class="notice-panel" data-testid="confirm-reset">
            <p>{method === 'stopwatch' ? 'Reset the stopwatch to zero?' : 'Reset the count to zero?'} Nothing has been saved yet.</p>
            <div class="notice-actions">
              <button type="button" class="btn btn-primary" onClick={() => setConfirmReset(false)}>Keep it</button>
              <button type="button" class="btn btn-outline" onClick={reset} data-testid="confirm-reset-yes">Reset</button>
            </div>
          </div>
        )}

        {review && (
          <div class="notice-panel" data-testid="duration-review">
            <p>{anomalyText[review.anomaly]} Please check the time before saving.</p>
            <p>Measured: <strong>{describeDuration(review.seconds)}</strong></p>
            <div class="notice-actions">
              <button type="button" class="btn btn-primary" onClick={() => { const s = review.seconds; setReview(null); void doSave({ durationSeconds: s }, 'live'); }} data-testid="review-keep">Save this time</button>
              <button type="button" class="btn btn-outline" onClick={() => { setReview(null); setManual({ h: '', m: '', s: '', reps: '' }); }}>Enter the time instead</button>
            </div>
          </div>
        )}

        <details class="more-details" open={!!manual} onToggle={(e) => { const open = (e.currentTarget as HTMLDetailsElement).open; if (open && !manual) setManual({ h: '', m: '', s: '', reps: '' }); if (!open) setManual(null); }}>
          <summary class="small text-link">{method === 'stopwatch' ? 'Enter duration manually' : 'Enter count manually'}</summary>
          {manual && (
            <div class="stack" style={{ marginTop: 'var(--space-2)' }} data-testid="manual-entry">
              {method === 'stopwatch' ? (
                <DurationFields idPrefix="m" legend="Duration" value={manual} onChange={(p) => setManual({ ...manual, ...p })} testId="duration-fields" />
              ) : (
                <div class="field"><label class="label" for="m-reps">Repetitions</label><input id="m-reps" class="input" inputMode="numeric" value={manual.reps} onInput={(e) => setManual({ ...manual, reps: (e.target as HTMLInputElement).value })} /></div>
              )}
              <button type="button" class="btn btn-outline btn-block" disabled={saving} onClick={saveManual} data-testid="save-manual">Save this {method === 'stopwatch' ? 'duration' : 'count'}</button>
            </div>
          )}
        </details>

        <details class="more-details">
          <summary class="small text-link">Add a note (optional)</summary>
          <textarea aria-label="Note for this session" class="textarea" maxLength={2000} value={note} onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} style={{ marginTop: 'var(--space-2)' }} />
        </details>

        {error && <ErrorText id="tracker-error">{error}</ErrorText>}
        <button type="button" class="btn btn-primary btn-block" disabled={saving || !loaded || (method === 'stopwatch' ? idle : false)} onClick={() => void saveLive()} data-testid="save-session">
          <Icon name="check" size={18} /> Save session
        </button>
        <p class="xsmall muted center">{method === 'stopwatch' ? 'Elapsed time isn’t recorded until you save the session.' : 'The count isn’t recorded until you save the session.'} The app can’t alert you in the background.</p>
        {state && (
          <button type="button" class="btn btn-ghost btn-sm" onClick={() => void discard()} data-testid="discard-tracker">Discard without saving</button>
        )}
      </div>
    </Sheet>
  );
}

/** One simple daily completion bar (the only new progress bar). Text equivalent always shown. */
export function DailyBar({ done, scheduled }: { done: number; scheduled: number }) {
  const pct = scheduled === 0 ? 0 : Math.min(100, (done / scheduled) * 100);
  return (
    <div class="stack" style={{ gap: '6px' }} data-testid="daily-bar">
      <p class="small" style={{ fontWeight: 600 }} data-testid="daily-count">{done} of {scheduled} session{scheduled === 1 ? '' : 's'} done</p>
      <div class="meter" role="img" aria-label={`${done} of ${scheduled} scheduled sessions done today`}>
        <div class="meter-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
