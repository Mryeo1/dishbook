<template>


    <v-layout style="height: 70vh">

        <v-navigation-drawer style="height: calc(100% + 0px)" v-model="drawer">
            <v-list>

                <!--                <v-list-item>-->
                <!--                    <v-text-field density="compact" variant="outlined" class="pt-2 pb-2" :label="$t('Search')" hide-details clearable></v-text-field>-->
                <!--                </v-list-item>-->
                <!--                <v-divider></v-divider>-->
                <v-list-item link :title="$t('Start')" @click="window = 'start'" prepend-icon="fa-solid fa-house"></v-list-item>
                <v-list-item link :title="$t('Space')" @click="window = 'space'" prepend-icon="fa-solid fa-database"></v-list-item>
                <v-list-item link :title="$t('Recipes')" @click="window = 'recipes'" prepend-icon="$recipes"></v-list-item>
                <v-list-item link :title="$t('Import')" @click="window = 'import'" prepend-icon="$import"></v-list-item>
                <v-list-item link :title="$t('AI')" @click="window = 'ai'" prepend-icon="$ai"></v-list-item>
                <v-list-item link :title="$t('Unit')" @click="window = 'unit'" prepend-icon="fa-solid fa-scale-balanced"></v-list-item>
                <v-list-item link :title="$t('Food')" @click="window = 'food'" prepend-icon="fa-solid fa-carrot"></v-list-item>
                <v-list-item link :title="$t('Keyword')" @click="window = 'keyword'" prepend-icon="fa-solid fa-tags"></v-list-item>
                <v-list-item link :title="$t('Recipe Structure')" @click="window = 'recipe_structure'" prepend-icon="fa-solid fa-diagram-project"></v-list-item>
                <v-list-item link :title="$t('Properties')" @click="window = 'properties'" prepend-icon="fa-solid fa-database"></v-list-item>
                <v-list-item link :title="$t('Search')" @click="window = 'recipe_search'" prepend-icon="$search"></v-list-item>
                <v-list-item link :title="$t('SavedSearch')" @click="window = 'search_filter'" prepend-icon="fa-solid fa-sd-card"></v-list-item>
                <v-list-item link :title="$t('Books')" @click="window = 'books'" prepend-icon="$books"></v-list-item>
                <v-list-item link :title="$t('Shopping')" @click="window = 'shopping'" prepend-icon="$shopping"></v-list-item>
                <v-list-item link :title="$t('Meal_Plan')" @click="window = 'meal_plan'" prepend-icon="$mealplan"></v-list-item>
                <v-list-item link :title="$t('Translations')" @click="window = 'translations'" prepend-icon="fa-solid fa-language"></v-list-item>
            </v-list>

        </v-navigation-drawer>

        <v-main scrollable>
            <v-container>
                <v-select v-model="window" :items="mobileMenuItems" class="d-block d-lg-none">  </v-select>

                <v-window v-model="window">
                    <v-window-item value="start">
                        <h2>{{ $t('WelcomeToTandoor2') }}</h2>
                        <p class="mt-3">{{ $t('HelpText01') }}</p>

                        <v-btn class="mt-2" color="primary" href="https://tandoor.dev" target="_blank" prepend-icon="fa-solid fa-globe">
                            {{ $t('Website') }}
                        </v-btn>
                        <v-btn class="mt-2 ms-2" color="info" href="https://github.com/TandoorRecipes/recipes" target="_blank" prepend-icon="fa-solid fa-code-branch">GitHub
                        </v-btn>

                        <v-alert class="mt-3" border="start" variant="tonal" color="success"
                                 v-if="!useUserPreferenceStore().activeSpace.demo">
                            <v-alert-title>{{ $t('DidYouKnow') }}</v-alert-title>
                            {{ $t('HelpOpenSourceText') }}
                            <br/>
                            <v-btn class="mt-2" color="secondary" href="https://docs.tandoor.dev/contribute/contribute/" target="_blank" prepend-icon="fa-solid fa-code-branch">
                                {{ $t('Contribute') }}
                            </v-btn>
                            <v-btn class="mt-2 ms-2" color="success" href="https://github.com/sponsors/vabene1111" target="_blank" prepend-icon="fa-solid fa-dollar-sign">{{ $t('Sponsor') }}
                            </v-btn>
                        </v-alert>

                    </v-window-item>
                    <v-window-item value="space">
                        <p class="mt-3">{{ $t('HelpText02') }}</p>

                        <p class="mt-3">{{ $t('HelpText03') }}</p>
                        <p class="mt-3">{{ $t('HelpText04') }}</p>
                        <p class="mt-3"></p>

                        <v-btn color="primary" variant="tonal" prepend-icon="fa-solid fa-database" class="me-2" :to="{name: 'UserSpaceSettings'}">{{ $t('YourSpaces') }}</v-btn>
                        <v-btn color="primary" variant="tonal" prepend-icon="$settings" class="me-2" :to="{name: 'SpaceSettings'}">{{ $t('SpaceSettings') }}</v-btn>
                        <v-btn color="primary" variant="tonal" prepend-icon="fa-solid fa-users" class="me-2" :to="{name: 'SpaceMemberSettings'}">{{ $t('Invites') }}</v-btn>

                    </v-window-item>
                    <v-window-item value="recipes">
                        <p class="mt-3">{{ $t('HelpText05') }}</p>

                        <p class="mt-3">{{ $t('HelpText06') }}</p>
                        <p class="mt-3">{{ $t('HelpText07') }}</p>
                        <p class="mt-3"></p>

                        <v-btn color="primary" variant="tonal" prepend-icon="$create" class="me-2" :to="{name: 'ModelEditPage', params: {model: 'Recipe'}}">{{
                                $t('Create')
                            }}
                        </v-btn>
                        <v-btn color="primary" variant="tonal" prepend-icon="$search" class="me-2" :to="{name: 'SearchPage'}">{{ $t('Search') }}</v-btn>

                    </v-window-item>
                    <v-window-item value="import">
                        <p class="mt-3">{{ $t('HelpText08') }}</p>

                        <p class="mt-3">{{ $t('HelpText09') }}</p>
                        <p class="mt-3">{{ $t('HelpText10') }}</p>
                        <p class="mt-3"></p>

                        <v-btn color="primary" variant="tonal" prepend-icon="$import" class="me-2" :to="{name: 'RecipeImportPage'}">{{ $t('Import') }}</v-btn>

                    </v-window-item>
                    <v-window-item value="ai">
                        <p class="mt-3">{{ $t('HelpText11') }}</p>

                        <p class="mt-3">{{ $t('HelpText13') }}</p>

                        <p class="mt-3">{{ $t('HelpText15') }}</p>

                        <v-btn color="primary" variant="tonal" prepend-icon="$ai" class="me-2" :to="{name: 'ModelListPage', params: {model: 'AiProvider'}}">
                            {{ $t('AiProvider') }}
                        </v-btn>
                        <v-btn color="primary" variant="tonal" prepend-icon="$ai" class="me-2" :to="{name: 'ModelListPage', params: {model: 'AiLog'}}">
                            {{ $t('AiLog') }}
                        </v-btn>
                        <v-btn color="primary" variant="tonal" prepend-icon="$ai" class="me-2" :to="{name: 'SpaceSettings'}">{{ $t('SpaceSettings') }}</v-btn>
                        <v-btn color="primary" variant="tonal" prepend-icon="$import" class="me-2" :to="{name: 'RecipeImportPage'}">{{ $t('Import') }}</v-btn>

                    </v-window-item>
                    <v-window-item value="unit">
                        <p class="mt-3">{{ $t('HelpText16') }}</p>

                        <p class="mt-3">{{ $t('HelpText17') }}</p>
                        <p class="mt-3">{{ $t('HelpText18') }}</p>


                        <v-btn color="primary" variant="tonal" prepend-icon="fa-solid fa-scale-balanced" class="me-2" :to="{name: 'ModelListPage', params: {model: 'Unit'}}">
                            {{ $t('Unit') }}
                        </v-btn>
                        <v-btn color="primary" variant="tonal" prepend-icon="fa-solid fa-exchange-alt" class="me-2"
                               :to="{name: 'ModelListPage', params: {model: 'UnitConversion'}}">
                            {{ $t('Conversion') }}
                        </v-btn>

                    </v-window-item>
                    <v-window-item value="food">
                        <p class="mt-3">{{ $t('HelpText19') }}</p>

                        <p class="mt-3">{{ $t('HelpText20') }}</p>
                        <p class="mt-3">{{ $t('HelpText21') }}</p>


                        <v-btn color="primary" variant="tonal" prepend-icon="fa-solid fa-carrot" class="me-2" :to="{name: 'ModelListPage', params: {model: 'Food'}}">
                            {{ $t('Food') }}
                        </v-btn>

                    </v-window-item>
                    <v-window-item value="keyword">
                        <p class="mt-3">{{ $t('HelpText22') }}</p>

                        <p class="mt-3">{{ $t('HelpText23') }}</p>
                        <p class="mt-3">{{ $t('HelpText24') }}</p>


                        <v-btn color="primary" variant="tonal" prepend-icon="fa-solid fa-tags" class="me-2" :to="{name: 'ModelListPage', params: {model: 'Keyword'}}">
                            {{ $t('Keyword') }}
                        </v-btn>

                    </v-window-item>
                    <v-window-item value="recipe_structure">
                        <p class="mt-3">{{ $t('HelpText25') }}</p>

                        <p class="mt-3">{{ $t('HelpText26') }}</p>
                        <p class="mt-3">{{ $t('HelpText27') }}</p>
                        <!-- TODO diagram -->

                    </v-window-item>
                    <v-window-item value="properties">
                        <p class="mt-3">{{ $t('HelpText28') }}</p>

                        <p class="mt-3">{{ $t('HelpText29') }}</p>
                        <p class="mt-3">{{ $t('HelpText30') }}</p>

                        <p class="mt-3">{{ $t('HelpText31') }}</p>

                        <v-btn color="primary" variant="tonal" prepend-icon="fa-solid fa-database" class="me-2 mt-2 mb-2"
                               :to="{name: 'ModelListPage', params: {model: 'PropertyType'}}">
                            {{ $t('Property') }}
                        </v-btn>
                        <h3>{{ $t('Editor') }}</h3>
                        <p class="mt-3">{{ $t('HelpText32') }}</p>

                        <p class="mt-3">{{ $t('HelpText33') }}</p>
                        <h3>{{ $t('View') }}</h3>

                        <p class="mt-3">{{ $t('HelpText34') }}</p>
                        <p class="mt-3">{{ $t('HelpText35') }}</p>
                    </v-window-item>
                    <v-window-item value="recipe_search">
                        <p class="mt-3">{{ $t('HelpText36') }}</p>

                        <p class="mt-3">{{ $t('HelpText37') }}</p>
                        <p class="mt-3">{{ $t('HelpText38') }}</p>


                        <v-btn color="primary" variant="tonal" prepend-icon="$search" class="me-2" :to="{name: 'SearchPage', }">
                            {{ $t('Search') }}
                        </v-btn>

                    </v-window-item>
                    <v-window-item value="search_filter">
                        <p class="mt-3">{{ $t('HelpText39') }}</p>
                        <p class="mt-3">{{ $t('HelpText40') }}</p>
                        <p class="mt-3">{{ $t('HelpText41') }}</p>
                    </v-window-item>
                    <v-window-item value="books">
                        <p class="mt-3">{{ $t('HelpText42') }}</p>

                        <p class="mt-3">{{ $t('HelpText43') }}</p>

                        <v-btn color="primary" variant="tonal" prepend-icon="$books" class="me-2" :to="{name: 'BooksPage', }">
                            {{ $t('Books') }}
                        </v-btn>
                    </v-window-item>
                    <v-window-item value="shopping">
                        <p class="mt-3">{{ $t('HelpText44') }}</p>

                        <p class="mt-3">{{ $t('HelpText45') }}</p>

                        <p class="mt-3">{{ $t('HelpText46') }}</p>

                        <v-list>
                            <v-list-item>Postpone: Hide the entry from the shopping list for a certain time (specified in the settings)</v-list-item>
                            <v-list-item>Ignore: Check this Food of the list and do not add it again when adding a recipe to the shopping list</v-list-item>
                            <v-list-item>Edit: Open the Food's Editor</v-list-item>
                            <v-list-item>Delete all: Delete all entries associated with this line.</v-list-item>
                        </v-list>

                        <p class="mt-3">{{ $t('HelpText47') }}</p>
                        <p class="mt-3">{{ $t('HelpText48') }}</p>
                        <v-btn color="primary" variant="tonal" prepend-icon="$shopping" class="me-2" :to="{name: 'ShoppingListPage', }">
                            {{ $t('Shopping') }}
                        </v-btn>
                        <v-btn color="primary" variant="tonal" prepend-icon="$settings" class="me-2" :to="{name: 'ShoppingSettings', }">
                            {{ $t('Settings') }}
                        </v-btn>
                    </v-window-item>

                    <v-window-item value="meal_plan">
                        <p class="mt-3">{{ $t('HelpText49') }}</p>

                        <p class="mt-3">{{ $t('HelpText50') }}</p>

                        <v-btn color="primary" variant="tonal" prepend-icon="$mealplan" class="me-2 mt-2" :to="{name: 'MealPlanPage', }">
                            {{ $t('Meal_Plan') }}
                        </v-btn>

                        <h3 class="mt-3">{{ $t('Meal_Type') }}</h3>

                        <p class="mt-3">{{ $t('HelpText51') }}</p>
                        <p class="mt-3">{{ $t('HelpText52') }}</p>

                        <v-btn color="primary" variant="tonal" prepend-icon="fa-solid fa-utensils" class="me-2 mt-2" :to="{name: 'ModelListPage', params: {model: 'MealType'}}">
                            {{ $t('Meal_Type') }}
                        </v-btn>

                    </v-window-item>
                    <v-window-item value="translations">
                        <div class="d-flex align-center justify-space-between">
                            <h2>{{ $t('Translations') }}</h2>
                            <v-btn variant="tonal" color="primary" href="https://translate.tandoor.dev" target="_blank" prepend-icon="fa-solid fa-language">
                                {{ $t('help_translate') }}
                            </v-btn>
                        </div>
                        <p class="mt-3">
                            {{ $t('HelpTranslateIntro') }}
                            <a href="https://translate.tandoor.dev" target="_blank">Weblate</a>
                            {{ $t('HelpTranslateCoverage', {coverage: minCoverage}) }}
                        </p>

                        <v-table density="compact" class="mt-4">
                            <thead>
                                <tr>
                                    <th>{{ $t('Language') }}</th>
                                    <th>{{ $t('Frontend') }}</th>
                                    <th>{{ $t('Backend') }}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="lang in sortedCoverage" :key="lang.filename">
                                    <td>
                                        <span :class="{'text-disabled': lang.fe < minCoverage}">
                                            {{ lang.name }}
                                        </span>
                                    </td>
                                    <td style="min-width: 160px">
                                        <div class="d-flex align-center ga-2">
                                            <v-progress-linear
                                                :model-value="lang.fe"
                                                :color="barColor(lang.fe)"
                                                height="14"
                                                rounded
                                                style="max-width: 100px"
                                            >
                                                <template #default>
                                                    <span class="text-caption" style="font-size: 10px !important">{{ lang.fe }}%</span>
                                                </template>
                                            </v-progress-linear>
                                        </div>
                                    </td>
                                    <td style="min-width: 160px">
                                        <div class="d-flex align-center ga-2">
                                            <v-progress-linear
                                                :model-value="lang.be"
                                                :color="barColor(lang.be)"
                                                height="14"
                                                rounded
                                                style="max-width: 100px"
                                            >
                                                <template #default>
                                                    <span class="text-caption" style="font-size: 10px !important">{{ lang.be }}%</span>
                                                </template>
                                            </v-progress-linear>
                                        </div>
                                    </td>
                                    <td>
                                        <v-btn
                                            size="x-small"
                                            variant="text"
                                            icon="fa-solid fa-pen"
                                            :href="weblateUrl(lang.filename)"
                                            target="_blank"
                                            :aria-label="'Translate ' + lang.name"
                                        ></v-btn>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-window-item>
                </v-window>
            </v-container>
        </v-main>
    </v-layout>


