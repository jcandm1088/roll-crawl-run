import { PlaceholderCard } from '../../components/Placeholder';
import type { IconName } from '../../components/Icon';

interface TabInfo {
  title: string;
  intro: string;
  checkpoint: number;
  items: Array<[IconName, string, string]>;
}

const TABS: Record<'growth' | 'calendar' | 'journal' | 'resources', TabInfo> = {
  growth: {
    title: 'Growth',
    intro: 'Track developmental milestones in five categories, using published CDC reference ages.',
    checkpoint: 2,
    items: [
      ['sprout', 'Milestone library', 'Starter milestones from birth to five years, each with its source. Being verified before they’re added.'],
      ['calendar', 'Three-month age views', 'Browse any age range without changing your child’s profile.'],
      ['check', 'Progress meters', 'Achieved ÷ applicable milestones. A record of what you’ve noted, not a measure of health.'],
      ['plus', 'Your own goals & exercises', 'Custom goals and recurring activities with completion history.'],
    ],
  },
  calendar: {
    title: 'Calendar',
    intro: 'Your family’s appointments, routines, and reference schedules in one place.',
    checkpoint: 3,
    items: [
      ['calendar', 'Month and agenda views', 'Four layers you can turn on or off.'],
      ['clock', 'Recurring events', 'Daily, weekly, and monthly routines.'],
      ['shield', 'Care references', 'Well-child visit references, and optional vaccination references from a source you choose. Educational only.'],
    ],
  },
  journal: {
    title: 'Journal',
    intro: 'A private space for your reflections, and organized notes to share with providers.',
    checkpoint: 4,
    items: [
      ['heart', 'Personal Reflections', 'Personal · excluded from sharing by default.'],
      ['fileText', 'Care Notes', 'Observations and questions for providers.'],
    ],
  },
  resources: {
    title: 'Resources',
    intro: 'A curated library from reputable organizations, with short descriptions you can read offline.',
    checkpoint: 4,
    items: [
      ['bookOpen', 'Curated resources', 'Milestones, play, pediatric care, early intervention, and parent well-being.'],
      ['heart', 'Encouragement', 'Gentle, original messages that change each day.'],
    ],
  },
};

export function TabPlaceholder({ tab }: { tab: keyof typeof TABS }) {
  const info = TABS[tab];
  return (
    <div>
      <div class="stack" style={{ margin: 'var(--space-2) var(--space-1) var(--space-5)' }}>
        <h1 class="title-1">{info.title}</h1>
        <p class="muted">{info.intro}</p>
      </div>
      <div class="banner neutral" role="note" style={{ marginBottom: 'var(--space-4)' }}>
        <span>
          <strong>Not available yet.</strong> This tab is a preview of what will be built in Checkpoint {info.checkpoint}. Nothing here saves information yet.
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
