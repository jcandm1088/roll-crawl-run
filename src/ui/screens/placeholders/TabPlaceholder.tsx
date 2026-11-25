import { PlaceholderCard } from '../../components/Placeholder';
import type { IconName } from '../../components/Icon';

/**
 * Temporary previews for tabs built in later checkpoints. The intro line is
 * intended final wording; the cards and banner are temporary and are removed
 * when each feature is built.
 */
interface TabInfo {
  title: string;
  intro: string;
  checkpoint: number;
  /** Use Inter for the heading where Fraunces letterforms were reported as undesirable. */
  uiHeading?: boolean;
  items: Array<[IconName, string, string]>;
}

const TABS: Record<'growth' | 'calendar' | 'journal' | 'resources', TabInfo> = {
  growth: {
    title: 'Growth',
    intro: 'Tracking your developmental milestones.',
    checkpoint: 2,
    // Permanent section order (approved at the Checkpoint 1 review).
    items: [
      ['check', 'Progress', 'What you’ve recorded so far, across five areas of development.'],
      ['plus', 'Goals & Exercises', 'Your own goals and regular activities, with a record of each time you do them.'],
      ['calendar', 'What to Expect at Every Age', 'Milestones grouped by age, from birth to five years.'],
      ['bookOpen', 'Milestone Library', 'Every milestone, with where it comes from.'],
    ],
  },
  calendar: {
    title: 'Calendar',
    intro: 'Your family’s appointments and routines in one place.',
    checkpoint: 3,
    items: [
      ['calendar', 'This month at a glance', 'The Calendar tab will open straight to the current month, with today highlighted and upcoming events below.'],
      ['clock', 'Repeating events', 'Daily, weekly, and monthly routines.'],
      ['shield', 'Checkup and vaccine schedules', 'Optional general schedules for reference — never a substitute for your provider’s plan.'],
    ],
  },
  journal: {
    title: 'Journal',
    intro: 'A private space for your thoughts, and notes to share with your child’s care team.',
    checkpoint: 4,
    uiHeading: true,
    items: [
      ['heart', 'Personal Reflections', 'Personal · excluded from sharing by default.'],
      ['fileText', 'Care Notes', 'Observations and questions for appointments.'],
    ],
  },
  resources: {
    title: 'Resources',
    intro: 'A curated library of trusted, science-backed resources.',
    checkpoint: 4,
    items: [
      ['bookOpen', 'Resource library', 'Development, play, checkups, early support, and caring for yourself.'],
      ['heart', 'Daily encouragement', 'A gentle note for each day.'],
    ],
  },
};

export function TabPlaceholder({ tab }: { tab: keyof typeof TABS }) {
  const info = TABS[tab];
  return (
    <div>
      <div class="stack" style={{ margin: 'var(--space-2) var(--space-1) var(--space-5)' }}>
        <h1 class={info.uiHeading ? 'title-1 heading-ui' : 'title-1'}>{info.title}</h1>
        <p class="muted">{info.intro}</p>
      </div>
      <div class="banner neutral" role="note" style={{ marginBottom: 'var(--space-4)' }}>
        <span>
          <strong>Preview only.</strong> This tab is being built in Checkpoint {info.checkpoint}.
        </span>
      </div>
      {info.items.map(([icon, title, body]) => (
        <PlaceholderCard key={title} icon={icon} title={title} checkpoint={info.checkpoint}>
          {body}
        </PlaceholderCard>
      ))}
    </div>
  );
}
