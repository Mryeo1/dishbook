<template>
    <v-row class="mp-row h-100">
        <v-col class="pb-0">
            <v-card ref="shellRef" class="mp-shell pa-0" :style="{height: shellHeight + 'px'}"
                    :class="{'mp-shell--empty': mdAndUp && !useMealPlanStore().loading && !hasVisibleEntries}"
                    :loading="useMealPlanStore().loading">
                <!-- phones get an agenda: seven columns at 390px cannot hold a title -->
                <meal-plan-agenda
                    v-if="!mdAndUp"
                    :calendar-date="calendarDate"
                    :plans="useMealPlanStore().planList"
                    :period="displayPeriod"
                    :period-count="periodCount"
                    :starting-day-of-week="startingDayOfWeek"
                ></meal-plan-agenda>
                <calendar-view
                    v-else
                    :locale="locale"
                    :show-date="calendarDate"
                    :items="planItems"
                    class="mp-cal theme-default"
                    :class="{'mp-cal--detailed': detailedEntries}"
                    :style="calendarVars"
                    :item-content-height="metrics.itemHeight + 'px'"
                    :item-top="metrics.top + 'px'"
                    :item-border-height="metrics.gap + 'px'"
                    :enable-drag-drop="true"
                    @dropOnDate="dropCalendarItemOnDate"
                    :display-period-uom="useUserPreferenceStore().deviceSettings.mealplan_displayPeriod"
                    :display-period-count="useUserPreferenceStore().deviceSettings.mealplan_displayPeriodCount"
                    :starting-day-of-week="useUserPreferenceStore().deviceSettings.mealplan_startingDayOfWeek"
                    :display-week-numbers="useUserPreferenceStore().deviceSettings.mealplan_displayWeekNumbers"
                    :current-period-label="$t('Today')"
                    @click-date="(date : Date, calendarItems: [], windowEvent: any) => { newPlanDialogDefaultItem.fromDate = date; newPlanDialogDefaultItem.toDate = date; newPlanDialog = true }">
                    <template #header="{ headerProps }">
                        <meal-plan-calendar-header :header-props="headerProps" @input="(d:Date) => calendarDate = d"></meal-plan-calendar-header>
                    </template>
                    <template #item="{ value, top }">
                        <meal-plan-calendar-item
                            :item-height="metrics.itemHeight + 'px'"
                            :value="value"
                            :item-top="top"
                            @onDragStart="currentlyDraggedMealplan = value"
                            @delete="(arg: MealPlan) => {useMealPlanStore().plans.delete(arg.id)}"
                            :detailed-items="detailedEntries"
                            :slim="metrics.slim"
                        ></meal-plan-calendar-item>
                    </template>
                    <!--
                        empty days get a quiet add affordance, days that already
                        hold entries stay plain. rendered here because the
                        calendar keeps its entries outside of the day cell, so a
                        css :has() based hint would fire on every day.
                    -->
                    <template #day-content="{ day }">
                        <div class="mp-day-add" v-if="detailedEntries && !hasEntries(day)">
                            <i class="fas fa-plus"></i>
                            <span>{{ $t('Add') }}</span>
                        </div>
                    </template>
                </calendar-view>
                <!--
                    an empty week and a request still in flight look identical in
                    the grid, which reads as a broken page when paging back. say
                    so instead, but only when nothing is actually in view so the
                    hint never covers days that do hold plans.
                -->
                <div class="mp-empty" v-if="mdAndUp && !useMealPlanStore().loading && !hasVisibleEntries">
                    <i class="far fa-calendar"></i>
                    <p>{{ $t('NothingPlanned') }}</p>
                    <span>{{ $t('NothingPlannedHint') }}</span>
                </div>
            </v-card>

            <model-edit-dialog model="MealPlan" v-model="newPlanDialog" :itemDefaults="newPlanDialogDefaultItem" :close-after-create="false"
                               @create="(arg: any) => useMealPlanStore().plans.set(arg.id, arg)"></model-edit-dialog>
        </v-col>
    </v-row>
</template>


