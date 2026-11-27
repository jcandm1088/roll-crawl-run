/**
 * “Manage this entry” for legacy personal milestone entries (D9, D10). Only on the existing personal
 * entry page (reached from “Your personal entries” in the Milestone Library). Nothing is automatic.
 */
import { useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { notifyMilestonesChanged, useChildMilestones } from '../../../state/milestones';
import { notifyPersonalChanged } from '../../../state/personal';
import { setFlash } from '../../../state/flash';
import { navigate } from '../../../router';
import { formatLongDate } from '../../../domain/dates';
import { getMilestone } from '../../../domain/milestones';
import { displayTextOf } from '../../../domain/milestoneDisplay';
import { convertLegacyEntry, deleteLegacyEntry, previewLegacy } from '../../../data/repositories/legacyRepo';
import { Sheet } from '../../components/Sheet';
import { ErrorText } from '../../components/ChildFields';
import { Icon } from '../../components/Icon';
import { TwoStepDelete } from './parts';

export function LegacyEntryManagement({ customId }: { customId: string }) {
  const app = useApp();
  const child = app.activeChild!;
  const m = useChildMilestones(child);
  const [sheet, setSheet] = useState<null | 'move' | 'delete'>(null);
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const item = m.data?.personal.find((p) => p.id === customId);
  if (!item || !m.data) return null;
  const record = m.data.records.find((r) => r.customItemId === customId);
  const preview = previewLegacy(item, record, m.data.events);
  const ctx = { deviceId: app.meta.deviceId, childId: child.id, dob: child.dob, today: m.today };
  const related = preview.relatedMilestoneId ? getMilestone(preview.relatedMilestoneId) : undefined;
  const move = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await convertLegacyEntry(app.db, ctx, customId, preview.needsDate ? { achievedDate: date } : preview.as === 'goal' ? { startDate: start || null } : {});
      notifyMilestonesChanged();
      notifyPersonalChanged();
      setFlash(r.kind === 'achievement' ? 'Moved to My Goals as an accomplishment. Its notes and history came with it.' : 'Moved to My Goals as a goal you’re working toward. Its notes and history came with it.');
      navigate({ name: 'goalItem', id: r.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That couldn’t be moved. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <details class="card stack" data-testid="manage-legacy">
        <summary class="small text-link" style={{ cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Manage this entry</summary>
        <div class="stack" style={{ marginTop: 'var(--space-3)' }}>
          <p class="xsmall muted">You can keep this entry here, move it to My Goals, or delete it. Nothing changes unless you choose.</p>
          <button type="button" class="btn btn-outline btn-block" onClick={() => { setError(null); setSheet('move'); }} data-testid="move-to-goals">Move to My Goals…</button>
          <button type="button" class="btn btn-quiet btn-block" onClick={() => setSheet('delete')} data-testid="delete-legacy"><Icon name="trash" size={18} /> Delete permanently…</button>
        </div>
      </details>
      {sheet === 'move' && (
        <Sheet title="Move to My Goals?" onClose={() => setSheet(null)}>
          <div class="stack" data-testid="move-preview">
            <p class="small">
              “{item.title}” will become {preview.as === 'achievement'
                ? <>an <strong>accomplishment</strong>{preview.achievedDate ? <> dated {formatLongDate(preview.achievedDate)}</> : ''}</>
                : <>a <strong>goal you’re working toward</strong></>}.
            </p>
            <ul class="plain-list small stack">
              <li>Its Notes & Observations{preview.observations || preview.hasUndatedNote ? ` (${preview.observations + (preview.hasUndatedNote ? 1 : 0)})` : ''} and history come with it.</li>
              {related && <li>The milestone it was based on, “{displayTextOf(related)}”, becomes its related milestone. That milestone isn’t changed.</li>}
              <li>It will no longer appear in the Milestone Library. It was never counted in milestone Progress, and it won’t be.</li>
              <li>There’s no automatic undo, but you can edit, reopen or delete it in My Goals.</li>
            </ul>
            {preview.needsDate && (
              <div class="field">
                <label class="label" for="legacy-date">Date achieved</label>
                <input id="legacy-date" class="input" type="date" min={child.dob} max={m.today} value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} />
                <p class="xsmall muted">No achievement date was recorded. Enter it only if you know it; otherwise you can leave the entry where it is.</p>
              </div>
            )}
            {preview.as === 'goal' && (
              <div class="field">
                <label class="label" for="legacy-start">Start date (optional)</label>
                <input id="legacy-start" class="input" type="date" min={child.dob} value={start} onInput={(e) => setStart((e.target as HTMLInputElement).value)} />
                <p class="xsmall muted">Leave it empty if you don’t know it; it will show as “Start date not recorded”.</p>
              </div>
            )}
            {error && <ErrorText id="legacy-error">{error}</ErrorText>}
            <button type="button" class="btn btn-primary btn-block" disabled={busy || (preview.needsDate && !date)} onClick={() => void move()} data-testid="confirm-move">Move to My Goals</button>
            <button type="button" class="btn btn-ghost btn-block" onClick={() => setSheet(null)}>Cancel — keep it here</button>
          </div>
        </Sheet>
      )}
      {sheet === 'delete' && (
        <TwoStepDelete
          title="Delete this personal entry permanently?"
          effects={[
            `“${item.title}”, its status, Notes & Observations and history will be permanently deleted from this device.`,
            'It was never counted in milestone Progress, so Progress doesn’t change. Official milestones aren’t affected.',
          ]}
          onClose={() => setSheet(null)}
          onConfirm={async () => {
            await deleteLegacyEntry(app.db, ctx, customId);
            notifyMilestonesChanged();
            navigate({ name: 'growthLibrary', preset: null });
          }}
        />
      )}
    </>
  );
}
