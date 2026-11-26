import { Fragment } from 'preact';
import { useApp } from '../../../state/app';
import { ageBetween, correctedAge, formatBeforeDueDate, formatPreciseAge } from '../../../domain/age';
import { useToday } from '../../../state/today';
import { formatLongDate } from '../../../domain/dates';
import { Avatar, childDisplayName } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { PlaceholderCard } from '../../components/Placeholder';
import { href } from '../../../router';
import { useChildMilestones } from '../../../state/milestones';
import { currentProgress, getMilestone } from '../../../domain/milestones';
import { recentProgressEvents } from '../../../domain/milestoneHistory';
import { CategoryProgressList, MilestoneSafeguard, StatusBadge } from '../growth/parts';
import type { Child } from '../../../types';

/**
 * Age on Home, in plain language. The standard (chronological) age needs no
 * label. When corrected age is turned on for this child, it is shown as a
 * second, quieter line marked "corrected"; details live in the profile.
 */
/** Lets a long age wrap only between its parts ("1 year, 6 months, | 5 days"), never inside one. */
function AgeParts({ text }: { text: string }) {
  const parts = text.split(', ');
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          <span style={{ whiteSpace: 'nowrap' }}>
            {p}
            {i < parts.length - 1 ? ',' : ''}
          </span>
          {i < parts.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </>
  );
}

export function AgeSummary({ child }: { child: Child }) {
  const today = useToday(); // updates when the local date changes, including after resuming
  const chrono = formatPreciseAge(ageBetween(child.dob, today));
  const corrected = child.correctedAge.enabled ? correctedAge(child.dob, child.correctedAge.dueDate, today) : null;
  return (
    <div class="stack" style={{ marginTop: 0 }}>
      <p class="child-age" data-testid="chronological-age"><AgeParts text={chrono} /></p>
      {corrected && corrected.status !== 'notApplicable' && (
        <p class="child-age-secondary">
          <span data-testid="corrected-age"><AgeParts text={corrected.status === 'corrected' ? formatPreciseAge(corrected.age) : formatBeforeDueDate(corrected)} /></span>
          <span class="tag-mini">corrected</span>
        </p>
      )}
    </div>
  );
}

export function Home() {
  const { activeChild } = useApp();
  if (!activeChild) return null;
  return (
    <div>
      <section class="card" aria-labelledby="child-heading">
        <div class="child-hero">
          <Avatar child={activeChild} size={72} />
          <div class="grow">
            <h2 id="child-heading" class="child-name">
              {childDisplayName(activeChild)}
            </h2>
            <AgeSummary child={activeChild} />
          </div>
          <a class="icon-btn plain" href={href({ name: 'profileEdit', id: activeChild.id })} aria-label={`Edit ${childDisplayName(activeChild)}’s profile`}>
            <Icon name="pencil" size={20} />
          </a>
        </div>
        <p class="small muted" style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
          Born {formatLongDate(activeChild.dob)}
        </p>
      </section>

      <div class="section">
        <h2 class="title-2 section-title">Quick actions</h2>
        <div class="quick-actions">
          <a class="quick-action active" href={href({ name: 'growthExpect', interval: null, view: 'interval' })} data-testid="qa-record-milestone">
            <Icon name="sprout" />
            <span>Record a milestone</span>
          </a>
          {[
            ['notebook', 'Journal entry', 4],
            ['calendar', 'New event', 3],
          ].map(([icon, label, cp]) => (
            <div class="quick-action" key={label as string} aria-disabled="true" aria-label={`${label} — not available yet`}>
              <Icon name={icon as 'sprout'} />
              <span>{label}</span>
              <span class="xsmall" style={{ fontWeight: 500 }}>Checkpoint {cp}</span>
            </div>
          ))}
        </div>
      </div>

      <HomeMilestoneCards />

      <div class="section">
        <h2 class="title-2 section-title">Coming next</h2>
        <PlaceholderCard icon="calendar" title="Coming up" checkpoint={3}>Appointments and activities for the days ahead.</PlaceholderCard>
        <PlaceholderCard icon="heart" title="Daily encouragement" checkpoint={4}>
          A gentle note for each day.
        </PlaceholderCard>
      </div>
    </div>
  );
}

/** Live milestone cards on Home. Always based on the child's actual milestone age, never a previewed range. */
function HomeMilestoneCards() {
  const { activeChild } = useApp();
  const m = useChildMilestones(activeChild);
  if (!activeChild || !m.age || !m.data) return null;
  const p = currentProgress(m.age.months, m.sourcedStates);
  const recent = recentProgressEvents(m.data.events, 3);
  const labelFor = (key: string) => {
    if (key.startsWith('def:')) return getMilestone(key.slice(4))?.text ?? 'Milestone';
    return m.data!.personal.find((x) => `custom:${x.id}` === key)?.title ?? 'Your version';
  };
  const keyFor = (key: string) => (key.startsWith('def:') ? key.slice(4) : `p-${key.slice(7)}`);
  return (
    <>
      <section class="section" aria-labelledby="home-progress-title" data-testid="home-progress">
        <div class="row-between section-title">
          <h2 class="title-2" id="home-progress-title">Milestone progress</h2>
          <a class="text-link small" href={href({ name: 'growthProgress' })}>See all</a>
        </div>
        <div class="card stack">
          {p.overall.state === 'ok' ? (
            <CategoryProgressList categories={p.categories} />
          ) : (
            <p class="small muted" data-testid="home-progress-empty">
              {m.age.months === null ? 'Milestones start counting at the due date (corrected age).' : p.overall.state === 'all-hidden' ? 'All milestones for this age are hidden.' : 'Nothing to track yet at this age. The first CDC milestones are listed “by 2 months.”'}
            </p>
          )}
          <MilestoneSafeguard compact />
        </div>
      </section>

      <section class="section" aria-labelledby="home-recent-title" data-testid="home-recent">
        <h2 class="title-2 section-title" id="home-recent-title">Recent milestones</h2>
        <div class="card">
          {recent.length === 0 ? (
            <p class="small muted" data-testid="home-recent-empty">Nothing recorded yet. When you mark a milestone as emerging or achieved, it will appear here.</p>
          ) : (
            <ul class="ms-list">
              {recent.map((e) => (
                <li key={e.id}>
                  <a class="ms-item" style={{ paddingLeft: 0, paddingRight: 0 }} href={href({ name: 'growthMilestone', key: keyFor(e.recordKey) })}>
                    <span class="ms-text">{labelFor(e.recordKey)}<span class="ms-meta">{e.eventDate ? formatLongDate(e.eventDate) : ''}</span></span>
                    <StatusBadge status={e.toStatus!} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
