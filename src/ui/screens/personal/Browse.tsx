/**
 * Browse Exercises and recommended activity detail (Checkpoint 2b, D2–D4, inventory corrections §3).
 *
 * - CDC's 12 reference ages plus All ages; default = the most recently reached CDC age (milestone age).
 *   Under 2 months or before the due date nothing is presented as being for the child: a calm intro
 *   offers the 2-month activities or another age. The selected reference age is always labelled
 *   separately from the child's own age; a reference age is context, not readiness or suitability.
 * - Five area accordions, all collapsed by default. Empty areas say so; nothing is invented.
 * - Activity pages show CDC's purpose sentence once, the instructions with safety sentences highlighted
 *   in place (never repeated), CDC's page-level guidance, materials, source and original wording.
 */
import { useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { useMilestoneAge } from '../../../state/milestones';
import { href, navigate } from '../../../router';
import { APP_CATEGORIES, REFERENCE_AGES } from '../../../domain/milestones';
import {
  ACTIVITIES, ageName, ageOld, ageOlds, agesOf, activitiesAt, browseDefault, getActivity, getActivityRecord, guidanceFor, pageSourceOf, recordForAge, recordsOf, splitRecord,
  type Activity, type ActivityRecord,
} from '../../../domain/activities';
import { Accordion } from '../../components/Accordion';
import { Icon } from '../../components/Icon';
import { childNameInline } from '../../components/Avatar';
import { ExternalLink, ForChild } from '../growth/parts';

export const ACTIVITY_SOURCE_NOTE = 'Activities are from CDC’s “Learn the Signs. Act Early.” milestone pages, in gender-neutral wording. Not endorsed by CDC, HHS, or the U.S. Government. The originals are available free at cdc.gov.';

export function BrowseScreen({ age }: { age: number | 'all' | null }) {
  const { activeChild } = useApp();
  const m = useMilestoneAge(activeChild);
  if (!activeChild || !m.age) return null;
  const name = childNameInline(activeChild);
  const def = browseDefault(m.age.months);
  const selected: number | 'all' | null = age ?? (def.kind === 'age' ? def.age : null);
  const go = (a: number | 'all') => navigate({ name: 'exerciseBrowse', age: a });
  const usingCorrected = activeChild.correctedAge.enabled && activeChild.ageBasis === 'corrected';
  return (
    <div class="stack-lg" data-testid="browse">
      <ForChild child={activeChild} />
      <p class="small muted">Everyday play and learning activities from CDC’s milestone pages. They’re general ideas, not individual advice.</p>
      <div class="card stack">
        <div class="field">
          <label class="label" for="browse-age">Reference age</label>
          <select id="browse-age" class="select" value={selected === null ? '' : String(selected)} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; if (v) go(v === 'all' ? 'all' : Number(v)); }} data-testid="browse-age">
            {selected === null && <option value="">Choose an age</option>}
            {REFERENCE_AGES.map((a) => <option key={a} value={String(a)}>For {ageOlds(a)}</option>)}
            <option value="all">All ages</option>
          </select>
        </div>
        <p class="xsmall muted" data-testid="age-context">
          {name}’s age used for milestones: {m.age.months === null ? 'before due date' : `${m.age.months} month${m.age.months === 1 ? '' : 's'} (${usingCorrected ? 'corrected' : 'chronological'} age)`}.{' '}
          {selected === 'all' ? 'Showing activities for every CDC age.' : selected !== null ? `Showing CDC’s tips for ${ageOlds(selected)}. A reference age gives context; it doesn’t mean an activity is right for every child of that age.` : ''}
        </p>
        {def.kind === 'age' && def.olderThanFive && selected === 60 && age === null && <p class="xsmall muted" data-testid="over-five-browse">CDC’s tips go up to age 5, so these are the 5-year activities.</p>}
      </div>

      {selected === null ? (
        <div class="card stack" data-testid="too-young">
          <p class="small">{def.kind === 'too-young' && def.beforeDueDate ? `${name}’s due date hasn’t arrived yet.` : `${name} is younger than 2 months.`} The earliest age CDC gives activity tips for is 2 months.</p>
          <p class="small muted">You can still look at them, or choose another age.</p>
          <button type="button" class="btn btn-secondary btn-block" onClick={() => go(2)} data-testid="browse-two-months">Browse activities for 2-month-olds</button>
        </div>
      ) : (
        <div class="stack" data-testid="browse-areas">
          {APP_CATEGORIES.map((c) => {
            const list = activitiesAt(selected).filter((a) => a.appCategory === c.id);
            return (
              <Accordion key={c.id} title={`${c.label} (${list.length})`} testId={`area-${c.id}`}>
                <div class="panel-pad">
                  {list.length === 0 ? (
                    <p class="small muted" data-testid="area-empty">CDC’s tips for {selected === 'all' ? 'these ages' : ageOlds(selected)} don’t include a {c.label.toLowerCase()} activity. Try another age, or create your own.</p>
                  ) : (
                    <ul class="ms-list">
                      {list.map((a) => (
                        <li key={a.id}>
                          <a class="ms-item" style={{ paddingLeft: 0, paddingRight: 0 }} href={href({ name: 'activity', id: a.id })} data-testid="activity-row">
                            <span class="ms-text">{a.title}<span class="ms-meta">For {agesOf(a).map(ageOlds).join(', ')}</span></span>
                            <Icon name="chevronRight" size={18} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Accordion>
            );
          })}
          <p class="source-note xsmall muted" data-testid="activity-source-note">{ACTIVITY_SOURCE_NOTE}</p>
        </div>
      )}
    </div>
  );
}

/** Instructions with CDC's safety sentences highlighted in place (no sentence appears twice). */
export function ActivityInstructions({ record }: { record: ActivityRecord }) {
  const { instructions } = splitRecord(record);
  return (
    <p class="small activity-text" data-testid="activity-instructions">
      {instructions.map((s, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {s.role === 'safety' ? <strong class="safety-inline" data-testid="safety-sentence"><span class="visually-hidden">Safety: </span>{s.text}</strong> : s.text}
        </span>
      ))}
    </p>
  );
}

/**
 * Safety qualifications for an activity: CDC's safety sentences from the tip, then CDC's page-level
 * guidance. Used on the activity page and at the point of use (adopted exercise page, tracker).
 * `withSentences` is false where the instructions with highlighted safety sentences are already shown.
 */
export function ActivitySafety({ activityId, compact = false, withSentences = true, recordId }: { activityId: string; compact?: boolean; withSentences?: boolean; recordId?: string }) {
  const a = getActivity(activityId);
  if (!a) return null;
  const r = (recordId ? getActivityRecord(recordId) : undefined) ?? recordsOf(a)[0]!;
  const sentences = splitRecord(r).safety;
  const g = guidanceFor(r);
  if (compact) {
    if (!a.safetySensitive && sentences.length === 0) return null;
    return (
      <div class="info-note" data-testid="tracker-safety">
        <Icon name="shield" size={18} />
        <span class="small">{sentences.length ? sentences.join(' ') : g?.display.split('. ').slice(1, 2).join('') + '.'} <span class="xsmall muted">(CDC)</span></span>
      </div>
    );
  }
  return (
    <section class="card stack" aria-labelledby={`safety-${a.id}`} data-testid="activity-safety">
      <h2 class="title-3" id={`safety-${a.id}`}><Icon name="shield" size={18} /> Safety</h2>
      {withSentences && sentences.length > 0 && <ul class="plain-list small stack">{sentences.map((s) => <li key={s}>{s}</li>)}</ul>}
      {g && <p class="small muted" data-testid="page-guidance">{g.display}</p>}
      <p class="xsmall muted">From CDC. This app doesn’t review whether an activity suits a particular child.</p>
    </section>
  );
}

function SourceCard({ record, adapted }: { record: ActivityRecord; adapted: boolean }) {
  const page = pageSourceOf(record);
  const g = guidanceFor(record);
  const corrected = !!record.corrections?.length;
  return (
    <section class="card stack small" data-testid="activity-source">
      <p>From CDC’s {page ? <ExternalLink url={page.url}>{page.title}</ExternalLink> : 'milestone pages'} (“What you can do for your {ageOld(record.referenceAgeMonths)}”, content reviewed May 15, 2026). Not endorsed by CDC, HHS, or the U.S. Government. Available free at cdc.gov.</p>
      <p class="xsmall muted">The title and area are this app’s own organization, not CDC’s.</p>
      {(adapted || (g && g.display !== g.source)) && (
        <details class="original-wording" data-testid="activity-original">
          <summary class="xsmall text-link">{corrected ? 'Wording adapted to be gender-neutral, with one typing correction' : 'Wording adapted to be gender-neutral'}</summary>
          <p class="xsmall muted">CDC’s original wording: “{record.source}”</p>
          {corrected && <p class="xsmall muted">Typing correction: “{record.corrections![0]![0]}” is shown as “{record.corrections![0]![1]}”.</p>}
          {g && g.display !== g.source && <p class="xsmall muted">CDC’s original page guidance: “{g.source}”</p>}
        </details>
      )}
    </section>
  );
}

/** The full activity content (purpose, instructions, materials, safety, source) for one CDC record. */
export function ActivityBody({ activity, record, showSafety = true }: { activity: Activity; record: ActivityRecord; showSafety?: boolean }) {
  const { purpose } = splitRecord(record);
  return (
    <>
      <section class="card stack">
        <h2 class="title-3">How to do it</h2>
        <ActivityInstructions record={record} />
        {purpose.length > 0 && <p class="small" data-testid="activity-purpose"><strong>Why it helps:</strong> {purpose.join(' ')}</p>}
        {activity.materials && (
          <p class="small" data-testid="activity-materials">
            <strong>{activity.materials.every((m) => m.example) ? 'You might use' : 'You’ll need'}:</strong>{' '}
            {activity.materials.map((m) => m.phrase.replace(/,$/, '') + (m.example && !activity.materials!.every((x) => x.example) ? ' (for example)' : '')).join('; ')}
          </p>
        )}
      </section>
      {showSafety && <ActivitySafety activityId={activity.id} recordId={record.id} withSentences={false} />}
      <SourceCard record={record} adapted={record.display !== record.source} />
    </>
  );
}

export function ActivityDetailScreen({ id }: { id: string }) {
  const { activeChild } = useApp();
  const m = useMilestoneAge(activeChild);
  const a = getActivity(id);
  const [ageSel, setAgeSel] = useState<number | null>(null);
  if (!activeChild || !m.age) return null;
  if (!a) {
    return (
      <div class="card stack" data-testid="item-missing">
        <p>This activity isn’t available.</p>
        <a class="btn btn-secondary" href={href({ name: 'exerciseBrowse', age: null })}>Browse Exercises</a>
      </div>
    );
  }
  const ages = agesOf(a);
  const record = recordForAge(a, ageSel ?? ages[0]!);
  const def = browseDefault(m.age.months);
  const forChildAge = def.kind === 'age' && ages.includes(def.age);
  return (
    <div class="stack-lg" data-testid="activity-detail">
      <section class="card stack">
        <span class="badge" style={{ alignSelf: 'flex-start' }}>From CDC’s activity tips</span>
        <h2 class="title-2" data-testid="activity-title">{a.title}</h2>
        <p class="small muted" data-testid="activity-meta">{APP_CATEGORIES.find((c) => c.id === a.appCategory)!.label} · CDC lists this for {ages.map(ageOlds).join(', ')}</p>
        {!forChildAge && <p class="xsmall muted" data-testid="age-differs">This is listed for a different age than the age {childNameInline(activeChild)}’s milestones use. You know {childNameInline(activeChild)} best.</p>}
        {ages.length > 1 && (
          <div class="segmented" role="group" aria-label="CDC age">
            {ages.map((x) => <button key={x} type="button" aria-pressed={record.referenceAgeMonths === x} onClick={() => setAgeSel(x)}>{ageName(x)}</button>)}
          </div>
        )}
        <a class="btn btn-primary btn-block" href={href({ name: 'exerciseNew', activity: `${a.id}~${record.id}` })} data-testid="add-to-my-exercises"><Icon name="plus" size={18} /> Add to My Exercises</a>
      </section>
      <ActivityBody activity={a} record={record} />
    </div>
  );
}

export const ACTIVITY_COUNT = ACTIVITIES.length;
