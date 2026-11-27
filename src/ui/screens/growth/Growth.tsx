import { useApp } from '../../../state/app';
import { useChildMilestones, useMilestoneAge } from '../../../state/milestones';
import { href, navigate } from '../../../router';
import { INTERVALS } from '../../../domain/intervals';
import { currentProgress, progressByReferenceAge, type AppCategory } from '../../../domain/milestones';
import { GUIDE, bareAge, guideFor, inlineAge, type GuideRange, type NeighbourAge } from '../../../domain/guide';
import { viewCounts } from '../../../domain/library';
import { ageBetween, formatPreciseAge } from '../../../domain/age';
import { PageHeader } from '../../components/PageHeader';
import { Icon, type IconName } from '../../components/Icon';
import { PlannedTag } from '../../components/Placeholder';
import { Accordion } from '../../components/Accordion';
import { childNameInline } from '../../components/Avatar';
import { AgeBasisPanel, CDC_CONCERNED_URL, CDC_MILESTONES_URL, CategoryProgressList, ExternalLink, ForChild, MilestoneSafeguard, OlderThanFiveNote, ProgressLine, SourceNote } from './parts';
import { displayTextOf } from '../../../domain/milestoneDisplay';
import { PAGE_SOURCES } from '../../../domain/milestones';
import type { Child } from '../../../types';

// ---------------------------------------------------------------------------
// Growth landing page — Review → Record → Support → Learn (owner-approved order and subtitles).
// ---------------------------------------------------------------------------

export const GROWTH_SECTIONS = [
  { title: 'Progress', subtitle: 'See how far we’ve come.' },
  { title: 'Milestone Library', subtitle: 'Record what we’ve accomplished.' },
  { title: 'Goals & Exercises', subtitle: 'Know what to work on.' },
  { title: 'What to Expect at Every Age', subtitle: 'Learn what’s ahead.' },
] as const;

