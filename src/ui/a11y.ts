import { useLayoutEffect, type MutableRef } from 'preact/hooks';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.closest('[inert]') && el.getClientRects().length > 0);
}

/**
 * Keeps keyboard focus inside a dialog while it is open: Tab and Shift+Tab
 * wrap around, Escape calls `onEscape`, and focus returns to the element
 * that opened the dialog when it closes.
 */
export function useFocusTrap(ref: MutableRef<HTMLElement | null>, onEscape: () => void, initialFocus?: () => HTMLElement | null) {
  // Layout effect: focus moves into the dialog synchronously when it opens, before any further key press.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    (initialFocus?.() ?? focusables(root)[0] ?? root).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables(root);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous && document.contains(previous)) previous.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Standard radio-group keyboard behavior for groups built from
 * role="radio" buttons: only the selected (or first) option is in the Tab
 * order, and arrow keys move to and select the previous/next option.
 * Use: <div role="radiogroup" onKeyDown={radioGroupKeyDown}> with each
 * option given tabIndex={rovingTabIndex(checked, index, anyChecked)}.
 */
export function radioGroupKeyDown(e: KeyboardEvent) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  const group = e.currentTarget as HTMLElement;
  const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')].filter((r) => r.closest('[role="radiogroup"]') === group);
  if (radios.length === 0) return;
  const current = radios.indexOf(document.activeElement as HTMLElement);
  let next = current < 0 ? 0 : current;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (next + 1) % radios.length;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (next - 1 + radios.length) % radios.length;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = radios.length - 1;
  e.preventDefault();
  radios[next]!.focus();
  radios[next]!.click(); // selection follows focus, as for native radio buttons
}

export function rovingTabIndex(checked: boolean, index: number, anyChecked: boolean): number {
  return checked || (!anyChecked && index === 0) ? 0 : -1;
}
