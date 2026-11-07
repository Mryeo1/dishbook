<template>
    <v-form class="profile-settings">
        <header class="profile-head">
            <h2 class="profile-title">{{ $t('Profile') }}</h2>
            <p class="profile-thanks">{{ $t('ProfileThanksNote') }}</p>
        </header>

        <section class="profile-block">
            <h3 class="profile-block-title">{{ $t('PersonalData') }}</h3>

            <v-row dense class="profile-fields">
                <v-col cols="12" sm="6">
                    <v-text-field :label="$t('First_name')" v-model="user.firstName" variant="outlined"
                                  density="comfortable" hide-details></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                    <v-text-field :label="$t('Last_name')" v-model="user.lastName" variant="outlined"
                                  density="comfortable" hide-details></v-text-field>
                </v-col>
            </v-row>

            <div class="profile-actions">
                <v-btn color="primary" variant="flat" prepend-icon="$save" @click="save()">{{ $t('Save') }}</v-btn>
            </div>
        </section>

        <section class="profile-block">
            <h3 class="profile-block-title">{{ $t('DeviceSettings') }}</h3>
            <p class="profile-block-sub">{{ $t('DeviceSettingsHelp') }}</p>

            <v-checkbox v-model="useUserPreferenceStore().deviceSettings.start_showMealPlan"
                        :label="$t('ShowMealPlanOnStartPage')" density="comfortable" hide-details
                        class="profile-check"></v-checkbox>

            <div class="profile-actions">
                <v-btn variant="outlined" color="warning" prepend-icon="fa-solid fa-rotate-left"
                       @click="useUserPreferenceStore().resetDeviceSettings()">{{ $t('Reset') }}</v-btn>
                <v-btn variant="outlined" color="warning" prepend-icon="fa-solid fa-circle-question"
                       @click="useUserPreferenceStore().deviceSettings.general_closedHelpAlerts = []">{{ $t('ResetHelp') }}</v-btn>
                <v-btn variant="outlined" prepend-icon="fa-solid fa-envelope">
                    <message-list-dialog></message-list-dialog>
                    {{ $t('Messages') }}
                </v-btn>
            </div>
        </section>
    </v-form>
</template>


<script setup lang="ts">

import {onMounted, ref} from "vue";
import {ApiApi, User} from "@/openapi";
import {ErrorMessageType, PreparedMessage, useMessageStore} from "@/stores/MessageStore";
import {useUserPreferenceStore} from "@/stores/UserPreferenceStore";
import MessageListDialog from "@/components/dialogs/MessageListDialog.vue";

const user = ref({} as User)

onMounted(() => {
    let api = new ApiApi()

    api.apiUserRetrieve({id: useUserPreferenceStore().userSettings.user.id}).then(r => {
        user.value = r
    }).catch(err => {
        useMessageStore().addError(ErrorMessageType.FETCH_ERROR, err)
    })
})

function save() {
    let api = new ApiApi()
    api.apiUserPartialUpdate({id: user.value.id!, patchedUser: user.value}).then(r => {
        user.value = r
        useMessageStore().addPreparedMessage(PreparedMessage.UPDATE_SUCCESS)
    }).catch(err => {
        useMessageStore().addError(ErrorMessageType.UPDATE_ERROR, err)
    })
}

</script>

<style scoped>

.profile-settings {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.profile-head {
    margin-bottom: 2px;
}

.profile-title {
    margin: 0;
    font-size: 22px;
    font-weight: 650;
    line-height: 1.3;
    letter-spacing: -.01em;
    color: rgb(var(--v-theme-on-surface));
}

.profile-thanks {
    margin: 9px 0 0;
    font-size: 13.5px;
    line-height: 1.6;
    color: rgba(var(--v-theme-on-surface), .58);
}

.profile-block {
    padding: 22px 24px 24px;
    border: 1px solid rgba(var(--v-theme-on-surface), .08);
    border-radius: 14px;
    background: rgba(var(--v-theme-surface), .55);
}

.profile-block-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    color: rgb(var(--v-theme-on-surface));
}

.profile-block-sub {
    margin: 7px 0 0;
    font-size: 12.5px;
    line-height: 1.55;
    color: rgba(var(--v-theme-on-surface), .55);
}

.profile-fields {
    margin-top: 6px;
}

.profile-fields .v-col {
    padding-top: 6px;
    padding-bottom: 6px;
}

.profile-check {
    margin-top: 14px;
}

.profile-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
}

.profile-actions .v-btn {
    height: 40px;
    border-radius: 9px;
    font-size: 13.5px;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
}

</style>
