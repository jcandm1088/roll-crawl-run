/**
 * Progress over time (Checkpoint 2b): one monthly bar chart at a time — Milestones, Goals or Exercises —
 * for the last 6 months (default) or 1 year (D7), with a text table equivalent. Hand-built SVG.
 * Counts only; no percentages, scores, streaks, rankings or predictions. Calculations: personalProgress.ts.
 */
import { useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { useChildMilestones } from '../../../state/milestones';
import { useChildPersonal } from '../../../state/personal';
import { href } from '../../../router';
import { exercisesChart, goalsChart, milestoneChart, personalSummary, type ChartPeriod, type ChartResult, type ChartView, type MonthBucket } from '../../../domain/personalProgress';
import { ForChild } from '../growth/parts';
import { childNameInline } from '../../components/Avatar';
import { Icon } from '../../components/Icon';

const VIEWS: Array<{ id: ChartView; label: string; title: string }> = [
  { id: 'milestones', label: 'Milestones', title: 'Milestones recorded as achieved' },
  { id: 'goals', label: 'Goals', title: 'Personal accomplishments' },
  { id: 'exercises', label: 'Exercises', title: 'Exercise sessions recorded' },
];

const statusText = (x: MonthBucket) => (x.status === 'before-birth' ? 'Before birth (not applicable)' : x.status === 'not-tracked' ? 'Not tracked yet' : String(x.count));

/**
 * Monthly bar chart (R-017). Every month of the period has a position. Months are told apart by marks
 * and text, not by colour alone: a number above every counted month (including 0), “–” for months
 * before birth, and a dotted baseline for months that weren't tracked yet. A legend explains them.
 */
export function BarChart({ result, title }: { result: ChartResult; title: string }) {
  const b = result.buckets;
  const max = Math.max(1, ...b.map((x) => x.count));
  const W = 320;
  const H = 150;
  const top = 18;
  const bottom = 22;
  const gap = b.length > 6 ? 4 : 6;
  const bw = (W - gap * (b.length - 1)) / Math.max(1, b.length);
  const counted = b.filter((x) => x.status === 'counted');
  const total = counted.reduce((t, x) => t + x.count, 0);
  const summary = `${title}: ${total} in the ${b.length} months shown. ${b.map((x) => `${x.longLabel}${x.current ? ' (so far)' : ''}: ${statusText(x)}`).join('; ')}.`;
  const hasBirth = b.some((x) => x.status === 'before-birth');
  const hasNotTracked = b.some((x) => x.status === 'not-tracked');
  return (
    <figure class="chart" data-testid="chart" data-months={b.length}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} width="100%" preserveAspectRatio="xMidYMid meet">
        <line x1="0" x2={W} y1={H - bottom} y2={H - bottom} class="chart-axis" />
        {b.map((x, i) => {
          const h = x.status === 'counted' ? ((H - top - bottom) * x.count) / max : 0;
          const bx = i * (bw + gap);
          const cx = bx + bw / 2;
          return (
            <g key={x.month} data-testid="chart-bar" data-month={x.month} data-count={x.count} data-status={x.status} data-unavailable={x.unavailable ? 'true' : 'false'}>
              {x.status === 'counted' && x.count > 0 && <rect x={bx} y={H - bottom - h} width={bw} height={Math.max(0, h)} rx={Math.min(4, bw / 4)} class={`chart-bar${x.current ? ' current' : ''}`} />}
              {x.status === 'counted' && <text x={cx} y={H - bottom - h - 4} text-anchor="middle" class={x.count > 0 ? 'chart-value' : 'chart-zero'}>{x.count}</text>}
              {x.status === 'not-tracked' && <line x1={bx + 1} x2={bx + bw - 1} y1={H - bottom - 3} y2={H - bottom - 3} class="chart-nottracked" />}
              {x.status === 'before-birth' && <text x={cx} y={H - bottom - 5} text-anchor="middle" class="chart-na">–</text>}
              <text x={cx} y={H - 6} text-anchor="middle" class={`chart-label${x.status === 'before-birth' ? ' na' : ''}`}>{x.label}{x.current ? '*' : ''}</text>
            </g>
          );
        })}
      </svg>
      <figcaption class="xsmall muted">
        <ul class="chart-legend" data-testid="chart-legend">
          <li>* This month so far</li>
          {b.some((x) => x.status === 'counted' && x.count === 0) && <li data-testid="legend-zero">0 = nothing recorded (it doesn’t mean nothing happened)</li>}
          {hasBirth && <li data-testid="legend-birth">– = before birth</li>}
          {hasNotTracked && <li data-testid="legend-not-tracked">Dotted line = exercises not tracked yet</li>}
        </ul>
      </figcaption>
    </figure>
  );
}

