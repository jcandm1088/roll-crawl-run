import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { useApp } from '../../../state/app';
import { keyFromTarget, useChildMilestones } from '../../../state/milestones';
import { loadLibraryState, saveLibraryState } from '../../../state/libraryState';
import { href, parseHash, replaceRoute, type LibraryPreset } from '../../../router';
import {
  APP_CATEGORIES, MILESTONES, PAGE_SOURCES, REFERENCE_AGES, REFERENCE_SOURCES, appCategoryLabel, isApplicable, referenceAgeLabel, type MilestoneDef, type MilestoneStatus,
} from '../../../domain/milestones';
import { DEFAULT_FILTERS, matchesElsewhere, selectSourced, viewCounts, type LibraryFilters, type LibraryView } from '../../../domain/library';
import { formatLongDate } from '../../../domain/dates';
import { Icon } from '../../components/Icon';
import { childNameInline } from '../../components/Avatar';
import { CDC_CONCERNED_URL, CDC_MILESTONES_URL, CdcAttribution, ExternalLink, ForChild, StatusBadge } from './parts';

const VIEW_LABEL: Record<LibraryView, string> = { now: 'Up to now', upcoming: 'Upcoming', all: 'All 159' };

function filtersFromPreset(preset: LibraryPreset): LibraryFilters {
  return { ...DEFAULT_FILTERS, view: preset.view, area: preset.area ?? 'all' };
}

/**
 * Milestone Library — the place to RECORD milestones. Opens on "Up to now" (applicable, visible CDC
 * milestones, most recent CDC age first). Its view, filters, search and scroll position are kept in
 * memory (never stored) while moving to a milestone and back, for the same child only.
 */
