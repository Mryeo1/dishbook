<template>
    <!--
      phone layout: a seven column grid at 390px gives every day about 48px,
      which truncates every title to three characters. an agenda grouped by day
      is what google calendar and every other mobile calendar falls back to.
    -->
    <div class="mp-agenda">
        <div class="mp-agenda__scroll">
            <section v-for="day in days" :key="day.key" class="mp-agenda__day"
                     :class="{'mp-agenda__day--today': day.isToday, 'mp-agenda__day--past': day.isPast}">
                <header class="mp-agenda__head">
                    <span class="mp-agenda__weekday">{{ day.weekdayLabel }}</span>
                    <span class="mp-agenda__date">{{ day.dateLabel }}</span>
                    <span class="mp-agenda__count" v-if="day.entries.length">{{ day.entries.length }}</span>
                    <span class="mp-agenda__spacer"></span>
                    <button class="mp-agenda__add" type="button" :aria-label="$t('Add')" @click="openNew(day)">
                        <i class="fas fa-plus"></i>
                    </button>
                </header>

                <div class="mp-agenda__empty" v-if="!day.entries.length">{{ $t('NothingPlanned') }}</div>

                <div v-for="entry in day.entries" :key="entry.id" class="mp-agenda__entry"
                     :style="{'--mp-accent': accentOf(entry)}" tabindex="0" role="button"
                     @click="openEntry(entry)" @keydown.enter="openEntry(entry)" @keydown.space.prevent="openEntry(entry)">
                    <div class="mp-agenda__thumb" v-if="entry.recipe">
                        <recipe-image height="100%" width="100%" :recipe="entry.recipe"></recipe-image>
                    </div>
                    <div class="mp-agenda__body">
                        <div class="mp-agenda__title">{{ titleOf(entry) }}</div>
                        <div class="mp-agenda__meta">
                            <span v-if="entry.mealType?.name">{{ entry.mealType.name }}</span>
                            <span class="mp-agenda__dot" v-if="entry.mealType?.name && timeOf(entry)"></span>
                            <span v-if="timeOf(entry)">{{ timeOf(entry) }}</span>
                            <i class="fas fa-cart-shopping" v-if="entry.shopping"></i>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!--
          one dialog per action instead of one per row: the editor is a full
          screen sheet anyway, and wrapping every row in its own v-dialog costs a
          lot on a phone.
        -->
        <model-edit-dialog model="MealPlan" v-model="editOpen" :item="editingEntry"
                           @delete="(args: MealPlan) => useMealPlanStore().plans.delete(args.id)"></model-edit-dialog>
        <model-edit-dialog model="MealPlan" v-model="createOpen" :itemDefaults="newDefaults" :close-after-create="false"
                           @create="(arg: any) => useMealPlanStore().plans.set(arg.id, arg)"></model-edit-dialog>
    </div>
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import {DateTime} from "luxon";
import {useI18n} from "vue-i18n";
import {MealPlan} from "@/openapi";
import ModelEditDialog from "@/components/dialogs/ModelEditDialog.vue";
import RecipeImage from "@/components/display/RecipeImage.vue";
import {useMealPlanStore} from "@/stores/MealPlanStore";
import {visibleRange, type DisplayPeriod} from "@/utils/mealplanLayout";

const props = defineProps({
    calendarDate: {type: Date, required: true},
    plans: {type: Array as () => MealPlan[], default: () => []},
    period: {type: String as () => DisplayPeriod, default: 'week'},
    periodCount: {type: Number, default: 1},
    startingDayOfWeek: {type: Number, default: 1},
})

const {locale} = useI18n()

/**
 * a single editor instance is opened programmatically: `v-model` makes the
 * dialog skip its activator, so a row only has to set the state.
 */
const editOpen = ref(false)
const editingEntry = ref<MealPlan | null>(null)
const createOpen = ref(false)
const newDefaults = ref<Partial<MealPlan>>({})

function openEntry(entry: MealPlan) {
    editingEntry.value = entry
    editOpen.value = true
}

function openNew(day: { date: Date }) {
    newDefaults.value = {fromDate: day.date, toDate: day.date}
    createOpen.value = true
}

/** luxon wants a full locale tag, the app stores shorthands like `zh-hans` */
const luxonLocale = computed(() => {
    const value = (locale.value || 'en').toLowerCase()
    if (value.startsWith('zh')) return value.includes('hant') || value.includes('tw') || value.includes('hk') ? 'zh-Hant' : 'zh-Hans'
    if (value.startsWith('pt')) return 'pt'
    return value.split('-')[0] || 'en'
})

const isChinese = computed(() => luxonLocale.value.startsWith('zh'))

const range = computed(() => visibleRange(props.calendarDate, props.period, props.periodCount, props.startingDayOfWeek))

/** entries grouped by the ISO date they start on */
const entriesPerDay = computed(() => {
    const map = new Map<string, MealPlan[]>()
    props.plans.forEach(plan => {
        if (!plan.fromDate) return
        const key = DateTime.fromJSDate(plan.fromDate).toISODate() as string
        const bucket = map.get(key)
        if (bucket) bucket.push(plan)
        else map.set(key, [plan])
    })
    map.forEach(list => list.sort((a, b) => (a.fromDate?.getTime() ?? 0) - (b.fromDate?.getTime() ?? 0)))
    return map
})

