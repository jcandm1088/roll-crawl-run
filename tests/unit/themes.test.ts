import { describe, expect, it } from 'vitest';
import { CHILD_COLORS, THEMES, getTheme, themesToCss } from '../../src/ui/theme/themes';
import { contrastRatio } from '../../src/domain/contrast';

const TEXT_AA = 4.5;
const UI_AA = 3;

describe('themes', () => {
  it('provides exactly the five approved themes with Earth first (default)', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['earth', 'sky', 'blush', 'lavender', 'sage']);
    expect(getTheme(undefined).id).toBe('earth');
    expect(getTheme('nonexistent').id).toBe('earth');
  });

  for (const theme of THEMES) {
    describe(theme.name, () => {
      const t = theme.tokens;
      const textPairs: Array<[string, string, string]> = [
        ['text on bg', t.text, t.bg],
        ['text on surface', t.text, t.surface],
        ['text on sunken', t.text, t.surfaceSunken],
        ['muted on bg', t.textMuted, t.bg],
        ['muted on surface', t.textMuted, t.surface],
        ['muted on sunken', t.textMuted, t.surfaceSunken],
        ['onPrimary on primary', t.onPrimary, t.primary],
        ['onPrimary on primaryPressed', t.onPrimary, t.primaryPressed],
        ['onPrimarySoft on primarySoft', t.onPrimarySoft, t.primarySoft],
        ['primary (links) on bg', t.primary, t.bg],
        ['primary (links) on surface', t.primary, t.surface],
        ['primary on nav', t.primary, t.navBg],
        ['muted on nav', t.textMuted, t.navBg],
      ];
      for (const [label, fg, bg] of textPairs) {
        it(`${label} ≥ ${TEXT_AA}:1`, () => expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(TEXT_AA));
      }
      const uiPairs: Array<[string, string, string]> = [
        ['control outline on surface', t.borderStrong, t.surface],
        ['control outline on bg', t.borderStrong, t.bg],
        ['focus ring on bg', t.focus, t.bg],
        ['focus ring on surface', t.focus, t.surface],
        ['primary meter fill on sunken track', t.primary, t.surfaceSunken],
      ];
      for (const [label, fg, bg] of uiPairs) {
        it(`${label} ≥ ${UI_AA}:1`, () => expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(UI_AA));
      }
    });
  }

  it('child avatar colors keep white initials ≥ 4.5:1', () => {
    for (const c of Object.values(CHILD_COLORS)) expect(contrastRatio('#FFFFFF', c.hex)).toBeGreaterThanOrEqual(TEXT_AA);
  });

  it('generates CSS for every theme with Earth as :root default', () => {
    const css = themesToCss();
    expect(css).toContain(':root,[data-theme="earth"]');
    for (const t of THEMES) expect(css).toContain(`[data-theme="${t.id}"]`);
  });
});
