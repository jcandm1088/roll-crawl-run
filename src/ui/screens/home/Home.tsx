import { useApp } from '../../../state/app';
import { ageBetween, correctedAge, formatAge, formatBeforeDueDate } from '../../../domain/age';
import { formatLongDate, todayLocal } from '../../../domain/dates';
import { Avatar, childDisplayName } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { PlaceholderCard } from '../../components/Placeholder';
import { href } from '../../../router';
import type { Child } from '../../../types';

export function AgeSummary({ child }: { child: Child }) {
  const today = todayLocal();
  const chrono = formatAge(ageBetween(child.dob, today));
  const corrected = child.correctedAge.enabled ? correctedAge(child.dob, child.correctedAge.dueDate, today) : null;
  return (
    <div class="stack" style={{ marginTop: 0 }}>
      <div class="age-line">
        <span class="age-value" data-testid="chronological-age">{chrono}</span>
        <span class="xsmall muted">Chronological age</span>
      </div>
      {corrected && corrected.status !== 'notApplicable' && (
        <div class="age-line">
          <span class="age-value" style={{ fontSize: 'var(--text-lg)' }} data-testid="corrected-age">
            {corrected.status === 'corrected' ? formatAge(corrected.age) : formatBeforeDueDate(corrected)}
          </span>
          <span class="xsmall muted">Corrected age</span>
        </div>
      )}
      {child.correctedAge.enabled && (
        <p class="xsmall muted">
          Milestone viewing will use <strong>{child.ageBasis === 'corrected' ? 'corrected' : 'chronological'} age</strong>.
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
            <h2 id="child-heading" class="title-1" style={{ fontSize: 'var(--text-xl)' }}>
              {childDisplayName(activeChild)}
            </h2>
            <p class="small muted">Born {formatLongDate(activeChild.dob)}</p>
          </div>
          <a class="icon-btn plain" href={href({ name: 'profileEdit', id: activeChild.id })} aria-label={`Edit ${childDisplayName(activeChild)}’s profile`}>
            <Icon name="pencil" size={20} />
          </a>
        </div>
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
          <AgeSummary child={activeChild} />
        </div>
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
          Progress meters for the five developmental categories, based only on what you record.
        </PlaceholderCard>
        <PlaceholderCard icon="calendar" title="Upcoming appointments & activities" checkpoint={3} />
        <PlaceholderCard icon="sparkles" title="Recent achievements" checkpoint={2} />
        <PlaceholderCard icon="heart" title="Daily encouragement" checkpoint={4}>
          Original encouraging messages, written for your review before they are added.
        </PlaceholderCard>
      </div>
    </div>
  );
}
