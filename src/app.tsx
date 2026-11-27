import { useApp } from './state/app';
import { useRoute, type Route } from './router';
import { Screen } from './ui/components/Shell';
import { Onboarding } from './ui/screens/onboarding/Onboarding';
import { Home } from './ui/screens/home/Home';
import { JournalScreen } from './ui/screens/journal/Journal';
import { ExpectScreen, GrowthHome, ProgressScreen } from './ui/screens/growth/Growth';
import { AboutMilestonesScreen, LibraryScreen } from './ui/screens/growth/Library';
import { MilestoneDetailScreen } from './ui/screens/growth/MilestoneDetail';
import { ProfileForm, ProfilesList } from './ui/screens/profiles/Profiles';
import { AboutInfo, InstallInfo, PrivacyInfo, Settings, StorageInfo } from './ui/screens/settings/Settings';
import { CalendarScreen } from './ui/screens/calendar/Calendar';
import { UpdateBanner } from './ui/components/UpdateBanner';
import { ExerciseDetailScreen, ExerciseFormScreen, ExercisesScreen } from './ui/screens/personal/Exercises';
import { ActivityDetailScreen, BrowseScreen } from './ui/screens/personal/Browse';
import { ProgressHistoryScreen } from './ui/screens/personal/History';
import { AchievementFormScreen, GoalDetailScreen, GoalEditScreen, GoalFormScreen, GoalIdeasScreen, GoalsLanding, MyGoalsScreen } from './ui/screens/personal/Goals';

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
    case 'goals':
      return <Screen nav current="goals" navCurrent="growth" title="Goals & Exercises" back={{ name: 'growth' }}><GoalsLanding /></Screen>;
    case 'myGoals':
      return <Screen nav current="myGoals" navCurrent="growth" title="My Goals" back={{ name: 'goals' }}><MyGoalsScreen /></Screen>;
    case 'goalNew':
      return <Screen nav current="goalNew" navCurrent="growth" title="Create a goal" back={{ name: 'myGoals' }}><GoalFormScreen key={`${route.milestone ?? ''}-${route.idea ?? ''}`} id={null} milestone={route.milestone} idea={route.idea} /></Screen>;
    case 'achievementNew':
      return <Screen nav current="achievementNew" navCurrent="growth" title="Record an achievement" back={{ name: 'myGoals' }}><AchievementFormScreen id={null} /></Screen>;
    case 'goalItem':
      return <Screen nav current="goalItem" navCurrent="growth" title="My Goals" back={{ name: 'myGoals' }}><GoalDetailScreen key={route.id} id={route.id} /></Screen>;
    case 'goalEdit':
      return <Screen nav current="goalEdit" navCurrent="growth" title="Edit" back={{ name: 'goalItem', id: route.id }}><GoalEditScreen key={route.id} id={route.id} /></Screen>;
    case 'goalIdeas':
      return <Screen nav current="goalIdeas" navCurrent="growth" title="Looking for inspiration?" back={{ name: 'myGoals' }}><GoalIdeasScreen range={route.range} /></Screen>;
    case 'exercises':
    case 'exerciseNew':
    case 'exerciseBrowse':
    case 'activity':
    case 'exerciseItem':
    case 'exerciseEdit':
    case 'progressHistory':
      return renderPersonalRoute(route);
    case 'calendar':
      return <Screen nav current="calendar"><CalendarScreen openAdd={route.add === true} /></Screen>;
    case 'journal':
      return <Screen nav current="journal"><JournalScreen openNew={route.add === true} /></Screen>;
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
        <Screen nav={false} current="profileEdit" title="Edit profile" back={route.section === 'age' ? { name: 'growthProgress' } : { name: 'profiles' }}>
          <ProfileForm key={`${route.id}-${route.section ?? ''}`} childId={route.id} focusAgeSettings={route.section === 'age'} />
        </Screen>
      );
  }
}

function renderPersonalRoute(route: Route) {
  const g = { nav: true, navCurrent: 'growth' as const };
  switch (route.name) {
    case 'exercises':
      return <Screen {...g} current="exercises" title="Exercises" back={{ name: 'goals' }}><ExercisesScreen focus={route.focus} /></Screen>;
    case 'exerciseNew':
      return <Screen {...g} current="exerciseNew" title={route.activity ? 'Add to My Exercises' : 'Create exercise'} back={route.activity ? { name: 'activity', id: route.activity.split('~')[0]! } : { name: 'exercises' }}><ExerciseFormScreen key={route.activity ?? 'new'} id={null} activity={route.activity} /></Screen>;
    case 'exerciseBrowse':
      return <Screen {...g} current="exerciseBrowse" title="Browse Exercises" back={{ name: 'exercises' }}><BrowseScreen key={String(route.age)} age={route.age} /></Screen>;
    case 'activity':
      return <Screen {...g} current="activity" title="Activity" back={{ name: 'exerciseBrowse', age: null }} backUsesHistory><ActivityDetailScreen key={route.id} id={route.id} /></Screen>;
    case 'exerciseItem':
      return <Screen {...g} current="exerciseItem" title="Exercise" back={{ name: 'exercises' }}><ExerciseDetailScreen key={route.id} id={route.id} /></Screen>;
    case 'exerciseEdit':
      return <Screen {...g} current="exerciseEdit" title="Edit exercise" back={{ name: 'exerciseItem', id: route.id }}><ExerciseFormScreen key={route.id} id={route.id} /></Screen>;
    case 'progressHistory':
      return <Screen {...g} current="progressHistory" title="Progress over time" back={{ name: 'growthProgress' }}><ProgressHistoryScreen view={route.view} /></Screen>;
    default:
      return null;
  }
}
