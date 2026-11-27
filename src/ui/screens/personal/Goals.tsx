/**
 * Goals & Exercises landing, My Goals, goal/achievement forms and detail, and inspiration (Checkpoint 2b).
 *
 * Personal content comes first. No progress bars, percentages, streaks or deadlines on goals. Linking
 * a milestone never changes it; accomplishing a goal never marks a milestone.
 */
import { useMemo, useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { notifyPersonalChanged, useChildPersonal } from '../../../state/personal';
import { useChildMilestones, useMilestoneAge } from '../../../state/milestones';
import { setFlash, takeFlash } from '../../../state/flash';
import { href, navigate } from '../../../router';
import { formatLongDate } from '../../../domain/dates';
import { MILESTONES, getMilestone, isApplicable } from '../../../domain/milestones';
import { displayTextOf } from '../../../domain/milestoneDisplay';
import { accomplishmentsOf, activeGoalsOf } from '../../../domain/personalProgress';
import { routineFor } from '../../../domain/schedule';
import { GOAL_IDEA_RANGES, getGoalIdea, getIdeaRange, ideaBasisLine, ideaRangeFor, ideaSafety } from '../../../domain/goalIdeas';
import { newId } from '../../../data/envelope';
import type { Achievement, PersonalCategory, PersonalGoal } from '../../../types';
import {
  accomplishGoal, correctAccomplishedDate, createAchievement, createGoal, deleteItemPermanently, reopenGoal, setArchived, updateAchievement, updateGoal,
} from '../../../data/repositories/personalRepo';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { ErrorText } from '../../components/ChildFields';
import { childNameInline } from '../../components/Avatar';
import { ForChild } from '../growth/parts';
import { CategorySelect, ItemHistory, ItemNotes, MoreDetails, RelatedMilestone, SavedBanner, TwoStepDelete, categoryLabel } from './parts';

export const GOALS_SECTIONS = [
  { title: 'My Goals', subtitle: 'Set personal goals and celebrate achievements.' },
  { title: 'Exercises', subtitle: 'Discover activities and build your own routines.' },
] as const;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** One-line live summaries for the two destination cards (D15). Simple counts only. */
export function goalsLiveLine(goals: PersonalGoal[], achievements: Achievement[]): string {
  const active = activeGoalsOf(goals).length;
  const done = accomplishmentsOf(goals, achievements).length;
  if (active === 0 && done === 0) return 'Nothing added yet';
  return `${active} working toward · ${done} accomplished`;
}

export function GoalsLanding() {
  const { activeChild } = useApp();
  const p = useChildPersonal(activeChild);
  if (!activeChild) return null;
  const d = p.data;
  const routine = d ? routineFor(d.exercises, d.sessions, p.today) : null;
  const lines = [
    d ? goalsLiveLine(d.goals, d.achievements) : '',
    routine ? (routine.scheduledCount === 0 ? 'Nothing scheduled today' : `Today: ${routine.doneCount} of ${routine.scheduledCount} done`) : '',
  ];
  const links = [href({ name: 'myGoals' }), href({ name: 'exercises' })];
  const icons = ['target', 'sparkles'] as const;
  return (
    <div>
      <ForChild child={activeChild} />
      <div class="stack" data-testid="goals-sections">
        {GOALS_SECTIONS.map((s, i) => (
          <a key={s.title} class="card section-link" href={links[i]} data-testid={i === 0 ? 'section-my-goals' : 'section-exercises'}>
            <span class="icon-wrap"><Icon name={icons[i]!} /></span>
            <span class="grow">
              <span class="title-3" style={{ display: 'block' }}>{s.title}</span>
              <span class="small section-subtitle" data-testid="section-subtitle">{s.subtitle}</span>
              <span class="xsmall muted" style={{ display: 'block' }} data-testid="section-live">{lines[i]}</span>
            </span>
            <span class="chev"><Icon name="chevronRight" size={20} /></span>
          </a>
        ))}
      </div>
    </div>
  );
}

function GoalRow({ g }: { g: PersonalGoal }) {
  return (
    <li>
      <a class="ms-item" style={{ paddingLeft: 0, paddingRight: 0 }} href={href({ name: 'goalItem', id: g.id })} data-testid="goal-row">
        <span class="ms-text">
          {g.title}
          <span class="ms-meta">
            {categoryLabel(g.appCategory)} · {g.startDate ? `since ${formatLongDate(g.startDate)}` : 'start date not recorded'}
            {g.targetDate && ` · target ${formatLongDate(g.targetDate)} (your plan)`}
          </span>
        </span>
        <Icon name="chevronRight" size={18} />
      </a>
    </li>
  );
}

function AccomplishmentRow({ a }: { a: { kind: 'goal' | 'achievement'; id: string; title: string; date: string } }) {
  return (
    <li>
      <a class="ms-item" style={{ paddingLeft: 0, paddingRight: 0 }} href={href({ name: 'goalItem', id: a.id })} data-testid="accomplishment-row" data-kind={a.kind}>
        <span class="row" style={{ gap: 'var(--space-2)', alignItems: 'flex-start' }}>
          <span class="muted" aria-hidden="true"><Icon name={a.kind === 'achievement' ? 'sparkles' : 'target'} size={18} /></span>
          <span class="ms-text">
            {a.title}
            <span class="ms-meta">{a.kind === 'achievement' ? formatLongDate(a.date) : `Accomplished ${formatLongDate(a.date)}`}</span>
          </span>
        </span>
        <Icon name="chevronRight" size={18} />
      </a>
    </li>
  );
}

export function MyGoalsScreen() {
  const { activeChild } = useApp();
  const p = useChildPersonal(activeChild);
  const [flash] = useState(() => takeFlash());
  if (!activeChild) return null;
  if (!p.data) return <p class="muted small">Loading…</p>;
  const name = childNameInline(activeChild);
  const working = activeGoalsOf(p.data.goals).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '') || a.title.localeCompare(b.title));
  const all = accomplishmentsOf(p.data.goals, p.data.achievements);
  const done = all.filter((a) => !a.archived);
  const archivedGoals = p.data.goals.filter((g) => g.archivedAt && g.status === 'active');
  const archived = [...all.filter((a) => a.archived)];
  return (
    <div class="stack-lg">
      <ForChild child={activeChild} />
      {flash && <SavedBanner text={flash} />}
      <div class="stack">
        <a class="btn btn-primary btn-block" href={href({ name: 'goalNew' })} data-testid="create-goal"><Icon name="plus" size={18} /> Create a goal</a>
        <a class="btn btn-secondary btn-block" href={href({ name: 'achievementNew' })} data-testid="record-achievement"><Icon name="sparkles" size={18} /> Record an achievement</a>
      </div>

      {working.length === 0 && done.length === 0 && (
        <p class="card small muted" data-testid="goals-empty">Nothing here yet. Create a goal, or record something {name} did that you want to remember.</p>
      )}

      <section aria-labelledby="working-title" data-testid="working-toward">
        <h2 class="title-2 section-title" id="working-title">Working toward ({working.length})</h2>
        <div class="card">
          {working.length === 0 ? <p class="small muted">No goals in progress.</p> : <ul class="ms-list">{working.map((g) => <GoalRow key={g.id} g={g} />)}</ul>}
        </div>
      </section>

      <section aria-labelledby="done-title" data-testid="accomplishments">
        <h2 class="title-2 section-title" id="done-title">Accomplishments ({done.length})</h2>
        <div class="card">
          {done.length === 0 ? <p class="small muted">Accomplished goals and achievements you record will appear here.</p> : <ul class="ms-list">{done.map((a) => <AccomplishmentRow key={a.id} a={a} />)}</ul>}
        </div>
      </section>

      {(archived.length > 0 || archivedGoals.length > 0) && (
        <details class="card" data-testid="archived-goals">
          <summary class="small text-link" style={{ cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Show archived ({archived.length + archivedGoals.length})</summary>
          <ul class="ms-list">
            {archivedGoals.map((g) => <GoalRow key={g.id} g={g} />)}
            {archived.map((a) => <AccomplishmentRow key={a.id} a={a} />)}
          </ul>
        </details>
      )}

      <a class="card section-link" href={href({ name: 'goalIdeas' })} data-testid="inspiration-link">
        <span class="grow">
          <span class="title-3" style={{ display: 'block' }}>Looking for inspiration?</span>
          <span class="xsmall muted">Optional ideas you can change to fit {name}.</span>
        </span>
        <span class="chev"><Icon name="chevronRight" size={20} /></span>
      </a>
    </div>
  );
}

/** Search-and-pick one CDC milestone (optional association). */
function MilestonePicker({ value, onChange, childMonths }: { value: string | null; onChange: (id: string | null) => void; childMonths: number | null }) {
  const [q, setQ] = useState('');
  const def = value ? getMilestone(value) : undefined;
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return MILESTONES.filter((m) => displayTextOf(m).toLowerCase().includes(t)).slice(0, 8);
  }, [q]);
  if (def) {
    return (
      <div class="stack" style={{ gap: '6px' }} data-testid="picked-milestone">
        <p class="small">{displayTextOf(def)} <span class="xsmall muted">({def.referenceAgeLabel.toLowerCase()}{isApplicable(def, childMonths) ? '' : ', upcoming'})</span></p>
        <button type="button" class="btn btn-quiet btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => onChange(null)}>Remove link</button>
      </div>
    );
  }
  return (
    <div class="stack" style={{ gap: '6px' }}>
      <input id="goal-milestone" class="input" type="search" placeholder="Search milestones" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} aria-describedby="goal-milestone-hint" />
      <p id="goal-milestone-hint" class="xsmall muted">Linking a milestone doesn’t change it in the Milestone Library.</p>
      {matches.length > 0 && (
        <ul class="list" data-testid="milestone-matches">
          {matches.map((m) => (
            <li key={m.id}>
              <button type="button" class="list-item" onClick={() => { onChange(m.id); setQ(''); }}>
                <span class="grow small">{displayTextOf(m)} <span class="xsmall muted">({m.referenceAgeLabel.toLowerCase()})</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GoalFormScreen({ id, milestone, idea }: { id: string | null; milestone?: string; idea?: string }) {
  const app = useApp();
  const child = app.activeChild;
  const p = useChildPersonal(child);
  const m = useChildMilestones(child);
  const existing = id ? p.data?.goals.find((g) => g.id === id) : undefined;
  if (!child || !p.ctx) return null;
  if (id && !p.data) return <p class="muted small">Loading…</p>;
  if (id && !existing) return <Missing />;
  return <GoalForm key={id ?? 'new'} existing={existing} milestone={milestone} idea={idea} exercises={(p.data?.exercises ?? []).filter((e) => !e.archivedAt)} childMonths={m.age?.months ?? null} />;
}

function GoalForm({ existing, milestone, idea, exercises, childMonths }: { existing?: PersonalGoal; milestone?: string; idea?: string; exercises: Array<{ id: string; title: string; goalIds: string[] }>; childMonths: number | null }) {
  const app = useApp();
  const child = app.activeChild!;
  const p = useChildPersonal(child);
  const prefillDef = milestone ? getMilestone(milestone) : undefined;
  // R-010: an idea only fills in the name and area for the parent to change. No date, link or schedule is set.
  const prefillIdea = idea ? getGoalIdea(idea) : undefined;
  const [formId] = useState(() => newId());
  const [title, setTitle] = useState(existing?.title ?? (prefillDef ? displayTextOf(prefillDef) : prefillIdea?.title ?? ''));
  const [area, setArea] = useState<PersonalCategory>(existing?.appCategory ?? prefillDef?.appCategory ?? prefillIdea?.appCategory ?? null);
  const [start, setStart] = useState<string>(existing ? existing.startDate ?? '' : p.today);
  const [target, setTarget] = useState(existing?.targetDate ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [defId, setDefId] = useState<string | null>(existing?.milestoneDefId ?? prefillDef?.id ?? null);
  const [linked, setLinked] = useState<string[]>(existing ? exercises.filter((e) => e.goalIds.includes(existing.id)).map((e) => e.id) : []);
  const [noteDate, setNoteDate] = useState(p.today);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!p.ctx || saving) return;
    setSaving(true);
    setError(null);
    try {
      const input = { title, appCategory: area, description, startDate: start || null, targetDate: target || null, milestoneDefId: defId, exerciseIds: linked, firstNote: existing ? null : note.trim() ? { date: noteDate, text: note } : null };
      if (existing) {
        await updateGoal(app.db, p.ctx, existing.id, input);
        notifyPersonalChanged();
        setFlash('Goal updated.');
        navigate({ name: 'goalItem', id: existing.id });
      } else {
        const g = await createGoal(app.db, p.ctx, input, formId);
        notifyPersonalChanged();
        setFlash('Goal saved. You’ll find it under Working toward.');
        navigate({ name: 'goalItem', id: g.id });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That couldn’t be saved.'); // the parent's text stays as typed
    } finally {
      setSaving(false);
    }
  };
  return (
    <form class="card stack" onSubmit={(e) => { e.preventDefault(); void save(); }} data-testid="goal-form">
      {prefillIdea && !existing && <p class="xsmall muted" data-testid="idea-prefill-note">Filled in from an idea. Change anything you like; nothing is saved until you choose Save goal.</p>}
      <div class="field">
        <label class="label" for="goal-title">Goal name</label>
        <input id="goal-title" class="input" maxLength={120} value={title} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} required aria-required="true" />
      </div>
      <CategorySelect id="goal-area" value={area} onChange={setArea} />
      <div class="field">
        <label class="label" for="goal-start">Starts</label>
        <input id="goal-start" class="input" type="date" min={child.dob} value={start} onInput={(e) => setStart((e.target as HTMLInputElement).value)} />
        {existing && existing.startDate === null && !start && <p class="xsmall muted">Start date not recorded. You can add one if you know it.</p>}
      </div>
      <div class="field">
        <label class="label" for="goal-target">Target date (optional)</label>
        <input id="goal-target" class="input" type="date" min={start || child.dob} value={target} onInput={(e) => setTarget((e.target as HTMLInputElement).value)} aria-describedby="goal-target-hint" />
        <p id="goal-target-hint" class="xsmall muted">A target date is your own plan, not a deadline.</p>
      </div>
      <MoreDetails testId="goal-more" defaultOpen={!!(existing && (existing.description || existing.milestoneDefId)) || !!prefillDef}>
        <div class="field">
          <label class="label" for="goal-desc">Description (optional)</label>
          <textarea id="goal-desc" class="textarea" maxLength={2000} value={description} onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)} />
        </div>
        {!existing && (
          <fieldset class="stack" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend class="label">Notes & Observations (optional)</legend>
            <input aria-label="Date observed" class="input" type="date" min={child.dob} max={p.today} value={noteDate} onInput={(e) => setNoteDate((e.target as HTMLInputElement).value)} />
            <textarea aria-label="Note or observation" class="textarea" maxLength={2000} value={note} onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} />
          </fieldset>
        )}
        <div class="field">
          <span class="label">Related milestone (optional)</span>
          <MilestonePicker value={defId} onChange={setDefId} childMonths={childMonths} />
        </div>
        {exercises.length > 0 && (
          <fieldset class="stack" style={{ border: 0, padding: 0, margin: 0 }} data-testid="goal-exercises">
            <legend class="label">Related exercises (optional)</legend>
            {exercises.map((e) => (
              <label key={e.id} class="row small" style={{ gap: 'var(--space-2)', minHeight: '44px' }}>
                <input type="checkbox" checked={linked.includes(e.id)} onChange={(ev) => setLinked((ev.target as HTMLInputElement).checked ? [...linked, e.id] : linked.filter((x) => x !== e.id))} />
                {e.title}
              </label>
            ))}
            <p class="xsmall muted">Recording an exercise never marks a goal accomplished.</p>
          </fieldset>
        )}
      </MoreDetails>
      {error && <ErrorText id="goal-error">{error}</ErrorText>}
      <button type="submit" class="btn btn-primary btn-block" disabled={saving} data-testid="save-goal">{existing ? 'Save changes' : 'Save goal'}</button>
      <a class="btn btn-ghost btn-block" href={existing ? href({ name: 'goalItem', id: existing.id }) : href({ name: 'myGoals' })}>Cancel</a>
    </form>
  );
}

export function AchievementFormScreen({ id }: { id: string | null }) {
  const app = useApp();
  const p = useChildPersonal(app.activeChild);
  if (!app.activeChild || !p.ctx) return null;
  if (id && !p.data) return <p class="muted small">Loading…</p>;
  const existing = id ? p.data?.achievements.find((a) => a.id === id) : undefined;
  if (id && !existing) return <Missing />;
  return <AchievementForm key={id ?? 'new'} existing={existing} />;
}

function AchievementForm({ existing }: { existing?: Achievement }) {
  const app = useApp();
  const child = app.activeChild!;
  const p = useChildPersonal(child);
  const [formId] = useState(() => newId());
  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.achievedDate ?? p.today);
  const [area, setArea] = useState<PersonalCategory>(existing?.appCategory ?? null);
  const [description, setDescription] = useState(existing?.description ?? '');
  const [noteDate, setNoteDate] = useState(p.today);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!p.ctx || saving) return;
    setSaving(true);
    setError(null);
    try {
      const input = { title, appCategory: area, description, achievedDate: date, firstNote: existing ? null : note.trim() ? { date: noteDate, text: note } : null };
      if (existing) {
        await updateAchievement(app.db, p.ctx, existing.id, input);
        notifyPersonalChanged();
        setFlash('Achievement updated.');
        navigate({ name: 'goalItem', id: existing.id });
      } else {
        const a = await createAchievement(app.db, p.ctx, input, formId);
        notifyPersonalChanged();
        setFlash('Achievement saved. You’ll find it under Accomplishments.');
        navigate({ name: 'goalItem', id: a.id });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That couldn’t be saved.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <form class="card stack" onSubmit={(e) => { e.preventDefault(); void save(); }} data-testid="achievement-form">
      <p class="xsmall muted">For something {childNameInline(child)} did that wasn’t a goal. No goal or start date is created.</p>
      <div class="field">
        <label class="label" for="ach-title">What happened?</label>
        <input id="ach-title" class="input" maxLength={120} value={title} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} required aria-required="true" />
      </div>
      <div class="field">
        <label class="label" for="ach-date">Date</label>
        <input id="ach-date" class="input" type="date" min={child.dob} max={p.today} value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} />
      </div>
      <CategorySelect id="ach-area" value={area} onChange={setArea} />
      <MoreDetails testId="ach-more" defaultOpen={!!existing?.description}>
        <div class="field">
          <label class="label" for="ach-desc">Description (optional)</label>
          <textarea id="ach-desc" class="textarea" maxLength={2000} value={description} onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)} />
        </div>
        {!existing && (
          <fieldset class="stack" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend class="label">Notes & Observations (optional)</legend>
            <input aria-label="Date observed" class="input" type="date" min={child.dob} max={p.today} value={noteDate} onInput={(e) => setNoteDate((e.target as HTMLInputElement).value)} />
            <textarea aria-label="Note or observation" class="textarea" maxLength={2000} value={note} onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} />
          </fieldset>
        )}
      </MoreDetails>
      {error && <ErrorText id="ach-error">{error}</ErrorText>}
      <button type="submit" class="btn btn-primary btn-block" disabled={saving} data-testid="save-achievement">{existing ? 'Save changes' : 'Save achievement'}</button>
      <a class="btn btn-ghost btn-block" href={existing ? href({ name: 'goalItem', id: existing.id }) : href({ name: 'myGoals' })}>Cancel</a>
    </form>
  );
}

