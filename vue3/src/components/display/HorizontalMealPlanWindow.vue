<template>
    <template v-if="days.length > 0">
        <!-- header: same visual language as the recipe rows below (h4 + "more") -->
        <v-row class="mt-0 mb-0" justify="space-between">
            <v-col class="pb-0">
                <h4>
                    <i class="fa-solid fa-calendar-week fa-fw"></i> {{ $t('Meal_Plan') }}
                    <span v-if="hasMore" class="ms-2 text-body-2 cursor-pointer day-more" @click="dialog = true">
                        {{ $t('ViewFullWeek') }} <i class="fa-solid fa-chevron-down"></i>
                    </span>
                </h4>
            </v-col>
        </v-row>

        <v-row class="mt-1" dense v-if="visibleDays.length > 0">
            <v-col v-for="day in visibleDays" :key="day.iso" cols="12" sm="6" class="d-flex">
                <v-card variant="outlined" class="day-card">
                    <div class="day-head">
                        <div class="d-flex align-center ga-2">
                            <v-icon :icon="day.icon" size="16" class="text-medium-emphasis"></v-icon>
                            <span class="text-subtitle-2">{{ day.label }}</span>
                            <span class="text-caption text-medium-emphasis">{{ day.shortDate }}</span>
                        </div>
                        <span class="text-caption text-medium-emphasis">{{ day.entries.length ? $t('Count_Items', {count: day.entries.length}) : '' }}</span>
                    </div>

                    <v-progress-linear v-if="loading" height="1" indeterminate></v-progress-linear>

                    <div v-if="day.entries.length === 0" class="day-empty">
                        <span class="text-caption text-medium-emphasis">{{ $t('NothingPlanned') }}</span>
                    </div>

                    <v-list v-else density="compact" class="pt-0 pb-0">
                        <v-list-item v-for="p in day.entries" :key="p.id" @click="clickMealPlan(p)" link class="day-entry">
                            <template #prepend>
                                <v-avatar size="32" :image="p.recipe?.image" v-if="p.recipe?.image"></v-avatar>
                                <v-avatar size="32" v-else>
                                    <v-icon size="16" class="text-medium-emphasis">fa-solid fa-utensils</v-icon>
                                </v-avatar>
                            </template>
                            <v-list-item-title class="text-body-2">
                                <span v-if="p.recipe">{{ p.recipe.name }}</span>
                                <span v-else>{{ p.title }}</span>
                            </v-list-item-title>
                            <v-list-item-subtitle class="text-caption">{{ p.mealType.name }}</v-list-item-subtitle>
                            <template #append>
                                <model-edit-dialog model="MealPlan" :item="p"></model-edit-dialog>
                            </template>
                        </v-list-item>
                    </v-list>

                    <div class="day-foot">
                        <model-edit-dialog model="MealPlan" :item-defaults="{fromDate: day.date.toJSDate()}"
                                           :close-after-create="false" :close-after-save="false"></model-edit-dialog>
                        <span class="text-caption">{{ $t('Add') }}</span>
                    </div>
                </v-card>
            </v-col>
        </v-row>

        <!-- full week, only reachable through the "more" link -->
        <v-dialog v-model="dialog" max-width="1080" scrollable>
            <v-card>
                <v-card-title class="d-flex align-center ga-2 py-3">
                    <i class="fa-solid fa-calendar-week"></i>
                    <span class="text-h6">{{ $t('Meal_Plan') }}</span>
                    <v-spacer></v-spacer>
                    <v-btn icon="fa-solid fa-xmark" variant="text" size="small" @click="dialog = false"></v-btn>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text class="pa-3">
                    <v-row dense>
                        <v-col v-for="day in days" :key="'d-' + day.iso" cols="12" sm="6" md="4" class="d-flex">
                            <v-card variant="outlined" class="day-card h-100">
                                <div class="day-head">
                                    <div class="d-flex align-center ga-2">
                                        <v-icon :icon="day.icon" size="16" class="text-medium-emphasis"></v-icon>
                                        <span class="text-subtitle-2">{{ day.label }}</span>
                                        <span class="text-caption text-medium-emphasis">{{ day.shortDate }}</span>
                                    </div>
                                    <span class="text-caption text-medium-emphasis">{{ day.entries.length ? $t('Count_Items', {count: day.entries.length}) : '' }}</span>
                                </div>
                                <div v-if="day.entries.length === 0" class="day-empty">
                                    <span class="text-caption text-medium-emphasis">{{ $t('NothingPlanned') }}</span>
                                </div>
                                <v-list v-else density="compact" class="pt-0 pb-0">
                                    <v-list-item v-for="p in day.entries" :key="'dl-' + p.id" @click="clickMealPlan(p)" link class="day-entry">
                                        <template #prepend>
                                            <v-avatar size="28" :image="p.recipe?.image" v-if="p.recipe?.image"></v-avatar>
                                            <v-avatar size="28" v-else>
                                                <v-icon size="14" class="text-medium-emphasis">fa-solid fa-utensils</v-icon>
                                            </v-avatar>
                                        </template>
                                        <v-list-item-title class="text-body-2">
                                            <span v-if="p.recipe">{{ p.recipe.name }}</span>
                                            <span v-else>{{ p.title }}</span>
                                        </v-list-item-title>
                                        <v-list-item-subtitle class="text-caption">{{ p.mealType.name }}</v-list-item-subtitle>
                                    </v-list-item>
                                </v-list>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-btn variant="text" @click="dialog = false">{{ $t('Close') }}</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn variant="tonal" append-icon="fa-solid fa-arrow-right" :to="{name: 'MealPlanPage'}">{{ $t('Meal_Plan') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </template>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {MealPlan} from "@/openapi";
import {useMealPlanStore} from "@/stores/MealPlanStore";
import {DateTime} from "luxon";
import ModelEditDialog from "@/components/dialogs/ModelEditDialog.vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";

const router = useRouter()
const {t} = useI18n()

const loading = ref(false)
const dialog = ref(false)

type Day = {
    iso: string,
    label: string,
    shortDate: string,
    icon: string,
    date: DateTime,
    entries: MealPlan[],
}

// today + the next six days, so the dialog can show a whole week
const DAYS_AHEAD = 7

const days = computed<Day[]>(() => {
    const list: Day[] = []
    const plans = (useMealPlanStore().planList || []) as MealPlan[]

    for (let i = 0; i < DAYS_AHEAD; i++) {
        const day = DateTime.now().startOf('day').plus({days: i})
        const entries = plans.filter((m: MealPlan) => {
            const from = DateTime.fromJSDate(m.fromDate).startOf('day')
            const to = DateTime.fromJSDate(m.toDate != undefined ? m.toDate : m.fromDate).startOf('day')
            return from <= day && to >= day
        }).sort((a, b) => DateTime.fromJSDate(a.fromDate).toMillis() - DateTime.fromJSDate(b.fromDate).toMillis())

        list.push({
            iso: day.toISODate() as string,
            label: i === 0 ? t('Today') : i === 1 ? t('Tomorrow') : day.toLocaleString({weekday: 'long'}),
            shortDate: day.toLocaleString({month: '2-digit', day: '2-digit'}),
            icon: i === 0 ? 'fa-solid fa-bowl-food' : 'fa-regular fa-calendar',
            date: day,
            entries: entries,
        })
    }
    return list
})

// the strip only ever shows today and tomorrow
const visibleDays = computed(() => days.value.slice(0, 2))

// ... and the "more" link only appears when something is planned beyond them
const hasMore = computed(() => days.value.slice(2).some(d => d.entries.length > 0))

onMounted(() => {
    loading.value = true
    useMealPlanStore().refreshFromAPI(DateTime.now().toJSDate(), DateTime.now().plus({days: 8}).toJSDate()).finally(() => {
        loading.value = false
    })
})

function clickMealPlan(plan: MealPlan) {
    if (plan.recipe) {
        router.push({
            name: 'RecipeViewPage',
            params: {id: String(plan.recipe.id)},
            query: {servings: String(plan.servings ?? '')}
        })
    }
}
</script>

<style scoped>
.day-more {
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.day-more:hover {
    color: rgb(var(--v-theme-primary));
}

.day-card {
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    width: 100%;
}

.day-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background: rgba(var(--v-theme-on-surface), 0.02);
}

.day-entry {
    border-radius: 8px;
    min-height: 44px;
}

.day-empty {
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 auto;
}

.day-foot {
    margin-top: auto;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    cursor: pointer;
    border-top: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
}

.day-foot:hover {
    background: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
