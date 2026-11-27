import { Fragment } from 'preact';
import { useApp } from '../../../state/app';
import { ageBetween, correctedAge, formatBeforeDueDate, formatPreciseAge } from '../../../domain/age';
import { useToday } from '../../../state/today';
import { formatLongDate } from '../../../domain/dates';
import { Avatar, childDisplayName } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { href, navigate } from '../../../router';
import { useChildMilestones } from '../../../state/milestones';
import { currentProgress, getMilestone } from '../../../domain/milestones';
import { displayTextOf } from '../../../domain/milestoneDisplay';
import { recentProgressEvents } from '../../../domain/milestoneHistory';
import { CategoryProgressList, MilestoneSafeguard, StatusBadge } from '../growth/parts';
import type { Child } from '../../../types';
import { useChildPersonal } from '../../../state/personal';
import { routineFor } from '../../../domain/schedule';
import { DailyBar } from '../personal/Tracker';
import { useChildEvents } from '../../../state/calendar';
import { homeUpcoming } from '../../../domain/calendar';
import { EventList, overlaysOf } from '../calendar/Calendar';

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
          <a class="quick-action active" href={href({ name: 'growthLibrary', preset: { view: 'now', area: null } })} data-testid="qa-record-milestone">
            <Icon name="sprout" />
            <span>Record a milestone</span>
          </a>
          <a class="quick-action active" href={href({ name: 'journal', add: true })} data-testid="qa-journal-entry">
            <Icon name="notebook" />
            <span>Journal entry</span>
          </a>
          <a class="quick-action active" href={href({ name: 'calendar', add: true })} data-testid="qa-new-event">
            <Icon name="calendar" />
            <span>New event</span>
          </a>
        </div>
      </div>

      <HomeTodaysExercises />

      <HomeMilestoneCards />

      <HomeComingUp />
    </div>
  );
}

/** The next few calendar events (parent-entered only; the same overlay choices as the Calendar). */
function HomeComingUp() {
  const { activeChild, settings } = useApp();
  const today = useToday();
  const { events } = useChildEvents(activeChild);
  if (!activeChild || events === null) return null;
  const next = homeUpcoming(events, overlaysOf(settings.layers), today);
  return (
    <div class="section" data-testid="home-coming-up">
      <h2 class="title-2 section-title">Upcoming Appointments</h2>
      {next.length === 0 ? (
        <div class="card"><p class="small muted">No upcoming events.</p></div>
      ) : (
        <EventList events={next} today={today} showDate onOpen={() => navigate({ name: 'calendar' })} testId="home-events" />
      )}
      <p class="small" style={{ margin: 'var(--space-3) var(--space-1) 0' }}><a class="text-link" href={href({ name: 'calendar' })} data-testid="home-open-calendar">Open Calendar</a></p>
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
    if (key.startsWith('def:')) { const d = getMilestone(key.slice(4)); return d ? displayTextOf(d) : 'Milestone'; }
    return m.data!.personal.find((x) => `custom:${x.id}` === key)?.title ?? 'Personal entry';
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
              {m.age.months === null ? 'Milestones start counting at the due date (corrected age).' : p.overall.state === 'all-hidden' ? 'All milestones for this age are hidden.' : 'Nothing to track yet at this age. The first milestones are listed “by 2 months.”'}
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

/**
 * Today's exercises (Checkpoint 2b, D13): shown only when the selected child has scheduled sessions today.
 * Same calculation and records as Today's routine on the Exercises page — no separate tracking.
 */
function HomeTodaysExercises() {
  const { activeChild } = useApp();
  const p = useChildPersonal(activeChild);
  if (!activeChild || !p.data) return null;
  const r = routineFor(p.data.exercises, p.data.sessions, p.today);
  if (r.scheduledCount === 0) return null;
  return (
    <section class="section" aria-labelledby="home-exercises-title" data-testid="home-exercises">
      <h2 class="title-2 section-title" id="home-exercises-title">Today’s exercises</h2>
      <div class="card stack">
        <DailyBar done={r.doneCount} scheduled={r.scheduledCount} />
        <a class="btn btn-secondary btn-block" href={href({ name: 'exercises', focus: 'today' })} data-testid="view-todays-routine">View today’s routine</a>
      </div>
    </section>
  );
}