function Missing() {
  return (
    <div class="card stack" data-testid="item-missing">
      <p>This item is no longer here.</p>
      <a class="btn btn-secondary" href={href({ name: 'myGoals' })}>Open My Goals</a>
    </div>
  );
}

export function GoalDetailScreen({ id }: { id: string }) {
  const app = useApp();
  const child = app.activeChild;
  const p = useChildPersonal(child);
  const [flash] = useState(() => takeFlash());
  const [saved, setSaved] = useState<string | null>(flash);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | 'accomplish' | 'delete'>(null);
  const [date, setDate] = useState(p.today);
  const [fixDate, setFixDate] = useState('');
  if (!child || !p.ctx) return null;
  if (!p.data) return <p class="muted small">Loading…</p>;
  const goal = p.data.goals.find((g) => g.id === id);
  const ach = p.data.achievements.find((a) => a.id === id);
  const item = goal ?? ach;
  if (!item) return <Missing />;
  const ctx = p.ctx;
  const run = async (fn: () => Promise<void>, message: string) => {
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
  const related = goal ? p.data.exercises.filter((e) => e.goalIds.includes(goal.id)) : [];
  const kindWord = goal ? 'goal' : 'achievement';
  return (
    <div class="stack-lg" data-testid="goal-detail" data-kind={item.kind}>
      <section class="card stack">
        <div class="row-between" style={{ alignItems: 'flex-start' }}>
          <span class="badge" data-testid="goal-status">{goal ? (goal.status === 'active' ? 'Working toward' : 'Accomplished') : 'Achievement'}</span>
          <a class="btn btn-quiet btn-sm" href={href({ name: 'goalEdit', id: item.id })} data-testid="edit-item"><Icon name="pencil" size={16} /> Edit</a>
        </div>
        <h2 class="title-2" data-testid="goal-title">{item.title}</h2>
        <p class="small muted">{categoryLabel(item.appCategory)}{item.archivedAt ? ' · Archived' : ''}</p>
        {goal && (
          <p class="small" data-testid="goal-dates">
            {goal.startDate ? `Started ${formatLongDate(goal.startDate)}` : 'Start date not recorded'}
            {goal.targetDate && ` · Target ${formatLongDate(goal.targetDate)} (your plan)`}
          </p>
        )}
        {goal?.status === 'accomplished' && goal.accomplishedDate && <p class="small">Accomplished on <strong>{formatLongDate(goal.accomplishedDate)}</strong></p>}
        {ach && <p class="small">On <strong>{formatLongDate(ach.achievedDate)}</strong></p>}
        {item.description && <p class="small">{item.description}</p>}
        {item.convertedFrom && <p class="xsmall muted" data-testid="converted-note">Moved here from your personal milestone entries.</p>}
        {item.milestoneDefId && <RelatedMilestone defId={item.milestoneDefId} note={`Marking this ${kindWord} doesn’t change the milestone.`} />}
        {goal && related.length > 0 && (
          <div class="stack" style={{ gap: '4px' }} data-testid="goal-related-exercises">
            <p class="small">Related exercises: {related.map((e, i) => <span key={e.id}>{i > 0 && ', '}<a class="text-link" href={href({ name: 'exerciseItem', id: e.id })}>{e.title}</a></span>)}</p>
            <p class="xsmall muted">Recording an exercise never marks this goal accomplished.</p>
          </div>
        )}
        {goal?.status === 'active' && (
          <button type="button" class="btn btn-primary btn-block" onClick={() => { setDate(p.today); setSheet('accomplish'); }} data-testid="mark-accomplished"><Icon name="check" size={18} /> Mark as accomplished</button>
        )}
        {goal?.status === 'accomplished' && (
          <div class="stack">
            <button type="button" class="btn btn-outline btn-block" onClick={() => run(() => reopenGoal(app.db, ctx, goal.id), 'Reopened. It’s back under Working toward; the earlier date stays in the history.')} data-testid="reopen-goal"><Icon name="rotate" size={18} /> Reopen</button>
            <details>
              <summary class="small text-link" style={{ cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Correct the date accomplished</summary>
              <div class="stack" style={{ marginTop: 'var(--space-2)' }}>
                <label class="label" for="fix-goal-date">Correct date</label>
                <input id="fix-goal-date" class="input" type="date" min={goal.startDate ?? child.dob} max={p.today} value={fixDate || goal.accomplishedDate!} onInput={(e) => setFixDate((e.target as HTMLInputElement).value)} />
                <button type="button" class="btn btn-outline btn-block" onClick={() => run(() => correctAccomplishedDate(app.db, ctx, goal.id, fixDate || goal.accomplishedDate!), 'Date corrected. The earlier date stays in the history.')}>Save corrected date</button>
              </div>
            </details>
          </div>
        )}
      </section>

      {error && <ErrorText id="goal-detail-error">{error}</ErrorText>}
      {saved && <SavedBanner text={saved} />}

      <ItemNotes db={app.db} ctx={ctx} itemId={item.id} events={p.data.events} dob={child.dob} today={p.today} onSaved={(t) => { setError(null); setSaved(t); }} onError={(t) => { setSaved(null); setError(t); }} />
      <ItemHistory db={app.db} ctx={ctx} itemId={item.id} events={p.data.events} onSaved={(t) => { setError(null); setSaved(t); }} onError={(t) => { setSaved(null); setError(t); }} />

      <details class="card stack" data-testid="manage-item">
        <summary class="small text-link" style={{ cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Manage this {kindWord}</summary>
        <div class="stack" style={{ marginTop: 'var(--space-3)' }}>
          <button type="button" class="btn btn-outline btn-block" data-testid="archive-item" onClick={() => run(() => setArchived(app.db, ctx, item.id, item.kind, !item.archivedAt), item.archivedAt ? 'Restored from the archive.' : 'Archived. Its history is kept and it still counts in your totals.')}>
            {item.archivedAt ? 'Restore from archive' : 'Archive'}
          </button>
          <p class="xsmall muted">Archiving tidies it away without erasing anything. {goal ? 'Archived goals aren’t counted as active.' : ''}</p>
          <button type="button" class="btn btn-quiet btn-block" data-testid="delete-item" onClick={() => setSheet('delete')}><Icon name="trash" size={18} /> Delete permanently…</button>
        </div>
      </details>

      {sheet === 'accomplish' && goal && (
        <Sheet title="Mark as accomplished" onClose={() => setSheet(null)}>
          <div class="stack">
            <div class="field">
              <label class="label" for="accomplished-date">Date accomplished</label>
              <input id="accomplished-date" class="input" type="date" min={goal.startDate ?? child.dob} max={p.today} value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} />
            </div>
            {goal.milestoneDefId && <p class="xsmall muted">This doesn’t change the related milestone in the Milestone Library.</p>}
            {error && <ErrorText id="accomplish-error">{error}</ErrorText>}
            <button type="button" class="btn btn-primary btn-block" data-testid="confirm-accomplished" onClick={async () => { if (await run(() => accomplishGoal(app.db, ctx, goal.id, date), 'Wonderful! It’s now under Accomplishments.')) setSheet(null); }}>Save</button>
            <button type="button" class="btn btn-ghost btn-block" onClick={() => setSheet(null)}>Cancel</button>
          </div>
        </Sheet>
      )}
      {sheet === 'delete' && (
        <TwoStepDelete
          title={`Delete this ${kindWord} permanently?`}
          effects={[
            `“${item.title}” and its Notes & Observations and history will be permanently deleted from this device.`,
            goal?.status === 'accomplished' || ach ? 'It will no longer be counted in Personal Progress or shown in the charts.' : 'It will no longer be counted as an active goal.',
            ...(related.length ? ['Related exercises are kept; only their link to this goal is removed.'] : []),
            'Milestones are not affected. To tidy it away instead, use Archive.',
          ]}
          onClose={() => setSheet(null)}
          onConfirm={async () => {
            await deleteItemPermanently(app.db, ctx, item.id, item.kind);
            notifyPersonalChanged();
            setFlash(`The ${kindWord} was permanently deleted.`);
            navigate({ name: 'myGoals' });
          }}
        />
      )}
    </div>
  );
}

/** Edit route: goals and achievements share one address pattern. */
export function GoalEditScreen({ id }: { id: string }) {
  const app = useApp();
  const p = useChildPersonal(app.activeChild);
  if (!p.data) return <p class="muted small">Loading…</p>;
  if (p.data.achievements.some((a) => a.id === id)) return <AchievementFormScreen id={id} />;
  return <GoalFormScreen id={id} />;
}

/**
 * Inspiration (R-010): Start from a milestone, plus optional, age-responsive goal ideas written for this
 * app. The default range follows the child's milestone age (chronological or corrected, as chosen);
 * before the due date nothing is presented as being for the child. Nothing is added until it is saved.
 */
export function GoalIdeasScreen({ range }: { range?: string }) {
  const { activeChild } = useApp();
  const m = useChildMilestones(activeChild);
  const age = useMilestoneAge(activeChild);
  const [q, setQ] = useState('');
  const [upcoming, setUpcoming] = useState(false);
  if (!activeChild || !age.age) return null;
  const name = childNameInline(activeChild);
  const t = q.trim().toLowerCase();
  const months = m.age?.months ?? null;
  const list = upcoming
    ? MILESTONES.filter((d) => !isApplicable(d, months) && !m.sourcedStates.get(d.id)?.hidden).sort((a, b) => a.referenceAgeMonths - b.referenceAgeMonths).slice(0, 12)
    : t.length >= 2 ? MILESTONES.filter((d) => displayTextOf(d).toLowerCase().includes(t)).slice(0, 12) : [];
  const def = ideaRangeFor(age.age.months);
  const chosen = (range ? getIdeaRange(range) : undefined) ?? (def.kind === 'range' ? def.range : undefined);
  const usingCorrected = activeChild.correctedAge.enabled && activeChild.ageBasis === 'corrected';
  const go = (id: string) => window.location.replace(href({ name: 'goalIdeas', range: id }));
  return (
    <div class="stack-lg" data-testid="goal-ideas">
      <p class="small muted">Ideas are optional. Change anything to fit {name}. Nothing is added until you save it.</p>
      <section class="card stack" aria-labelledby="from-milestone">
        <h2 class="title-3" id="from-milestone">Start from a milestone</h2>
        <input class="input" type="search" aria-label="Search milestones" placeholder="Search milestones" value={q} onInput={(e) => { setQ((e.target as HTMLInputElement).value); setUpcoming(false); }} />
        <button type="button" class="btn btn-quiet btn-sm" style={{ alignSelf: 'flex-start' }} aria-pressed={upcoming} onClick={() => { setUpcoming(!upcoming); setQ(''); }} data-testid="show-upcoming">
          {upcoming ? 'Hide upcoming milestones' : `Show upcoming milestones for ${name}`}
        </button>
        {list.length > 0 && (
          <ul class="ms-list" data-testid="idea-milestones">
            {list.map((d) => (
              <li key={d.id}>
                <a class="ms-item" style={{ paddingLeft: 0, paddingRight: 0 }} href={href({ name: 'goalNew', milestone: d.id })}>
                  <span class="ms-text">{displayTextOf(d)}<span class="ms-meta">{d.referenceAgeLabel}</span></span>
                  <Icon name="plus" size={18} />
                </a>
              </li>
            ))}
          </ul>
        )}
        <p class="xsmall muted">Choosing a milestone fills in a new goal for you to edit. It doesn’t change the milestone.</p>
      </section>
      <section class="card stack" aria-labelledby="ideas-title" data-testid="original-ideas" data-range={chosen?.id ?? ''}>
        <h2 class="title-3" id="ideas-title">Goal ideas by age</h2>
        <div class="field">
          <label class="label" for="idea-range">Age range</label>
          <select id="idea-range" class="select" value={chosen?.id ?? ''} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; if (v) go(v); }} data-testid="idea-range">
            {!chosen && <option value="">Choose an age range</option>}
            {GOAL_IDEA_RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        <p class="xsmall muted" data-testid="idea-age-context">
          {name}’s age used for milestones: {age.age.months === null ? 'before due date' : `${age.age.months} month${age.age.months === 1 ? '' : 's'} (${usingCorrected ? 'corrected' : 'chronological'} age)`}.
          {chosen && def.kind === 'range' && chosen.id !== def.range.id ? ` You’re looking at another age range than ${name}’s.` : ''}
        </p>
        {def.kind === 'range' && def.olderThanFive && chosen?.id === def.range.id && (
          <p class="xsmall muted" data-testid="idea-over-five">These ideas go up to age 5, the age the milestones and activities in this app cover, so these are the ideas for 48 to 60 months.</p>
        )}
        {!chosen ? (
          <div class="stack" data-testid="idea-before-due">
            <p class="small">{name}’s due date hasn’t arrived yet, so no ideas are suggested for {name} yet.</p>
            <p class="small muted">Goal ideas are arranged by age, starting from birth. Because {name}’s age for milestones starts at the due date, no age range is chosen yet. You can look at any age range whenever you like.</p>
            <button type="button" class="btn btn-secondary btn-block" onClick={() => go(GOAL_IDEA_RANGES[0]!.id)} data-testid="idea-browse-first">Look at ideas for birth to under 6 months</button>
          </div>
        ) : (
          <ul class="ms-list" data-testid="idea-list">
            {chosen.ideas.map((idea) => {
              const safety = ideaSafety(idea);
              return (
                <li key={idea.id} class="idea-item" data-testid="idea" data-idea={idea.id}>
                  <a class="ms-item" style={{ paddingLeft: 0, paddingRight: 0 }} href={href({ name: 'goalNew', idea: idea.id })} aria-describedby={`${idea.id}-basis`}>
                    <span class="ms-text">{idea.title}<span class="ms-meta" id={`${idea.id}-basis`}>{categoryLabel(idea.appCategory)} · {ideaBasisLine(idea)}</span></span>
                    <span class="small text-link idea-use">Use this idea</span>
                  </a>
                  {safety.length > 0 && (
                    <p class="info-note xsmall" data-testid="idea-safety">
                      <Icon name="shield" size={16} />
                      <span>
                        {safety.flatMap((x) => x.sentences).length > 0 ? `${[...new Set(safety.flatMap((x) => x.sentences))].join(' ')} ` : ''}
                        <a class="text-link" href={href({ name: 'activity', id: safety[0]!.activity.id })}>Safety notes for the related activity</a>
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p class="xsmall muted" data-testid="idea-disclaimer">Written for this app as possible goals, based on the milestones and activities in this app. They aren’t CDC milestones, recommendations from CDC or any medical organization, or things {name} is expected to do. Using one sets no deadline.</p>
      </section>
    </div>
  );
}

export { plural };