<script setup lang="ts">
import {CalendarView} from "vue-simple-calendar"
import "vue-simple-calendar/dist/style.css"
import "vue-simple-calendar/dist/css/default.css"

import MealPlanCalendarItem from "@/components/display/MealPlanCalendarItem.vue";
import {IMealPlanCalendarItem, IMealPlanNormalizedCalendarItem} from "@/types/MealPlan";
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {DateTime} from "luxon";
import {useDisplay} from "vuetify";
import {useMealPlanStore} from "@/stores/MealPlanStore";
import ModelEditDialog from "@/components/dialogs/ModelEditDialog.vue";
import {MealPlan} from "@/openapi";
import {useUserPreferenceStore} from "@/stores/UserPreferenceStore";
import MealPlanCalendarHeader from "@/components/display/MealPlanCalendarHeader.vue";
import MealPlanAgenda from "@/components/display/MealPlanAgenda.vue";
import {useI18n} from "vue-i18n";
import {
    calendarVars as calendarVarsOf,
    computeMetrics,
    countEntriesPerDay,
    hasEntriesInRange,
    rowBudget as rowBudgetOf,
    slotsPerRow as slotsPerRowOf,
    visibleRange as visibleRangeOf,
    weekCount,
} from "@/utils/mealplanLayout";

const {lgAndUp, mdAndUp} = useDisplay()
const {locale} = useI18n()

const calendarDate = ref(new Date())

/**
 * the card sizes itself to the remaining viewport instead of trusting a chain
 * of percentage heights: with `height: 100%` the calendar grew past the window
 * whenever a month row needed more space, which cut off the last week.
 */
const shellRef = ref<any>(null)
const shellHeight = ref(Math.max(window.innerHeight - 190, 320))

function updateShellHeight() {
    const el = shellRef.value?.$el as HTMLElement | undefined
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    shellHeight.value = Math.max(Math.round(window.innerHeight - top - 14), 320)
}

onMounted(() => {
    updateShellHeight()
    window.addEventListener('resize', updateShellHeight)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateShellHeight)
})

const currentlyDraggedMealplan = ref({} as IMealPlanNormalizedCalendarItem)

const newPlanDialog = ref(false)
const newPlanDialogDefaultItem = ref({} as MealPlan)

/**
 * computed property that converts array of MealPlan object to
 * array of CalendarItems (format required/extended from vue-simple-calendar)
 */
const planItems = computed(() => {
    let items = [] as IMealPlanCalendarItem[]
    useMealPlanStore().planList.forEach(mp => {
        items.push({
            startDate: mp.fromDate,
            endDate: mp.toDate ? mp.toDate : mp.fromDate,
            id: mp.id,
            mealPlan: mp,
        } as IMealPlanCalendarItem)
    })
    return items
})

const displayPeriod = computed(() => useUserPreferenceStore().deviceSettings.mealplan_displayPeriod)
const periodCount = computed(() => useUserPreferenceStore().deviceSettings.mealplan_displayPeriodCount)
const startingDayOfWeek = computed(() => useUserPreferenceStore().deviceSettings.mealplan_startingDayOfWeek ?? 0)

/**
 * first and last day the calendar is showing, always widened to whole weeks
 */
const visibleRange = computed(() => visibleRangeOf(calendarDate.value, displayPeriod.value, periodCount.value, startingDayOfWeek.value))
const visibleWeeks = computed(() => weekCount(visibleRange.value))

/**
 * number of entries per day, multi day entries count on every day they touch
 */
const entriesPerDay = computed(() => countEntriesPerDay(useMealPlanStore().planList))

/**
 * slots a row has to offer: enough for the busiest day in view, never less than
 * breakfast / lunch / dinner so short weeks keep the same rhythm
 */
const slotsPerRow = computed(() => slotsPerRowOf(visibleRange.value, entriesPerDay.value))

/**
 * height the calendar can hand to a single week row
 */
const rowBudget = computed(() => rowBudgetOf(shellHeight.value, visibleWeeks.value))

