import {describe, expect, it} from "vitest";
import {DateTime} from "luxon";
import {
    busiestDay,
    calendarVars,
    computeMetrics,
    countEntriesPerDay,
    MAX_SLOTS,
    MIN_SLOTS,
    rowBudget,
    rowHeight,
    slotsPerRow,
    visibleRange,
    weekCount,
} from "../mealplanLayout";

const iso = (dt: DateTime) => dt.toISODate() as string
const at = (value: string) => DateTime.fromISO(value).toJSDate()

describe('visibleRange', () => {
    // 2026-11-07 is a saturday
    const anchor = at('2026-11-07')

    it('widens a week period to whole weeks, starting on the configured day', () => {
        const monday = visibleRange(anchor, 'week', 3, 1)
        expect(iso(monday.start)).toBe('2026-11-02')
        expect(iso(monday.end)).toBe('2026-11-22')
        expect(weekCount(monday)).toBe(3)

        const sunday = visibleRange(anchor, 'week', 3, 0)
        expect(iso(sunday.start)).toBe('2026-11-01')
        expect(iso(sunday.end)).toBe('2026-11-21')
    })

    it('pads a month to full weeks so the grid never ends mid week', () => {
        const range = visibleRange(anchor, 'month', 1, 1)
        // november 2026 starts on a sunday, so the grid opens on october 26
        expect(iso(range.start)).toBe('2026-10-26')
        // and ends on the sunday after november 30
        expect(iso(range.end)).toBe('2026-12-06')
        expect(weekCount(range)).toBe(6)
    })

    it('covers a whole year without losing days', () => {
        const range = visibleRange(anchor, 'year', 1, 1)
        const firstDay = DateTime.fromISO('2026-01-01')
        const lastDay = DateTime.fromISO('2026-12-31')
        expect(range.start <= firstDay).toBe(true)
        expect(range.end >= lastDay).toBe(true)
        expect(weekCount(range)).toBeGreaterThanOrEqual(52)
    })
})

describe('countEntriesPerDay', () => {
    it('counts a multi day entry on every day it touches', () => {
        const perDay = countEntriesPerDay([{fromDate: at('2026-11-07'), toDate: at('2026-11-09')}])
        expect(perDay.get('2026-11-07')).toBe(1)
        expect(perDay.get('2026-11-08')).toBe(1)
        expect(perDay.get('2026-11-09')).toBe(1)
        expect(perDay.has('2026-11-10')).toBe(false)
    })

    it('stacks several entries on the same day', () => {
        const perDay = countEntriesPerDay([
            {fromDate: at('2026-11-07')},
            {fromDate: at('2026-11-07')},
            {fromDate: at('2026-11-07')},
        ])
        expect(perDay.get('2026-11-07')).toBe(3)
    })

    it('ignores entries without a start date and inverted ranges', () => {
        const perDay = countEntriesPerDay([
            {},
            {fromDate: at('2026-11-09'), toDate: at('2026-11-07')},
        ])
        expect(perDay.size).toBe(0)
    })

    it('does not loop forever on a corrupt range', () => {
        const perDay = countEntriesPerDay([{fromDate: at('2026-11-07'), toDate: at('2036-11-07')}])
        // the guard caps the walk well before the range is exhausted
        expect(perDay.size).toBeLessThanOrEqual(400)
    })
})

describe('slotsPerRow', () => {
    const range = visibleRange(at('2026-11-07'), 'week', 1, 1)

    it('keeps three slots so a quiet week still reads like a day plan', () => {
        expect(slotsPerRow(range, new Map())).toBe(MIN_SLOTS)
        expect(slotsPerRow(range, countEntriesPerDay([{fromDate: at('2026-11-03')}]))).toBe(MIN_SLOTS)
    })

    it('grows to fit the busiest day in view', () => {
        const plans = Array.from({length: 5}, () => ({fromDate: at('2026-11-05')}))
        expect(busiestDay(range, countEntriesPerDay(plans))).toBe(5)
        expect(slotsPerRow(range, countEntriesPerDay(plans))).toBe(5)
    })

    it('caps a pathologically full day', () => {
        const plans = Array.from({length: 20}, () => ({fromDate: at('2026-11-05')}))
        expect(slotsPerRow(range, countEntriesPerDay(plans))).toBe(MAX_SLOTS)
    })
})

describe('computeMetrics', () => {
    it('fits the row budget when the ideal height is between the clamps', () => {
        const metrics = computeMetrics({rowBudget: 200, slots: 3, detailed: true})
        expect(metrics.itemHeight).toBe(52) // clamped from (200-28-8-5)/3
        expect(rowHeight(metrics)).toBeLessThanOrEqual(200 + metrics.gap)
    })

    it('shrinks entries on a short window instead of overflowing the row', () => {
        const tall = computeMetrics({rowBudget: 240, slots: 3, detailed: true})
        const short = computeMetrics({rowBudget: 130, slots: 3, detailed: true})
        expect(short.itemHeight).toBeLessThan(tall.itemHeight)
        expect(rowHeight(short)).toBeLessThanOrEqual(130)
    })

    it('switches to a single line title once the card gets too short', () => {
        expect(computeMetrics({rowBudget: 260, slots: 3, detailed: true}).slim).toBe(false)
        expect(computeMetrics({rowBudget: 140, slots: 3, detailed: true}).slim).toBe(true)
    })

    it('uses the compact geometry for the month grid', () => {
        const metrics = computeMetrics({rowBudget: 126, slots: 3, detailed: false})
        expect(metrics.details).toBe(false)
        expect(metrics.itemHeight).toBeLessThanOrEqual(34)
        expect(metrics.gap).toBe(2)
    })
})

describe('rowBudget', () => {
    it('splits the card between the visible weeks', () => {
        expect(rowBudget(600, 3)).toBeCloseTo((600 - 84) / 3)
        expect(rowBudget(600, 6)).toBeCloseTo((600 - 84) / 6)
    })

    it('never returns a negative or zero budget', () => {
        expect(rowBudget(10, 3)).toBeGreaterThan(0)
    })
})

describe('calendarVars', () => {
    it('exposes the geometry the calendar grid reads', () => {
        const vars = calendarVars(computeMetrics({rowBudget: 200, slots: 3, detailed: true}))
        expect(vars['--mp-row-h']).toMatch(/^\d+px$/)
        expect(vars['--mp-pitch']).toMatch(/^\d+px$/)
        expect(vars['--mp-item-h']).toMatch(/^\d+px$/)
        expect(parseInt(vars['--mp-row-h'])).toBe(rowHeight(computeMetrics({rowBudget: 200, slots: 3, detailed: true})))
    })
})
