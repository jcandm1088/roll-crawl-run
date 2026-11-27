/**
 * Simplified Calendar (Checkpoint 3): month arithmetic, event rules and ordering, and the vaccine
 * schedule reference (content, source meaning and date display conventions). FICTIONAL data only.
 */
import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '../../src/types';
import {
  canShiftMonth, compareEvents, eventsOn, EventInputError, formatFullDate, formatMonthYear, formatShortDate, formatTime, homeUpcoming, isCalendarEvent, isValidTime,
  MAX_YEAR, MIN_YEAR, monthGrid, shiftMonth, upcomingEvents, validateEventInput, visibleEvents, weekdayOf, yearMonthOf, type EventInput,
} from '../../src/domain/calendar';
import {
  ageLabelOf, datedReferences, markerDates, nextReferenceGroup, rangesCovering, rangesOverlapping, referenceDates, referencesStartingOn, startAgeLabel,
  validateVaccines, VACCINE_CONTENT, VACCINE_DISCUSSION, VACCINE_REFERENCES, type ReferenceAge, type VaccineContent,
} from '../../src/domain/vaccineSchedule';

const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'e', createdAt: 't', updatedAt: 't', deletedAt: null, rev: 1, originDeviceId: 'd', lastModifiedBy: 'd',
  recordType: 'calendarEvent', childId: 'c1', kind: 'medical', title: 'Fictional event', date: '2026-11-26', time: null, location: '', notes: '', ...over,
});
const input = (over: Partial<EventInput> = {}): EventInput => ({ kind: 'medical', title: 'Fictional checkup', date: '2026-11-30', time: '', location: '', notes: '', ...over });

describe('month grid and navigation', () => {
  it('knows the weekday of fixed dates', () => {
    expect(weekdayOf('1970-01-01')).toBe(4); // Thursday
    expect(weekdayOf('2026-11-26')).toBe(4); // Thursday
    expect(weekdayOf('2000-02-29')).toBe(2); // Tuesday
    expect(weekdayOf('2026-11-01')).toBe(0); // Sunday
    expect(weekdayOf('1969-12-31')).toBe(3); // Wednesday (before the epoch)
  });

  it('lays out November 2026 (starts on a Sunday, 30 days, 5 weeks)', () => {
    const g = monthGrid({ year: 2026, month: 11 });
    expect(g).toHaveLength(5);
    expect(g[0]![0]).toBe('2026-11-01');
    expect(g[4]!.slice(0, 3)).toEqual(['2026-11-29', '2026-11-30', null]);
    expect(g.flat().filter(Boolean)).toHaveLength(30);
    expect(g.every((w) => w.length === 7)).toBe(true);
  });

  it('handles February in leap and common years', () => {
    const leap = monthGrid({ year: 2024, month: 2 });
    expect(leap.flat().filter(Boolean)).toHaveLength(29);
    expect(leap[0]!.slice(0, 5)).toEqual([null, null, null, null, '2024-02-01']); // Thursday
    expect(leap.flat().filter(Boolean).at(-1)).toBe('2024-02-29');
    const common = monthGrid({ year: 2026, month: 2 });
    expect(common).toHaveLength(4); // Feb 2026 starts on a Sunday: exactly four weeks
    expect(common.flat().every(Boolean)).toBe(true);
    expect(monthGrid({ year: 2100, month: 2 }).flat().filter(Boolean)).toHaveLength(28); // 2100 is not a leap year
    expect(monthGrid({ year: 2000, month: 2 }).flat().filter(Boolean)).toHaveLength(29); // 2000 is
  });

  it('a 31-day month starting on a Saturday needs six weeks', () => {
    const g = monthGrid({ year: 2026, month: 8 }); // August 1, 2026 is a Saturday
    expect(g).toHaveLength(6);
    expect(g[0]![6]).toBe('2026-08-01');
    expect(g[5]!.slice(0, 2)).toEqual(['2026-08-30', '2026-08-31']);
  });

  it('moves between months and across years', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 11 }, 14)).toEqual({ year: 2028, month: 1 });
    expect(shiftMonth({ year: 2026, month: 3 }, -15)).toEqual({ year: 2024, month: 12 });
    expect(formatMonthYear({ year: 2027, month: 1 })).toBe('January 2027');
    expect(yearMonthOf('2026-11-26')).toEqual({ year: 2026, month: 11 });
    expect(canShiftMonth({ year: MIN_YEAR, month: 1 }, -1)).toBe(false);
    expect(canShiftMonth({ year: MAX_YEAR, month: 12 }, 1)).toBe(false);
    expect(canShiftMonth({ year: 2026, month: 11 }, 1)).toBe(true);
  });

  it('formats dates and times in plain language', () => {
    expect(formatFullDate('2026-11-26')).toBe('Thursday, November 26, 2026');
    expect(formatShortDate('2026-11-30', '2026-11-26')).toBe('Mon, Nov 30');
    expect(formatShortDate('2027-01-04', '2026-11-26')).toBe('Mon, Jan 4, 2027');
    expect(formatTime('09:30')).toBe('9:30 AM');
    expect(formatTime('00:05')).toBe('12:05 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('23:59')).toBe('11:59 PM');
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:30')).toBe(false);
  });
});