export function ProgressHistoryScreen({ view }: { view: ChartView }) {
  const { activeChild } = useApp();
  const m = useChildMilestones(activeChild);
  const p = useChildPersonal(activeChild);
  const [period, setPeriod] = useState<ChartPeriod>(6);
  if (!activeChild) return null;
  if (!m.data || !p.data) return <p class="muted small">Loading…</p>;
  const name = childNameInline(activeChild);
  const today = p.today;
  const result = view === 'milestones'
    ? milestoneChart(m.data.records, today, activeChild.dob, period)
    : view === 'goals'
      ? goalsChart(p.data.goals, p.data.achievements, today, activeChild.dob, period)
      : exercisesChart(p.data.sessions, p.data.exercises, today, activeChild.dob, period);
  const v = VIEWS.find((x) => x.id === view)!;
  return (
    <div class="stack-lg" data-testid="progress-history" data-view={view}>
      <ForChild child={activeChild} />
      <div class="segmented" role="group" aria-label="What to show" data-testid="history-views">
        {VIEWS.map((x) => (
          <button key={x.id} type="button" aria-pressed={x.id === view} onClick={() => window.location.replace(href({ name: 'progressHistory', view: x.id }))}>{x.label}</button>
        ))}
      </div>
      <div class="segmented" role="group" aria-label="Period" data-testid="history-period">
        {([6, 12] as const).map((n) => <button key={n} type="button" aria-pressed={period === n} onClick={() => setPeriod(n)}>{n === 6 ? '6 months' : '1 year'}</button>)}
      </div>
      <section class="card stack" aria-labelledby="chart-title">
        <h2 class="title-3" id="chart-title">{v.title}, by month</h2>
        <BarChart result={result} title={v.title} />
        {view === 'milestones' && <p class="xsmall muted">Uses the achievement dates you’ve recorded, including any corrections. This isn’t the same as the Progress percentages, which count milestones for {name}’s current age.</p>}
        {view === 'goals' && <p class="xsmall muted">Accomplished goals and achievements you’ve recorded, each counted once.</p>}
        {view === 'exercises' && <p class="xsmall muted">This shows participation you’ve recorded, not ability.</p>}
        {result.excludedHidden > 0 && <p class="xsmall muted" data-testid="hidden-excluded">{result.excludedHidden} hidden milestone{result.excludedHidden === 1 ? ' isn’t' : 's aren’t'} included.</p>}
        {result.undated > 0 && <p class="xsmall muted" data-testid="undated">{result.undated} recorded without a date can’t be shown by month.</p>}
        {result.laterDated > 0 && <p class="xsmall muted" data-testid="later-dated">{result.laterDated} with a date after today {result.laterDated === 1 ? 'isn’t' : 'aren’t'} shown.</p>}
        <details data-testid="chart-table">
          <summary class="small text-link" style={{ cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Show as a table</summary>
          <table class="data-table small">
            <thead><tr><th scope="col">Month</th><th scope="col">Count</th></tr></thead>
            <tbody>
              {result.buckets.map((b) => (
                <tr key={b.month} data-testid="chart-row" data-status={b.status}><th scope="row">{b.longLabel}{b.current ? ' (so far)' : ''}</th><td>{statusText(b)}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
      <p class="xsmall muted">Personal goals and exercises never change milestone progress. <a class="text-link" href={href({ name: 'growthProgress' })}>Back to Progress</a></p>
    </div>
  );
}

/** Personal Progress summary on the Progress page (simple counts; no percentages or bars). */
export function PersonalProgressCard() {
  const { activeChild } = useApp();
  const p = useChildPersonal(activeChild);
  if (!activeChild || !p.data) return null;
  const s = personalSummary(p.data, p.today);
  return (
    <section class="card section stack" aria-labelledby="personal-progress" data-testid="personal-progress">
      <h2 class="title-3" id="personal-progress">Personal progress</h2>
      <dl class="count-list">
        <div><dt>Personal accomplishments</dt><dd data-testid="pp-accomplishments">{s.accomplishments}</dd></div>
        <div><dt>Active goals</dt><dd data-testid="pp-active">{s.activeGoals}</dd></div>
        <div><dt>Exercise sessions this month</dt><dd data-testid="pp-sessions">{s.sessionsThisMonth}</dd></div>
      </dl>
      <a class="btn btn-secondary btn-block" href={href({ name: 'progressHistory', view: 'milestones' })} data-testid="view-over-time"><Icon name="chart" size={18} /> View progress over time</a>
      <p class="xsmall muted">Personal goals and exercises never change milestone progress.</p>
    </section>
  );
}
