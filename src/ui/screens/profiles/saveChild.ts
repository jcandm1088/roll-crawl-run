import type { Child } from '../../../types';
import type { RcrDB } from '../../../data/db';
import { NO_CORRECTED_AGE, createChild, setChildPhoto, updateChild, type ChildInput } from '../../../data/repositories/childrenRepo';
import { evaluateCorrectedAge, type CorrectedAgeDraft, type PhotoDraft } from '../../components/ChildFields';

export interface ChildDraft {
  name: string;
  dob: string;
  about: string;
  corrected: CorrectedAgeDraft;
  photo: PhotoDraft;
}

export const EMPTY_CORRECTED: CorrectedAgeDraft = { bornEarly: null, method: 'dueDate', dueDate: '', weeks: '', days: '0', basis: 'chronological' };

/**
 * Converts a validated draft into a stored input. Returns an error message
 * when the corrected-age section is incomplete or invalid — the parent must
 * fix it (or choose "No"); nothing is silently changed.
 */
export function draftToInput(d: ChildDraft): { ok: true; input: ChildInput } | { ok: false; message: string } {
  const ev = evaluateCorrectedAge(d.dob, d.corrected);
  if (ev.kind === 'incomplete' || ev.kind === 'invalid') return { ok: false, message: ev.message };
  const correctedAge = ev.kind === 'ok' ? ev.settings : NO_CORRECTED_AGE;
  return {
    ok: true,
    input: { name: d.name, dob: d.dob, about: d.about, correctedAge, ageBasis: ev.kind === 'ok' ? d.corrected.basis : 'chronological' },
  };
}

export async function saveChild(db: RcrDB, deviceId: string, existingId: string | null, input: ChildInput, photo: PhotoDraft): Promise<Child> {
  let child = existingId ? await updateChild(db, deviceId, existingId, input) : await createChild(db, deviceId, input);
  if (photo.kind === 'new') child = await setChildPhoto(db, deviceId, child.id, { blob: photo.blob, width: photo.width, height: photo.height });
  else if (photo.kind === 'remove' && child.photoId) child = await setChildPhoto(db, deviceId, child.id, null);
  return child;
}
