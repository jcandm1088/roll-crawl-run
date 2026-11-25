/**
 * Brand: app mark and wordmark.
 * The mark shows three forms rising along a gentle path — a quiet nod to
 * rolling, crawling, and running — drawn in the active theme's colors.
 * The same geometry (fixed Earth colors) is used for the installed app icon
 * (see scripts/generate-icons.mjs).
 */

export const APP_NAME = 'Roll, Crawl, RUN';
export const APP_SUBTITLE = 'Tracking Growth Together';
export const APP_FULL_NAME = `${APP_NAME}: ${APP_SUBTITLE}`;

export function AppMark({ size = 40, class: className }: { size?: number; class?: string }) {
  return (
    <svg class={className} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${APP_NAME} logo`}>
      <rect width="100" height="100" rx="26" fill="var(--primary-soft)" />
      <path d="M18 74 C 38 80, 58 72, 82 44" fill="none" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round" />
      <circle cx="27" cy="66" r="6.5" fill="var(--primary)" opacity="0.55" />
      <circle cx="49" cy="61" r="9.5" fill="var(--primary)" opacity="0.78" />
      <circle cx="72" cy="42" r="13.5" fill="var(--primary)" />
    </svg>
  );
}

export function Wordmark({ size = 'sm', showSubtitle = true }: { size?: 'sm' | 'lg'; showSubtitle?: boolean }) {
  // Capitalization preserved exactly: "Roll, Crawl, RUN".
  return (
    <span class={`wordmark ${size}`} aria-label={showSubtitle ? APP_FULL_NAME : APP_NAME} role="img">
      <span class="wordmark-name" aria-hidden="true">
        Roll, Crawl, <span class="run">RUN</span>
      </span>
      {showSubtitle && (
        <span class="wordmark-sub" aria-hidden="true">
          {APP_SUBTITLE}
        </span>
      )}
    </span>
  );
}
