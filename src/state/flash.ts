/** A one-time confirmation message carried across a navigation (e.g. “Goal saved.” after a form). */
let pending: string | null = null;
export function setFlash(text: string) {
  pending = text;
}
export function takeFlash(): string | null {
  const t = pending;
  pending = null;
  return t;
}
