/**
 * Recording confirmations (pure). Each message describes the ACTUAL effect of the saved action on
 * the resulting record, using the same applicability and progress rules as Progress.
 * Owner rules: distinguish a new achievement from edits to an existing one; future counting is always
 * conditional; never imply erased text is recoverable; personal entries are separate.
 */
import { STATUS_LABEL, type MilestoneStatus } from './milestones';

export type SavedAction =
  | { kind: 'status'; from: MilestoneStatus; to: MilestoneStatus }
  | { kind: 'date-corrected' }
  | { kind: 'note' }
  | { kind: 'observation-added' }
  | { kind: 'observation-edited' }
  | { kind: 'observation-removed' }
  | { kind: 'note-removed' }
  | { kind: 'text-erased' }
  | { kind: 'hidden' }
  | { kind: 'restored' }
  | { kind: 'personal-saved' };

export interface ConfirmationContext {
  /** Personal entries (from earlier versions of the app) are never part of Progress. */
  personal: boolean;
  /** Applicable at the child's current milestone age (always false for personal entries). */
  applicable: boolean;
  /** Hidden AFTER the action. */
  hidden: boolean;
  /** Status AFTER the action. */
  status: MilestoneStatus;
  childName: string;
  /** "chronological" or "corrected": the age basis used for milestones. */
  basis: 'chronological' | 'corrected';
  /** e.g. "2 years", "18 months" (no leading "by"). */
  ageWords: string;
}

export interface Confirmation { text: string; /** Offer a link to Progress (the action changed or could change current progress). */ showProgressLink: boolean }

const counted = (c: ConfirmationContext) => !c.personal && c.applicable && !c.hidden;
const whenCounts = (c: ConfirmationContext) => `once ${c.childName}’s ${c.basis} age reaches ${c.ageWords}`;

export function confirmationFor(a: SavedAction, c: ConfirmationContext): Confirmation {
  const plain = (text: string): Confirmation => ({ text, showProgressLink: false });
  switch (a.kind) {
    case 'note': return plain('Note saved.');
    case 'observation-added': return plain('Entry added. It doesn’t change the status.');
    case 'observation-edited': return plain('Entry updated. The earlier wording stays in this device’s history until you erase it permanently.');
    case 'observation-removed': return plain('Entry removed from view. Its text stays in this device’s history until you erase it permanently.');
    case 'note-removed': return plain('Note removed from view. Its text stays in this device’s history until you erase it permanently.');
    case 'text-erased': return plain('Text permanently erased.');
    case 'date-corrected': return plain('Achievement date updated. This doesn’t add another achievement; the earlier date stays in the history.');
    case 'personal-saved': return plain('Saved. Personal entries aren’t counted in Progress.');
    case 'hidden':
      if (c.personal) return plain('Hidden. Its status and history are kept.');
      if (c.applicable) return { text: 'Hidden. It’s no longer included in progress. Its status and history are kept.', showProgressLink: true };
      return plain('Hidden. It won’t be included in progress while it’s hidden. Its status and history are kept.');
    case 'restored':
      if (c.personal) return plain('Restored.');
      if (!c.applicable) return plain(`Restored. It will be included in progress ${whenCounts(c)}.`);
      return {
        text: c.status === 'achieved' ? 'Restored. It counts as achieved in progress again.' : `Restored. It’s included in progress again, as ${STATUS_LABEL[c.status].toLowerCase()}.`,
        showProgressLink: true,
      };
    case 'status': {
      const label = STATUS_LABEL[a.to];
      if (c.personal) return plain(`Saved as ${label}. Personal entries aren’t counted in Progress.`);
      if (a.from === 'achieved' && a.to !== 'achieved') {
        return counted(c)
          ? { text: `Saved as ${label}. It no longer counts as achieved in ${c.childName}’s progress. Your earlier entry stays in the history.`, showProgressLink: true }
          : plain(`Saved as ${label}. It wasn’t counted in current progress, so progress is unchanged. Your earlier entry stays in the history.`);
      }
      if (a.to === 'achieved') {
        if (c.hidden) return plain('Saved as Achieved. Hidden milestones aren’t counted in progress unless you restore them.');
        if (c.applicable) return { text: `Saved as Achieved. It now counts in ${c.childName}’s progress.`, showProgressLink: true };
        return plain(`Saved as Achieved. It will count in progress ${whenCounts(c)}, as long as it’s still marked Achieved and isn’t hidden.`);
      }
      if (a.to === 'emerging') {
        if (c.hidden) return plain('Saved as Emerging. Hidden milestones aren’t included in progress.');
        if (c.applicable) return { text: 'Saved as Emerging. Progress shows it as emerging; it doesn’t count as achieved.', showProgressLink: true };
        return plain('Saved as Emerging. It isn’t part of current progress yet.');
      }
      return plain('Saved as Not yet observed.');
    }
  }
}