describe('event validation', () => {
  it('accepts a title and date alone; optional fields stay empty', () => {
    expect(validateEventInput(input())).toEqual({ kind: 'medical', title: 'Fictional checkup', date: '2026-11-30', time: null, location: '', notes: '' });
  });
  it('trims text and keeps the optional fields', () => {
    expect(validateEventInput(input({ kind: 'personal', title: '  Fictional visit ', time: '14:05', location: ' Sample Park ', notes: ' Bring snacks ' })))
      .toEqual({ kind: 'personal', title: 'Fictional visit', date: '2026-11-30', time: '14:05', location: 'Sample Park', notes: 'Bring snacks' });
  });
  it('rejects missing or invalid input with a plain message and never adjusts a date', () => {
    const bad: Array<[Partial<EventInput>, RegExp]> = [
      [{ title: '   ' }, /enter a title/],
      [{ title: 'x'.repeat(121) }, /120 characters/],
      [{ date: '' }, /valid date/],
      [{ date: '2026-02-30' }, /valid date/],
      [{ date: '2023-02-29' }, /valid date/],
      [{ date: '1889-01-01' }, /between 1990 and 2100/],
      [{ date: '2101-01-01' }, /between 1990 and 2100/],
      [{ time: '25:00' }, /valid time/],
      [{ time: '9am' }, /valid time/],
      [{ location: 'x'.repeat(201) }, /200 characters/],
      [{ notes: 'x'.repeat(2001) }, /2000 characters/],
      [{ kind: 'vaccine' as never }, /Medical appointment or Personal/],
    ];
    for (const [patch, message] of bad) {
      expect(() => validateEventInput(input(patch)), JSON.stringify(patch)).toThrow(EventInputError);
      expect(() => validateEventInput(input(patch))).toThrow(message);
    }
    expect(validateEventInput(input({ date: '2024-02-29' })).date).toBe('2024-02-29');
  });
  it('recognises only real calendar events in the store', () => {
    expect(isCalendarEvent(ev({}))).toBe(true);
    expect(isCalendarEvent({ id: 'e1', childId: 'c1' })).toBe(false);
    expect(isCalendarEvent(ev({ kind: 'vaccine' as never }))).toBe(false);
    expect(isCalendarEvent(ev({ date: '2026-13-01' }))).toBe(false);
    expect(isCalendarEvent(ev({ time: '7pm' }))).toBe(false);
    expect(isCalendarEvent(null)).toBe(false);
  });
});

