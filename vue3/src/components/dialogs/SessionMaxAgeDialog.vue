<template>
    <v-dialog :model-value="visible" max-width="430" persistent transition="dialog-bottom-transition">
        <v-card class="session-age-card" rounded="lg">
            <v-card-text class="pt-6 text-center">
                <div class="session-age-icon">
                    <v-icon icon="fa-solid fa-clock-rotate-left" size="28"/>
                </div>
                <h2 class="session-age-title">{{ $t('SessionMaxAgeTitle') }}</h2>
                <p class="session-age-body">{{ $t('SessionMaxAgeBody') }}</p>
            </v-card-text>
            <v-card-actions class="pb-4 px-6">
                <v-btn block color="primary" variant="flat" size="large" @click="visible = false">
                    {{ $t('Relogin') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import {maxAgeDialogVisible} from "@/utils/sessionGuard";

/**
 * shown when a single sign-in reached its absolute lifetime; the user is already
 * signed out and sitting on the login page behind this dialog
 */
const visible = maxAgeDialogVisible
</script>

<style scoped>
.session-age-card {
    padding: 4px 2px 2px;
}

.session-age-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: rgb(var(--v-theme-warning));
    background: rgba(var(--v-theme-warning), 0.14);
}

.session-age-title {
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 8px;
}

.session-age-body {
    font-size: 0.9rem;
    line-height: 1.65;
    opacity: 0.78;
    margin: 0;
}
</style>
