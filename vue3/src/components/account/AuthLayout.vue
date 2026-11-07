<template>
    <div class="auth-shell">
        <aside class="auth-brand">
            <div class="auth-brand-head">
                <img class="auth-brand-logo" src="../../assets/logo_color.svg" alt=""/>
                <span class="auth-brand-name">{{ $t('AppName') }}</span>
            </div>

            <div class="auth-brand-copy">
                <h2 class="auth-brand-title">{{ $t('AuthBrandTitle') }}</h2>

                <ul class="auth-features">
                    <li v-for="feature in FEATURES" :key="feature.title">
                        <span class="auth-feature-icon"><i :class="feature.icon" aria-hidden="true"/></span>
                        <span class="auth-feature-text">
                            <strong>{{ $t(feature.title) }}</strong>
                            <em>{{ $t(feature.desc) }}</em>
                        </span>
                    </li>
                </ul>
            </div>

            <img class="auth-art" src="../../assets/auth_illustration.jpg" alt=""/>
        </aside>

        <main class="auth-panel">
            <img class="auth-panel-mark" src="../../assets/logo_color.svg" alt="" aria-hidden="true"/>
            <div class="auth-stack">
                <section class="auth-card">
                    <header class="auth-head">
                        <h1 class="auth-title">{{ title }}</h1>
                    </header>

                    <p class="auth-subtitle" v-if="subtitle">{{ subtitle }}</p>

                    <div class="auth-body">
                        <slot/>
                    </div>
                </section>

                <footer class="auth-legal" v-if="showLegal && (legal.privacyUrl || legal.termsUrl || legal.imprintUrl)">
                    <a v-if="legal.privacyUrl" :href="legal.privacyUrl" target="_blank" rel="noreferrer">{{ $t('PrivacyPolicy') }}</a>
                    <a v-if="legal.termsUrl" :href="legal.termsUrl" target="_blank" rel="noreferrer">{{ $t('TermsOfService') }}</a>
                    <a v-if="legal.imprintUrl" :href="legal.imprintUrl" target="_blank" rel="noreferrer">{{ $t('Imprint') }}</a>
                </footer>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {useUserPreferenceStore} from "@/stores/UserPreferenceStore.ts"

withDefaults(defineProps<{
    title: string,
    subtitle?: string,
    showLegal?: boolean,
}>(), {
    showLegal: true,
})

const legal = computed(() => useUserPreferenceStore().serverSettings)

const FEATURES = [
    {icon: 'fa-solid fa-book-open', title: 'AuthFeatureRecipesTitle', desc: 'AuthFeatureRecipesDesc'},
    {icon: 'fa-solid fa-calendar-days', title: 'AuthFeaturePlanTitle', desc: 'AuthFeaturePlanDesc'},
    {icon: 'fa-solid fa-cart-shopping', title: 'AuthFeatureShopTitle', desc: 'AuthFeatureShopDesc'},
]
</script>

<style>
/*
 * Shared styling for all unauthenticated screens (login, signup, password reset).
 * The rules are intentionally global but namespaced with .auth-* so that the
 * slotted page content (compiled in the parent scope) picks them up as well.
 */

.auth-shell {
    /*
     * pinned to the viewport so the screen is immune to whatever spacing the
     * surrounding app shell applies and always fills the window exactly
     */
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(430px, .86fr);
    overflow: auto;
    background: rgb(var(--v-theme-surface));
}

/* --- brand / storytelling panel --- */

.auth-brand {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    padding: 42px 56px 0;
    overflow: hidden;
    background: linear-gradient(178deg, #fdf9f3 0%, #f9f0e2 44%, #f5e7d1 100%);
}

.auth-brand-head {
    display: flex;
    align-items: center;
    gap: 12px;
}

.auth-brand-logo {
    width: 38px;
    height: 38px;
    flex: none;
    border-radius: 10px;
    box-shadow: 0 3px 10px rgba(94, 62, 36, .18);
}

.auth-brand-name {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: .12em;
    color: #4b3627;
}

.auth-brand-copy {
    margin-top: 46px;
    max-width: 540px;
}

.auth-brand-title {
    margin: 0;
    font-size: 32px;
    font-weight: 650;
    line-height: 1.32;
    letter-spacing: -.02em;
    /* keep the headline on two evenly filled lines instead of stranding one character */
    text-wrap: balance;
    color: #42301f;
}

.auth-features {
    display: flex;
    flex-direction: column;
    gap: 10px;
    /* extra top margin because the intro paragraph was removed: the tiles still
       need room to breathe under the headline */
    margin: 52px 0 0;
    padding: 0;
    list-style: none;
}

/* each feature sits in its own soft tile so the three points read as separate
   items instead of one dense paragraph */
.auth-features li {
    position: relative;
    z-index: 0;
    display: flex;
    align-items: flex-start;
    gap: 15px;
    padding: 13px 15px;
    border: 1px solid rgba(94, 62, 36, .055);
    border-radius: 14px;
    /* opaque enough that the illustration never shows through the tiles */
    background: rgba(255, 255, 255, .9);
    /* scale from the left edge so the tile grows towards the panel centre and
       stays aligned with the headline */
    transform-origin: left center;
    transition: transform .26s cubic-bezier(.22, .61, .36, 1),
        background-color .26s ease,
        border-color .26s ease,
        box-shadow .26s ease;
    will-change: transform;
}

/* the whole tile scales, text included - that is the "grows under the cursor"
   effect, kept at 1.05 so it never reaches the form panel */
.auth-features li:hover {
    z-index: 2;
    transform: scale(1.05);
    background: rgba(255, 255, 255, .96);
    border-color: rgba(94, 62, 36, .1);
    box-shadow: 0 14px 30px -20px rgba(94, 62, 36, .55);
}

.auth-feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex: none;
    margin-top: 1px;
    border-radius: 12px;
    background: rgba(255, 255, 255, .78);
    box-shadow: 0 1px 2px rgba(94, 62, 36, .07);
    color: rgb(var(--v-theme-primary));
    font-size: 18px;
    transition: transform .28s cubic-bezier(.22, .61, .36, 1),
        background-color .28s ease,
        box-shadow .28s ease;
}

