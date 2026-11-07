<template>
    <span class="brand-wordmark">
        <img class="brand-wordmark__icon" :src="logo" alt=""/>
        <span class="brand-wordmark__name">{{ $t('AppName') }}</span>
    </span>
</template>

<script setup lang="ts">
import logo from "@/assets/logo_color.svg"
</script>

<style scoped>
/*
 * the shipped wordmark is the original latin logo with the name baked into the
 * paths, so it cannot carry a localised product name. the mark and the name are
 * therefore composed here: icon stays a picture, the name is real text and
 * inherits the colour of whatever bar it sits in.
 */
.brand-wordmark {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    height: 40px;
    color: inherit;
    user-select: none;
    vertical-align: middle;
}

.brand-wordmark__icon {
    display: block;
    flex: 0 0 auto;
    width: 27px;
    height: 27px;
}

.brand-wordmark__name {
    font-size: 1.13rem;
    font-weight: 600;
    line-height: 1;
    letter-spacing: .12em;
    /* chinese glyphs sit optically low next to a round mark, nudge them up */
    transform: translateY(.5px);
}
</style>
