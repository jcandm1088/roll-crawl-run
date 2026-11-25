import type { Child } from '../../../types';
import type { RcrDB } from '../../../data/db';
import { NO_CORRECTED_AGE, saveChildProfile, type ChildInput, type PhotoChange } from '../../../data/repositories/childrenRepo';
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

/** Saves profile and photo together atomically (see saveChildProfile). */
export async function saveChild(db: RcrDB, deviceId: string, id: string, input: ChildInput, photo: PhotoDraft): Promise<Child> {
  const change: PhotoChange =
    photo.kind === 'new' ? { kind: 'set', blob: photo.blob, width: photo.width, height: photo.height } : photo.kind === 'remove' ? { kind: 'remove' } : { kind: 'keep' };
  return saveChildProfile(db, deviceId, { id, input, photo: change });
}