export function LibraryScreen({ preset }: { preset: LibraryPreset | null }) {
  const { activeChild } = useApp();
  const m = useChildMilestones(activeChild);
  const childId = activeChild?.id ?? '';
  const [f, setF] = useState<LibraryFilters>(() => (preset ? filtersFromPreset(preset) : loadLibraryState(childId)?.filters ?? DEFAULT_FILTERS));
  const restoreY = useRef<number | null>(preset ? 0 : loadLibraryState(childId)?.scrollY ?? 0);
  const shownFor = useRef(childId);

  // A preset (from Home, Growth or Progress) is applied once; the address then becomes the plain
  // Library address so that Back from a milestone restores the Library as it was left.
  // Only while the address is still the preset address: if the parent has already moved on, leave it alone
  // (otherwise the replacement could override a newer navigation).
  useEffect(() => {
    if (preset && JSON.stringify(parseHash(window.location.hash)) === JSON.stringify({ name: 'growthLibrary', preset })) replaceRoute({ name: 'growthLibrary', preset: null });
  }, []);

  // Switching child: never carry filters or scroll position over to another child's records.
  useEffect(() => {
    if (shownFor.current !== childId) {
      shownFor.current = childId;
      setF(DEFAULT_FILTERS);
      restoreY.current = null;
      window.scrollTo(0, 0);
    }
  }, [childId]);

  useEffect(() => { if (childId) saveLibraryState({ childId, filters: f, scrollY: loadLibraryState(childId)?.scrollY ?? 0 }); }, [childId, f]);

  // Restore the scroll position once the child's records have loaded (the list is then complete).
  useLayoutEffect(() => {
    if (m.loading || restoreY.current === null) return;
    const y = restoreY.current;
    restoreY.current = null;
    if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y));
  }, [m.loading]);

  if (!activeChild || !m.age) return null;
  const set = (patch: Partial<LibraryFilters>) => setF({ ...f, ...patch });
  const rememberScroll = () => saveLibraryState({ childId, filters: f, scrollY: window.scrollY });

  const name = childNameInline(activeChild);
  const months = m.age.months;
  const statusOf = (id: string): MilestoneStatus => m.sourcedStates.get(id)?.status ?? 'not-yet';
  const counts = viewCounts(months, m.sourcedStates);
  const hiddenApplicable = MILESTONES.filter((d) => m.sourcedStates.get(d.id)?.hidden && isApplicable(d, months)).length;
  const sourced = selectSourced(f, months, m.sourcedStates);
  const q = f.query.trim().toLowerCase();
  const personal = (m.data?.personal ?? []).filter((p) => {
    const rec = m.recordFor({ kind: 'personal', customId: p.id });
    return (f.area === 'all' || f.area === 'personal' || p.appCategory === f.area) &&
      (f.showHidden ? !!rec?.hidden : !rec?.hidden) &&
      (f.age === 'all' || p.referenceAgeMonths === f.age) &&
      (f.status === 'all' || (rec?.status ?? 'not-yet') === f.status) &&
      (!q || `${p.title} ${p.description}`.toLowerCase().includes(q));
  });
  const total = sourced.length + personal.length;
  const filtered = !!q || f.area !== 'all' || f.age !== 'all' || f.status !== 'all';
  const elsewhere = total === 0 && filtered ? matchesElsewhere(f, months, m.sourcedStates) : null;

  const catalogLabel =
    f.view === 'all'
      ? counts.hidden > 0
        ? `All ${counts.catalog} CDC milestones · ${counts.visible} shown · ${counts.hidden} hidden`
        : `All ${counts.catalog} CDC milestones`
      : f.view === 'now'
        ? `${counts.now} CDC milestone${counts.now === 1 ? '' : 's'} apply to ${name} now`
        : `${counts.upcoming} upcoming CDC milestone${counts.upcoming === 1 ? '' : 's'}, nearest first`;

  // Group rows under their CDC age, keeping the view's order.
  const groups: Array<{ age: number; defs: MilestoneDef[] }> = [];
  for (const d of sourced) {
    const last = groups[groups.length - 1];
    if (last && last.age === d.referenceAgeMonths) last.defs.push(d);
    else groups.push({ age: d.referenceAgeMonths, defs: [d] });
  }

  const emptyNow = f.view === 'now' && !filtered && !f.showHidden && counts.now === 0;

  return (
    <div>
      <ForChild child={activeChild} />
      <p class="info-note" data-testid="record-guidance">
        <Icon name="info" size={18} />
        <span>
          Tap a milestone to record it. Milestones marked <strong>Achieved</strong> that apply now count toward Progress.{' '}
          <a class="text-link" href={href({ name: 'growthProgress' })}>See Progress</a>
        </span>
      </p>

      <div class="segmented section" role="group" aria-label="Which milestones" data-testid="library-views">
        {(['now', 'upcoming', 'all'] as const).map((v) => (
          <button type="button" key={v} aria-pressed={f.view === v} data-testid={`view-${v}`} onClick={() => { set({ view: v }); window.scrollTo(0, 0); }}>
            {v === 'all' ? VIEW_LABEL.all : `${VIEW_LABEL[v]} (${v === 'now' ? counts.now : counts.upcoming})`}
          </button>
        ))}
      </div>
      <p class="small muted" style={{ margin: 'var(--space-2) var(--space-1) 0' }} data-testid="catalog-label">{catalogLabel}</p>

      <div class="section stack">
        <div class="search-field">
          <Icon name="search" size={18} />
          <label class="visually-hidden" for="ms-search">Search milestones</label>
          <input id="ms-search" class="input" type="search" placeholder="Search milestones" value={f.query} onInput={(e) => set({ query: (e.target as HTMLInputElement).value })} />
        </div>
        <div class="chips" role="group" aria-label="Area">
          <button type="button" class="chip" aria-pressed={f.area === 'all'} onClick={() => set({ area: 'all' })}>All areas</button>
          {APP_CATEGORIES.map((c) => <button type="button" key={c.id} class="chip" aria-pressed={f.area === c.id} onClick={() => set({ area: c.id })}>{c.label}</button>)}
          <button type="button" class="chip" aria-pressed={f.area === 'personal'} onClick={() => set({ area: 'personal' })}>Your versions</button>
        </div>
        <div class="input-row">
          <label>
            <span class="label">Age</span>
            <select class="select" value={String(f.age)} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; set({ age: v === 'all' ? 'all' : Number(v) }); }} aria-label="Reference age">
              <option value="all">All ages</option>
              {REFERENCE_AGES.map((a) => <option key={a} value={String(a)}>{referenceAgeLabel(a)}</option>)}
            </select>
          </label>
          <label>
            <span class="label">Status</span>
            <select class="select" value={f.status} onChange={(e) => set({ status: (e.target as HTMLSelectElement).value as LibraryFilters['status'] })} aria-label="Status">
              <option value="all">Any status</option>
              <option value="not-yet">Not yet observed</option>
              <option value="emerging">Emerging</option>
              <option value="achieved">Achieved</option>
            </select>
          </label>
        </div>
        <button type="button" class="chip" aria-pressed={f.showHidden} onClick={() => set({ showHidden: !f.showHidden })} data-testid="toggle-hidden" style={{ alignSelf: 'flex-start' }}>
          <Icon name="eyeOff" size={16} /> Hidden milestones ({counts.hidden})
        </button>
      </div>

      <p class="small muted" style={{ margin: 'var(--space-4) var(--space-1) var(--space-2)' }} role="status" data-testid="result-count">
        {f.showHidden ? `${total} hidden` : `${total} milestone${total === 1 ? '' : 's'}`}
      </p>

      {total === 0 ? (
        <div class="card small stack" data-testid="library-empty">
          {emptyNow ? (
            months === null ? (
              <p>No CDC milestones apply yet, because {name}’s due date hasn’t arrived. You can still record milestones early.</p>
            ) : hiddenApplicable > 0 ? (
              <p>All the milestones that apply to {name} now are hidden. Hidden milestones aren’t counted in progress; you can restore them anytime.</p>
            ) : (
              <p>No CDC milestones apply yet. The first are listed “by 2 months.” You can still record milestones early.</p>
            )
          ) : (
            <p class="muted">{f.showHidden ? 'Nothing is hidden here. Hidden milestones aren’t counted in progress; you can restore them anytime.' : 'No milestones match. Try a different search or filter.'}</p>
          )}
          {emptyNow && hiddenApplicable > 0 && <button type="button" class="btn btn-outline btn-sm" onClick={() => set({ showHidden: true })}>Show hidden milestones</button>}
          {emptyNow && hiddenApplicable === 0 && <button type="button" class="btn btn-outline btn-sm" onClick={() => set({ view: 'upcoming' })} data-testid="go-upcoming">See upcoming milestones</button>}
          {elsewhere && (['now', 'upcoming', 'all'] as const).filter((v) => v !== f.view && elsewhere[v] > 0 && !(v === 'all' && f.view !== 'all' && elsewhere.now + elsewhere.upcoming > 0)).map((v) => (
            <button type="button" key={v} class="btn btn-outline btn-sm" onClick={() => set({ view: v })} data-testid={`matches-${v}`}>
              {elsewhere[v]} match{elsewhere[v] === 1 ? '' : 'es'} in {VIEW_LABEL[v]} — show
            </button>
          ))}
        </div>
      ) : (
        <div onClickCapture={rememberScroll}>
          {personal.length > 0 && (
            <section aria-label="Your versions">
              <h3 class="ms-group-title">Your versions</h3>
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
              </ul>
            </section>
          )}
          {groups.map((g) => (
            <section key={g.age} aria-label={referenceAgeLabel(g.age)} data-testid="library-group" data-age={g.age}>
              <h3 class="ms-group-title">{referenceAgeLabel(g.age)}{!isApplicable({ referenceAgeMonths: g.age }, months) && <span class="xsmall" style={{ fontWeight: 500 }}> · upcoming for {name}</span>}</h3>
              <ul class="ms-list card list-card">
                {g.defs.map((d) => (
                  <li key={d.id}>
                    <a class="ms-item" href={href({ name: 'growthMilestone', key: d.id })} data-testid="milestone-row" data-id={d.id}>
                      <span class="ms-text">
                        {d.text}
                        <span class="ms-meta">{appCategoryLabel(d.appCategory)}</span>
                      </span>
                      <StatusBadge status={statusOf(d.id)} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <a class="card section-link section" href={href({ name: 'growthAbout' })} data-testid="about-link">
        <span class="icon-wrap"><Icon name="info" /></span>
        <span class="grow"><span class="title-3" style={{ display: 'block' }}>About these milestones</span><span class="small muted">What they mean, where they come from, and how progress works</span></span>
        <span class="chev"><Icon name="chevronRight" size={20} /></span>
      </a>
      <div class="section"><CdcAttribution /></div>
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
        <p><strong>A milestone age isn’t a deadline.</strong> Because CDC’s milestones are things most children (75% or more) do by that age, not all, a milestone age isn’t the age every child reaches it.</p>
        <p>CDC explains that its checklists aren’t developmental guidelines or standards, and shouldn’t be used as screening or diagnostic tools. In the same way, what you record in this app isn’t a clinical assessment, a screening, or a diagnosis.</p>
        <p>If {name} isn’t showing a milestone, has lost skills, or you have any concern, talk with {name}’s healthcare provider. CDC’s page <ExternalLink url={CDC_CONCERNED_URL}>Concerned About Your Child’s Development?</ExternalLink> has more information.</p>
      </section>

      <section class="card stack small">
        <h2 class="title-2">How they’re organized</h2>
        <p>CDC groups milestones into four areas: Social/Emotional, Language/Communication, Cognitive, and Movement/Physical Development. Every milestone keeps its CDC area.</p>
        <p><strong>Gross motor and fine motor are this app’s own grouping</strong>, not CDC’s and not a clinical classification. To make movement easier to follow, the app splits CDC’s Movement/Physical milestones into gross motor (head control, posture, balance, and getting around) and fine motor (using hands and fingers — like grasping, feeding, drawing, and dressing). Each milestone appears in exactly one area.</p>
        <p>Milestones are listed by CDC’s ages: 2, 4, 6, and 9 months; 1 year; 15, 18 months; 2 years; 30 months; 3, 4, and 5 years. The three-month age ranges in What to Expect at Every Age are just a way to browse — a milestone published “by 6 months” is shown in 3–6 months, and its age never changes. CDC has no milestones for some ranges (such as 18–21 months), and none are added to fill them. CDC’s checklists end at age 5.</p>
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
