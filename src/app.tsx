import { useApp } from './state/app';
import { useRoute, type Route } from './router';
import { Screen } from './ui/components/Shell';
import { Onboarding } from './ui/screens/onboarding/Onboarding';
import { Home } from './ui/screens/home/Home';
import { TabPlaceholder } from './ui/screens/placeholders/TabPlaceholder';
import { ExpectScreen, GrowthHome, ProgressScreen } from './ui/screens/growth/Growth';
import { AboutMilestonesScreen, LibraryScreen } from './ui/screens/growth/Library';
import { MilestoneDetailScreen } from './ui/screens/growth/MilestoneDetail';
import { ProfileForm, ProfilesList } from './ui/screens/profiles/Profiles';
import { AboutInfo, InstallInfo, PrivacyInfo, Settings, StorageInfo } from './ui/screens/settings/Settings';
import { UpdateBanner } from './ui/components/UpdateBanner';

export function App() {
  const { meta, children } = useApp();
  const route = useRoute();

  if (!meta.onboardingComplete) return <Onboarding mode="firstRun" />;
  // Every profile was deleted: ask for a new child (abbreviated flow).
  if (children.length === 0) return <Onboarding mode="addChild" />;

  return (
    <>
      {renderRoute(route)}
      <UpdateBanner />
    </>
  );
}

function renderRoute(route: Route) {
  switch (route.name) {
    case 'home':
      return <Screen nav current="home"><Home /></Screen>;
    case 'growth':
      return <Screen nav current="growth"><GrowthHome /></Screen>;
    case 'growthProgress':
      return <Screen nav current="growthProgress" navCurrent="growth" title="Progress" back={{ name: 'growth' }}><ProgressScreen /></Screen>;
    case 'growthExpect':
      return (
        <Screen nav current="growthExpect" navCurrent="growth" title="What to Expect" back={{ name: 'growth' }}>
          <ExpectScreen key={`${route.interval}`} interval={route.interval} />
        </Screen>
      );
    case 'growthLibrary':
      return <Screen nav current="growthLibrary" navCurrent="growth" title="Milestone Library" back={{ name: 'growth' }}><LibraryScreen preset={route.preset} /></Screen>;
    case 'growthAbout':
      return <Screen nav current="growthAbout" navCurrent="growth" title="About these milestones" back={{ name: 'growthLibrary', preset: null }} backUsesHistory><AboutMilestonesScreen /></Screen>;
    case 'growthMilestone':
      return (
        <Screen nav current="growthMilestone" navCurrent="growth" title="Milestone" back={{ name: 'growth' }} backUsesHistory>
          <MilestoneDetailScreen key={route.key} routeKey={route.key} />
        </Screen>
      );
    case 'calendar':
    case 'journal':
    case 'resources':
      return <Screen nav current={route.name}><TabPlaceholder tab={route.name} /></Screen>;
    case 'settings':
      return <Screen nav={false} current="settings" title="Settings" back={{ name: 'home' }}><Settings /></Screen>;
    case 'privacy':
      return <Screen nav={false} current="privacy" title="Privacy" back={{ name: 'settings' }}><PrivacyInfo /></Screen>;
    case 'storage':
      return <Screen nav={false} current="storage" title="Storage" back={{ name: 'settings' }}><StorageInfo /></Screen>;
    case 'install':
      return <Screen nav={false} current="install" title="Install" back={{ name: 'settings' }}><InstallInfo /></Screen>;
    case 'about':
      return <Screen nav={false} current="about" title="About" back={{ name: 'settings' }}><AboutInfo /></Screen>;
    case 'profiles':
      return <Screen nav={false} current="profiles" title="Child profiles" back={{ name: 'settings' }}><ProfilesList /></Screen>;
    case 'profileNew':
      return <Screen nav={false} current="profileNew" title="Add a child" back={{ name: 'profiles' }}><ProfileForm childId={null} /></Screen>;
    case 'profileEdit':
      return (
        <Screen nav={false} current="profileEdit" title="Edit profile" back={{ name: 'profiles' }}>
          <ProfileForm key={route.id} childId={route.id} />
        </Screen>
      );
  }
}
