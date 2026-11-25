import { getTheme, themesToCss, type ThemeId } from '../ui/theme/themes';

let injected = false;

/** Injects all theme variables once, then switches by setting data-theme on <html>. */
export function applyTheme(id: ThemeId): void {
  if (!injected) {
    const style = document.createElement('style');
    style.id = 'rcr-themes';
    style.textContent = themesToCss();
    document.head.prepend(style);
    injected = true;
  }
  const theme = getTheme(id);
  document.documentElement.dataset['theme'] = theme.id;
  // Standalone title bar / status bar color.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.tokens.bg);
}
