import { Fragment } from 'preact';
import { useApp } from '../../../state/app';
import { ageBetween, correctedAge, formatBeforeDueDate, formatPreciseAge } from '../../../domain/age';
import { useToday } from '../../../state/today';
import { formatLongDate } from '../../../domain/dates';
import { Avatar, childDisplayName } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { PlaceholderCard } from '../../components/Placeholder';
import { href } from '../../../router';
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
        <div class="row-between section-title">
          <h2 class="title-2">Quick actions</h2>
          <span class="placeholder-tag">
            <Icon name="clock" size={14} /> Not available yet
          </span>
        </div>
        <div class="quick-actions" aria-label="Quick actions — not available yet">
          {[
            ['sprout', 'Record a milestone', 2],
            ['notebook', 'Journal entry', 4],
            ['calendar', 'New event', 3],
          ].map(([icon, label, cp]) => (
            <div class="quick-action" key={label as string} aria-disabled="true">
              <Icon name={icon as 'sprout'} />
              <span>{label}</span>
              <span class="xsmall" style={{ fontWeight: 500 }}>Checkpoint {cp}</span>
            </div>
          ))}
        </div>
      </div>

      <div class="section">
        <h2 class="title-2 section-title">Coming next</h2>
        <PlaceholderCard icon="sprout" title="Milestone progress" checkpoint={2}>
          See the milestones you’ve recorded across five areas of development.
        </PlaceholderCard>
        <PlaceholderCard icon="calendar" title="Coming up" checkpoint={3}>Appointments and activities for the days ahead.</PlaceholderCard>
        <PlaceholderCard icon="sparkles" title="Recent milestones" checkpoint={2}>Moments you’ve recently recorded.</PlaceholderCard>
        <PlaceholderCard icon="heart" title="Daily encouragement" checkpoint={4}>
          A gentle note for each day.
        </PlaceholderCard>
      </div>
    </div>
  );
}