function SectionLink({ to, icon, index, live, testId }: { to: string; icon: IconName; index: number; live: string; testId: string }) {
  const s = GROWTH_SECTIONS[index]!;
  return (
    <a class="card section-link" href={to} data-testid={testId}>
      <span class="icon-wrap"><Icon name={icon} /></span>
      <span class="grow">
        <span class="title-3" style={{ display: 'block' }}>{s.title}</span>
        <span class="small section-subtitle" data-testid="section-subtitle">{s.subtitle}</span>
        <span class="xsmall muted" style={{ display: 'block' }} data-testid="section-live">{live}</span>
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
  const counts = viewCounts(m.age.months, m.sourcedStates);
  const progressLive = overall.state === 'ok' ? `${overall.achieved} of ${overall.applicable} recorded as achieved` : overall.state === 'all-hidden' ? 'All current milestones are hidden' : 'Nothing to track yet at this age';
  const libraryLive = counts.now === 0 ? 'No milestones apply yet' : `${counts.now} milestone${counts.now === 1 ? '' : 's'} apply now`;
  const goals = GROWTH_SECTIONS[2];
  return (
    <div>
      <PageHeader title="Growth" intro="Tracking your developmental milestones." />
      <ForChild child={activeChild} />
      <div class="stack" data-testid="growth-sections">
        <SectionLink to={href({ name: 'growthProgress' })} icon="chart" index={0} live={progressLive} testId="section-progress" />
        <SectionLink to={href({ name: 'growthLibrary', preset: { view: 'now', area: null } })} icon="bookOpen" index={1} live={libraryLive} testId="section-library" />
        <section class="card placeholder" aria-label={`${goals.title} — coming soon`} data-testid="section-goals">
          <div class="row" style={{ alignItems: 'flex-start' }}>
            <span class="muted"><Icon name="target" /></span>
            <div class="grow stack" style={{ marginTop: 0 }}>
              <h3 class="title-3">{goals.title}</h3>
              <p class="small section-subtitle" data-testid="section-subtitle">{goals.subtitle}</p>
              <PlannedTag />
            </div>
          </div>
        </section>
        <SectionLink to={href({ name: 'growthExpect', interval: null })} icon="map" index={3} live={`Now: ${m.currentInterval.label}`} testId="section-expect" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress — review only. Calculated automatically; no editing controls.
// ---------------------------------------------------------------------------

export function ProgressScreen() {
  const { activeChild } = useApp();
  const m = useChildMilestones(activeChild);
  if (!activeChild || !m.age) return null;
  const name = childNameInline(activeChild);
  const p = currentProgress(m.age.months, m.sourcedStates);
  const byAge = progressByReferenceAge(m.age.months, m.sourcedStates);
  const libraryFor = (area: AppCategory | null) => href({ name: 'growthLibrary', preset: { view: 'now', area } });
  const hasPersonal = (m.data?.personal.length ?? 0) > 0;
  return (
    <div>
      <ForChild child={activeChild} />
      <OlderThanFiveNote months={m.age.months} />
      <section class="card section" aria-labelledby="progress-headline" data-testid="progress-headline">
        <h2 class="title-2" id="progress-headline">Milestones recorded as achieved</h2>
        <p class="small muted" style={{ margin: '4px 0 var(--space-4)' }} data-testid="progress-scope">
          {m.age.months === null
            ? `${name}’s due date hasn’t arrived yet, so no milestones are counted using corrected age.`
            : `Milestones for ${m.age.months} month${m.age.months === 1 ? '' : 's'} and younger, as you’ve recorded them.`}
        </p>
        <ProgressLine p={p.overall} label="All areas" />
        {p.overall.state === 'none-applicable' && m.age.months !== null && (
          <p class="small muted" style={{ marginTop: 'var(--space-2)' }}>The first milestones are listed “by 2 months.”</p>
        )}
      </section>

      <section class="card section stack" aria-labelledby="what-updates" data-testid="what-updates">
        <h2 class="title-3" id="what-updates">What updates Progress?</h2>
        <ul class="plain-list small">
          <li><Icon name="check" size={16} /> <span>Marking a milestone <strong>Achieved</strong> in the Milestone Library, if it applies to {name} now and isn’t hidden.</span></li>
          <li><Icon name="info" size={16} /> <span>Emerging milestones are shown separately and don’t count as achieved.</span></li>
          <li><Icon name="info" size={16} /> <span>Upcoming milestones count once {name} reaches their age. Hidden milestones aren’t counted{hasPersonal ? ', and neither are your personal entries' : ''}.</span></li>
          <li><Icon name="info" size={16} /> <span>Reading What to Expect doesn’t change Progress.</span></li>
        </ul>
        <a class="btn btn-secondary btn-block" href={libraryFor(null)} data-testid="record-in-library">Record in the Milestone Library</a>
      </section>

      <section class="card section" aria-labelledby="by-area">
        <h2 class="title-3" id="by-area">By area</h2>
        <p class="xsmall muted" style={{ margin: '4px 0 var(--space-3)' }}>Tap an area to see its milestones in the Milestone Library.</p>
        <CategoryProgressList categories={p.categories} linkFor={(c) => libraryFor(c)} />
      </section>

      <div class="section"><MilestoneSafeguard /></div>

      <Accordion title="By age" testId="acc-by-age">
        <div class="panel-pad stack small" data-testid="by-age">
          <p class="muted">Only ages that apply to {name} now are shown.</p>
          {byAge.length === 0 ? (
            <p>No ages apply yet.</p>
          ) : (
            <ul class="plain-list">
              {[...byAge].reverse().map((a) => (
                <li key={a.referenceAgeMonths} class="row-between" data-testid="by-age-row" data-age={a.referenceAgeMonths}>
                  <span>{a.label}</span>
                  <span class="progress-figure">{a.progress.state === 'ok' ? `${a.progress.achieved} of ${a.progress.applicable} achieved` : 'All hidden'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Accordion>
      <Accordion title="How is this calculated?" testId="acc-how">
        <div class="panel-pad stack small">
          <p>For each area, we count the milestones that apply to {name}’s milestone age — those listed for that age or younger — and show how many you’ve marked <strong>Achieved</strong>.</p>
          <p><strong>Achieved ÷ milestones that apply.</strong> Emerging milestones are shown separately and don’t count as achieved. Milestones for older ages aren’t counted until {name} reaches them, even if you record them early. Hidden milestones aren’t counted{hasPersonal ? ', and neither are your personal entries' : ''}.</p>
          <p>When nothing applies yet, or everything that applies is hidden, we show that instead of a percentage.</p>
          <p>This reflects only what you’ve recorded. It isn’t a measure of development or health, and it isn’t a screening.</p>
        </div>
      </Accordion>
      <div class="card section stack" data-testid="age-basis-card">
        <AgeBasisPanel child={activeChild} age={m.age} corrected={m.corrected} today={m.today} />
        <AgeSettingsNote child={activeChild} />
      </div>
      <SourceNote />
      <p class="small muted" style={{ margin: 'var(--space-4) var(--space-1)' }} data-testid="coming-soon-note">
        Charts of your records over time, and progress on your own goals and activities, are coming soon.
      </p>
    </div>
  );
}

/**
 * R-008: how to change the age used for milestones, with a direct link to this child's profile
 * settings. Navigation only — nothing about age calculation or preferences changes here.
 */
function AgeSettingsNote({ child }: { child: Child }) {
  const name = childNameInline(child);
  return (
    <div class="stack small" data-testid="age-settings-note">
      <p class="muted">
        {child.correctedAge.enabled
          ? `You can change whether milestones are based on chronological or corrected age in ${name}’s profile settings.`
          : `Milestones are based on chronological age. If ${name} was born early, you can turn on corrected age in ${name}’s profile settings.`}
      </p>
      <a class="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} href={href({ name: 'profileEdit', id: child.id, section: 'age' })} data-testid="manage-age-settings">
        Manage age settings
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// What to Expect at Every Age — exclusively informational, read-only guide.
// It uses only the child's milestone AGE (to choose the starting range) and never loads or
// writes milestone records. All content comes from guideFor(), which takes no records.
// ---------------------------------------------------------------------------

function GuideAgeLine({ child, months, today }: { child: Child; months: number | null; today: string }) {
  const name = childNameInline(child);
  const usingCorrected = child.correctedAge.enabled && child.ageBasis === 'corrected';
  if (months === null) {
    return (
      <div class="guide-age" data-testid="milestone-age-line">
        <p class="small">Age used for milestones: <strong>Before due date</strong></p>
        <p class="xsmall muted" data-testid="pre-due-note">{name}’s due date hasn’t arrived yet. No milestones are counted as applicable using corrected age at this time. You can still explore the developmental guide.</p>
      </div>
    );
  }
  return (
    <div class="guide-age" data-testid="milestone-age-line">
      <p class="small">
        Age used for milestones: <strong>{months} month{months === 1 ? '' : 's'}</strong> <span class="muted">({usingCorrected ? 'corrected' : 'chronological'})</span>
      </p>
      {usingCorrected && (
        <p class="xsmall muted" data-testid="corrected-note">
          Chronological age: {formatPreciseAge(ageBetween(child.dob, today))}. Corrected age is counted from {name}’s due date instead of birth date. You chose to use it for milestones in {name}’s profile.
        </p>
      )}
      {months > 60 && (
        <p class="xsmall muted" data-testid="over-five-note">The milestone checklists end at age 5, so there are no milestones after “by 5 years.” The guide opens at 57–60 months, the last range.</p>
      )}
    </div>
  );
}

function NeighbourCard({ kind, n }: { kind: 'previous' | 'next'; n: NeighbourAge }) {
  return (
    <div class="card neighbour-card" data-testid={`neighbour-${kind}`}>
      <span class="grow">
        <span class="small" style={{ display: 'block', fontWeight: 600 }}>{kind === 'previous' ? 'Most recent milestone age' : 'Next milestone age'}: {inlineAge(n.referenceAgeMonths)}</span>
        <span class="xsmall muted">Shown in {n.interval.label}</span>
      </span>
      <button type="button" class="btn btn-outline btn-sm" onClick={() => navigate({ name: 'growthExpect', interval: n.interval.index })} aria-label={`Open ${n.interval.label}`}>
        Open <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}

function GuideBody({ g }: { g: GuideRange }) {
  const s = GUIDE.shared;
  return (
    <>
      <h2 class="title-2 guide-range-title" data-testid="guide-range-title">{g.interval.label}</h2>
      {g.kind === 'empty' ? (
        <section class="stack" data-testid="empty-interval">
          <p class="guide-text">
            There’s no milestone checklist for this range: CDC’s checklists go from {bareAge(g.previous.referenceAgeMonths)} to {bareAge(g.next.referenceAgeMonths)}, so
            the app doesn’t add any milestones here. For a child in this range, the most recent milestones are the ones listed “{inlineAge(g.previous.referenceAgeMonths)}.”
          </p>
          <NeighbourCard kind="previous" n={g.previous} />
          <NeighbourCard kind="next" n={g.next} />
        </section>
      ) : (
        <>
          <p class="small muted" data-testid="range-includes">
            This range includes the {g.referenceAges.map((a, i) => <span key={a}>{i > 0 && ' and '}“{inlineAge(a)}”</span>)} milestones.
          </p>
          <section class="guide-overview" aria-labelledby="overview-title" data-testid="guide-overview">
            <h3 class="title-3" id="overview-title">Overview</h3>
            <p class="guide-text">{g.overview.text}</p>
            <p class="xsmall muted">{s.overviewLabel}</p>
          </section>
          {g.groups.map((grp) => (
            <section key={grp.referenceAgeMonths} class="guide-age-group" aria-label={grp.label} data-testid="guide-age-group" data-age={grp.referenceAgeMonths}>
              <h3 class="title-3 guide-age-title">{grp.label}</h3>
              {grp.areas.map((a) => (
                <div key={a.category} class="guide-area" data-testid="guide-area" data-category={a.category}>
                  <h4 class="guide-area-title">{a.label}</h4>
                  {a.explanation && <p class="small muted guide-area-explain">{a.explanation}</p>}
                  {a.milestones.length > 0 ? (
                    <ul class="guide-milestones">
                      {a.milestones.map((d) => <li key={d.id} data-testid="guide-milestone" data-id={d.id}>{displayTextOf(d)}</li>)}
                    </ul>
                  ) : (
                    <p class="xsmall muted" data-testid="area-empty-note">No “{inlineAge(grp.referenceAgeMonths)}” milestones are in this area.</p>
                  )}
                </div>
              ))}
            </section>
          ))}
          <section class="card section stack small" aria-label="About gross and fine motor" data-testid="motor-note">
            <h3 class="title-3">About gross and fine motor</h3>
            {s.motor.paragraphs.map((t) => <p key={t}>{t}</p>)}
          </section>
          <section class="section" aria-label="Looking ahead" data-testid="looking-ahead">
            <h3 class="title-3">Looking ahead</h3>
            {g.next ? <NeighbourCard kind="next" n={g.next} /> : <p class="small" data-testid="last-age">{s.lastAge}</p>}
          </section>
        </>
      )}
      <details class="guide-details section">
        <summary class="small text-link">How the age ranges work</summary>
        {s.ranges.paragraphs.map((t) => <p key={t} class="small">{t}</p>)}
      </details>
    </>
  );
}

function GuideSources({ g }: { g: GuideRange }) {
  const pages = g.kind === 'populated' ? PAGE_SOURCES.filter((p) => g.referenceAges.includes(p.referenceAgeMonths)) : [];
  return (
    <section class="card section stack small" aria-label="Sources and safeguards" data-testid="guide-sources">
      <h3 class="title-3">Sources</h3>
      {g.kind === 'populated' ? (
        <p>
          Milestones are from the Centers for Disease Control and Prevention (CDC), “Learn the Signs. Act Early.” (
          {pages.map((p, i) => <span key={p.id}>{i > 0 && '; '}<ExternalLink url={p.url}>{p.title}</ExternalLink></span>)}), with gender-neutral wording in place of “he” and “she.” The overviews and
          explanations are written for this app from those milestones. CDC’s milestone checklists are available free at <ExternalLink url={CDC_MILESTONES_URL}>cdc.gov</ExternalLink>.
          This app is not endorsed by CDC, HHS, or the U.S. Government.
        </p>
      ) : (
        <p>
          Information about CDC’s milestone ages is from the Centers for Disease Control and Prevention (CDC), available free at <ExternalLink url={CDC_MILESTONES_URL}>cdc.gov</ExternalLink>.
          This app is not endorsed by CDC, HHS, or the U.S. Government.
        </p>
      )}
      <h3 class="title-3">A note for parents</h3>
      <p data-testid="guide-safeguard">
        CDC explains that its milestone checklists aren’t developmental standards and aren’t screening or diagnostic tools. This guide doesn’t assess your child and doesn’t
        replace your child’s healthcare provider. If you have a concern about your child’s development, talk with your child’s healthcare provider. CDC’s page{' '}
        <ExternalLink url={CDC_CONCERNED_URL}>Concerned About Your Child’s Development?</ExternalLink> has more information.
      </p>
      <p class="xsmall muted">Links open cdc.gov in your browser and need an internet connection. Everything else in this guide works offline.</p>
    </section>
  );
}

export function ExpectScreen({ interval }: { interval: number | null }) {
  const { activeChild } = useApp();
  const a = useMilestoneAge(activeChild);
  if (!activeChild || !a.age) return null;
  const name = childNameInline(activeChild);
  const current = a.currentInterval.index;
  const selected = interval ?? current;
  const g = guideFor(selected);
  const isPreview = selected !== current;
  const go = (i: number) => navigate({ name: 'growthExpect', interval: i });
  return (
    <div data-testid="guide">
      <div data-testid="guide-header">
        <ForChild child={activeChild} />
        <GuideAgeLine child={activeChild} months={a.age.months} today={a.today} />
        <div class="field">
          <label class="label" for="interval-select">Age range</label>
          <select id="interval-select" class="select" value={String(selected)} onChange={(e) => go(Number((e.target as HTMLSelectElement).value))}>
            {INTERVALS.map((x) => <option key={x.index} value={String(x.index)}>{x.label}{x.index === current ? ' (current)' : ''}</option>)}
          </select>
        </div>
        <div class="row-between guide-stepper">
          <button type="button" class="btn btn-outline btn-sm" disabled={selected === 0} onClick={() => go(selected - 1)} data-testid="guide-earlier">
            <Icon name="chevronLeft" size={16} /> Earlier
          </button>
          <button type="button" class="btn btn-outline btn-sm" disabled={selected === INTERVALS.length - 1} onClick={() => go(selected + 1)} data-testid="guide-next">
            Next <Icon name="chevronRight" size={16} />
          </button>
        </div>
        {isPreview && (
          <div class="banner neutral" role="status" style={{ marginTop: 'var(--space-3)' }} data-testid="preview-banner">
            <Icon name="eye" size={18} />
            <span class="grow">
              You’re looking at {INTERVALS[selected]!.label}. Viewing the guide doesn’t change {name}’s records.
              <button type="button" class="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-2)', display: 'flex' }} onClick={() => navigate({ name: 'growthExpect', interval: null })}>
                Back to current age
              </button>
            </span>
          </div>
        )}
      </div>
      <article data-testid="guide-content">
        <section class="card section stack small" aria-label="About this guide" data-testid="guide-about">
          <h2 class="title-3">About this guide</h2>
          {GUIDE.shared.about.paragraphs.map((t) => <p key={t}>{t}</p>)}
        </section>
        <GuideBody g={g} />
        <GuideSources g={g} />
      </article>
    </div>
  );
}