/* no extra icon zoom: the whole tile already scales, so the icon grows with it */
.auth-features li:hover .auth-feature-icon {
    background: #fff;
    box-shadow: 0 8px 18px -8px rgba(94, 62, 36, .45);
}

.auth-feature-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.auth-feature-text strong {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    color: #42301f;
}

.auth-feature-text em {
    font-size: 14px;
    font-style: normal;
    line-height: 1.55;
    /* reserve two lines so the three tiles always share the same height */
    min-height: 3.1em;
    text-wrap: pretty;
    color: rgba(66, 48, 31, .64);
}

.auth-art {
    width: calc(100% + 112px);
    height: 40%;
    min-height: 240px;
    margin: auto -56px 0;
    object-fit: cover;
    object-position: bottom center;
    /* let the illustration melt into the panel instead of sitting in a box */
    -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 22%);
    mask-image: linear-gradient(180deg, transparent 0, #000 22%);
}

/* --- form panel --- */

.auth-panel {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    padding: 48px 40px;
    overflow: hidden;
    /* almost white, with the same warm sand gradient as the brand side - just
       far lower saturation so the form panel stays calm */
    background:
        radial-gradient(880px 520px at 100% 0%, rgba(233, 209, 178, .26), transparent 68%),
        radial-gradient(760px 480px at 0% 100%, rgba(236, 216, 190, .22), transparent 66%),
        linear-gradient(158deg, #fffefd 0%, #fdfaf5 58%, #faf2e7 100%);
}

/* faint paper grain, keeps the large empty area from looking like flat paint */
.auth-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: .035;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* a single oversized ring in the corner gives the panel some depth */
.auth-panel::after {
    content: "";
    position: absolute;
    top: -200px;
    right: -180px;
    z-index: 0;
    width: 580px;
    height: 580px;
    border: 1px solid rgba(180, 130, 88, .09);
    border-radius: 50%;
    pointer-events: none;
}

/* faint brand mark in the lower corner, keeps the empty half of the panel occupied
   without introducing colours the rest of the app does not use */
.auth-panel-mark {
    position: absolute;
    right: 36px;
    bottom: 28px;
    z-index: 0;
    width: 132px;
    height: 132px;
    /* desaturated so it reads as a watermark rather than a coloured blob */
    filter: grayscale(1);
    opacity: .06;
    pointer-events: none;
    user-select: none;
}

.auth-stack {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 424px;
    min-width: 0;
}

.auth-card {
    padding: 44px 36px 38px;
    border: 1px solid rgba(var(--v-theme-on-surface), .07);
    border-radius: 22px;
    background: rgb(var(--v-theme-surface));
    box-shadow: 0 1px 2px rgba(64, 45, 32, .05), 0 24px 48px -30px rgba(64, 45, 32, .42);
}

.auth-head {
    display: flex;
    align-items: center;
    gap: 13px;
}

.auth-title {
    margin: 0;
    font-size: 25px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -.01em;
    color: rgb(var(--v-theme-on-surface));
}

.auth-subtitle {
    margin: 11px 0 0;
    font-size: 14px;
    line-height: 1.55;
    color: rgba(var(--v-theme-on-surface), .62);
}

.auth-body {
    margin-top: 30px;
}

/* --- form --- */

.auth-fields {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

/* two short fields (first / last name) share one line */
.auth-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.auth-card .v-field {
    border-radius: 10px;
}

/* vuetify falls back to currentColor (= near black) for the focused outline, use the brand color instead */
.auth-shell .auth-card .v-field.v-field--focused .v-field__outline {
    color: rgb(var(--v-theme-primary));
}

.auth-card .v-field__prepend-inner > .v-icon,
.auth-card .v-field__append-inner > .v-icon {
    font-size: 16px;
    opacity: .55;
}

.auth-card .v-field__input {
    font-size: 15px;
}

.auth-card .v-messages {
    font-size: 12px;
}

.auth-hint {
    margin: 8px 0 0;
    font-size: 12.5px;
    line-height: 1.45;
    color: rgba(var(--v-theme-on-surface), .5);
}

.auth-alert {
    margin-bottom: 18px;
    border-radius: 10px;
    font-size: 13.5px;
}

.auth-aside {
    display: flex;
    justify-content: flex-end;
    margin: 10px 0 20px;
}

.auth-consent.v-checkbox {
    margin-top: 14px;
}

.auth-consent .v-label {
    font-size: 13px;
    line-height: 1.45;
    opacity: 1;
    color: rgba(var(--v-theme-on-surface), .75);
}

.auth-submit.v-btn {
    height: 48px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
}

.auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 22px 0;
    font-size: 12.5px;
    color: rgba(var(--v-theme-on-surface), .5);
}

.auth-divider::before,
.auth-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(var(--v-theme-on-surface), .12);
}