const days = computed(() => {
    const today = DateTime.now().startOf('day')
    const result = []
    // a year of days would be a useless list on a phone, cap it to a month
    const limit = Math.min(31, Math.round(range.value.end.diff(range.value.start, 'days').days) + 1)

    for (let i = 0; i < limit; i++) {
        const date = range.value.start.plus({days: i})
        const key = date.toISODate() as string
        result.push({
            key,
            date: date.toJSDate(),
            isToday: date.hasSame(today, 'day'),
            isPast: date < today && !date.hasSame(today, 'day'),
            dateLabel: date.setLocale(luxonLocale.value).toFormat(isChinese.value ? 'M月d日' : 'LLL d'),
            weekdayLabel: date.setLocale(luxonLocale.value).toFormat('ccc'),
            entries: entriesPerDay.value.get(key) ?? [],
        })
    }
    return result
})

function titleOf(plan: MealPlan): string {
    if (plan.title) return plan.title
    if (plan.recipe) return plan.recipe.name
    return '—'
}

function timeOf(plan: MealPlan): string {
    if (!plan.fromDate) return ''
    const time = DateTime.fromJSDate(plan.fromDate)
    if (time.hour === 0 && time.minute === 0 && plan.mealType?.time) return ''
    return time.toFormat('HH:mm')
}

/** same bucket as the desktop grid so the two views stay recognisable */
function accentOf(plan: MealPlan): string {
    if (plan.mealType?.color) return plan.mealType.color
    if (!plan.fromDate) return 'var(--mp-accent)'
    const hour = DateTime.fromJSDate(plan.fromDate).hour
    if (hour < 11) return '#c08a45'
    if (hour < 16) return '#7d8f5b'
    return '#9d6b86'
}
</script>

<style scoped>
.mp-agenda {
    height: 100%;
    min-height: 0;
    background: var(--mp-grid);
}

.mp-agenda__scroll {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 5px 0 14px;
    scrollbar-width: thin;
    scrollbar-color: var(--mp-scroll-thumb) transparent;
}

.mp-agenda__day {
    padding: 2px 10px 8px;
    border-bottom: 1px solid var(--mp-line);
}

.mp-agenda__day:last-child {
    border-bottom: 0;
}

.mp-agenda__head {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 3px 2px 5px;
}

.mp-agenda__weekday {
    font-size: .7rem;
    font-weight: 600;
    letter-spacing: .06em;
    color: var(--mp-text-soft);
}

.mp-agenda__date {
    font-size: .84rem;
    font-weight: 600;
    color: var(--mp-text);
    font-variant-numeric: tabular-nums;
}

.mp-agenda__day--today .mp-agenda__date {
    color: var(--mp-accent-ink);
}

.mp-agenda__day--past .mp-agenda__weekday,
.mp-agenda__day--past .mp-agenda__date {
    color: var(--mp-text-faint);
}

.mp-agenda__count {
    min-width: 16px;
    height: 16px;
    padding: 0 5px;
    border-radius: 8px;
    background: var(--mp-accent);
    color: #ffffff;
    font-size: .58rem;
    font-weight: 600;
    line-height: 16px;
    text-align: center;
}

.mp-agenda__spacer {
    flex: 1 1 auto;
}

.mp-agenda__add {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px dashed var(--mp-add-border);
    background: transparent;
    color: var(--mp-text-faint);
    font-size: .6rem;
    line-height: 1;
    cursor: pointer;
    transition: color .16s ease, border-color .16s ease, background-color .16s ease;
}

.mp-agenda__add:hover {
    color: var(--mp-accent-ink);
    border-color: var(--mp-accent-ink);
    background: var(--mp-add-hover-bg);
}

.mp-agenda__empty {
    padding: 2px 2px 6px;
    font-size: .68rem;
    color: var(--mp-text-ghost);
}

.mp-agenda__entry {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px 8px 6px 7px;
    margin-bottom: 5px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--mp-accent) 26%, var(--mp-item-base));
    border-left-width: 3px;
    background: color-mix(in srgb, var(--mp-accent) 14%, var(--mp-item-base));
    cursor: pointer;
    transition: box-shadow .16s ease, transform .16s ease;
}

.mp-agenda__entry:active {
    transform: scale(.995);
}

.mp-agenda__thumb {
    flex: 0 0 38px;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    overflow: hidden;
    line-height: 0;
    background: var(--mp-thumb-bg);
}

.mp-agenda__thumb :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.mp-agenda__body {
    min-width: 0;
    flex: 1 1 auto;
}

.mp-agenda__title {
    font-size: .82rem;
    font-weight: 500;
    line-height: 1.25;
    color: var(--mp-text);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
}

.mp-agenda__meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 1px;
    font-size: .64rem;
    color: color-mix(in srgb, var(--mp-accent) 62%, var(--mp-text-mid));
}

.mp-agenda__dot {
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: currentColor;
    opacity: .5;
}

.mp-agenda__meta i {
    font-size: .6rem;
}
</style>
