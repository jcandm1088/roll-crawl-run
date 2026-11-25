import { useApp } from './state/app';
import { useRoute, type Route } from './router';
import { Screen } from './ui/components/Shell';
import { Onboarding } from './ui/screens/onboarding/Onboarding';
import { Home } from './ui/screens/home/Home';
import { TabPlaceholder } from './ui/screens/placeholders/TabPlaceholder';
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
