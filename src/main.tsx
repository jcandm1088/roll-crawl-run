import { render } from 'preact';
import '@fontsource/fraunces/latin-400.css';
import '@fontsource/fraunces/latin-500.css';
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import './ui/styles/base.css';
import { AppProvider } from './state/app';
import { App } from './app';
import { AppMark } from './ui/components/Brand';
import { registerServiceWorker } from './sw/register';
import { applyTheme } from './state/theme';
import { DEFAULT_THEME } from './ui/theme/themes';

applyTheme(DEFAULT_THEME); // replaced by the saved theme as soon as storage opens

function Loading() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-busy="true" aria-label="Loading">
      <AppMark size={64} />
    </div>
  );
}

function StorageError({ message }: { message: string }) {
  return (
    <div class="onboarding">
      <div class="onboarding-body stack-lg">
        <AppMark size={64} />
        <h1 class="title-1">Storage isn’t available</h1>
        <p class="muted">{message}</p>
        <p class="small muted">Try opening the app in a regular (not private) browser window, or check that site data isn’t blocked for this page.</p>
      </div>
    </div>
  );
}

render(
  <AppProvider fallback={<Loading />} errorView={(m) => <StorageError message={m} />}>
    <App />
  </AppProvider>,
  document.getElementById('app')!,
);

registerServiceWorker();
