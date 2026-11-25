/**
 * FICTIONAL sample data for automated tests only. Not real people.
 */
import type { ChildInput } from '../../src/data/repositories/childrenRepo';

export const SAMPLE_CHILD_A: ChildInput = {
  name: 'Sample Child A',
  dob: '2025-02-14',
  about: null,
  correctedAge: { enabled: false, inputMethod: 'dueDate', dueDate: null, gestationalWeeks: null, gestationalDays: null },
  ageBasis: 'chronological',
};

export const SAMPLE_CHILD_B: ChildInput = {
  name: 'Sample Child B',
  dob: '2023-08-30',
  about: 'Fictional test profile.',
  correctedAge: { enabled: true, inputMethod: 'gestationalAge', dueDate: '2023-10-25', gestationalWeeks: 32, gestationalDays: 0 },
  ageBasis: 'corrected',
};
