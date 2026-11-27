import type { ComponentChildren } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useFocusTrap } from '../a11y';
import { href, navigate, type Route } from '../../router';
import { useApp } from '../../state/app';
import { Icon, type IconName } from './Icon';
import { Avatar, childDisplayName } from './Avatar';
import { AppMark } from './Brand';

const TABS: Array<{ name: Route['name']; label: string; icon: IconName }> = [
  { name: 'home', label: 'Home', icon: 'house' },
  { name: 'growth', label: 'Growth', icon: 'sprout' },
  { name: 'calendar', label: 'Calendar', icon: 'calendar' },
  { name: 'journal', label: 'Journal', icon: 'notebook' },
];

export function BottomNav({ current }: { current: Route['name'] }) {
  return (
    <nav class="bottomnav" aria-label="Main">
      <ul>
        {TABS.map((t) => (
          <li key={t.name}>
            <a class="navlink" href={href({ name: t.name } as Route)} aria-current={current === t.name ? 'page' : undefined}>
              <Icon name={t.icon} size={24} />
              <span>{t.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Child selector: a dropdown panel that opens DOWNWARD from the top bar.
 * It is rendered into <body> through a portal and positioned from the
 * top bar's measured bottom edge, so it can never be pushed above the
 * viewport (see docs/reviews/CHECKPOINT_1_REVIEW.md for the original defect).
 * Its height is limited to the space below it; the list scrolls inside.
 */
export function ChildSwitcher({ onClose, anchor }: { onClose: () => void; anchor: HTMLElement | null }) {
  const { children, activeChild, setActiveChild } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => computePosition(anchor));
  useFocusTrap(ref, onClose, () => ref.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]') ?? null);
  useEffect(() => {
    const update = () => setPos(computePosition(anchor));
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [anchor]);

  return createPortal(
    <div class="popover-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        class="popover"
        role="dialog"
        aria-modal="true"
        aria-label="Switch child"
        data-testid="child-switcher"
        style={{ top: `${pos.top}px`, left: `${pos.left}px`, width: `${pos.width}px`, maxHeight: `${pos.maxHeight}px` }}
      >
        <p class="eyebrow" style={{ padding: 'var(--space-4) var(--space-4) var(--space-2)' }}>Switch child</p>
        <ul class="list popover-list" role="radiogroup" aria-label="Child profiles" onKeyDown={radioGroupKeyDownNoSelect}>
          {children.map((c) => (
            <li key={c.id}>
              <button
                class="list-item"
                role="radio"
                aria-checked={c.id === activeChild?.id}
                tabIndex={c.id === activeChild?.id ? 0 : -1}
                onClick={async () => {
                  await setActiveChild(c.id);
                  onClose();
                }}
              >
                <Avatar child={c} size={36} />
                <span class="grow" style={{ fontWeight: 600 }}>{childDisplayName(c)}</span>
                {c.id === activeChild?.id && (
                  <span style={{ color: 'var(--primary)' }}>
                    <Icon name="check" />
                    <span class="visually-hidden">Selected</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div class="popover-footer">
          <a class="btn btn-secondary btn-sm btn-block" href={href({ name: 'profileNew' })} onClick={onClose}>
            <Icon name="plus" size={18} /> Add a child
          </a>
          <a class="btn btn-ghost btn-sm btn-block" href={href({ name: 'profiles' })} onClick={onClose}>
            Manage profiles
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Arrow keys move between children without switching; Enter/Space selects. */
function radioGroupKeyDownNoSelect(e: KeyboardEvent) {
  if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
  const radios = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]')];
  const i = radios.indexOf(document.activeElement as HTMLElement);
  let n = i < 0 ? 0 : i;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = Math.min(n + 1, radios.length - 1);
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = Math.max(n - 1, 0);
  else if (e.key === 'Home') n = 0;
  else n = radios.length - 1;
  e.preventDefault();
  radios[n]?.focus();
}

const GUTTER = 12;
const POPOVER_MAX_WIDTH = 360;
/** Height we try to keep available below the selector before moving it up in short windows. */
const COMFORTABLE_HEIGHT = 220;

export function computePosition(anchor: HTMLElement | null) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const header = anchor?.closest('.topbar')?.getBoundingClientRect();
  const a = anchor?.getBoundingClientRect();
  // Open just below the top bar — level with the top of the child's profile card on Home.
  let top = Math.max(GUTTER, Math.round((header?.bottom ?? a?.bottom ?? 64) + 8));
  // In unusually short windows (e.g. a phone in landscape), move up so there is usable room,
  // but never above the window.
  if (vh - top - GUTTER < COMFORTABLE_HEIGHT) top = Math.max(GUTTER, Math.min(top, vh - GUTTER - COMFORTABLE_HEIGHT));
  const width = Math.min(POPOVER_MAX_WIDTH, vw - GUTTER * 2);
  const left = Math.min(Math.max(GUTTER, Math.round(a?.left ?? GUTTER)), vw - width - GUTTER);
  // Never taller than the space actually available (no fixed minimum); content scrolls inside.
  const maxHeight = Math.max(0, vh - top - GUTTER);
  return { top, left, width, maxHeight };
}

export function TopBar({ title, back, backUsesHistory }: { title?: string; back?: Route; backUsesHistory?: boolean }) {
  const { activeChild } = useApp();
  const [switching, setSwitching] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);
  return (
    <>
    <header class="topbar">
      <div class="topbar-inner">
        {back ? (
          <button class="icon-btn plain" onClick={() => (backUsesHistory && window.history.length > 1 ? window.history.back() : navigate(back))} aria-label="Back">
            <Icon name="chevronLeft" />
          </button>
        ) : (
          <AppMark size={36} />
        )}
        {title ? (
          <h1 class="topbar-title grow">
            {title}
          </h1>
        ) : (
          <div class="grow" style={{ minWidth: 0 }}>
            {activeChild && (
              <button class="child-chip" ref={chipRef} aria-haspopup="dialog" aria-expanded={switching} onClick={() => setSwitching(true)} aria-label={`Active child: ${childDisplayName(activeChild)}. Switch child`} data-testid="child-chip">
                <Avatar child={activeChild} size={36} />
                <span class="name">{childDisplayName(activeChild)}</span>
                <Icon name="chevronDown" size={18} />
              </button>
            )}
          </div>
        )}
        <a class="icon-btn" href={href({ name: 'settings' })} aria-label="Profiles and settings">
          <Icon name="settings" />
        </a>
      </div>
    </header>
    {switching && <ChildSwitcher anchor={chipRef.current} onClose={() => setSwitching(false)} />}
    </>
  );
}

export function Screen({ children, nav, current, title, back, navCurrent, backUsesHistory }: { children: ComponentChildren; nav: boolean; current: Route['name']; title?: string; back?: Route; navCurrent?: Route['name']; backUsesHistory?: boolean }) {
  return (
    <div class="app">
      <TopBar title={title} back={back} backUsesHistory={backUsesHistory} />
      <main id="main" class={`main screen-enter${nav ? '' : ' no-nav'}`} key={current}>
        {children}
      </main>
      {nav && <BottomNav current={navCurrent ?? current} />}
    </div>
  );
}
