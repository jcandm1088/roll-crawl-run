/**
 * Theme tokens — the single source of truth for every color in the app.
 * Each theme defines the complete palette (not just an accent).
 * tests/unit/themes.test.ts verifies WCAG AA contrast for each pairing.
 */

export type ThemeId = 'earth' | 'sky' | 'blush' | 'lavender' | 'sage';

export interface ThemeTokens {
  bg: string; // app background
  surface: string; // cards
  surfaceSunken: string; // wells, inputs, segmented controls
  text: string; // primary text
  textMuted: string; // secondary text (still ≥ 4.5:1)
  primary: string; // buttons, links, active nav, meters
  primaryPressed: string;
  onPrimary: string; // text on primary
  primarySoft: string; // tinted backgrounds (selected chips, badges)
  onPrimarySoft: string; // text on primarySoft
  accent: string; // decorative only (illustration strokes, wordmark detail)
  border: string; // hairline card borders (decorative)
  borderStrong: string; // input and control outlines (≥ 3:1 vs surface)
  focus: string; // focus ring (≥ 3:1 vs bg and surface)
  navBg: string; // bottom navigation background
  shadow: string; // rgba used in soft shadows
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  tokens: ThemeTokens;
}

export const THEMES: readonly Theme[] = [
  {
    id: 'earth',
    name: 'Earth',
    description: 'Warm browns, creams, and beige',
    tokens: {
      bg: '#F6F0E8',
      surface: '#FFFCF7',
      surfaceSunken: '#EEE5D9',
      text: '#2E241C',
      textMuted: '#67564A',
      primary: '#7A4F33',
      primaryPressed: '#633F28',
      onPrimary: '#FFFFFF',
      primarySoft: '#EBDCCB',
      onPrimarySoft: '#4A2F1E',
      accent: '#C08A5E',
      border: '#E6DACB',
      borderStrong: '#9C8471',
      focus: '#7A4F33',
      navBg: '#FFFCF7',
      shadow: 'rgba(74, 47, 30, 0.08)',
    },
  },
  {
    id: 'sky',
    name: 'Sky',
    description: 'Soft, light blues',
    tokens: {
      bg: '#F0F5F9',
      surface: '#FFFFFF',
      surfaceSunken: '#E2ECF4',
      text: '#1C2935',
      textMuted: '#4B5E6F',
      primary: '#2D6290',
      primaryPressed: '#224D73',
      onPrimary: '#FFFFFF',
      primarySoft: '#D6E6F3',
      onPrimarySoft: '#1B4366',
      accent: '#86B6D9',
      border: '#DAE5EE',
      borderStrong: '#73889C',
      focus: '#2D6290',
      navBg: '#FFFFFF',
      shadow: 'rgba(28, 41, 53, 0.08)',
    },
  },
  {
    id: 'blush',
    name: 'Blush',
    description: 'Soft, light pinks',
    tokens: {
      bg: '#FAF2F2',
      surface: '#FFFDFD',
      surfaceSunken: '#F3E3E5',
      text: '#33222A',
      textMuted: '#6C5260',
      primary: '#97455F',
      primaryPressed: '#7A364C',
      onPrimary: '#FFFFFF',
      primarySoft: '#F2D8DF',
      onPrimarySoft: '#6A2A40',
      accent: '#DDA0B2',
      border: '#EFDDE1',
      borderStrong: '#9A7C88',
      focus: '#97455F',
      navBg: '#FFFDFD',
      shadow: 'rgba(51, 34, 42, 0.08)',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft purples',
    tokens: {
      bg: '#F5F2FA',
      surface: '#FFFEFF',
      surfaceSunken: '#E9E3F3',
      text: '#2A2338',
      textMuted: '#5D5470',
      primary: '#664C99',
      primaryPressed: '#523C7D',
      onPrimary: '#FFFFFF',
      primarySoft: '#E2D9F2',
      onPrimarySoft: '#432F6C',
      accent: '#B4A0D8',
      border: '#E4DCEF',
      borderStrong: '#8E84A3',
      focus: '#664C99',
      navBg: '#FFFEFF',
      shadow: 'rgba(42, 35, 56, 0.08)',
    },
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Soft, light greens',
    tokens: {
      bg: '#F2F5EF',
      surface: '#FFFFFD',
      surfaceSunken: '#E3EBDF',
      text: '#1F2B22',
      textMuted: '#506053',
      primary: '#466749',
      primaryPressed: '#37523A',
      onPrimary: '#FFFFFF',
      primarySoft: '#DAE7D5',
      onPrimarySoft: '#2C4730',
      accent: '#9BBB96',
      border: '#DCE5D7',
      borderStrong: '#7F9282',
      focus: '#466749',
      navBg: '#FFFFFD',
      shadow: 'rgba(31, 43, 34, 0.08)',
    },
  },
];

export const DEFAULT_THEME: ThemeId = 'earth';

export function getTheme(id: ThemeId | string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

const CSS_NAMES: Record<keyof ThemeTokens, string> = {
  bg: '--bg',
  surface: '--surface',
  surfaceSunken: '--surface-sunken',
  text: '--text',
  textMuted: '--text-muted',
  primary: '--primary',
  primaryPressed: '--primary-pressed',
  onPrimary: '--on-primary',
  primarySoft: '--primary-soft',
  onPrimarySoft: '--on-primary-soft',
  accent: '--accent',
  border: '--border',
  borderStrong: '--border-strong',
  focus: '--focus',
  navBg: '--nav-bg',
  shadow: '--shadow-color',
};

/** CSS for all themes, keyed by [data-theme]. Injected once at startup. */
export function themesToCss(): string {
  return THEMES.map((t) => {
    const vars = (Object.keys(CSS_NAMES) as Array<keyof ThemeTokens>)
      .map((k) => `${CSS_NAMES[k]}:${t.tokens[k]};`)
      .join('');
    const selector = t.id === DEFAULT_THEME ? `:root,[data-theme="${t.id}"]` : `[data-theme="${t.id}"]`;
    return `${selector}{${vars}}`;
  }).join('\n');
}

/** Child profile colors: used for the avatar circle behind a white initial. Same in every theme. */
export const CHILD_COLORS = {
  clay: { name: 'Clay', hex: '#9A5B3C' },
  ocean: { name: 'Ocean', hex: '#2F6A8A' },
  rose: { name: 'Rose', hex: '#A24B67' },
  plum: { name: 'Plum', hex: '#6D4F96' },
  moss: { name: 'Moss', hex: '#4E6B3F' },
  slate: { name: 'Slate', hex: '#4F5B66' },
} as const;
