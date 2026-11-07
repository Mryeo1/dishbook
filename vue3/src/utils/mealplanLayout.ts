import {DateTime} from "luxon";

/**
 * Layout maths for the meal plan calendar.
 *
 * These used to live inline inside `MealPlanView.vue`. They are pure functions on
 * purpose: the calendar library stacks entries by a fixed pitch, so getting the
 * row height wrong is what made entries bleed into the following week. Keeping
 * the arithmetic testable is cheaper than re-checking it by hand in a browser.
 */

export type DisplayPeriod = 'week' | 'month' | 'year'

export interface DateRange {
    start: DateTime
    end: DateTime
}

export interface PlanLike {
    fromDate?: Date
    toDate?: Date
}

export interface LayoutMetrics {
    /** height of a single entry card, in px */
    itemHeight: number
    /** vertical space between two entries, in px */
    gap: number
    /** space reserved above the first entry for the day number */
    top: number
    /** padding below the last entry */
    bottom: number
    /** how many entries a row must be able to hold */
    slots: number
    /** true when there is room for a thumbnail and a second text line */
    details: boolean
    /** true when the card is too short for a two line title */
    slim: boolean
}

/** every row keeps at least breakfast, lunch and dinner worth of space */
export const MIN_SLOTS = 3
/** beyond this a day is better served by scrolling than by shrinking every card */
export const MAX_SLOTS = 8
/** toolbar plus weekday strip, measured once instead of guessed per render */
export const CALENDAR_CHROME = 84

/**
 * First and last day the calendar shows, always widened to whole weeks so the
 * grid never starts or ends mid week.
 *
 * Luxon weekdays run 1 (monday) .. 7 (sunday) while the calendar counts
 * 0 (sunday) .. 6, hence the modulo dance.
 */
export function visibleRange(anchorDate: Date, period: DisplayPeriod, count: number, startingDayOfWeek: number): DateRange {
    const anchor = DateTime.fromJSDate(anchorDate).startOf('day')
    const anchorOffset = (anchor.weekday % 7 - startingDayOfWeek + 7) % 7

    let first = anchor.minus({days: anchorOffset})
    let last = first.plus({days: count * 7 - 1})

    if (period === 'month') {
        first = anchor.startOf('month')
        last = first.plus({months: count}).minus({days: 1})
    } else if (period === 'year') {
        first = anchor.startOf('year')
        last = first.plus({years: count}).minus({days: 1})
    }

    const startOffset = (first.weekday % 7 - startingDayOfWeek + 7) % 7
    const endOffset = (startingDayOfWeek + 6 - last.weekday % 7 + 7) % 7
    return {start: first.minus({days: startOffset}), end: last.plus({days: endOffset})}
}

/** number of week rows a range needs, at least one */
export function weekCount(range: DateRange): number {
    const days = Math.round(range.end.diff(range.start, 'days').days) + 1
    return Math.max(1, Math.ceil(days / 7))
}

/**
 * Entries per day. A multi day entry counts on every day it touches, because it
 * occupies a slot on each of them.
 */
export function countEntriesPerDay(plans: PlanLike[]): Map<string, number> {
    const perDay = new Map<string, number>()
    plans.forEach(plan => {
        if (!plan.fromDate) return
        const start = DateTime.fromJSDate(plan.fromDate).startOf('day')
        const end = plan.toDate ? DateTime.fromJSDate(plan.toDate).startOf('day') : start
        if (end < start) return

        let day = start
        // a runaway entry (bad data, clock skew) must not hang the render
        for (let guard = 0; day.toMillis() <= end.toMillis() && guard < 400; guard++) {
            const key = day.toISODate() as string
            perDay.set(key, (perDay.get(key) ?? 0) + 1)
            day = day.plus({days: 1})
        }
    })
    return perDay
}

/** the busiest day in view decides how many slots a row offers */
export function busiestDay(range: DateRange, perDay: Map<string, number>): number {
    let max = 0
    for (let day = range.start, guard = 0; day.toMillis() <= range.end.toMillis() && guard < 400; day = day.plus({days: 1}), guard++) {
        const count = perDay.get(day.toISODate() as string) ?? 0
        if (count > max) max = count
    }
    return max
}

/** slots per row: enough for the busiest day, never below three, capped for sanity */
export function slotsPerRow(range: DateRange, perDay: Map<string, number>): number {
    return Math.min(Math.max(busiestDay(range, perDay), MIN_SLOTS), MAX_SLOTS)
}

/** height a single week row may take, given the space the card actually has */
export function rowBudget(shellHeight: number, weeks: number, chrome: number = CALENDAR_CHROME): number {
    return Math.max(shellHeight - chrome, 180) / Math.max(weeks, 1)
}

/**
 * Geometry of one entry.
 *
 * A wide week grid gets thumbnails and a second text line; month and small
 * screens get a thin chip. The height is solved from the row budget so a short
 * window shrinks the cards instead of producing a scrollbar or, worse, entries
 * bleeding into the next week.
 */
export function computeMetrics(options: {
    rowBudget: number
    slots: number
    detailed: boolean
}): LayoutMetrics {
    const {rowBudget, slots, detailed} = options
    const top = detailed ? 28 : 22
    const gap = detailed ? 4 : 2
    const bottom = detailed ? 5 : 3

    const available = rowBudget - top - (slots - 1) * gap - bottom
    const raw = available / slots
    const min = detailed ? 26 : 20
    const max = detailed ? 52 : 34
    // floor, not round: a row that rounds up overflows its budget by a pixel or
    // two, which is exactly how entries end up bleeding into the next week
    const itemHeight = Math.floor(Math.min(Math.max(raw, min), max))

    return {
        itemHeight, gap, top, bottom, slots, details: detailed,
        // two line titles need room, below that a single line keeps the card calm
        slim: detailed && itemHeight < 40,
    }
}

/** height a row has to be so every slot fits, gap included */
export function rowHeight(metrics: LayoutMetrics): number {
    return metrics.top + metrics.slots * metrics.itemHeight + (metrics.slots - 1) * metrics.gap + metrics.bottom
}

/** css custom properties the calendar grid reads */
export function calendarVars(metrics: LayoutMetrics): Record<string, string> {
    return {
        '--mp-row-h': rowHeight(metrics) + 'px',
        '--mp-pitch': (metrics.itemHeight + metrics.gap) + 'px',
        '--mp-item-h': metrics.itemHeight + 'px',
        '--mp-top': metrics.top + 'px',
        '--mp-thumb': 'clamp(16px, calc(var(--mp-item-h, 44px) - 12px), 34px)',
    }
}