describe('ordering, overlays and upcoming events', () => {
  const list = [
    ev({ id: '5', date: '2026-12-03', time: '14:00', title: 'Fictional therapy' }),
    ev({ id: '2', date: '2026-11-30', time: '16:00', kind: 'personal', title: 'Fictional play group' }),
    ev({ id: '1', date: '2026-11-30', time: '09:30', title: 'Fictional checkup' }),
    ev({ id: '3', date: '2026-11-30', time: null, kind: 'personal', title: 'Fictional all-day visit' }),
    ev({ id: '0', date: '2026-11-25', title: 'Fictional past visit' }),
    ev({ id: '4', date: '2026-11-26', kind: 'personal', title: 'fictional today' }),
    ev({ id: '6', date: '2026-11-30', time: '09:30', title: 'A fictional earlier title' }),
  ];
  it('sorts by date, then all-day first, then time, then title', () => {
    expect([...list].sort(compareEvents).map((e) => e.id)).toEqual(['0', '4', '3', '6', '1', '2', '5']);
  });
  it('upcoming includes today and later, never the past', () => {
    expect(upcomingEvents(list, '2026-11-26').map((e) => e.id)).toEqual(['4', '3', '6', '1', '2', '5']);
    expect(upcomingEvents(list, '2026-12-04')).toEqual([]);
  });
  it('each overlay filters independently and never alters the records', () => {
    const before = JSON.stringify(list);
    expect(visibleEvents(list, { medical: true, personal: false, vaccines: false }).every((e) => e.kind === 'medical')).toBe(true);
    expect(visibleEvents(list, { medical: false, personal: true, vaccines: true }).map((e) => e.id)).toEqual(['4', '3', '2']);
    expect(visibleEvents(list, { medical: false, personal: false, vaccines: true })).toEqual([]);
    expect(visibleEvents(list, { medical: true, personal: true, vaccines: false })).toHaveLength(7);
    expect(JSON.stringify(list)).toBe(before);
  });
  it('selected-day and Home lists follow the same rules', () => {
    expect(eventsOn(list, '2026-11-30').map((e) => e.id)).toEqual(['3', '6', '1', '2']);
    expect(homeUpcoming(list, { medical: true, personal: true, vaccines: false }, '2026-11-26').map((e) => e.id)).toEqual(['4', '3', '6']);
    expect(homeUpcoming(list, { medical: true, personal: false, vaccines: true }, '2026-11-26').map((e) => e.id)).toEqual(['6', '1', '5']);
  });
});