/**
 * geometry of one entry.
 *
 * the calendar stacks entries by a fixed pitch and never grows a cell on its
 * own, so the entry height is derived from the space a row actually has. a
 * short window therefore gets slimmer entries instead of a scrollbar or, worse,
 * entries bleeding into the next week.
 */
const metrics = computed(() => computeMetrics({
    rowBudget: rowBudget.value,
    slots: slotsPerRow.value,
    detailed: lgAndUp.value && displayPeriod.value === 'week',
}))

const detailedEntries = computed(() => metrics.value.details)

const calendarVars = computed(() => calendarVarsOf(metrics.value))

function hasEntries(day: Date | string): boolean {
    const key = typeof day === 'string' ? day : DateTime.fromJSDate(day).toISODate()
    return (entriesPerDay.value.get(key as string) ?? 0) > 0
}

/** true while the visible period holds at least one plan */
const hasVisibleEntries = computed(() => hasEntriesInRange(visibleRange.value, entriesPerDay.value))

watch(calendarDate, () => {
    refreshVisiblePeriod(false)
})

/**
 * refresh data for the currently visible period
 * @param startDateUnknown when the calendar initially loads the date is set to today but the visible period might be larger. If set loads the period day count for the past as well
 */
function refreshVisiblePeriod(startDateUnknown: boolean) {
    let daysInPeriod = 7
    if (useUserPreferenceStore().deviceSettings.mealplan_displayPeriod == 'month') {
        daysInPeriod = 31
    } else if (useUserPreferenceStore().deviceSettings.mealplan_displayPeriod == 'year') {
        daysInPeriod = 365
    }

    let days = useUserPreferenceStore().deviceSettings.mealplan_displayPeriodCount * daysInPeriod

    // load backwards to as on initial
    if (startDateUnknown) {
        useMealPlanStore().refreshFromAPI(DateTime.fromJSDate(calendarDate.value).minus({days: days}).toJSDate(), DateTime.fromJSDate(calendarDate.value).plus({days: days}).toJSDate())
    } else {
        useMealPlanStore().refreshFromAPI(calendarDate.value, DateTime.fromJSDate(calendarDate.value).plus({days: days}).toJSDate())
    }
}

onMounted(() => {
    refreshVisiblePeriod(true)
})

/**
 * handle drop event for calendar items on fields
 * @param undefinedItem
 * @param targetDate
 * @param event
 */
function dropCalendarItemOnDate(undefinedItem: IMealPlanNormalizedCalendarItem, targetDate: Date, event: DragEvent) {
    //The item argument (first) is undefined because our custom calendar item cannot manipulate the calendar state so the item is unknown to the calendar (probably fixable by somehow binding state to the item)
    if (currentlyDraggedMealplan.value.originalItem?.mealPlan?.id != undefined) {
        let mealPlan = useMealPlanStore().plans.get(currentlyDraggedMealplan.value.originalItem.mealPlan.id)
        if (mealPlan != undefined) {
            let fromToDiff = {days: 0}
            if (mealPlan.toDate && mealPlan.toDate > mealPlan.fromDate) {
                fromToDiff = DateTime.fromJSDate(mealPlan.toDate).diff(DateTime.fromJSDate(mealPlan.fromDate), 'days')
            }

            const existingTime = DateTime.fromJSDate(mealPlan.fromDate)
            const newFrom = DateTime.fromJSDate(targetDate).set({
                hour: existingTime.hour, minute: existingTime.minute, second: existingTime.second
            }).toJSDate()
            const newTo = DateTime.fromJSDate(targetDate).plus(fromToDiff).set({
                hour: existingTime.hour, minute: existingTime.minute, second: existingTime.second
            }).toJSDate()

            // create copy of item if control is pressed
            if (event.ctrlKey) {
                let new_entry = Object.assign({}, mealPlan)
                new_entry.fromDate = newFrom
                new_entry.toDate = newTo
                new_entry.addshopping = mealPlan.shopping
                useMealPlanStore().createObject(new_entry)
            } else {
                mealPlan.fromDate = newFrom
                mealPlan.toDate = newTo
                useMealPlanStore().updateObject(mealPlan)
            }
        }
    }
}

</script>