.auth-providers {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.auth-provider.v-btn {
    height: 42px;
    border-radius: 10px;
    font-size: 14px;
    letter-spacing: 0;
    text-transform: none;
}

.auth-switch {
    margin-top: 26px;
    padding-top: 20px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), .08);
    font-size: 13.5px;
    text-align: center;
    color: rgba(var(--v-theme-on-surface), .7);
}

.auth-link {
    font-size: 13px;
    font-weight: 500;
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
}

.auth-link:hover {
    text-decoration: underline;
}

.auth-switch .auth-link {
    font-weight: 600;
}

.auth-note {
    margin: 0 0 14px;
    font-size: 13.5px;
    line-height: 1.55;
    color: rgba(var(--v-theme-on-surface), .7);
}

.auth-note:last-of-type {
    margin-bottom: 20px;
}

.auth-loading {
    display: flex;
    justify-content: center;
    padding: 6px 0 14px;
}

.auth-legal {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 18px;
    margin-top: 22px;
    font-size: 12.5px;
}

.auth-legal a {
    color: rgba(var(--v-theme-on-surface), .55);
    text-decoration: none;
}

.auth-legal a:hover {
    color: rgba(var(--v-theme-on-surface), .85);
    text-decoration: underline;
}

/* --- responsive --- */

/* short windows: tighten the surrounding chrome so the panel still breathes
   on laptops with a shallow viewport without shrinking the card itself */
@media (max-height: 780px) and (min-width: 861px) {
    .auth-brand-copy {
        margin-top: 32px;
    }

    .auth-features {
        gap: 8px;
        margin-top: 34px;
    }

    .auth-features li {
        padding: 10px 13px;
    }

    .auth-art {
        height: 32%;
        min-height: 170px;
        -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 30%);
        mask-image: linear-gradient(180deg, transparent 0, #000 30%);
    }

    .auth-panel {
        padding: 24px 32px;
    }

    .auth-card {
        padding: 34px 32px 30px;
    }

    .auth-body {
        margin-top: 24px;
    }

    .auth-fields {
        gap: 14px;
    }

    .auth-panel-mark {
        display: none;
    }
}

@media (max-width: 1080px) {
    .auth-shell {
        grid-template-columns: minmax(0, 1fr) minmax(400px, 1fr);
    }

    .auth-brand {
        padding: 34px 36px 0;
    }

    .auth-brand-title {
        font-size: 27px;
    }

    .auth-art {
        width: calc(100% + 72px);
        margin: 0 -36px;
    }
}

@media (max-width: 860px) {
    .auth-shell {
        /* minmax(0, …) keeps a track from growing to its content's min-content width,
           which would otherwise push the card past the viewport */
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto 1fr;
    }

    .auth-brand {
        min-height: 0;
        padding: 20px 20px 0;
        background: linear-gradient(180deg, #fdf9f3, #f9f0e2);
    }

    .auth-brand-logo {
        width: 32px;
        height: 32px;
        border-radius: 9px;
    }

    .auth-brand-copy {
        margin-top: 18px;
    }

    .auth-brand-title {
        font-size: 20px;
    }

    .auth-features,
    .auth-art {
        display: none;
    }

    .auth-panel::after {
        display: none;
    }

    .auth-panel-mark {
        display: none;
    }

    .auth-panel {
        align-items: flex-start;
        padding: 26px 20px 36px;
    }

    .auth-stack {
        max-width: 440px;
        margin: 0 auto;
    }
}

@media (max-width: 480px) {
    .auth-brand-title {
        font-size: 18px;
    }

    .auth-row {
        grid-template-columns: minmax(0, 1fr);
        gap: 16px;
    }

    .auth-panel {
        padding: 20px 14px 30px;
    }

    .auth-card {
        padding: 26px 20px 22px;
        border-radius: 16px;
    }

    .auth-title {
        font-size: 20px;
    }
}
</style>
