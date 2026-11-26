import type { ComponentChildren } from 'preact';
import { Icon, type IconName } from './Icon';

/**
 * Clearly marks a feature that is planned and is NOT working yet. Never styled like a working control.
 * Parent-facing wording only: no internal development terms (owner decision D-12).
 */
export function PlannedTag() {
  return (
    <span class="placeholder-tag">
      <Icon name="clock" size={14} />
      Coming soon
    </span>
  );
}

export function PlaceholderCard({ icon, title, children }: { icon: IconName; title: string; children?: ComponentChildren }) {
  return (
    <section class="card placeholder" aria-label={`${title} — coming soon`}>
      <div class="row" style={{ alignItems: 'flex-start' }}>
        <span class="muted" style={{ marginTop: '2px' }}>
          <Icon name={icon} />
        </span>
        <div class="grow stack" style={{ marginTop: 0 }}>
          <h3 class="title-3">{title}</h3>
          {children && <p class="small muted">{children}</p>}
          <PlannedTag />
        </div>
      </div>
    </section>
  );
}
