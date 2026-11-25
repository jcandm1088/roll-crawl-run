import type { ComponentChildren } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useRef } from 'preact/hooks';
import { useFocusTrap } from '../a11y';

/**
 * Bottom sheet (centered dialog on wide screens).
 * Rendered into <body> through a portal so that no ancestor (for example the
 * blurred top bar or an animated screen) can become its positioning
 * container and push it off-screen. Focus is trapped inside while open.
 */
export function Sheet({ title, onClose, children, labelledBy }: { title?: string; onClose: () => void; children: ComponentChildren; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, onClose);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div class="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={labelledBy ? undefined : title} aria-labelledby={labelledBy} ref={ref} tabIndex={-1}>
        <div class="sheet-handle" aria-hidden="true" />
        {title && <h2 class="title-2" style={{ marginBottom: 'var(--space-4)' }}>{title}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  );
}
