import { useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { keyFromTarget, useChildMilestones } from '../../../state/milestones';
import { href, navigate } from '../../../router';
import { INTERVALS } from '../../../domain/intervals';
import {
  APP_CATEGORIES, MILESTONES, appCategoryLabel, cumulativeThroughInterval, currentProgress, intervalOf, intervalProgress, isApplicable,
  isEmptyInterval, milestonesInInterval, neighbouringReferenceIntervals, referenceAgeLabel, type AppCategory, type MilestoneDef, type MilestoneStatus,
} from '../../../domain/milestones';
import { PageHeader } from '../../components/PageHeader';
import { Icon, type IconName } from '../../components/Icon';
import { PlannedTag } from '../../components/Placeholder';
import { Accordion } from '../../components/Accordion';
import { childNameInline } from '../../components/Avatar';
import { AgeBasisPanel, CategoryProgressList, ForChild, MilestoneSafeguard, OlderThanFiveNote, ProgressLine, StatusBadge } from './parts';
import type { PersonalMilestone } from '../../../types';

// ---------------------------------------------------------------------------
// Growth landing page — four sections in the approved order.
// ---------------------------------------------------------------------------

function SectionLink({ to, icon, title, detail, testId }: { to: string; icon: IconName; title: string; detail: string; testId: string }) {
  return (
    <a class="card section-link" href={to} data-testid={testId}>
      <span class="icon-wrap"><Icon name={icon} /></span>
      <span class="grow">
        <span class="title-3" style={{ display: 'block' }}>{title}</span>
        <span class="small muted">{detail}</span>
      </span>
      <span class="chev"><Icon name="chevronRight" size={20} /></span>
    </a>
  );
}

export function GrowthHome() {
  const { activeChild } = useApp();
  const m = useChildMilestones(activeChild);
  if (!activeChild || !m.age) return null;
  const overall = currentProgress(m.age.months, m.sourcedStates).overall;
  const progressDetail =
    overall.state === 'ok' ? `${overall.achieved} of ${overall.applicable} achieved so far` : overall.state === 'all-hidden' ? 'All current milestones are hidden' : 'Nothing to track yet at this age';
  return (
    <div>
      <PageHeader title="Growth" intro="Tracking your developmental milestones." />
      <ForChild child={activeChild} />
      <div class="stack" data-testid="growth-sections">
        <SectionLink to={href({ name: 'growthProgress' })} icon="chart" title="Progress" detail={progressDetail} testId="section-progress" />
        <section class="card placeholder" aria-label="Goals & Exercises — not available yet" data-testid="section-goals">
          <div class="row" style={{ alignItems: 'flex-start' }}>
            <span class="muted"><Icon name="target" /></span>
            <div class="grow stack" style={{ marginTop: 0 }}>
              <h3 class="title-3">Goals & Exercises</h3>
              <p class="small muted">Your own goals and regular activities, with a record of each time you do them.</p>
              <PlannedTag checkpoint="2b" />
            </div>
          </div>
        </section>
        <SectionLink to={href({ name: 'growthExpect', interval: null, view: 'interval' })} icon="map" title="What to Expect at Every Age" detail={`Now showing ${m.currentInterval.label}`} testId="section-expect" />
        <SectionLink to={href({ name: 'growthLibrary' })} icon="bookOpen" title="Milestone Library" detail={`${MILESTONES.length} milestones from CDC`} testId="section-library" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function ProgressScreen() {
  const { activeChild } = useApp();
  const m = useChildMilestones(activeChild);
  if (!activeChild || !m.age) return null;
  const p = currentProgress(m.age.months, m.sourcedStates);
  return (
    <div>
      <ForChild child={activeChild} />
      <div class="card"><AgeBasisPanel child={activeChild} age={m.age} corrected={m.corrected} today={m.today} /></div>
      <div class="section"><MilestoneSafeguard /></div>
      <OlderThanFiveNote months={m.age.months} />
      <section class="card section" aria-labelledby="progress-up-to-now">
        <h2 class="title-2" id="progress-up-to-now">Up to now</h2>
        <p class="small muted" style={{ margin: '4px 0 var(--space-4)' }}>CDC milestones for {m.age.months === null ? 'this age' : `${m.age.months} months and younger`}, as you’ve recorded them.</p>
        <ProgressLine p={p.overall} label="All areas" />
        <div style={{ borderTop: '1px solid var(--border)', margin: 'var(--space-4) 0', paddingTop: 'var(--space-4)' }}>
          <CategoryProgressList categories={p.categories} />
        </div>
        <p class="xsmall muted">Your personal versions aren’t included here.</p>
      </section>
      <Accordion title="How is this calculated?" testId="acc-how">
        <div class="panel-pad stack small">
          <p>For each area, we count the CDC milestones that apply to {childNameInline(activeChild)}’s milestone age — those listed for that age or younger — and show how many you’ve marked <strong>Achieved</strong>.</p>
          <p><strong>Achieved ÷ milestones that apply.</strong> Emerging milestones are shown separately and don’t count as achieved. Milestones for older ages aren’t counted until {childNameInline(activeChild)} reaches them, even if you record them early. Hidden milestones and your personal versions aren’t counted.</p>
          <p>When nothing applies yet, or everything that applies is hidden, we show that instead of a percentage.</p>
          <p>This reflects only what you’ve recorded. It isn’t a measure of development or health, and it isn’t a screening.</p>
        </div>
      </Accordion>
    </div>
  );
}

// ---------------------------------------------------------------------------
// What to Expect at Every Age
// ---------------------------------------------------------------------------

type StatusFilter = 'all' | MilestoneStatus;
const STATUS_FILTERS: Array<[StatusFilter, string]> = [['all', 'All'], ['not-yet', 'Not yet observed'], ['emerging', 'Emerging'], ['achieved', 'Achieved']];

function MilestoneList({ defs, statusOf, applicableAt, childName }: { defs: MilestoneDef[]; statusOf: (id: string) => MilestoneStatus; applicableAt: number | null; childName: string }) {
  const ages = [...new Set(defs.map((d) => d.referenceAgeMonths))].sort((a, b) => a - b);
  return (
    <div>
      {ages.map((age) => (
        <section key={age} aria-label={referenceAgeLabel(age)}>
          <h3 class="ms-group-title">{referenceAgeLabel(age)}{!isApplicable({ referenceAgeMonths: age }, applicableAt) && <span class="xsmall" style={{ fontWeight: 500 }}> · upcoming for {childName}</span>}</h3>
          <ul class="ms-list card list-card">
            {defs.filter((d) => d.referenceAgeMonths === age).map((d) => (
              <li key={d.id}>
                <a class="ms-item" href={href({ name: 'growthMilestone', key: d.id })} data-testid="milestone-row" data-id={d.id}>
                  <span class="ms-text">
                    {d.text}
                    <span class="ms-meta">{appCategoryLabel(d.appCategory)}</span>
                  </span>
                  <StatusBadge status={statusOf(d.id)} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function ExpectScreen({ interval, view }: { interval: number | null; view: 'interval' | 'all' }) {
  const { activeChild } = useApp();
  const m = useChildMilestones(activeChild);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [catFilter, setCatFilter] = useState<AppCategory | 'all'>('all');
  if (!activeChild || !m.age) return null;
  const name = childNameInline(activeChild);
  const current = m.currentInterval.index;
  const selected = interval ?? current;
  const iv = INTERVALS[selected]!;
  const isPreview = selected !== current;
  const statusOf = (id: string): MilestoneStatus => m.sourcedStates.get(id)?.status ?? 'not-yet';
  const hiddenIds = new Set([...m.sourcedStates].filter(([, s]) => s.hidden).map(([id]) => id));
  const visible = (d: MilestoneDef) => !hiddenIds.has(d.id);

  const header = (
    <>
      <ForChild child={activeChild} />
      <p class="small" style={{ margin: '0 var(--space-1) var(--space-4)' }} data-testid="milestone-age-line">
        Age used for milestones:{' '}
        <strong>{m.age.months === null ? 'not yet (before due date)' : `${m.age.months} month${m.age.months === 1 ? '' : 's'}`}</strong>{' '}
        <span class="muted">({activeChild.correctedAge.enabled && activeChild.ageBasis === 'corrected' ? 'corrected' : 'chronological'})</span>
      </p>
      <div class="segmented" role="group" aria-label="View" style={{ marginBottom: 'var(--space-4)' }}>
        <button type="button" aria-pressed={view === 'interval'} onClick={() => navigate({ name: 'growthExpect', interval, view: 'interval' })}>By age range</button>
        <button type="button" aria-pressed={view === 'all'} onClick={() => navigate({ name: 'growthExpect', interval: null, view: 'all' })}>Everything up to now</button>
      </div>
    </>
  );

  if (view === 'all') {
    const upToNow = MILESTONES.filter((d) => visible(d) && isApplicable(d, m.age!.months));
    const shown = upToNow.filter((d) => (statusFilter === 'all' || statusOf(d.id) === statusFilter) && (catFilter === 'all' || d.appCategory === catFilter));
    return (
      <div>
        {header}
        <MilestoneSafeguard compact />
        <div class="section stack">
          <div class="chips" role="group" aria-label="Status">
            {STATUS_FILTERS.map(([v, l]) => <button type="button" key={v} class="chip" aria-pressed={statusFilter === v} onClick={() => setStatusFilter(v)}>{l}</button>)}
          </div>
          <div class="chips" role="group" aria-label="Area">
            <button type="button" class="chip" aria-pressed={catFilter === 'all'} onClick={() => setCatFilter('all')}>All areas</button>
            {APP_CATEGORIES.map((c) => <button type="button" key={c.id} class="chip" aria-pressed={catFilter === c.id} onClick={() => setCatFilter(c.id)}>{c.label}</button>)}
          </div>
        </div>
        <p class="small muted" style={{ margin: 'var(--space-4) var(--space-1) 0' }} data-testid="result-count">
          {upToNow.length === 0 ? 'No CDC milestones apply yet at this age.' : `Showing ${shown.length} of ${upToNow.length} milestones that apply now.`}
        </p>
        <MilestoneList defs={shown} statusOf={statusOf} applicableAt={m.age.months} childName={name} />
      </div>
    );
  }

  const inInterval = milestonesInInterval(selected);
  const visibleInInterval = inInterval.filter(visible);
  const hiddenHere = inInterval.length - visibleInInterval.length;
  const ip = intervalProgress(selected, m.sourcedStates).overall;
  const cp = cumulativeThroughInterval(selected, m.sourcedStates).overall;
  const empty = isEmptyInterval(selected);
  const near = neighbouringReferenceIntervals(selected);
  const personalHere = (m.data?.personal ?? []).filter((p: PersonalMilestone) =>
    p.referenceAgeMonths === null ? empty : intervalOf({ referenceAgeMonths: p.referenceAgeMonths }).index === selected,
  );

  return (
    <div>
      {header}
      <div class="field">
        <label class="label" for="interval-select">Age range</label>
        <select id="interval-select" class="select" value={String(selected)} onChange={(e) => navigate({ name: 'growthExpect', interval: Number((e.target as HTMLSelectElement).value), view: 'interval' })}>
          {INTERVALS.map((x) => <option key={x.index} value={String(x.index)}>{x.label}{x.index === current ? ' (current)' : ''}</option>)}
        </select>
      </div>
      {isPreview && (
        <div class="banner neutral" role="status" style={{ marginTop: 'var(--space-3)' }} data-testid="preview-banner">
          <Icon name="eye" size={18} />
          <span class="grow">
            Previewing {iv.label}. This doesn’t change {name}’s age, saved preferences, or progress on Home.
            <button type="button" class="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-2)', display: 'flex' }} onClick={() => navigate({ name: 'growthExpect', interval: null, view: 'interval' })}>
              Back to current age
            </button>
          </span>
        </div>
      )}
      <OlderThanFiveNote months={m.age.months} />

      <section class="card section" aria-label="Progress for this range" data-testid="interval-summary">
        <ProgressLine p={ip} label={`In ${iv.label}`} />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <ProgressLine p={cp} label={`Cumulative, up to ${iv.endMonths} months`} />
        </div>
        <p class="xsmall muted" style={{ marginTop: 'var(--space-3)' }}>These describe this range only. {name}’s current progress is on the Progress screen.</p>
      </section>

      {empty ? (
        <section class="card section stack" data-testid="empty-interval">
          <h2 class="title-3">No new milestones in this range</h2>
          <p class="small muted">CDC hasn’t published milestones for {iv.label}. Earlier milestones still count, and the next ones are listed further on.</p>
          <div class="stack">
            {near.previous && (
              <button type="button" class="btn btn-outline btn-block" onClick={() => navigate({ name: 'growthExpect', interval: near.previous!.index, view: 'interval' })}>
                <Icon name="chevronLeft" size={18} /> Earlier: {referenceAgeLabel(Math.max(...milestonesInInterval(near.previous.index).map((d) => d.referenceAgeMonths)))}
              </button>
            )}
            {near.next && (
              <button type="button" class="btn btn-outline btn-block" onClick={() => navigate({ name: 'growthExpect', interval: near.next!.index, view: 'interval' })}>
                Next: {referenceAgeLabel(Math.min(...milestonesInInterval(near.next.index).map((d) => d.referenceAgeMonths)))} <Icon name="chevronRight" size={18} />
              </button>
            )}
            <a class="btn btn-ghost btn-block" href={href({ name: 'growthExpect', interval: null, view: 'all' })}>See everything up to now</a>
          </div>
        </section>
      ) : (
        <MilestoneList defs={visibleInInterval} statusOf={statusOf} applicableAt={m.age.months} childName={name} />
      )}
      {hiddenHere > 0 && <p class="small muted" style={{ margin: 'var(--space-3) var(--space-1)' }}>{hiddenHere} hidden in this range. <a class="text-link" href={href({ name: 'growthLibrary' })}>Manage in the Milestone Library</a></p>}
      {personalHere.length > 0 && (
        <section class="section" aria-label="Your versions">
          <h3 class="ms-group-title">Your versions</h3>
          <ul class="ms-list card list-card">
            {personalHere.map((p) => {
              const rec = m.recordFor({ kind: 'personal', customId: p.id });
              return (
                <li key={p.id}>
                  <a class="ms-item" href={href({ name: 'growthMilestone', key: keyFromTarget({ kind: 'personal', customId: p.id }) })}>
                    <span class="ms-text">{p.title}<span class="ms-meta">Your version</span></span>
                    <StatusBadge status={rec?.status ?? 'not-yet'} />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
