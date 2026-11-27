import { render } from 'preact';
import '@fontsource/fraunces/latin-400.css';
import '@fontsource/fraunces/latin-500.css';
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import './ui/styles/base.css';
import { AppProvider, type StorageNotice } from './state/app';
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

/** An update is waiting for (or was taken over by) another open copy of the app. Nothing is reset or lost. */
function StorageNoticeView({ notice }: { notice: StorageNotice }) {
  return (
    <div class="onboarding">
      <div class="onboarding-body stack-lg" data-testid="storage-notice" data-notice={notice}>
        <AppMark size={64} />
        {notice === 'blocked' ? (
          <>
            <h1 class="title-1">Almost ready</h1>
            <p class="muted">Roll, Crawl, RUN is finishing an update, but it’s still open in another window or tab.</p>
            <p class="small muted">Please close the other copies of the app. This page will continue by itself. Your information is safe and nothing has been changed.</p>
          </>
        ) : (
          <>
            <h1 class="title-1">A newer version is open</h1>
            <p class="muted">The app was updated in another window or tab, so this copy has paused to keep your information safe.</p>
            <button type="button" class="btn btn-primary btn-block" onClick={() => window.location.reload()}>Reload</button>
          </>
        )}
      </div>
    </div>
  );
}

render(
  <AppProvider fallback={<Loading />} errorView={(m) => <StorageError message={m} />} noticeView={(n) => <StorageNoticeView notice={n} />}>
    <App />
  </AppProvider>,
  document.getElementById('app')!,
);

registerServiceWorker();
