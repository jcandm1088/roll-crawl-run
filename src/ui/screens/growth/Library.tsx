import { useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { keyFromTarget, useChildMilestones } from '../../../state/milestones';
import { href } from '../../../router';
import {
  APP_CATEGORIES, MILESTONES, PAGE_SOURCES, REFERENCE_AGES, REFERENCE_SOURCES, appCategoryLabel, isApplicable, referenceAgeLabel, type AppCategory, type MilestoneStatus,
} from '../../../domain/milestones';
import { formatLongDate } from '../../../domain/dates';
import { Icon } from '../../components/Icon';
import { childNameInline } from '../../components/Avatar';
import { CDC_CONCERNED_URL, CDC_MILESTONES_URL, CdcAttribution, ExternalLink, ForChild, StatusBadge } from './parts';

type CatFilter = AppCategory | 'all' | 'personal';
type StatusFilter = 'all' | MilestoneStatus;

export function LibraryScreen() {
  const { activeChild } = useApp();
  const m = useChildMilestones(activeChild);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<CatFilter>('all');
  const [age, setAge] = useState<string>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [showHidden, setShowHidden] = useState(false);
  if (!activeChild || !m.age) return null;

  const q = query.trim().toLowerCase();
  const statusOf = (id: string): MilestoneStatus => m.sourcedStates.get(id)?.status ?? 'not-yet';
  const hiddenOf = (id: string) => !!m.sourcedStates.get(id)?.hidden;
  const hiddenCount = MILESTONES.filter((d) => hiddenOf(d.id)).length;

  const sourced = cat === 'personal' ? [] : MILESTONES.filter((d) =>
    (showHidden ? hiddenOf(d.id) : !hiddenOf(d.id)) &&
    (cat === 'all' || d.appCategory === cat) &&
    (age === 'all' || d.referenceAgeMonths === Number(age)) &&
    (status === 'all' || statusOf(d.id) === status) &&
    (!q || d.text.toLowerCase().includes(q)));

  const personal = (m.data?.personal ?? []).filter((p) => {
    const rec = m.recordFor({ kind: 'personal', customId: p.id });
    return (cat === 'all' || cat === 'personal' || p.appCategory === cat) &&
      (showHidden ? !!rec?.hidden : !rec?.hidden) &&
      (age === 'all' || p.referenceAgeMonths === Number(age)) &&
      (status === 'all' || (rec?.status ?? 'not-yet') === status) &&
      (!q || `${p.title} ${p.description}`.toLowerCase().includes(q));
  });

  return (
    <div>
      <ForChild child={activeChild} />
      <CdcAttribution />
      <a class="card section-link section" href={href({ name: 'growthAbout' })} data-testid="about-link">
        <span class="icon-wrap"><Icon name="info" /></span>
        <span class="grow"><span class="title-3" style={{ display: 'block' }}>About these milestones</span><span class="small muted">What they mean, where they come from, and how progress works</span></span>
        <span class="chev"><Icon name="chevronRight" size={20} /></span>
      </a>

      <div class="section stack">
        <div class="search-field">
          <Icon name="search" size={18} />
          <label class="visually-hidden" for="ms-search">Search milestones</label>
          <input id="ms-search" class="input" type="search" placeholder="Search milestones" value={query} onInput={(e) => setQuery((e.target as HTMLInputElement).value)} />
        </div>
        <div class="chips" role="group" aria-label="Area">
          <button type="button" class="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>All areas</button>
          {APP_CATEGORIES.map((c) => <button type="button" key={c.id} class="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</button>)}
          <button type="button" class="chip" aria-pressed={cat === 'personal'} onClick={() => setCat('personal')}>Your versions</button>
        </div>
        <div class="input-row">
          <label>
            <span class="label">Age</span>
            <select class="select" value={age} onChange={(e) => setAge((e.target as HTMLSelectElement).value)} aria-label="Reference age">
              <option value="all">All ages</option>
              {REFERENCE_AGES.map((a) => <option key={a} value={String(a)}>{referenceAgeLabel(a)}</option>)}
            </select>
          </label>
          <label>
            <span class="label">Status</span>
            <select class="select" value={status} onChange={(e) => setStatus((e.target as HTMLSelectElement).value as StatusFilter)} aria-label="Status">
              <option value="all">Any status</option>
              <option value="not-yet">Not yet observed</option>
              <option value="emerging">Emerging</option>
              <option value="achieved">Achieved</option>
            </select>
          </label>
        </div>
        <button type="button" class="chip" aria-pressed={showHidden} onClick={() => setShowHidden(!showHidden)} data-testid="toggle-hidden" style={{ alignSelf: 'flex-start' }}>
          <Icon name="eyeOff" size={16} /> Hidden milestones ({hiddenCount})
        </button>
      </div>

      <p class="small muted" style={{ margin: 'var(--space-4) var(--space-1) var(--space-2)' }} role="status" data-testid="result-count">
        {showHidden ? `${sourced.length + personal.length} hidden` : `${sourced.length + personal.length} milestone${sourced.length + personal.length === 1 ? '' : 's'}`}
      </p>
      {sourced.length + personal.length === 0 ? (
        <p class="card small muted">{showHidden ? 'Nothing is hidden. Hidden milestones aren’t counted in progress; you can restore them anytime.' : 'No milestones match. Try a different search or filter.'}</p>
      ) : (
        <ul class="ms-list card list-card">
          {personal.map((p) => {
            const rec = m.recordFor({ kind: 'personal', customId: p.id });
            return (
              <li key={p.id}>
                <a class="ms-item" href={href({ name: 'growthMilestone', key: keyFromTarget({ kind: 'personal', customId: p.id }) })} data-testid="milestone-row">
                  <span class="ms-text">{p.title}<span class="ms-meta">Your version{p.referenceAgeMonths ? ` · based on CDC, ${referenceAgeLabel(p.referenceAgeMonths)}` : ''}</span></span>
                  <StatusBadge status={rec?.status ?? 'not-yet'} />
                </a>
              </li>
            );
          })}
          {sourced.map((d) => (
            <li key={d.id}>
              <a class="ms-item" href={href({ name: 'growthMilestone', key: d.id })} data-testid="milestone-row" data-id={d.id}>
                <span class="ms-text">
                  {d.text}
                  <span class="ms-meta">{d.referenceAgeLabel} · {appCategoryLabel(d.appCategory)}{!isApplicable(d, m.age!.months) ? ' · upcoming' : ''}</span>
                </span>
                <StatusBadge status={statusOf(d.id)} />
              </a>
            </li>
          ))}
        </ul>
      )}
      <p class="attribution" style={{ margin: 'var(--space-4) var(--space-1)' }}>Source: CDC. Not endorsed by CDC, HHS, or the U.S. Government.</p>
    </div>
  );
}

export function AboutMilestonesScreen() {
  const { activeChild } = useApp();
  const name = activeChild ? childNameInline(activeChild) : 'your child';
  const keyPoints = REFERENCE_SOURCES.find((s) => s.id === 'cdc-ltsae-key-points')!;
  return (
    <div class="stack-lg" data-testid="about-milestones">
      <CdcAttribution />
      <section class="card stack small">
        <h2 class="title-2">What these milestones are</h2>
        <p>Developmental milestones are things most children can do by a certain age — in how they play, learn, speak, act, and move. Each milestone here comes word-for-word from CDC’s “Learn the Signs. Act Early.” checklists, which list skills <strong>most children (75% or more)</strong> show by each age.</p>
        <p><strong>Children develop at different rates.</strong> A milestone age is the age by which most children show a skill — not a deadline, and not the age every child should reach it.</p>
        <p>CDC explains that its checklists aren’t developmental guidelines or standards, and shouldn’t be used as screening or diagnostic tools. In the same way, what you record in this app isn’t a clinical assessment, a screening, or a diagnosis.</p>
        <p>If {name} isn’t showing a milestone, has lost skills, or you have any concern, talk with {name}’s healthcare provider. CDC’s page <ExternalLink url={CDC_CONCERNED_URL}>Concerned about your child’s development?</ExternalLink> explains next steps.</p>
      </section>

      <section class="card stack small">
        <h2 class="title-2">How they’re organized</h2>
        <p>CDC groups milestones into four areas: Social/Emotional, Language/Communication, Cognitive, and Movement/Physical. Every milestone keeps its CDC area.</p>
        <p><strong>Gross motor and fine motor are this app’s own grouping</strong>, not CDC’s and not a clinical classification. To make movement easier to follow, the app splits CDC’s Movement/Physical milestones into gross motor (head control, posture, balance, and getting around) and fine motor (using hands and fingers — like grasping, feeding, drawing, and dressing). Each milestone appears in exactly one area.</p>
        <p>Milestones are listed by CDC’s ages: 2, 4, 6, and 9 months; 1 year; 15, 18 months; 2 years; 30 months; 3, 4, and 5 years. The three-month age ranges in What to Expect are just a way to browse — a milestone published “by 6 months” is shown in 3–6 months, and its age never changes. CDC has no milestones for some ranges (such as 18–21 months), and none are added to fill them. CDC’s checklists end at age 5.</p>
      </section>

      <section class="card stack small">
        <h2 class="title-2">How progress works</h2>
        <p>Progress counts the CDC milestones for {name}’s age and younger, and shows how many you’ve marked <strong>Achieved</strong> — for example “7 of 9 achieved.” Emerging milestones are shown separately and don’t count as achieved. Milestones for older ages don’t count until {name} reaches them, even if you record them early. Hidden milestones and your personal versions aren’t counted.</p>
        <p>The app never marks anything achieved for you — not based on age, and not because a later milestone was achieved.</p>
        <p><strong>Age used for milestones:</strong> chronological age (from the date of birth) unless you turned on corrected age for {name} and chose to use it. Before the due date, no milestones count yet. The app doesn’t decide whether or how long to use corrected age — ask your child’s provider. You can change this in {name}’s profile.</p>
      </section>

      <section class="card stack small">
        <h2 class="title-2">Your records</h2>
        <p>Changes are saved on this device and kept in each milestone’s history, so earlier entries aren’t lost when you change a status or correct a date. Removing an observation hides it but keeps it in this device’s history; you can erase it permanently from the history. Deleting {name}’s profile or resetting the app permanently removes everything.</p>
        <p>A personal version is your own copy of a milestone that you can reword. It’s marked “Your version,” never changes the CDC milestone, and isn’t counted in CDC progress.</p>
      </section>

      <section class="card stack small" data-testid="about-sources">
        <h2 class="title-2">Sources</h2>
        <p>Centers for Disease Control and Prevention, “Learn the Signs. Act Early.” milestone checklists. CDC made the revised (2022) checklists available in February 2022 (<ExternalLink url={keyPoints.url}>Key Points</ExternalLink>). The age pages used here were last reviewed by CDC on {formatLongDate(PAGE_SOURCES[0]!.contentLastReviewed)} and copied on {formatLongDate(PAGE_SOURCES[0]!.retrieved)}.</p>
        <p>The original checklists, photos, and videos are available free from CDC at <ExternalLink url={CDC_MILESTONES_URL}>cdc.gov</ExternalLink>. CDC’s photos and videos aren’t included in this app. CDC may update its materials, so check cdc.gov for the latest version.</p>
        <ul class="small" style={{ paddingLeft: '1.2em', margin: 0 }}>
          {PAGE_SOURCES.map((s) => <li key={s.id}><ExternalLink url={s.url}>{s.title}</ExternalLink></li>)}
        </ul>
        <p class="muted">Links open cdc.gov in your browser and need an internet connection. Everything else on this page works offline.</p>
      </section>
    </div>
  );
}