<style>
/*
 * the calendar renders its grid inside a child component, so these rules are
 * intentionally global but namespaced below .mp-cal to keep them scoped to the
 * meal plan page.
 *
 * colours live in tokens on .mp-row because the card (.mp-shell) is a sibling of
 * the calendar, not a child of it. the dark block only redefines the tokens, so
 * a rule never has to know which theme it is running under.
 */

.mp-row {
    min-height: 0;

    /* light theme */
    --mp-surface: #fffdfa;
    --mp-grid: #ffffff;
    --mp-grid-alt: #fdfcf9;
    --mp-line: #f2ebe2;
    --mp-line-soft: #f0e9df;
    --mp-line-day: #f4eee6;
    --mp-rail-bg: #fbf8f3;
    --mp-rail-text: #bcaea0;
    --mp-hover: #fdfaf5;
    --mp-past: #faf6ef;
    --mp-past-alt: #f8f3ea;
    --mp-outside: #fcfaf6;
    --mp-today: #fffbf3;
    --mp-today-ring: #f3e3c9;
    --mp-text: #3f342a;
    --mp-text-mid: #8d7f71;
    --mp-text-soft: #a2958a;
    --mp-text-faint: #c0b4a7;
    --mp-text-ghost: #d6cabc;
    --mp-thumb-bg: #f6efe6;
    --mp-item-base: #ffffff;
    --mp-accent: #b98766;
    --mp-accent-ink: #a9855c;
    --mp-add-border: #f0e4d4;
    --mp-add-hover-bg: #fff9ee;
    --mp-shadow: #4a3724;
    --mp-scroll-thumb: #e4d8c9;
    --mp-scroll-thumb-hover: #d6c6b2;
    --mp-weekend: #fdfcf9;
}

/* dark theme: same tokens, darker values. surfaces lift as they nest:
   page < week rail < day cell < entry card */
.v-theme--dark .mp-row {
    --mp-surface: #201c19;
    --mp-grid: #262220;
    --mp-grid-alt: #2a2522;
    --mp-line: #352e28;
    --mp-line-soft: #302924;
    --mp-line-day: #332c26;
    --mp-rail-bg: #241f1c;
    --mp-rail-text: #8b7f74;
    --mp-hover: #2c2724;
    --mp-past: #221e1b;
    --mp-past-alt: #242020;
    --mp-outside: #1c1916;
    --mp-today: #2e2722;
    --mp-today-ring: #5b4a37;
    --mp-text: #ece3d8;
    --mp-text-mid: #b3a496;
    --mp-text-soft: #9c8e82;
    --mp-text-faint: #7d7166;
    --mp-text-ghost: #6b6055;
    --mp-thumb-bg: #332c26;
    --mp-item-base: #2e2925;
    --mp-accent: #c08a45;
    --mp-accent-ink: #d8b78e;
    --mp-add-border: #3b332c;
    --mp-add-hover-bg: #332c26;
    --mp-shadow: #000000;
    --mp-scroll-thumb: #3d352e;
    --mp-scroll-thumb-hover: #4c4239;
    --mp-weekend: #2a2522;
}

.mp-shell {
    position: relative;
    border-radius: 14px !important;
    border: 1px solid var(--mp-line-soft);
    overflow: hidden;
    background: var(--mp-surface);
}

/* ---------- empty period ---------- */

/*
 * floats over the grid rather than filling it: the days underneath keep their
 * hover state and stay clickable, and a card reads as an annotation instead of a
 * replacement for the calendar. opaque on purpose, a translucent one let the
 * per-day add hints bleed through the text.
 */
.mp-empty {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 24px 36px;
    border-radius: 14px;
    border: 1px solid var(--mp-line-soft);
    background: var(--mp-surface);
    box-shadow: 0 12px 32px color-mix(in srgb, var(--mp-shadow) 14%, transparent);
    text-align: center;
    pointer-events: none;
}

/*
 * twenty one identical "+ add" hints on an empty month say nothing the card
 * does not already say, and they compete with it for attention.
 */
.mp-shell--empty .mp-day-add {
    display: none;
}

