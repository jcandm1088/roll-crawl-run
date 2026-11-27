/**
 * Calendar (Checkpoint 3, Simplified Calendar): a record-keeping calendar for parents.
 *
 * - Month grid with previous/next navigation, today and selected-day indicators, the selected day's
 *   events and an Upcoming list.
 * - Exactly three overlays, switched independently and remembered on this device: Recommended vaccine
 *   schedule (off by default; the only prepopulated one), Medical appointments and Personal. Hiding an
 *   overlay only filters what is shown; no record is changed.
 * - Markers differ by shape as well as color (R-020): a plus with four equal arms (medical), a heart (personal)
 *   and a hollow diamond (recommended vaccinations).
 * - Vaccine wording is parent-first (R-019): one visible statement about the provider's role, one
 *   visible source line with the non-endorsement, and the full source record in an expandable section.
 *   Source attribution is not repeated beside each recommendation.
 * - Vaccine references mark one day each (an age anniversary, or the first day of an age range); a range
 *   is never repeated across its days. They are reference information, not appointments.
 * - All state is per child: the inner screen is keyed by the child's id, so switching profiles closes any
 *   open editor and discards its unsaved input rather than carrying it to another profile.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { CalendarEvent, CalendarEventKind, Child } from '../../../types';
import { useApp } from '../../../state/app';
import { useToday } from '../../../state/today';
import { notifyEventsChanged, useChildEvents } from '../../../state/calendar';
import { addDays, addMonthsClamped, formatLongDate, parseLocalDate, type LocalDate } from '../../../domain/dates';
import {
  canShiftMonth, EVENT_KINDS, EventInputError, eventsOn, firstOfMonth, formatFullDate, formatMonthYear, formatShortDate, formatTime, kindSingular, lastOfMonth,
  LOCATION_MAX, MAX_YEAR, MIN_YEAR, monthGrid, NOTES_MAX, shiftMonth, TITLE_MAX, upcomingEvents, visibleEvents, WEEKDAY_NAMES, WEEKDAY_SHORT, yearMonthOf,
  type EventInput, type OverlayVisibility, type YearMonth,
} from '../../../domain/calendar';
import {
  datedReferences, markerDates, nextReferenceGroup, startAgeLabel, rangesCovering, rangesOverlapping, referencesStartingOn, VACCINE_CONTENT, VACCINE_DISCUSSION, VACCINE_DISPLAY_SOURCE,
  type DatedReference,
} from '../../../domain/vaccineSchedule';
import { createEvent, deleteEvent, updateEvent, type EventContext } from '../../../data/repositories/eventsRepo';
import { newId } from '../../../data/envelope';
import { PageHeader } from '../../components/PageHeader';
import { Sheet } from '../../components/Sheet';
import { Icon } from '../../components/Icon';
import { ErrorText } from '../../components/ChildFields';
import { childDisplayName } from '../../components/Avatar';
import { SavedBanner } from '../personal/parts';

/** The single parent-facing statement about what the vaccine dates are (owner's wording, R-019). */
export const VACCINE_DISCLAIMER = 'Your child’s healthcare provider determines their individual vaccination schedule. The dates shown are general recommendations, not scheduled appointments or confirmation of eligibility.';
/** Visible source attribution and non-endorsement (owner's wording, R-019). The date comes from the content file. */
export const VACCINE_SOURCE_SUMMARY = `Based on the CDC childhood immunization schedule, ${formatLongDate(VACCINE_CONTENT.schedule.scheduleDate)}. This app is not endorsed by CDC, HHS or the U.S. Government and has not been clinically reviewed.`;

type OverlayId = keyof OverlayVisibility;
const OVERLAYS: Array<{ id: OverlayId; label: string }> = [
  { id: 'medical', label: 'Medical appointments' },
  { id: 'personal', label: 'Personal' },
  { id: 'vaccines', label: 'Recommended vaccine schedule' },
];

export const overlaysOf = (layers: { medical?: boolean; personal?: boolean; vaccines?: boolean }): OverlayVisibility => ({
  medical: layers.medical !== false,
  personal: layers.personal !== false,
  vaccines: layers.vaccines === true,
});

