import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

/** Bottom sheet (centered dialog on wide screens). Closes on Escape or scrim tap. */
export function Sheet({ title, onClose, children, labelledBy }: { title?: string; onClose: () => void; children: ComponentChildren; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('button, [href], input, select, textarea');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div class="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={labelledBy ? undefined : title} aria-labelledby={labelledBy} ref={ref}>
        <div class="sheet-handle" aria-hidden="true" />
        {title && <h2 class="title-2" style={{ marginBottom: 'var(--space-4)' }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
