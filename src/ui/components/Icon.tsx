/**
 * Icons: a vendored subset of Lucide (ISC license, https://lucide.dev),
 * imported as raw SVG at build time so no network request is ever made.
 */
import house from 'lucide-static/icons/house.svg?raw';
import sprout from 'lucide-static/icons/sprout.svg?raw';
import calendar from 'lucide-static/icons/calendar-days.svg?raw';
import notebook from 'lucide-static/icons/notebook-pen.svg?raw';
import library from 'lucide-static/icons/library.svg?raw';
import settings from 'lucide-static/icons/settings-2.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import chevronLeft from 'lucide-static/icons/chevron-left.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import camera from 'lucide-static/icons/camera.svg?raw';
import users from 'lucide-static/icons/users.svg?raw';
import palette from 'lucide-static/icons/palette.svg?raw';
import shield from 'lucide-static/icons/shield-check.svg?raw';
import hardDrive from 'lucide-static/icons/hard-drive.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import bell from 'lucide-static/icons/bell.svg?raw';
import share from 'lucide-static/icons/share.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import smartphone from 'lucide-static/icons/smartphone.svg?raw';
import bookOpen from 'lucide-static/icons/book-open.svg?raw';
import heart from 'lucide-static/icons/heart.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import rotate from 'lucide-static/icons/rotate-ccw.svg?raw';
import sparkles from 'lucide-static/icons/sparkles.svg?raw';
import tag from 'lucide-static/icons/tag.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import externalLink from 'lucide-static/icons/external-link.svg?raw';
import eyeOff from 'lucide-static/icons/eye-off.svg?raw';
import copyPlus from 'lucide-static/icons/copy-plus.svg?raw';
import chart from 'lucide-static/icons/chart-no-axes-column.svg?raw';
import listChecks from 'lucide-static/icons/list-checks.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import target from 'lucide-static/icons/target.svg?raw';
import map from 'lucide-static/icons/map.svg?raw';

const ICONS = {
  house, sprout, calendar, notebook, library, settings, chevronRight, chevronLeft, chevronDown, plus, check, x,
  camera, users, palette, shield, hardDrive, info, download, trash, pencil, bell, share, fileText, smartphone,
  bookOpen, heart, clock, rotate, sparkles, tag, refresh, eye, search, externalLink, eyeOff, copyPlus, chart, listChecks, history, target, map,
} as const;

export type IconName = keyof typeof ICONS;

const cleaned: Record<string, string> = {};
function svgFor(name: IconName): string {
  if (!cleaned[name]) {
    cleaned[name] = ICONS[name]
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s(width|height)="24"/g, '')
      .replace(/class="[^"]*"/, 'aria-hidden="true" focusable="false"')
      .replace('stroke-width="2"', 'stroke-width="1.75"')
      .trim();
  }
  return cleaned[name]!;
}

export function Icon({ name, size = 22, class: className }: { name: IconName; size?: number; class?: string }) {
  return (
    <span
      class={`icon${className ? ` ${className}` : ''}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
      // Static, build-time SVG from the vendored icon set — never user content.
      dangerouslySetInnerHTML={{ __html: svgFor(name) }}
    />
  );
}