/** Shape marker (decorative: every use has a text equivalent). */
export function Mark({ kind }: { kind: OverlayId }) {
  // Medical: a simple plus. Two bars of equal length and thickness crossing at their midpoints, so the four
  // arms are equal. Thin bars in the theme's own color: it is not the Red Cross emblem (thick red arms on white).
  if (kind === 'medical') {
    return (
      <svg class="cal-mark cal-mark-medical" data-shape="plus" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <rect x="5" y="1" width="2" height="10" rx="0.4" /><rect x="1" y="5" width="10" height="2" rx="0.4" />
      </svg>
    );
  }
  if (kind === 'personal') {
    return (
      <svg class="cal-mark cal-mark-personal" data-shape="heart" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M6 11 1.3 6.4a2.9 2.9 0 0 1 0-4.1 2.8 2.8 0 0 1 4 0L6 3l.7-.7a2.8 2.8 0 0 1 4 0 2.9 2.9 0 0 1 0 4.1Z" />
      </svg>
    );
  }
  return <span class="cal-mark cal-mark-vaccines" data-shape="diamond" aria-hidden="true" />;
}

export function CalendarScreen({ openAdd = false }: { openAdd?: boolean }) {
  const { activeChild } = useApp();
  if (!activeChild) return null;
  return <CalendarInner key={activeChild.id} child={activeChild} openAdd={openAdd} />;
}

type SheetState =
  | null
  | { mode: 'new'; date: LocalDate }
  | { mode: 'view'; id: string }
  | { mode: 'edit'; id: string }
  | { mode: 'delete'; id: string };

