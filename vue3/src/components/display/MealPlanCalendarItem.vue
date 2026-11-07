<template>
    <!--
      positioning shell: vue-simple-calendar places every entry absolutely, the
      shell only carries that geometry. the visible card lives inside it with a
      small inset, which gives stacked entries a real gap instead of them
      touching each other and the day borders.
    -->
    <div class="cv-item mp-slot"
         :class="value.classes"
         :style="{'top': itemTop, 'height': itemHeight, '--mp-accent': accent}"
         draggable="true"
         @dragstart="emit('onDragStart', value, $event)">
        <v-card class="mp-item" :class="{'mp-item--compact': !detailedItems, 'mp-item--slim': slim}" variant="flat">
            <div class="mp-item__inner">
                <div class="mp-item__thumb" v-if="detailedItems && mealPlan.recipe">
                    <recipe-image height="100%" width="100%" :recipe="mealPlan.recipe"></recipe-image>
                </div>
                <div class="mp-item__body">
                    <div class="mp-item__title">{{ itemTitle }}</div>
                    <div class="mp-item__meta" v-if="detailedItems">
                        <span class="mp-item__type" v-if="mealPlan.mealType?.name">{{ mealPlan.mealType.name }}</span>
                        <span class="mp-item__dot" v-if="mealPlan.mealType?.name && timeLabel"></span>
                        <span class="mp-item__time" v-if="timeLabel">{{ timeLabel }}</span>
                        <i class="fas fa-cart-shopping" v-if="mealPlan.shopping"></i>
                    </div>
                </div>
            </div>
            <model-edit-dialog model="MealPlan" :item="mealPlan" @delete="(args: MealPlan) => emit('delete', args)"></model-edit-dialog>
        </v-card>
    </div>
</template>

<script setup lang="ts">

import {computed, PropType} from "vue";
import {IMealPlanNormalizedCalendarItem} from "@/types/MealPlan";
import RecipeImage from "@/components/display/RecipeImage.vue";
import ModelEditDialog from "@/components/dialogs/ModelEditDialog.vue";
import {MealPlan} from "@/openapi";
import {DateTime} from "luxon";

const emit = defineEmits({
    onDragStart: (value: IMealPlanNormalizedCalendarItem, event: DragEvent) => {
        return true
    },
    delete: (value: MealPlan) => {
        return true
    }
})

let props = defineProps({
    value: {type: {} as PropType<IMealPlanNormalizedCalendarItem>, required: true},
    itemHeight: {type: String,},
    itemTop: {type: String,},
    detailedItems: {type: Boolean, default: true},
    slim: {type: Boolean, default: false},
})

const mealPlan = computed(() => {
    return props.value.originalItem.mealPlan
})

const itemTitle = computed(() => {
    if (mealPlan.value.title != null && mealPlan.value.title !== "") {
        return mealPlan.value.title
    } else if (mealPlan.value.recipe != undefined) {
        return mealPlan.value.recipe.name
    } else {
        return 'ERROR'
    }
})

/**
 * start time only, e.g. "18:30". meal type gets its own chip so the two
 * pieces of information stay scannable at small sizes
 */
const timeLabel = computed(() => {
    if (!mealPlan.value.fromDate) return ''
    const time = DateTime.fromJSDate(mealPlan.value.fromDate)
    if (time.hour === 0 && time.minute === 0 && mealPlan.value.mealType?.time) {
        // entries created without an explicit time usually inherit the meal
        // type time, no need to print 00:00
        return ''
    }
    return time.toFormat('HH:mm')
})

/**
 * colour of the entry. an explicit meal type colour wins, otherwise the entry
 * is tinted by the time of day so breakfast / lunch / dinner stay
 * distinguishable in a grid of white cards.
 */
const accent = computed(() => {
    if (mealPlan.value.mealType?.color) {
        return mealPlan.value.mealType.color
    }
    if (!mealPlan.value.fromDate) return '#b98766'
    const hour = DateTime.fromJSDate(mealPlan.value.fromDate).hour
    if (hour < 11) return '#c08a45'
    if (hour < 16) return '#7d8f5b'
    return '#9d6b86'
})

</script>

<style scoped>
/*
 * shell holds the geometry only, so the card can be inset without fighting the
 * absolute positioning of the calendar
 */
.mp-slot {
    z-index: 1;
}

.mp-item {
    position: absolute;
    inset: 2px 4px;
    overflow: hidden;
    background: color-mix(in srgb, var(--mp-accent) 16%, var(--mp-item-base));
    border: 1px solid color-mix(in srgb, var(--mp-accent) 26%, var(--mp-item-base));
    border-radius: 8px;
    cursor: pointer;
    transition: box-shadow .16s ease, border-color .16s ease, transform .16s ease, background-color .16s ease;
}

.mp-item:hover {
    border-color: color-mix(in srgb, var(--mp-accent) 38%, var(--mp-item-base));
    box-shadow: 0 3px 10px color-mix(in srgb, var(--mp-accent) 22%, transparent);
    transform: translateY(-1px);
    z-index: 3;
}

.mp-item__inner {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 100%;
    padding: 0 6px 0 7px;
    min-width: 0;
}

.mp-item__thumb {
    flex: 0 0 var(--mp-thumb, 30px);
    width: var(--mp-thumb, 30px);
    height: var(--mp-thumb, 30px);
    border-radius: 6px;
    overflow: hidden;
    line-height: 0;
    background: var(--mp-thumb-bg);
}

.mp-item__thumb :deep(.v-img) {
    width: 100%;
    height: 100%;
}

.mp-item__thumb :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.mp-item__body {
    min-width: 0;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
}

.mp-item__title {
    font-size: .7rem;
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -.005em;
    color: var(--mp-text);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
    text-wrap: pretty;
}

.mp-item__meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: .58rem;
    line-height: 1.05;
    color: color-mix(in srgb, var(--mp-accent) 62%, var(--mp-text-mid));
    white-space: nowrap;
    overflow: hidden;
}

.mp-item__type {
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
}

.mp-item__dot {
    flex: 0 0 2px;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: currentColor;
    opacity: .5;
}

.mp-item__time {
    opacity: .8;
    font-variant-numeric: tabular-nums;
}

.mp-item__meta i {
    font-size: .55rem;
    opacity: .9;
}

/* a short card cannot hold a wrapped title and the meal line at once */
.mp-item--slim .mp-item__title {
    -webkit-line-clamp: 1;
    font-size: .68rem;
}

.mp-item--slim .mp-item__meta {
    font-size: .55rem;
}

/* month grid and small screens: one compact line, no picture */
.mp-item--compact {
    inset: 1px 2px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--mp-accent) 12%, var(--mp-item-base));
    border-color: color-mix(in srgb, var(--mp-accent) 20%, var(--mp-item-base));
    box-shadow: none;
}

.mp-item--compact:hover {
    transform: none;
    box-shadow: 0 1px 4px color-mix(in srgb, var(--mp-shadow) 12%, transparent);
}

.mp-item--compact .mp-item__inner {
    padding: 0 5px 0 6px;
    gap: 4px;
}

.mp-item--compact .mp-item__title {
    font-size: .64rem;
    line-height: 1.1;
    -webkit-line-clamp: 1;
    color: var(--mp-text);
}
</style>
