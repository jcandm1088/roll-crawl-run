/**
 * Parent-facing display wording for milestones (owner refinement R-004: gender-neutral language).
 *
 * The CDC catalog (src/content/milestones.cdc-2022.json) is NEVER modified: it stays verbatim,
 * locked by milestone-ids.lock.json, and remains the source of truth for meaning, reference age,
 * category and source. CDC alternates “he” and “she” between milestones; the app shows
 * gender-neutral wording instead, from a separate, identifiable display layer
 * (src/content/milestones.display.json).
 *
 * Each adaptation records the exact CDC source text and an ordered list of whole-word replacements.
 * `validateDisplay` proves, at build time and in unit tests, that applying exactly those replacements
 * to the CDC text gives the display text, and that only gendered pronouns change (to they/them/their/
 * themselves, or an article where the sentence reads naturally without a pronoun), together with the
 * verb agreement that singular “they” requires. Everything else — qualifiers, numbers, examples and
 * quoted speech — is therefore character-for-character identical to CDC's wording.
 *
 * Adapted wording is never presented as a quotation of CDC; CDC's original wording is shown, as
 * CDC's, on each milestone's page.
 */
import displayJson from '../content/milestones.display.json';
import { MILESTONES, type MilestoneDef } from './milestones';

export interface DisplayAdaptation {
  id: string;
  /** CDC's exact wording at the time of adaptation (must equal the catalog text). */
  source: string;
  /** Ordered whole-word replacements: [from, to]. */
  replacements: Array<[string, string]>;
  display: string;
}
export interface DisplayContent { format: string; version: number; catalogContentVersion: string; basis: string; adaptations: DisplayAdaptation[] }

export const DISPLAY: DisplayContent = displayJson as unknown as DisplayContent;

const byId = new Map(DISPLAY.adaptations.map((a) => [a.id, a]));

/** The wording shown to parents. Equals CDC's text unless the milestone has a gender-neutral adaptation. */
export function displayTextOf(def: Pick<MilestoneDef, 'id' | 'text'>): string {
  return byId.get(def.id)?.display ?? def.text;
}

/** True when the shown wording differs from CDC's (only gendered pronouns and their verb agreement). */
export function isWordingAdapted(def: Pick<MilestoneDef, 'id'>): boolean {
  return byId.has(def.id);
}

/** Gendered words that must never appear in parent-facing milestone wording. */
export const GENDERED_WORDS = /(?<![\w’'])(he|she|his|her|hers|him|himself|herself|he’s|she’s|boy|girl|son|daughter)(?![\w’'])/i;

const PRONOUN_FROM = new Set(['he', 'she', 'his', 'her', 'hers', 'him', 'himself', 'herself']);
const NEUTRAL_TO = new Set(['they', 'them', 'their', 'theirs', 'themselves', 'the', 'a', 'an']);
/** Verb agreement for singular “they”: third-person singular → plural form. */
function isAgreement(from: string, to: string): boolean {
  if (from === 'is' && to === 'are') return true;
  if (from === 'has' && to === 'have') return true;
  if (from === 'doesn’t' && to === 'don’t') return true;
  if (from === 'does' && to === 'do') return true;
  if (from === 'was' && to === 'were') return true;
  return /^[a-z]+s$/.test(from) && (to === from.slice(0, -1) || (from.endsWith('es') && to === from.slice(0, -2)));
}

const word = (w: string) => new RegExp(`(?<![\\w’'])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w’'])`, 'g');

/** Applies the replacements in order, each searched from the end of the previous one. Null if one isn't found. */
export function applyReplacements(source: string, replacements: ReadonlyArray<readonly [string, string]>): string | null {
  let out = source;
  let pos = 0;
  for (const [from, to] of replacements) {
    const re = word(from);
    re.lastIndex = pos;
    const m = re.exec(out);
    if (!m) return null;
    out = out.slice(0, m.index) + to + out.slice(m.index + from.length);
    pos = m.index + to.length;
  }
  return out;
}

/**
 * Validates the display layer against the catalog. Returns a list of errors (empty when valid).
 * Checks: known ids, no duplicates, the recorded source equals CDC's current text, the display text
 * is exactly the source with only the declared replacements, every replacement is a gendered pronoun
 * → neutral word or a matching verb agreement, at least one pronoun changes, the result has no gendered
 * words, and every catalog milestone that uses a gendered word has an adaptation.
 */
export function validateDisplay(content: DisplayContent = DISPLAY, items: readonly MilestoneDef[] = MILESTONES, catalogContentVersion?: string): string[] {
  const errors: string[] = [];
  const catalog = new Map(items.map((m) => [m.id, m]));
  if (catalogContentVersion !== undefined && content.catalogContentVersion !== catalogContentVersion) errors.push('display layer was written for a different catalog version');
  const seen = new Set<string>();
  for (const a of content.adaptations) {
    if (seen.has(a.id)) errors.push(`${a.id}: duplicate adaptation`);
    seen.add(a.id);
    const def = catalog.get(a.id);
    if (!def) { errors.push(`${a.id}: unknown milestone`); continue; }
    if (a.source !== def.text) errors.push(`${a.id}: recorded source wording no longer matches CDC's text`);
    if (!a.replacements.length) errors.push(`${a.id}: no replacements`);
    let pronouns = 0;
    for (const [from, to] of a.replacements) {
      if (PRONOUN_FROM.has(from)) {
        pronouns++;
        if (!NEUTRAL_TO.has(to)) errors.push(`${a.id}: “${from}” must become a neutral word, not “${to}”`);
      } else if (!isAgreement(from, to)) errors.push(`${a.id}: “${from}” → “${to}” is not a pronoun or verb-agreement change`);
    }
    if (pronouns === 0) errors.push(`${a.id}: no gendered pronoun replaced`);
    const rebuilt = applyReplacements(a.source, a.replacements);
    if (rebuilt === null) errors.push(`${a.id}: a replacement does not occur in the source`);
    else if (rebuilt !== a.display) errors.push(`${a.id}: display text is not exactly the source with the declared replacements`);
    if (GENDERED_WORDS.test(a.display)) errors.push(`${a.id}: display text still uses gendered wording`);
    if (a.display.trim() !== a.display || !a.display) errors.push(`${a.id}: empty or untrimmed display text`);
  }
  for (const m of items) if (GENDERED_WORDS.test(m.text) && !seen.has(m.id)) errors.push(`${m.id}: uses gendered wording but has no gender-neutral display wording`);
  return errors;
}