function CalendarInner({ child, openAdd }: { child: Child; openAdd: boolean }) {
  const app = useApp();
  const today = useToday();
  const { events } = useChildEvents(child);
  const overlays = overlaysOf(app.settings.layers);
  const [ym, setYm] = useState<YearMonth>(() => yearMonthOf(today));
  const [selected, setSelected] = useState<LocalDate>(today);
  const [sheet, setSheet] = useState<SheetState>(openAdd ? { mode: 'new', date: today } : null);
  const [saved, setSaved] = useState<string | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const focusDay = useRef(false);
  const gridRef = useRef<HTMLTableElement>(null);
  const ctx: EventContext = { deviceId: app.meta.deviceId, childId: child.id };

  // Opened from "New event" on Home (#/calendar/add): keep the address as the plain Calendar afterwards.
  useEffect(() => {
    if (openAdd) window.history.replaceState(null, '', '#/calendar');
  }, [openAdd]);

  // Keyboard day-to-day movement: focus follows the selected day as soon as it is rendered (a layout
  // effect, so focus is never left on a removed day when the arrow keys cross into another month).
  useLayoutEffect(() => {
    if (!focusDay.current) return;
    focusDay.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${selected}"]`)?.focus();
  }, [selected, ym]);

  const all = events ?? [];
  const shown = useMemo(() => visibleEvents(all, overlays), [events, overlays.medical, overlays.personal]);
  const dated = useMemo(() => (overlays.vaccines ? datedReferences(child.dob) : []), [overlays.vaccines, child.dob]);
  const vaccineDays = useMemo(() => markerDates(dated), [dated]);
  const byDate = useMemo(() => {
    const m = new Map<LocalDate, { medical: number; personal: number }>();
    for (const e of shown) {
      const c = m.get(e.date) ?? { medical: 0, personal: 0 };
      c[e.kind]++;
      m.set(e.date, c);
    }
    return m;
  }, [shown]);

  const select = (date: LocalDate, viaKeyboard = false) => {
    const p = parseLocalDate(date);
    if (!p || p.year < MIN_YEAR || p.year > MAX_YEAR) return;
    focusDay.current = viaKeyboard;
    setSelected(date);
    setYm({ year: p.year, month: p.month });
  };
  const goMonth = (delta: number) => {
    if (!canShiftMonth(ym, delta)) return;
    const next = shiftMonth(ym, delta);
    const t = yearMonthOf(today);
    setYm(next);
    setSelected(t.year === next.year && t.month === next.month ? today : firstOfMonth(next));
  };
  const onGridKey = (e: KeyboardEvent) => {
    const moves: Record<string, () => LocalDate> = {
      ArrowLeft: () => addDays(selected, -1),
      ArrowRight: () => addDays(selected, 1),
      ArrowUp: () => addDays(selected, -7),
      ArrowDown: () => addDays(selected, 7),
      Home: () => firstOfMonth(ym),
      End: () => lastOfMonth(ym),
      PageUp: () => addMonthsClamped(selected, -1),
      PageDown: () => addMonthsClamped(selected, 1),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    select(move(), true);
  };

  const toggle = (id: OverlayId) => void app.setSettings({ layers: { ...app.settings.layers, [id]: !overlays[id] } });

  const weeks = monthGrid(ym);
  const dayEvents = eventsOn(shown, selected);
  const hiddenToday = eventsOn(all, selected).length - dayEvents.length;
  const upcoming = upcomingEvents(shown, today);
  const upcomingShown = showAllUpcoming ? upcoming : upcoming.slice(0, 5);
  const startingToday = referencesStartingOn(dated, selected);
  const covering = rangesCovering(dated, selected).filter((d) => d.start !== selected);
  const monthRanges = rangesOverlapping(dated, firstOfMonth(ym), lastOfMonth(ym));
  const nextRef = overlays.vaccines ? nextReferenceGroup(dated, today) : null;
  const current = sheet && sheet.mode !== 'new' ? all.find((e) => e.id === sheet.id) : undefined;
  const isThisMonth = yearMonthOf(today).year === ym.year && yearMonthOf(today).month === ym.month;

  const afterSave = (event: CalendarEvent, text: string) => {
    notifyEventsChanged();
    setSheet(null);
    setSelected(event.date);
    setYm(yearMonthOf(event.date));
    setSaved(overlays[event.kind] ? text : `${text} ${EVENT_KINDS.find((k) => k.id === event.kind)!.label} are hidden right now, so it isn’t shown. Turn that on under “Show on the calendar” to see it.`);
  };

  return (
    <div data-testid="calendar">
      <PageHeader title="Calendar" intro={`Appointments and events for ${childDisplayName(child)}, kept on this device.`} />
      {saved && <SavedBanner text={saved} />}

      <button type="button" class="btn btn-primary btn-block" style={{ marginTop: 'var(--space-4)' }} data-testid="add-event" onClick={() => { setSaved(null); setSheet({ mode: 'new', date: selected }); }}>
        <Icon name="plus" size={18} /> Add event
      </button>

      <section class="card cal-card" aria-label="Month view">
        <div class="cal-nav">
          <button type="button" class="icon-btn" aria-label="Previous month" data-testid="cal-prev" disabled={!canShiftMonth(ym, -1)} onClick={() => goMonth(-1)}><Icon name="chevronLeft" /></button>
          <h2 class="title-2 cal-month" aria-live="polite" data-testid="cal-month">{formatMonthYear(ym)}</h2>
          <button type="button" class="icon-btn" aria-label="Next month" data-testid="cal-next" disabled={!canShiftMonth(ym, 1)} onClick={() => goMonth(1)}><Icon name="chevronRight" /></button>
        </div>
        <table class="cal-grid" ref={gridRef} onKeyDown={onGridKey} data-testid="cal-grid">
          <caption class="visually-hidden">{formatMonthYear(ym)}. Use the arrow keys to move between days.</caption>
          <thead>
            <tr>{WEEKDAY_SHORT.map((w, i) => <th key={w} scope="col" abbr={WEEKDAY_NAMES[i]}><span aria-hidden="true">{w}</span><span class="visually-hidden">{WEEKDAY_NAMES[i]}</span></th>)}</tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((date, di) => {
                  if (!date) return <td key={di} class="cal-blank" />;
                  const counts = byDate.get(date);
                  const vax = vaccineDays.has(date);
                  const isToday = date === today;
                  const isSelected = date === selected;
                  const label = [
                    formatFullDate(date),
                    isToday ? 'today' : '',
                    counts?.medical ? `${counts.medical} medical appointment${counts.medical === 1 ? '' : 's'}` : '',
                    counts?.personal ? `${counts.personal} personal event${counts.personal === 1 ? '' : 's'}` : '',
                    vax ? 'recommended vaccinations' : '',
                  ].filter(Boolean).join(', ');
                  return (
                    <td key={di}>
                      <button
                        type="button"
                        class={`cal-day${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`}
                        data-date={date}
                        aria-label={label}
                        aria-pressed={isSelected}
                        aria-current={isToday ? 'date' : undefined}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => select(date)}
                      >
                        <span class="cal-num">{Number(date.slice(8))}</span>
                        <span class="cal-marks">
                          {counts?.medical ? <Mark kind="medical" /> : null}
                          {counts?.personal ? <Mark kind="personal" /> : null}
                          {vax ? <Mark kind="vaccines" /> : null}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {(!isThisMonth || selected !== today) && (
          <button type="button" class="btn btn-quiet btn-sm" style={{ marginTop: 'var(--space-3)' }} data-testid="cal-today" onClick={() => select(today)}>Go to today</button>
        )}
      </section>

      <section class="section" aria-labelledby="cal-show-h">
        <h2 id="cal-show-h" class="title-2 section-title">Show on the calendar</h2>
        <div class="chips" data-testid="overlays">
          {OVERLAYS.map((o) => (
            <button key={o.id} type="button" class="chip" aria-pressed={overlays[o.id]} data-testid={`overlay-${o.id}`} onClick={() => toggle(o.id)}>
              <Mark kind={o.id} /> {o.label}
            </button>
          ))}
        </div>
        <p class="xsmall muted" style={{ margin: 'var(--space-2) var(--space-1) 0' }}>Hiding a group only hides it. Nothing is deleted.</p>
      </section>

      <section class="section" aria-labelledby="cal-day-h" data-testid="selected-day">
        <h2 id="cal-day-h" class="title-2 section-title" data-testid="selected-date">
          {formatFullDate(selected)}{selected === today && <span class="tag-mini" style={{ marginLeft: 'var(--space-2)' }}>Today</span>}
        </h2>
        {events === null ? (
          <p class="muted small">Loading…</p>
        ) : dayEvents.length === 0 ? (
          <p class="muted small" data-testid="no-events" style={{ margin: '0 var(--space-1)' }}>No events on this day.</p>
        ) : (
          <EventList events={dayEvents} today={today} showDate={false} onOpen={(id) => { setSaved(null); setSheet({ mode: 'view', id }); }} testId="day-events" />
        )}
        {hiddenToday > 0 && (
          <p class="xsmall muted" data-testid="hidden-note" style={{ margin: 'var(--space-2) var(--space-1) 0' }}>
            {hiddenToday === 1 ? '1 event on this day is hidden.' : `${hiddenToday} events on this day are hidden.`} Change “Show on the calendar” to see {hiddenToday === 1 ? 'it' : 'them'}.
          </p>
        )}
        {overlays.vaccines && (startingToday.length > 0 || covering.length > 0) && (
          <div class="vax-ref" data-testid="vax-on-day">
            {startingToday.length > 0 && <ReferenceGroup marked items={startingToday} heading={`Recommended vaccinations: ${startAgeLabel(startingToday[0]!.ref.age)}`} />}
            {covering.length > 0 && <ReferenceGroup marked={startingToday.length === 0} items={covering} heading="Recommended age ranges that include this day" />}
          </div>
        )}
      </section>

      <section class="section" aria-labelledby="cal-up-h" data-testid="upcoming">
        <h2 id="cal-up-h" class="title-2 section-title">Upcoming</h2>
        {events !== null && upcoming.length === 0 ? (
          <p class="muted small" data-testid="no-upcoming" style={{ margin: '0 var(--space-1)' }}>No upcoming events. Choose Add event to record one.</p>
        ) : (
          <EventList events={upcomingShown} today={today} showDate onOpen={(id) => { setSaved(null); setSheet({ mode: 'view', id }); }} testId="upcoming-events" />
        )}
        {upcoming.length > 5 && (
          <button type="button" class="btn btn-quiet btn-sm" style={{ marginTop: 'var(--space-3)' }} data-testid="upcoming-toggle" aria-expanded={showAllUpcoming} onClick={() => setShowAllUpcoming(!showAllUpcoming)}>
            {showAllUpcoming ? 'Show fewer' : `Show all ${upcoming.length}`}
          </button>
        )}
        {nextRef && (
          <button type="button" class="vax-next" data-testid="vax-next" onClick={() => select(nextRef.date)}>
            <Mark kind="vaccines" />
            <span>
              <span class="small" style={{ display: 'block', fontWeight: 600 }}>Next recommended vaccinations: {startAgeLabel(nextRef.items[0]!.ref.age)}</span>
              <span class="xsmall muted">{formatLongDate(nextRef.date)}</span>
            </span>
          </button>
        )}
      </section>

      {overlays.vaccines && <VaccineInfo monthRanges={monthRanges} month={formatMonthYear(ym)} />}

      {sheet?.mode === 'new' && <EventEditor ctx={ctx} date={sheet.date} onClose={() => setSheet(null)} onSaved={(e) => afterSave(e, `Event saved for ${formatLongDate(e.date)}.`)} />}
      {sheet?.mode === 'view' && current && (
        <EventView event={current} onClose={() => setSheet(null)} onEdit={() => setSheet({ mode: 'edit', id: current.id })} onDelete={() => setSheet({ mode: 'delete', id: current.id })} />
      )}
      {sheet?.mode === 'edit' && current && <EventEditor ctx={ctx} existing={current} date={current.date} onClose={() => setSheet(null)} onSaved={(e) => afterSave(e, 'Event updated.')} />}
      {sheet?.mode === 'delete' && current && (
        <DeleteEvent
          event={current}
          onClose={() => setSheet({ mode: 'view', id: current.id })}
          onConfirm={async () => {
            await deleteEvent(app.db, ctx, current.id);
            notifyEventsChanged();
            setSheet(null);
            setSaved('Event deleted.');
          }}
        />
      )}
    </div>
  );
}

export function EventList({ events, today, showDate, onOpen, testId }: { events: CalendarEvent[]; today: LocalDate; showDate: boolean; onOpen: (id: string) => void; testId: string }) {
  return (
    <ul class="list card list-card" data-testid={testId}>
      {events.map((e) => (
        <li key={e.id}>
          <button type="button" class="list-item cal-event" data-testid="event-row" onClick={() => onOpen(e.id)}>
            <Mark kind={e.kind} />
            <span class="grow" style={{ minWidth: 0 }}>
              <span class="cal-event-title">{e.title}</span>
              <span class="xsmall muted" style={{ display: 'block' }}>
                {[showDate ? (e.date === today ? 'Today' : formatShortDate(e.date, today)) : '', e.time ? formatTime(e.time) : '', kindSingular(e.kind), e.location].filter(Boolean).join(' · ')}
              </span>
            </span>
            <span class="chev"><Icon name="chevronRight" size={18} /></span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ReferenceGroup({ items, heading, marked = false }: { items: DatedReference[]; heading: string; marked?: boolean }) {
  return (
    <div class="vax-group">
      <p class="small" style={{ fontWeight: 600 }}>{marked && <Mark kind="vaccines" />}{heading}</p>
      <ul class="vax-list">
        {items.map((d) => (
          <li key={d.ref.id} data-testid="vax-item">
            <span class="small">{d.vaccineLabel} — {d.ref.dose.toLowerCase()} · {d.ref.ageLabel.toLowerCase()}</span>
            {d.shape === 'range' && <span class="xsmall muted" style={{ display: 'block' }}>By date of birth: {formatLongDate(d.start)} through {formatLongDate(d.end)}</span>}
            {d.ref.parentNote && <span class="xsmall muted" style={{ display: 'block' }}>{d.ref.parentNote}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VaccineInfo({ monthRanges, month }: { monthRanges: DatedReference[]; month: string }) {
  const s = VACCINE_CONTENT.schedule;
  return (
    <section class="section" aria-labelledby="vax-h" data-testid="vaccine-info">
      <h2 id="vax-h" class="title-2 section-title">Recommended vaccine schedule</h2>
      <div class="card stack">
        {/* The one visible statement about what these dates are (R-019). */}
        <p class="info-note" data-testid="vax-provider"><Icon name="info" size={18} /><span>{VACCINE_DISCLAIMER}</span></p>

        <details class="more-details" data-testid="vax-month">
          <summary class="small text-link">Recommended age ranges that include {month} ({monthRanges.length})</summary>
          {monthRanges.length === 0 ? (
            <p class="small muted" style={{ marginTop: 'var(--space-2)' }}>No recommended age range includes this month.</p>
          ) : (
            <ReferenceGroup items={monthRanges} heading="By date of birth" />
          )}
        </details>

        <details class="more-details" data-testid="vax-discuss">
          <summary class="small text-link">Ask your child’s provider about ({VACCINE_DISCUSSION.length})</summary>
          <p class="xsmall muted" style={{ marginTop: 'var(--space-2)' }}>These depend on your child’s situation, so they aren’t placed on a date.</p>
          <ul class="vax-list">
            {VACCINE_DISCUSSION.map((d) => (
              <li key={d.id} data-testid="vax-discuss-item">
                <span class="small" style={{ fontWeight: 600 }}>{d.label} · {d.ageLabel}</span>
                <span class="small" style={{ display: 'block' }}>{d.parentText}</span>
                {d.parentNote && <span class="xsmall muted" style={{ display: 'block' }}>{d.parentNote}</span>}
              </li>
            ))}
          </ul>
          <p class="small" style={{ marginTop: 'var(--space-3)', fontWeight: 600 }}>{VACCINE_CONTENT.moreGuidance.cdcIntro}</p>
          <ul class="vax-list">{VACCINE_CONTENT.moreGuidance.cdcItems.map((t) => <li key={t} class="small">{t}</li>)}</ul>
        </details>

        <div class="vax-source" data-testid="vax-source">
          <h3 class="title-3">Source</h3>
          {/* Attribution and non-endorsement: always visible, said once (R-019). */}
          <p class="small" data-testid="vax-source-summary">{VACCINE_SOURCE_SUMMARY}</p>
          <details class="more-details" data-testid="vax-source-details">
            <summary class="small text-link">Source details</summary>
            <div class="stack attribution" style={{ marginTop: 'var(--space-2)' }}>
              <p>
                CDC, “{s.title}” ({formatLongDate(s.scheduleDate)}), checked against CDC’s schedule, notes and addendum for health care providers. Retrieved {formatLongDate(s.retrieved)}.{' '}
                <a href={VACCINE_DISPLAY_SOURCE.url} target="_blank" rel="noopener noreferrer" data-testid="vax-source-link">View the schedule at cdc.gov<span class="visually-hidden"> (opens in a new window)</span> <Icon name="externalLink" size={14} /></a>
              </p>
              <p>CDC’s materials are available free of charge at cdc.gov. CDC’s website identified this schedule as its current schedule when it was checked on {formatLongDate(s.currencyChecked)}. Schedules change, and this copy does not update itself.</p>
              <p>The vaccine names, dose labels and ages are CDC’s. Short notes beside them are written for this app from CDC’s schedule and notes; some are CDC’s own words and some are reworded, and the complete wording is at cdc.gov.</p>
              <p>The calendar dates are worked out by this app from the date of birth (not a corrected age): a single age is marked on the day your child reaches it, and an age range runs from the day your child reaches its first age through the last day of its last age.</p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

function EventView({ event, onClose, onEdit, onDelete }: { event: CalendarEvent; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <Sheet title={event.title} onClose={onClose}>
      <div class="stack" data-testid="event-view">
        <p class="small"><Mark kind={event.kind} /> {kindSingular(event.kind)}</p>
        <dl class="kv">
          <dt>Date</dt><dd data-testid="event-view-date">{formatFullDate(event.date)}</dd>
          {event.time && <><dt>Time</dt><dd data-testid="event-view-time">{formatTime(event.time)}</dd></>}
          {event.location && <><dt>Location</dt><dd data-testid="event-view-location">{event.location}</dd></>}
        </dl>
        {event.notes && <div><p class="label">Notes</p><p class="small entry-text" data-testid="event-view-notes">{event.notes}</p></div>}
        <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
          <button type="button" class="btn btn-primary btn-block" data-testid="event-edit" onClick={onEdit}><Icon name="pencil" size={18} /> Edit</button>
          <button type="button" class="btn btn-danger btn-block" data-testid="event-delete" onClick={onDelete}><Icon name="trash" size={18} /> Delete</button>
          <button type="button" class="btn btn-quiet btn-block" onClick={onClose}>Close</button>
        </div>
      </div>
    </Sheet>
  );
}

function DeleteEvent({ event, onClose, onConfirm }: { event: CalendarEvent; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title="Delete this event?" onClose={onClose}>
      <p class="small" data-testid="delete-event-text">“{event.title}” on {formatLongDate(event.date)} will be permanently removed from the calendar. This can’t be undone.</p>
      {error && <ErrorText id="event-delete-error">{error}</ErrorText>}
      <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
        <button type="button" class="btn btn-primary btn-block" data-testid="delete-event-cancel" onClick={onClose}>Cancel — keep it</button>
        <button
          type="button"
          class="btn btn-danger btn-block"
          data-testid="delete-event-confirm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await onConfirm(); } catch (e) { setError(e instanceof EventInputError ? e.message : 'That couldn’t be deleted. Nothing was changed. Please try again.'); setBusy(false); }
          }}
        >Delete event</button>
      </div>
    </Sheet>
  );
}

function EventEditor({ ctx, existing, date, onClose, onSaved }: { ctx: EventContext; existing?: CalendarEvent; date: LocalDate; onClose: () => void; onSaved: (e: CalendarEvent) => void }) {
  const app = useApp();
  const [formId] = useState(() => newId());
  const [v, setV] = useState<EventInput>({
    kind: existing?.kind ?? 'medical',
    title: existing?.title ?? '',
    date: existing?.date ?? date,
    time: existing?.time ?? '',
    location: existing?.location ?? '',
    notes: existing?.notes ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<EventInput>) => setV((cur) => ({ ...cur, ...patch }));
  const save = async () => {
    if (saving) return;
    // The editor belongs to the child it was opened for. If another child is active now, nothing is written.
    if (app.activeChild?.id !== ctx.childId) return setError('The child profile changed while this was open, so nothing was saved. Close this and try again.');
    setSaving(true);
    setError(null);
    try {
      const event = existing ? await updateEvent(app.db, ctx, existing.id, v) : await createEvent(app.db, ctx, v, formId);
      onSaved(event);
    } catch (e) {
      // What was typed stays in the form. Only the app's own plain-language messages are shown.
      setError(e instanceof EventInputError ? e.message : 'That couldn’t be saved. What you entered is still here. Please try again.');
      setSaving(false);
    }
  };
  const kindRadio = (kind: CalendarEventKind, label: string) => (
    <label class="choice" data-testid={`event-kind-${kind}`}>
      <input type="radio" name="event-kind" value={kind} checked={v.kind === kind} onChange={() => set({ kind })} />
      <span>{label}</span>
    </label>
  );
  return (
    <Sheet title={existing ? 'Edit event' : 'Add event'} onClose={onClose}>
      <form class="stack" onSubmit={(e) => { e.preventDefault(); void save(); }} data-testid="event-form" noValidate>
        <fieldset class="choice-group">
          <legend class="label">Type</legend>
          {kindRadio('medical', 'Medical appointment')}
          {kindRadio('personal', 'Personal')}
        </fieldset>
        <p class="xsmall muted">Medical appointments can include checkups, specialists and therapy sessions.</p>
        <div class="field">
          <label class="label" for="event-title">Title</label>
          <input id="event-title" class="input" maxLength={TITLE_MAX} value={v.title} onInput={(e) => set({ title: (e.target as HTMLInputElement).value })} aria-required="true" aria-describedby={error ? 'event-error' : undefined} />
        </div>
        <div class="field">
          <label class="label" for="event-date">Date</label>
          <input id="event-date" class="input" type="date" min={`${MIN_YEAR}-01-01`} max={`${MAX_YEAR}-12-31`} value={v.date} onInput={(e) => set({ date: (e.target as HTMLInputElement).value })} aria-required="true" />
        </div>
        <div class="field">
          <label class="label" for="event-time">Time (optional)</label>
          <input id="event-time" class="input" type="time" value={v.time} onInput={(e) => set({ time: (e.target as HTMLInputElement).value })} />
        </div>
        <div class="field">
          <label class="label" for="event-location">Location (optional)</label>
          <input id="event-location" class="input" maxLength={LOCATION_MAX} value={v.location} onInput={(e) => set({ location: (e.target as HTMLInputElement).value })} />
        </div>
        <div class="field">
          <label class="label" for="event-notes">Notes (optional)</label>
          <textarea id="event-notes" class="textarea" maxLength={NOTES_MAX} value={v.notes} onInput={(e) => set({ notes: (e.target as HTMLTextAreaElement).value })} />
        </div>
        {error && <ErrorText id="event-error">{error}</ErrorText>}
        <div class="stack" style={{ marginTop: 'var(--space-5)' }}>
          <button type="submit" class="btn btn-primary btn-block" data-testid="save-event" disabled={saving}>{existing ? 'Save changes' : 'Save event'}</button>
          <button type="button" class="btn btn-quiet btn-block" data-testid="cancel-event" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Sheet>
  );
}