</template>

<script setup lang="ts">

import {ref, computed} from "vue";
import {useUserPreferenceStore} from "@/stores/UserPreferenceStore.ts";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import {localeCoverage, LOCALE_MIN_COVERAGE as minCoverage} from "@/i18n.ts";

const props = withDefaults(defineProps<{
    defaultSection?: string
}>(), {
    defaultSection: undefined,
})

const {t} = useI18n()
const route = useRoute()
const drawer = defineModel()
const section = props.defaultSection || (typeof route.query.section === 'string' ? route.query.section : null)
const window = ref(section || 'start')

const mobileMenuItems = ref([
    {title: t('Start'), props: {prependIcon: 'fa-solid fa-house'}, value: 'start'},
    {title: t('Space'), props: {prependIcon: 'fa-solid fa-database'}, value: 'space'},
    {title: t('Recipes'), props: {prependIcon: '$recipes'}, value: 'recipes'},
    {title: t('Import'), props: {prependIcon: '$import'}, value: 'import'},
    {title: t('AI'), props: {prependIcon: '$ai'}, value: 'ai'},
    {title: t('Unit'), props: {prependIcon: 'fa-solid fa-scale-balanced'}, value: 'unit'},
    {title: t('Food'), props: {prependIcon: 'fa-solid fa-carrot'}, value: 'food'},
    {title: t('Keyword'), props: {prependIcon: 'fa-solid fa-tags'}, value: 'keyword'},
    {title: t('RecipeStructure'), props: {prependIcon: 'fa-solid fa-diagram-project'}, value: 'recipe_structure'},
    {title: t('Properties'), props: {prependIcon: 'fa-solid fa-database'}, value: 'properties'},
    {title: t('Search'), props: {prependIcon: '$search'}, value: 'recipe_search'},
    {title: t('SavedSearch'), props: {prependIcon: 'fa-solid fa-sd-card'}, value: 'search_filter'},
    {title: t('Books'), props: {prependIcon: '$books'}, value: 'books'},
    {title: t('Shopping'), props: {prependIcon: '$shopping'}, value: 'shopping'},
    {title: t('Meal_Plan'), props: {prependIcon: '$mealplan'}, value: 'meal_plan'},
    {title: t('Translations'), props: {prependIcon: 'fa-solid fa-language'}, value: 'translations'}
])

// Weblate directory names use underscore format (nb_NO, zh_Hant)
function weblateUrl(filename: string): string {
    return `https://translate.tandoor.dev/projects/tandoor/-/${filename}/`
}

function barColor(pct: number): string {
    if (pct >= 80) return 'success'
    if (pct >= minCoverage) return 'warning'
    return 'error'
}

// Use Intl.DisplayNames to get native language names
const displayNames = new Intl.DisplayNames(['en'], {type: 'language'})

const sortedCoverage = computed(() => {
    return Object.entries(localeCoverage)
        .filter(([filename]) => filename !== 'en')  // exclude source language
        .map(([filename, data]) => {
            const code = filename.replaceAll('_', '-').toLowerCase()
            let name: string
            try {
                name = displayNames.of(code) || filename
            } catch {
                name = filename
            }
            return {filename, code, name, fe: data.fe, be: data.be}
        })
        .sort((a, b) => b.fe - a.fe || b.be - a.be)
})

</script>


<style scoped>

</style>