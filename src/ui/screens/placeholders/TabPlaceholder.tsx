import { PlaceholderCard } from '../../components/Placeholder';
import { PageHeader } from '../../components/PageHeader';
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
  items: Array<[IconName, string, string]>;
}

const TABS: Record<'calendar' | 'journal' | 'resources', TabInfo> = {
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
      <PageHeader title={info.title} intro={info.intro} />
      <div class="banner neutral" role="note" style={{ marginBottom: 'var(--space-4)' }}>
        <span>
          <strong>Preview only.</strong> This tab is coming soon.
        </span>
      </div>
      {info.items.map(([icon, title, body]) => (
        <PlaceholderCard key={title} icon={icon} title={title}>
          {body}
        </PlaceholderCard>
      ))}
    </div>
  );
}
