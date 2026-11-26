import type { ComponentChildren } from 'preact';
import { Icon, type IconName } from './Icon';

/**
 * Clearly marks a feature that is planned for a later checkpoint and is NOT
 * working yet. Never styled like a working control.
 */
export function PlannedTag({ checkpoint }: { checkpoint: number | string }) {
  return (
    <span class="placeholder-tag">
      <Icon name="clock" size={14} />
      Not available yet · Checkpoint {checkpoint}
    </span>
  );
}

export function PlaceholderCard({ icon, title, checkpoint, children }: { icon: IconName; title: string; checkpoint: number; children?: ComponentChildren }) {
  return (
    <section class="card placeholder" aria-label={`${title} — not available yet`}>
      <div class="row" style={{ alignItems: 'flex-start' }}>
        <span class="muted" style={{ marginTop: '2px' }}>
          <Icon name={icon} />
        </span>
        <div class="grow stack" style={{ marginTop: 0 }}>
          <h3 class="title-3">{title}</h3>
          {children && <p class="small muted">{children}</p>}
          <PlannedTag checkpoint={checkpoint} />
        </div>
      </div>
    </section>
  );
}
