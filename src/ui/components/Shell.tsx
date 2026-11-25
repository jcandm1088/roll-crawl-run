import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { href, navigate, type Route } from '../../router';
import { useApp } from '../../state/app';
import { Icon, type IconName } from './Icon';
import { Avatar, childDisplayName } from './Avatar';
import { Sheet } from './Sheet';
import { AppMark } from './Brand';

const TABS: Array<{ name: Route['name']; label: string; icon: IconName }> = [
  { name: 'home', label: 'Home', icon: 'house' },
  { name: 'growth', label: 'Growth', icon: 'sprout' },
  { name: 'calendar', label: 'Calendar', icon: 'calendar' },
  { name: 'journal', label: 'Journal', icon: 'notebook' },
  { name: 'resources', label: 'Resources', icon: 'library' },
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

export function ChildSwitcher({ onClose }: { onClose: () => void }) {
  const { children, activeChild, setActiveChild } = useApp();
  return (
    <Sheet title="Switch child" onClose={onClose}>
      <ul class="list" role="radiogroup" aria-label="Child profiles">
        {children.map((c) => (
          <li key={c.id}>
            <button
              class="list-item"
              role="radio"
              aria-checked={c.id === activeChild?.id}
              onClick={async () => {
                await setActiveChild(c.id);
                onClose();
              }}
            >
              <Avatar child={c} size={40} />
              <span class="grow">
                <span class="title-3" style={{ display: 'block' }}>{childDisplayName(c)}</span>
              </span>
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
      <div class="stack" style={{ marginTop: 'var(--space-4)' }}>
        <a class="btn btn-secondary btn-block" href={href({ name: 'profileNew' })} onClick={onClose}>
          <Icon name="plus" size={18} /> Add a child
        </a>
        <a class="btn btn-ghost btn-block" href={href({ name: 'profiles' })} onClick={onClose}>
          Manage profiles
        </a>
      </div>
    </Sheet>
  );
}

export function TopBar({ title, back }: { title?: string; back?: Route }) {
  const { activeChild } = useApp();
  const [switching, setSwitching] = useState(false);
  return (
    <header class="topbar">
      <div class="topbar-inner">
        {back ? (
          <button class="icon-btn plain" onClick={() => navigate(back)} aria-label="Back">
            <Icon name="chevronLeft" />
          </button>
        ) : (
          <AppMark size={36} />
        )}
        {title ? (
          <h1 class="title-3 grow" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'var(--text-xl)' }}>
            {title}
          </h1>
        ) : (
          <div class="grow" style={{ minWidth: 0 }}>
            {activeChild && (
              <button class="child-chip" onClick={() => setSwitching(true)} aria-label={`Active child: ${childDisplayName(activeChild)}. Switch child`} data-testid="child-chip">
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
      {switching && <ChildSwitcher onClose={() => setSwitching(false)} />}
    </header>
  );
}

export function Screen({ children, nav, current, title, back }: { children: ComponentChildren; nav: boolean; current: Route['name']; title?: string; back?: Route }) {
  return (
    <div class="app">
      <TopBar title={title} back={back} />
      <main id="main" class={`main screen-enter${nav ? '' : ' no-nav'}`} key={current}>
        {children}
      </main>
      {nav && <BottomNav current={current} />}
    </div>
  );
}
