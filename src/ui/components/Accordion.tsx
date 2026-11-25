import type { ComponentChildren } from 'preact';
import { useId, useState } from 'preact/hooks';
import { Icon } from './Icon';

/**
 * Inline disclosure section. The whole header is one button
 * (aria-expanded / aria-controls), so a click or tap anywhere on it, or
 * Enter/Space from the keyboard, toggles it. Collapsed by default.
 */
export function Accordion({
  title,
  summary,
  children,
  defaultOpen = false,
  variant = 'card',
  testId,
  level = 2,
}: {
  title: string;
  summary?: string;
  children: ComponentChildren;
  defaultOpen?: boolean;
  variant?: 'card' | 'subtle';
  testId?: string;
  level?: 2 | 3;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const Heading = level === 3 ? 'h3' : 'h2';
  return (
    <section class={`accordion accordion-${variant}${open ? ' is-open' : ''}`} data-testid={testId}>
      <Heading class="accordion-heading">
        <button type="button" class="accordion-trigger" aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-trigger`} onClick={() => setOpen(!open)}>
          <span class="grow">
            <span class="accordion-title">{title}</span>
            {summary && <span class="accordion-summary">{summary}</span>}
          </span>
          <span class="accordion-chevron" aria-hidden="true">
            <Icon name="chevronDown" size={20} />
          </span>
        </button>
      </Heading>
      <div class="accordion-panel" id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