describe('vaccine schedule reference: bundled snapshot', () => {
  it('passes validation and names its source, version and retrieval date', () => {
    expect(validateVaccines()).toEqual([]);
    expect(VACCINE_CONTENT.schedule).toMatchObject({ organization: 'CDC', scheduleDate: '2025-07-02', retrieved: '2026-11-27', title: 'Recommended Immunizations for Birth Through 6 Years Old, United States, 2025' });
    expect(VACCINE_CONTENT.sources.map((s) => s.url)).toEqual([
      'https://www.cdc.gov/vaccines/imz-schedules/child-easyread.html',
      'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-age.html',
      'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html',
      'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-addendum.html',
    ]);
    expect(JSON.stringify(VACCINE_CONTENT)).not.toMatch(/aap\.org|healthychildren|pathways/i);
  });

  it('validation catches broken content', () => {
    const clone = (): VaccineContent => JSON.parse(JSON.stringify(VACCINE_CONTENT)) as VaccineContent;
    const a = clone(); a.references[0]!.id = a.references[1]!.id;
    expect(validateVaccines(a).join()).toMatch(/duplicate id/);
    const b = clone(); b.references.find((r) => r.id === 'cdc25-dtap-4')!.ageLabel = '15–19 months';
    expect(validateVaccines(b).join()).toMatch(/does not match its age/);
    const c = clone(); c.discussion[0]!.appNote = 'Give on November 30';
    expect(validateVaccines(c).join()).toMatch(/must not carry a date/);
    const d = clone(); d.discussion[5]!.appNote = '2 doses 2024–25 Moderna';
    expect(validateVaccines(d).join()).toMatch(/seasonal product wording/);
    const e = clone(); e.sources[0]!.url = 'https://example.org/schedule';
    expect(validateVaccines(e).join()).toMatch(/cdc\.gov/);
    const f = clone(); (f.references[5]!.age as { months: number }).months = 2.5;
    expect(validateVaccines(f).join()).toMatch(/out of range/);
    const g = clone(); g.references.find((r) => r.id === 'cdc25-hepb-3')!.age = { kind: 'range', fromMonths: 18, throughMonths: 6 };
    expect(validateVaccines(g).join()).toMatch(/bad age range/);
  });

  /**
   * Source meaning, typed independently from CDC's notes for health care providers (routine vaccination,
   * retrieved November 27, 2026) rather than derived from the content file:
   *   HepB "3-dose series at age 0, 1–2, 6–18 months" · Rotavirus "Rotarix: 2-dose series at age 2 and 4
   *   months; RotaTeq: 3-dose series at age 2, 4, and 6 months" · DTaP "2, 4, and 6 months, followed by
   *   booster doses at ages 15–18 months and 4–6 years" · Hib "2, 4, and 6 months [or 2 and 4 months],
   *   followed by a booster dose at age 12–15 months" · PCV "4-dose series at 2, 4, 6, 12–15 months" ·
   *   IPV "4-dose series at ages 2, 4, 6–18 months, 4–6 years" · MMR and varicella "2-dose series at age
   *   12–15 months, 4–6 years" · HepA "2-dose series (minimum interval: 6 months) at age 12–23 months".
   * Only ages that apply whatever the product are dated: rotavirus and Hib at 6 months are not.
   */
  const EXPECTED: Record<string, Array<'birth' | number | [number, number]>> = {
    hepb: ['birth', [1, 2], [6, 18]],
    rv: [2, 4],
    dtap: [2, 4, 6, [15, 18], [48, 83]],
    hib: [2, 4, [12, 15]],
    pcv: [2, 4, 6, [12, 15]],
    ipv: [2, 4, [6, 18], [48, 83]],
    mmr: [[12, 15], [48, 83]],
    var: [[12, 15], [48, 83]],
    hepa: [[12, 23]],
  };
  const shape = (a: ReferenceAge) => (a.kind === 'birth' ? 'birth' : a.kind === 'single' ? a.months : [a.fromMonths, a.throughMonths]);

  it('dates exactly the universally recommended ages in CDC’s schedule, and no others', () => {
    const actual: Record<string, unknown[]> = {};
    for (const r of VACCINE_REFERENCES) (actual[r.vaccine] ??= []).push(shape(r.age));
    expect(actual).toEqual(EXPECTED);
    expect(VACCINE_REFERENCES).toHaveLength(26);
  });

  it('the 4–6 year range is complete: it runs through the last day before the 7th birthday, not to age five', () => {
    for (const id of ['cdc25-dtap-5', 'cdc25-ipv-4', 'cdc25-mmr-2', 'cdc25-var-2']) {
      const r = VACCINE_REFERENCES.find((x) => x.id === id)!;
      expect(r.ageLabel).toBe('4–6 years');
      expect(referenceDates('2022-03-10', r.age)).toEqual({ start: '2026-03-10', end: '2029-03-09' });
    }
  });

  it('keeps the qualifications that matter with the reference', () => {
    const q = (id: string) => VACCINE_REFERENCES.find((r) => r.id === id)!.qualification ?? '';
    expect(q('cdc25-hepb-1')).toMatch(/less than 2,000 grams/);
    expect(q('cdc25-hepb-1')).toMatch(/mother has, or may have, hepatitis B/);
    expect(q('cdc25-rv-1')).toMatch(/15 weeks, 0 days/);
    expect(q('cdc25-rv-2')).toMatch(/two or three doses, depending on the vaccine/);
    expect(q('cdc25-rv-2')).toMatch(/8 months, 0 days/);
    expect(q('cdc25-hib-booster')).toMatch(/3rd or 4th dose/);
    expect(VACCINE_REFERENCES.find((r) => r.id === 'cdc25-hib-booster')!.dose).toBe('Dose 3 or 4');
    expect(q('cdc25-hepa-series')).toMatch(/2 doses separated by 6 months/);
    expect(q('cdc25-hepa-series')).toMatch(/does not work out a date for either dose/);
    expect(q('cdc25-ipv-4')).toMatch(/on or after age 4 years and at least 6 months after the previous dose/);
  });

  it('R-019: parent-facing wording drops the source-prefacing language and keeps every precise figure', () => {
    const p = (id: string) => VACCINE_REFERENCES.find((r) => r.id === id)!.parentNote ?? '';
    // The source record is untouched and still says where each qualification comes from.
    expect(VACCINE_REFERENCES.find((r) => r.id === 'cdc25-hepb-3')!.qualification).toBe('CDC’s notes for health care providers say a fourth dose is permitted when a combination vaccine is used after the birth dose.');
    expect(p('cdc25-hepb-3')).toBe('A fourth dose is permitted when a combination vaccine is used after the birth dose.');
    expect(p('cdc25-hepb-1')).toMatch(/less than 2,000 grams at birth/);
    expect(p('cdc25-hepb-1')).toMatch(/mother has, or may have, hepatitis B/);
    expect(p('cdc25-hepb-1')).toMatch(/birth hospital and your child’s provider decide/);
    expect(p('cdc25-rv-1')).toBe('This series should not be started at or after age 15 weeks, 0 days.');
    expect(p('cdc25-rv-2')).toBe('The series has two or three doses, depending on the vaccine used. The maximum age for the final dose is 8 months, 0 days.');
    expect(p('cdc25-hib-booster')).toBe('This is the third or fourth dose, depending on the vaccine used.');
    expect(p('cdc25-ipv-4')).toBe('The final dose is given on or after age 4 years and at least 6 months after the previous dose.');
    expect(p('cdc25-hepa-series')).toBe('2 doses separated by 6 months. The app does not work out a date for either dose.');
    const withNotes = VACCINE_REFERENCES.filter((r) => r.parentNote !== undefined);
    expect(withNotes.map((r) => r.id)).toEqual(VACCINE_REFERENCES.filter((r) => r.qualification !== undefined).map((r) => r.id));
    expect(withNotes).toHaveLength(7);
    for (const r of withNotes) {
      expect(r.parentNote, r.id).not.toMatch(/CDC|health care providers/);
      for (const figure of r.qualification!.match(/\d[\d,]* (?:grams|weeks|days|months|years)/g) ?? []) expect(r.parentNote, `${r.id}: ${figure}`).toContain(figure);
    }
    // Provider-discussion items: CDC's wording is kept word for word where it is presented as such.
    for (const d of VACCINE_DISCUSSION) {
      if (d.parentTextVerbatim) expect(d.parentText, d.id).toBe(d.cdcText);
      expect(`${d.parentText} ${d.parentNote ?? ''}`, d.id).not.toMatch(/CDC|notes for health care/);
    }
    expect(VACCINE_DISCUSSION.filter((d) => !d.parentTextVerbatim).map((d) => d.id)).toEqual(['cdc25-talk-rv-3', 'cdc25-talk-hib-3']);
    expect(VACCINE_DISCUSSION.find((d) => d.id === 'cdc25-talk-rv-3')!.parentText).toBe('Some children get a third dose at this age. It depends on the vaccine used.');
    expect(VACCINE_DISCUSSION.find((d) => d.id === 'cdc25-talk-rsv-infant')!.parentNote).toBe('Timing also depends on the RSV season and the month your child was born.');
    // Validation enforces the same rules.
    const clone = (): VaccineContent => JSON.parse(JSON.stringify(VACCINE_CONTENT)) as VaccineContent;
    const a = clone(); a.references.find((r) => r.id === 'cdc25-rv-1')!.parentNote = 'CDC’s notes for health care providers say not to start late.';
    expect(validateVaccines(a).join()).toMatch(/source-prefacing language/);
    const b = clone(); b.references.find((r) => r.id === 'cdc25-rv-1')!.parentNote = 'This series should not be started late.';
    expect(validateVaccines(b).join()).toMatch(/lost “15 weeks”/);
    const c = clone(); delete c.references.find((r) => r.id === 'cdc25-hepb-1')!.parentNote;
    expect(validateVaccines(c).join()).toMatch(/both be present or both absent/);
    const d = clone(); d.discussion[0]!.parentText = 'Depends on the mother’s vaccine status';
    expect(validateVaccines(d).join()).toMatch(/must match it exactly/);
    expect(VACCINE_CONTENT.contentVersion).toBe('cdc-child-schedule-2025-07-02.app-2');
  });

  it('conditional, seasonal and individually decided recommendations are listed without any date', () => {
    expect(VACCINE_DISCUSSION.map((d) => d.id)).toEqual(['cdc25-talk-rsv-infant', 'cdc25-talk-rsv-older', 'cdc25-talk-rv-3', 'cdc25-talk-hib-3', 'cdc25-talk-flu', 'cdc25-talk-covid']);
    for (const d of VACCINE_DISCUSSION) {
      expect(Object.keys(d).sort()).toEqual(['ageLabel', 'appNote', 'cdcKey', 'cdcText', 'id', 'label', 'parentNote', 'parentText', 'parentTextVerbatim']); // no age or date fields to compute from
    }
    const by = (id: string) => VACCINE_DISCUSSION.find((d) => d.id === id)!;
    expect(by('cdc25-talk-rsv-infant').cdcText).toBe('Depends on mother’s RSV vaccine status');
    expect(by('cdc25-talk-rsv-infant').appNote).toMatch(/RSV season and the month of birth/);
    expect(by('cdc25-talk-rsv-older')).toMatchObject({ ageLabel: '8 through 19 months', cdcText: 'Depends on child’s health status' });
    expect(by('cdc25-talk-flu')).toMatchObject({ ageLabel: '6 months and older', cdcText: 'Every year. Two doses for some children' });
    expect(by('cdc25-talk-covid').cdcText).toMatch(/talk to their health care provider to decide/);
    expect(JSON.stringify(VACCINE_DISCUSSION)).not.toMatch(/Moderna|Pfizer|Novavax|2024|2025/);
    // No dated reference exists for these vaccines, so nothing can reach the grid.
    expect(VACCINE_REFERENCES.some((r) => /rsv|flu|covid|men/i.test(r.vaccine))).toBe(false);
    expect(VACCINE_CONTENT.moreGuidance.cdcItems.join(' ')).toMatch(/higher risk for infection.*traveling outside the United States.*misses a vaccine/);
  });

  it('rebuilds age wording from the numbers', () => {
    expect(ageLabelOf({ kind: 'birth' })).toBe('Birth');
    expect(ageLabelOf({ kind: 'single', months: 2 })).toBe('2 months');
    expect(ageLabelOf({ kind: 'range', fromMonths: 1, throughMonths: 2 })).toBe('1–2 months');
    expect(ageLabelOf({ kind: 'range', fromMonths: 12, throughMonths: 23 })).toBe('12–23 months');
    expect(ageLabelOf({ kind: 'range', fromMonths: 48, throughMonths: 83 })).toBe('4–6 years');
    expect(startAgeLabel({ kind: 'birth' })).toBe('birth');
    expect(startAgeLabel({ kind: 'range', fromMonths: 6, throughMonths: 18 })).toBe('6 months');
    expect(startAgeLabel({ kind: 'range', fromMonths: 48, throughMonths: 83 })).toBe('4 years');
    expect(startAgeLabel({ kind: 'single', months: 12 })).toBe('12 months');
  });
});

