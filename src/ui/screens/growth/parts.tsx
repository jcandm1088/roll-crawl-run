import type { ComponentChildren } from 'preact';
import { Icon } from '../../components/Icon';
import { href } from '../../../router';
import { APP_CATEGORIES, STATUS_LABEL, type CategoryProgress, type MilestoneStatus } from '../../../domain/milestones';
import type { ViewingAge, CorrectedAgeResult } from '../../../domain/age';
import { ageBetween, formatBeforeDueDate, formatPreciseAge } from '../../../domain/age';
import type { Child } from '../../../types';
import { childDisplayName } from '../../components/Avatar';

export const CDC_MILESTONES_URL = 'https://www.cdc.gov/act-early/milestones/index.html';
export const CDC_CONCERNED_URL = 'https://www.cdc.gov/act-early/families/concerned.html';

/** External links: open outside the app in a new window (CDC linking requirement). */
export function ExternalLink({ url, children }: { url: string; children: ComponentChildren }) {
  return (
    <a class="text-link" href={url} target="_blank" rel="noopener noreferrer">
      {children}
      <Icon name="externalLink" size={14} class="inline-icon" />
      <span class="visually-hidden"> (opens cdc.gov in a new window; needs internet)</span>
    </a>
  );
}

/** Short, plain-language safeguard shown wherever progress appears. */
export function MilestoneSafeguard({ compact = false }: { compact?: boolean }) {
  return (
    <p class="info-note" data-testid="milestone-safeguard">
      <Icon name="info" size={18} />
      <span>
        {compact
          ? 'Children develop at different rates. This shows what you’ve recorded — it isn’t a screening or clinical assessment.'
          : 'Children develop at different rates. CDC’s milestones describe skills most children (75% or more) show by each age — they aren’t deadlines. What you record here isn’t a screening, diagnosis, or clinical assessment.'}{' '}
        If you have concerns, talk with your child’s healthcare provider.{' '}
        <a class="text-link" href={href({ name: 'growthAbout' })}>About these milestones</a>
      </span>
    </p>
  );
}

/** Prominent CDC attribution + free availability + non-endorsement (CDC reuse conditions). */
export function CdcAttribution() {
  return (
    <div class="card stack small" data-testid="cdc-attribution" style={{ boxShadow: 'none' }}>
      <p style={{ fontWeight: 600 }}>Milestones: Source: CDC</p>
      <p class="attribution" style={{ fontSize: 'var(--text-sm)' }}>
        The milestone wording comes from the Centers for Disease Control and Prevention’s “Learn the Signs. Act Early.” checklists (2022 revision), shown
        without changes. The original materials are available free from CDC at <ExternalLink url={CDC_MILESTONES_URL}>cdc.gov</ExternalLink>.
      </p>
      <p class="attribution" style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>
        <strong>Not endorsed:</strong> Roll, Crawl, RUN is an independent app. It is not endorsed by CDC, the U.S. Department of Health and Human Services
        (HHS), or the U.S. Government.
      </p>
    </div>
  );
}

export function StatusBadge({ status }: { status: MilestoneStatus }) {
  return (
    <span class={`status-badge ${status}`} data-status={status}>
      {status === 'achieved' && <Icon name="check" size={12} />}
      {STATUS_LABEL[status]}
    </span>
  );
}

/** One progress line: neutral colours, raw fraction, emerging / not yet counts, neutral empty states. */
export function ProgressLine({ p, label }: { p: CategoryProgress; label: string }) {
  return (
    <div class="progress-row" data-testid={`progress-${p.category}`}>
      <div class="row-between">
        <span class="small" style={{ fontWeight: 600 }}>{label}</span>
        {p.state === 'ok' ? (
          <span class="progress-figure small" data-testid="fraction">
            {p.achieved} of {p.applicable} achieved
          </span>
        ) : (
          <span class="neutral-state" data-testid="neutral-state">
            {p.state === 'all-hidden' ? 'All hidden' : 'Nothing to track yet'}
          </span>
        )}
      </div>
      {p.state === 'ok' && (
        <>
          <div class="meter" role="img" aria-label={`${p.achieved} of ${p.applicable} recorded as achieved`}>
            <div class="meter-fill" style={{ width: `${(p.achieved / p.applicable) * 100}%` }} />
          </div>
          <p class="progress-sub" data-testid="counts">
            Emerging {p.emerging} · Not yet observed {p.notYet}
            {p.hidden > 0 && ` · ${p.hidden} hidden (not counted)`}
          </p>
        </>
      )}
      {p.state === 'all-hidden' && <p class="progress-sub">{p.hidden} hidden milestone{p.hidden === 1 ? '' : 's'} not counted. Restore them in the Milestone Library.</p>}
    </div>
  );
}

export function CategoryProgressList({ categories }: { categories: CategoryProgress[] }) {
  return (
    <div>
      {categories.map((c) => (
        <ProgressLine key={c.category} p={c} label={APP_CATEGORIES.find((x) => x.id === c.category)?.label ?? 'All milestones'} />
      ))}
    </div>
  );
}

/** Chronological age, corrected age, and the age used for milestones — always labelled separately. */
export function AgeBasisPanel({ child, age, corrected, today }: { child: Child; age: ViewingAge; corrected: CorrectedAgeResult | null; today: string }) {
  const chrono = formatPreciseAge(ageBetween(child.dob, today));
  const usingCorrected = child.correctedAge.enabled && child.ageBasis === 'corrected';
  return (
    <dl class="age-panel" data-testid="age-panel">
      <dt>Age</dt>
      <dd data-testid="panel-chronological">{chrono}</dd>
      {corrected && corrected.status !== 'notApplicable' && (
        <>
          <dt>Corrected age</dt>
          <dd>{corrected.status === 'corrected' ? formatPreciseAge(corrected.age) : formatBeforeDueDate(corrected)}</dd>
        </>
      )}
      <dt>Age used for milestones</dt>
      <dd data-testid="panel-milestone-age">
        {age.months === null ? 'Not yet (before due date)' : `${age.months} month${age.months === 1 ? '' : 's'}`}
        <span class="xsmall muted" style={{ display: 'block', fontWeight: 500 }}>{usingCorrected ? 'corrected age' : 'chronological age'}</span>
      </dd>
    </dl>
  );
}

export function ForChild({ child }: { child: Child }) {
  return <p class="small muted" style={{ margin: '0 var(--space-1) var(--space-4)' }}>For <strong style={{ color: 'var(--text)' }}>{childDisplayName(child)}</strong></p>;
}

export function OlderThanFiveNote({ months }: { months: number | null }) {
  if (months === null || months <= 60) return null;
  return (
    <p class="info-note" data-testid="over-five-note">
      <Icon name="info" size={18} />
      <span>CDC’s milestone checklists go up to age 5, so there are no published milestones beyond 5 years. Everything you’ve recorded is kept, and you can keep tracking existing milestones and your own versions.</span>
    </p>
  );
}
