<template>
    <div class="mp-head">
        <div class="mp-head__range">
            <span class="mp-head__month">{{ monthLabel }}</span>
            <span class="mp-head__sub">{{ rangeLabel }}</span>
        </div>
        <div class="mp-head__nav">
            <v-btn density="comfortable" icon="fa-solid fa-chevron-left" variant="text" size="small"
                   class="mp-head__arrow"
                   @click="date = props.headerProps.previousFullPeriod"></v-btn>
            <v-btn density="comfortable" variant="tonal" size="small" class="mp-head__today"
                   @click="date = new Date()">{{ $t('Today') }}</v-btn>
            <v-btn density="comfortable" icon="fa-solid fa-chevron-right" variant="text" size="small"
                   class="mp-head__arrow"
                   @click="date = props.headerProps.nextFullPeriod"></v-btn>

            <v-menu :close-on-content-click="false" location="bottom end" offset="6">
                <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" density="comfortable" variant="text" size="small"
                           icon="fa-regular fa-calendar" class="mp-head__calendar"></v-btn>
                </template>
                <v-date-picker :model-value="date" @update:model-value="(d: any) => d && (date = d)"
                               color="primary" show-adjacent-months></v-date-picker>
            </v-menu>
        </div>
    </div>
</template>

<script setup lang="ts">

import {IHeaderProps} from "vue-simple-calendar/dist/src/IHeaderProps";
import {computed, ref, watch} from "vue";
import {DateTime} from "luxon";

const emit = defineEmits(['input'])

const props = defineProps({
    headerProps: {
        type: Object as () => IHeaderProps,
        required: true,
    },
})

const date = ref(new Date())

const first = computed(() => props.headerProps?.displayFirstDate ? DateTime.fromJSDate(props.headerProps.displayFirstDate) : null)
const last = computed(() => props.headerProps?.displayLastDate ? DateTime.fromJSDate(props.headerProps.displayLastDate) : null)

/**
 * "2026年11月" when the period stays inside one month, a month range otherwise
 */
const monthLabel = computed(() => {
    if (!first.value || !last.value) return ''
    if (first.value.hasSame(last.value, 'month')) {
        return first.value.toLocaleString({year: 'numeric', month: 'long'})
    }
    if (first.value.hasSame(last.value, 'year')) {
        return `${first.value.toLocaleString({year: 'numeric', month: 'long'})} – ${last.value.toLocaleString({month: 'long'})}`
    }
    return `${first.value.toLocaleString({year: 'numeric', month: 'long'})} – ${last.value.toLocaleString({year: 'numeric', month: 'long'})}`
})

/**
 * compact day range shown next to the month label
 */
const rangeLabel = computed(() => {
    if (!first.value || !last.value) return ''
    return `${first.value.toLocaleString({month: 'numeric', day: 'numeric'})} – ${last.value.toLocaleString({month: 'numeric', day: 'numeric'})}`
})

watch(() => date.value, (newValue) => {
    emit('input', newValue)
})

</script>

<style scoped>
.mp-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 9px 14px;
    width: 100%;
    border-bottom: 1px solid var(--mp-line-day);
    background: var(--mp-surface);
}

.mp-head__range {
    display: flex;
    align-items: baseline;
    gap: 9px;
    min-width: 0;
}

.mp-head__month {
    font-size: 1.02rem;
    font-weight: 600;
    color: var(--mp-text);
    letter-spacing: .01em;
    white-space: nowrap;
}

.mp-head__sub {
    font-size: .76rem;
    color: var(--mp-text-soft);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}

.mp-head__nav {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 0 0 auto;
}

.mp-head__arrow {
    color: var(--mp-text-mid);
}

.mp-head__today {
    margin: 0 4px;
    text-transform: none;
    letter-spacing: 0;
    font-size: .78rem;
    font-weight: 600;
    border-radius: 9px;
    color: var(--mp-accent-ink);
}

.mp-head__calendar {
    margin-left: 4px;
    color: var(--mp-text-mid);
}

@media (max-width: 767.9px) {
    .mp-head {
        padding: 8px 10px;
        gap: 8px;
    }

    .mp-head__sub {
        display: none;
    }

    .mp-head__today {
        padding: 0 8px;
    }
}
</style>
