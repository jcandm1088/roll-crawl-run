/**
 * Brand: app mark and wordmark.
 * The mark is "Growing Together" (approved Concept 5): a parent and child
 * side by side. Same geometry everywhere; the installed app icons use the
 * fixed brand (Earth) colors via scripts/generate-icons.mjs.
 */

import { MARK_RADIUS, markShapes, type MarkColors } from '../brand/mark';

export const APP_NAME = 'Roll, Crawl, RUN';
export const APP_SUBTITLE = 'Tracking Growth Together';
export const APP_FULL_NAME = `${APP_NAME}: ${APP_SUBTITLE}`;

/** In-app mark, drawn in the active theme's colors. (Installed app icons use the fixed brand colors.) */
const THEMED: MarkColors = { background: 'var(--primary-soft)', primary: 'var(--primary)', accent: 'var(--accent)' };

export function AppMark({ size = 40, class: className }: { size?: number; class?: string }) {
  return (
    <svg
      class={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${APP_NAME} logo`}
      // Static artwork from src/ui/brand/growing-together.json — never user content.
      dangerouslySetInnerHTML={{ __html: `<rect width="100" height="100" rx="${MARK_RADIUS}" fill="var(--primary-soft)"/>${markShapes(THEMED)}` }}
    />
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