.mp-empty i {
    font-size: 1.35rem;
    color: var(--mp-text-faint);
    margin-bottom: 6px;
}

.mp-empty p {
    margin: 0;
    font-size: .95rem;
    font-weight: 500;
    color: var(--mp-text-soft);
    letter-spacing: .02em;
}

.mp-empty span {
    font-size: .78rem;
    color: var(--mp-text-faint);
}

.mp-cal.cv-wrapper {
    height: 100%;
    min-height: 100%;
    max-height: 100%;
    font-size: 1em;
    line-height: 1.2;
    background: var(--mp-grid);
}

/* ---------- header ---------- */

.mp-cal .cv-header {
    background: var(--mp-surface);
    border: 0;
    border-bottom: 1px solid var(--mp-line-soft);
    min-height: 0;
}

.mp-cal .cv-header-days {
    background: var(--mp-rail-bg);
    border: 0;
    border-bottom: 1px solid var(--mp-line-soft);
}

.mp-cal .cv-header-day {
    border: 0;
    padding: .5rem 0;
    font-size: .7rem;
    font-weight: 600;
    letter-spacing: .1em;
    color: var(--mp-text-soft);
}

/* ---------- week number gutter ---------- */

/*
 * a 26px rail instead of an unlabelled 32px empty column: the number reads as a
 * row label and the tinted background separates it from the grid
 */
.mp-cal .cv-weeknumber {
    width: 26px;
    flex: 0 0 26px;
    border: 0;
    border-right: 1px solid var(--mp-line-soft);
    background: var(--mp-rail-bg);
    color: var(--mp-rail-text);
    font-size: .58rem;
    font-weight: 600;
    letter-spacing: .02em;
    font-variant-numeric: tabular-nums;
}

.mp-cal .cv-header-days > .cv-weeknumber {
    border-bottom: 0;
}

/* ---------- grid ---------- */

.mp-cal .cv-weeks {
    border: 0;
    overflow-x: hidden;
    overscroll-behavior: contain;
    /* the calendar hides its scrollbar by default, which left the last week
       looking cut off with no hint that more rows exist */
    scrollbar-width: thin;
    scrollbar-color: var(--mp-scroll-thumb) transparent;
}

.mp-cal .cv-weeks::-webkit-scrollbar {
    width: 8px;
    background: transparent;
}

.mp-cal .cv-weeks::-webkit-scrollbar-thumb {
    background: var(--mp-scroll-thumb);
    border-radius: 4px;
    border: 2px solid var(--mp-grid);
}

.mp-cal .cv-weeks::-webkit-scrollbar-thumb:hover {
    background: var(--mp-scroll-thumb-hover);
}

.mp-cal .cv-week {
    border: 0;
    border-bottom: 1px solid var(--mp-line);
    min-height: var(--mp-row-h, 180px);
    overflow: hidden;
}

.mp-cal .cv-week:last-child {
    border-bottom: 0;
}

.mp-cal .cv-weeknumber + .cv-weekdays {
    min-width: 0;
}

.mp-cal .cv-day {
    position: relative;
    top: auto;
    border: 0;
    border-right: 1px solid var(--mp-line-day);
    background: var(--mp-grid);
    transition: background-color .15s ease;
}

.mp-cal .cv-day:nth-child(6),
.mp-cal .cv-day:nth-child(7) {
    background: var(--mp-weekend);
}

/* days and entries share the same parent, so the right edge has to be matched
   by child index instead of :last-child */
.mp-cal .cv-day:nth-child(7) {
    border-right: 0;
}

/* hairline in the gap between two entry slots: an empty cell still reads as a
   stack of meal slots instead of a bare box */
.mp-cal.mp-cal--detailed .cv-day::before {
    content: '';
    position: absolute;
    left: 6px;
    right: 6px;
    top: calc(var(--mp-top, 30px) + var(--mp-item-h, 44px));
    bottom: 0;
    background-image: repeating-linear-gradient(
        to bottom,
        var(--mp-line) 0,
        var(--mp-line) 1px,
        transparent 1px,
        transparent var(--mp-pitch, 48px)
    );
    opacity: .7;
    pointer-events: none;
    z-index: 0;
}