describe('vaccine schedule reference: dates from the chronological date of birth', () => {
  const at = (dob: string, id: string) => referenceDates(dob, VACCINE_REFERENCES.find((r) => r.id === id)!.age);

  it('a single age is one day: the anniversary of that age, never a month-long window', () => {
    expect(at('2026-07-20', 'cdc25-hepb-1')).toEqual({ start: '2026-07-20', end: '2026-07-20' });
    expect(at('2026-07-20', 'cdc25-dtap-1')).toEqual({ start: '2026-09-20', end: '2026-09-20' });
    expect(at('2026-07-20', 'cdc25-dtap-2')).toEqual({ start: '2026-11-20', end: '2026-11-20' });
    expect(at('2026-07-20', 'cdc25-pcv-3')).toEqual({ start: '2027-01-20', end: '2027-01-20' });
    for (const d of datedReferences('2026-07-20').filter((x) => x.shape === 'marker')) expect(d.end).toBe(d.start);
  });

  it('an age range is inclusive: from the first age’s anniversary through the last day of the last age', () => {
    expect(at('2026-07-20', 'cdc25-hepb-2')).toEqual({ start: '2026-08-20', end: '2026-10-19' }); // 1 through 2 months
    expect(at('2026-07-20', 'cdc25-hepb-3')).toEqual({ start: '2027-01-20', end: '2028-02-19' }); // 6 through 18 months
    expect(at('2026-07-20', 'cdc25-dtap-4')).toEqual({ start: '2027-10-20', end: '2028-02-19' }); // 15 through 18 months
    expect(at('2026-07-20', 'cdc25-mmr-1')).toEqual({ start: '2027-07-20', end: '2027-11-19' }); // 12 through 15 months
    expect(at('2026-07-20', 'cdc25-hepa-series')).toEqual({ start: '2027-07-20', end: '2028-07-19' }); // 12 through 23 months
    expect(at('2026-07-20', 'cdc25-dtap-5')).toEqual({ start: '2030-07-20', end: '2033-07-19' }); // 4 through 6 years
  });

  it('handles month ends: a shorter month uses its last day', () => {
    expect(at('2025-08-31', 'cdc25-dtap-1').start).toBe('2025-10-31');
    expect(at('2025-08-31', 'cdc25-dtap-3').start).toBe('2026-02-28'); // 6 months after Aug 31
    expect(at('2025-08-31', 'cdc25-hepb-2')).toEqual({ start: '2025-09-30', end: '2025-11-29' });
    expect(at('2025-12-31', 'cdc25-dtap-1').start).toBe('2026-02-28');
    expect(at('2025-12-31', 'cdc25-dtap-2').start).toBe('2026-04-30');
    expect(at('2025-01-31', 'cdc25-hepb-2').start).toBe('2025-02-28');
  });

  it('handles leap days', () => {
    expect(at('2024-02-29', 'cdc25-dtap-1').start).toBe('2024-04-29');
    expect(at('2024-02-29', 'cdc25-mmr-1')).toEqual({ start: '2025-02-28', end: '2025-06-28' });
    expect(at('2024-02-29', 'cdc25-dtap-5')).toEqual({ start: '2028-02-29', end: '2031-02-27' });
    expect(at('2023-12-29', 'cdc25-dtap-1').start).toBe('2024-02-29'); // lands on a leap day
    expect(at('2023-08-29', 'cdc25-dtap-3').start).toBe('2024-02-29');
    expect(at('2022-08-31', 'cdc25-dtap-3').start).toBe('2023-02-28');
  });

  it('is unaffected by the time zone or daylight saving (date-only arithmetic)', () => {
    const tz = process.env.TZ;
    try {
      for (const zone of ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'America/New_York', 'UTC']) {
        process.env.TZ = zone;
        expect(at('2026-03-08', 'cdc25-dtap-1').start).toBe('2026-05-08'); // US daylight saving starts March 8, 2026
        expect(at('2026-01-01', 'cdc25-hepb-2')).toEqual({ start: '2026-02-01', end: '2026-03-31' });
        expect(monthGrid({ year: 2026, month: 3 })[1]![0]).toBe('2026-03-08');
      }
    } finally {
      process.env.TZ = tz;
    }
  });

  it('marks one day per reference on the grid, never every day of a range', () => {
    const dated = datedReferences('2026-07-20');
    const marks = markerDates(dated);
    // Birth, 1, 2, 4, 6, 12, 15 months and 4 years: eight distinct days for all 26 references.
    expect([...marks].sort()).toEqual(['2026-07-20', '2026-08-20', '2026-09-20', '2026-11-20', '2027-01-20', '2027-07-20', '2027-10-20', '2030-07-20']);
    expect(marks.has('2027-03-15')).toBe(false); // inside the 6–18 month ranges: no grid mark
    expect(rangesCovering(dated, '2027-03-15').map((d) => d.ref.id)).toEqual(['cdc25-hepb-3', 'cdc25-ipv-3']);
    expect(rangesCovering(dated, '2028-02-19').map((d) => d.ref.id).sort()).toEqual(['cdc25-dtap-4', 'cdc25-hepa-series', 'cdc25-hepb-3', 'cdc25-ipv-3']);
    expect(rangesCovering(dated, '2028-02-20').map((d) => d.ref.id)).toEqual(['cdc25-hepa-series']);
    expect(rangesOverlapping(dated, '2026-11-01', '2026-11-30')).toEqual([]);
    expect(rangesOverlapping(dated, '2026-10-01', '2026-10-31').map((d) => d.ref.id)).toEqual(['cdc25-hepb-2']);
    expect(referencesStartingOn(dated, '2026-09-20').map((d) => d.ref.id)).toEqual(['cdc25-rv-1', 'cdc25-dtap-1', 'cdc25-hib-1', 'cdc25-pcv-1', 'cdc25-ipv-1']);
  });

  it('finds the next reference age without inventing one', () => {
    const dated = datedReferences('2026-07-20');
    expect(nextReferenceGroup(dated, '2026-11-26')).toMatchObject({ date: '2027-01-20' });
    expect(nextReferenceGroup(dated, '2026-11-26')!.items.map((d) => d.ref.id)).toEqual(['cdc25-hepb-3', 'cdc25-dtap-3', 'cdc25-pcv-3', 'cdc25-ipv-3']);
    expect(nextReferenceGroup(dated, '2026-11-20')!.date).toBe('2026-11-20'); // today counts
    expect(nextReferenceGroup(dated, '2030-07-21')).toBeNull(); // nothing after the last reference age
    expect(datedReferences('not-a-date')).toEqual([]);
  });

  it('has no input other than the date of birth, so a corrected age cannot change it', () => {
    expect(datedReferences.length).toBeLessThanOrEqual(2);
    expect(datedReferences('2023-08-30').map((d) => [d.ref.id, d.start, d.end])).toEqual(datedReferences('2023-08-30', VACCINE_REFERENCES).map((d) => [d.ref.id, d.start, d.end]));
  });
});