.mp-cal .cv-day:hover {
    background: var(--mp-hover);
}

.mp-cal .cv-day.past {
    background-color: var(--mp-past);
}

.mp-cal .cv-day.past:nth-child(6),
.mp-cal .cv-day.past:nth-child(7) {
    background-color: var(--mp-past-alt);
}

.mp-cal .cv-day.past .cv-day-number {
    color: var(--mp-text-faint);
}

.mp-cal .cv-day.outsideOfMonth {
    background: var(--mp-outside);
}

.mp-cal .cv-day.outsideOfMonth .cv-day-number {
    color: var(--mp-text-ghost);
}

.mp-cal .cv-day.today {
    background: var(--mp-today);
    box-shadow: inset 0 0 0 1px var(--mp-today-ring);
}

/* ---------- day number ---------- */

.mp-cal .cv-day-number {
    height: 28px;
    padding: 4px 7px 0;
    font-size: .7rem;
    font-weight: 600;
    color: var(--mp-text-soft);
    letter-spacing: .02em;
    flex: 0 0 28px;
    position: relative;
    z-index: 2;
}

/*
 * on the first of a month the calendar prefixes the number with the month name.
 * the number is pinned to a 28px column so the days line up, which squeezed that
 * label into one character per line and, with the shipped styling, dropped a
 * pink block into the grid. let that one cell size itself instead.
 */
.mp-cal .cv-day.d01 .cv-day-number {
    flex: 0 0 auto;
    width: auto;
    padding-right: 10px;
    white-space: nowrap;
    background: transparent;
}

.mp-cal .cv-fom-name {
    font-size: .86em;
    font-weight: 500;
    opacity: .7;
    margin-right: 2px;
}

.mp-cal .cv-day.today .cv-day-number {
    align-self: flex-start;
    width: auto;
    height: 20px;
    margin: 4px 0 0 5px;
    padding: 0 7px;
    background: var(--mp-accent);
    color: #ffffff;
    border-radius: 6px;
    font-weight: 700;
    line-height: 20px;
    box-shadow: 0 1px 3px color-mix(in srgb, var(--mp-accent) 40%, transparent);
}

/* ---------- empty day affordance ---------- */

/*
 * an outlined block where the first entry would sit, so an empty day reads as
 * an empty meal slot (the pattern used by notion / samsung food) instead of a
 * blank cell with a floating icon
 */
.mp-day-add {
    position: absolute;
    left: 4px;
    right: 4px;
    top: var(--mp-top, 30px);
    height: var(--mp-item-h, 44px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border-radius: 8px;
    border: 1px dashed var(--mp-add-border);
    background: transparent;
    color: var(--mp-text-faint);
    font-size: .6rem;
    line-height: 1;
    opacity: .55;
    transition: opacity .16s ease, border-color .16s ease, color .16s ease, background-color .16s ease;
    pointer-events: none;
    z-index: 1;
    white-space: nowrap;
}

.mp-day-add i {
    font-size: .58rem;
}

.mp-cal .cv-day:hover .mp-day-add {
    opacity: 1;
    border-color: var(--mp-accent-ink);
    background: var(--mp-add-hover-bg);
    color: var(--mp-accent-ink);
}

/* ---------- items ---------- */

.mp-cal .cv-item {
    white-space: normal;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: visible;
    z-index: 1;
}

.mp-cal .cv-item.span3,
.mp-cal .cv-item.span4,
.mp-cal .cv-item.span5,
.mp-cal .cv-item.span6,
.mp-cal .cv-item.span7 {
    text-align: left;
}

.mp-cal .cv-item:hover {
    z-index: 5;
}

.mp-cal .cv-day.draghover {
    box-shadow: inset 0 0 0 2px var(--mp-accent, #ddbf86);
}

.mp-cal .ghost {
    opacity: .5;
}

@media (max-width: 767.9px) {
    .mp-cal .cv-day::before {
        display: none;
    }

    .mp-day-add {
        display: none;
    }
}
</style>
