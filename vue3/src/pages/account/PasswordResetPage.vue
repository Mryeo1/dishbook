<template>
    <auth-layout :title="$t('PasswordReset')" :subtitle="key ? '' : $t('PasswordResetSubtitle')">

        <v-form v-if="!key" :disabled="loading" @submit.prevent="requestResetLink()">
            <v-text-field :label="$t('Email')" autofocus autocomplete="email" prepend-inner-icon="fa-solid fa-envelope"
                          variant="outlined" density="comfortable" hide-details="auto" required v-model="email"/>

            <v-btn class="auth-submit mt-5" type="submit" block variant="flat" color="primary" :loading="loading">{{ $t('Send') }}</v-btn>
        </v-form>

        <v-form v-if="key" :disabled="loading" @submit.prevent="resetPassword()">
            <div class="auth-fields">
                <v-text-field :label="$t('NewPassword')" type="password" autofocus autocomplete="new-password"
                              prepend-inner-icon="fa-solid fa-lock" variant="outlined" density="comfortable" hide-details="auto"
                              v-model="newPassword1"/>

                <v-text-field :label="$t('RepeatNewPassword')" type="password" autocomplete="new-password"
                              prepend-inner-icon="fa-solid fa-lock" variant="outlined" density="comfortable" hide-details="auto"
                              v-model="newPassword2"/>
            </div>

            <v-btn class="auth-submit mt-5" type="submit" block variant="flat" color="primary" :loading="loading">{{ $t('PasswordReset') }}</v-btn>
        </v-form>

        <div class="auth-signup">
            <router-link class="auth-link" :to="{name: 'LoginPage'}">{{ $t('BackToLogin') }}</router-link>
        </div>

    </auth-layout>
</template>

<script setup lang="ts">

import {ref} from "vue";
import {AuthenticationPasswordResetApi} from "@/authapi";
import {ErrorMessageType, MessageType, PreparedMessage, useMessageStore} from "@/stores/MessageStore.ts";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useRouteQuery} from "@vueuse/router";
import AuthLayout from "@/components/account/AuthLayout.vue";

const router = useRouter()
const {t} = useI18n()

const loading = ref(false)

const key = useRouteQuery("key")

let newPassword1 = ref('')
let newPassword2 = ref('')

const email = ref('')

function requestResetLink() {
    let authenticationPasswordResetApi = new AuthenticationPasswordResetApi()
    loading.value = true

    authenticationPasswordResetApi.allauthClientV1AuthPasswordRequestPost({client: "browser", requestPassword: {email: email.value}}).then(r => {
        console.log(r)
        useMessageStore().addPreparedMessage(PreparedMessage.CREATE_SUCCESS)
    }).catch(err => {
        err.response.json().then(responseJson => {
            if (responseJson.status == 429) {
                useMessageStore().addPreparedMessage(PreparedMessage.RATE_LIMIT)
            } else {
                let message = ''
                responseJson.errors.forEach(error => {
                    message += error.message + ' (' + error.param + ')\n'
                })
                useMessageStore().addMessage(MessageType.ERROR, {title: t('UPDATE_ERROR'), text: message}, 7000, responseJson)
            }
        })
    }).finally(() => {
        loading.value = false
    })
}

function resetPassword() {
    const authenticationPasswordResetApi = new AuthenticationPasswordResetApi()

    if (newPassword1.value == newPassword2.value) {
        loading.value = true

        authenticationPasswordResetApi.allauthClientV1AuthPasswordResetPost({client: "browser", resetPassword: {key: key.value, password: newPassword1.value}}).then(r => {
            if (r.meta.isAuthenticated) {
                // this does not trigger because the response status is 401 and triggers the error block
                // leaving this in in case there is any case I missed
                router.push({name: 'StartPage'})
            } else {
                router.push({name: 'LoginPage'})
            }
        }).catch(err => {
            if (err.response.status == 401) {
                // 401 indicates successfull reset but no automatic login configured
                router.push({name: 'LoginPage'})
            } else {
                useMessageStore().addError(ErrorMessageType.UPDATE_ERROR, err)
            }
        }).finally(() => {
            loading.value = false
        })
    } else {
        useMessageStore().addPreparedMessage(PreparedMessage.PASSWORDS_DONT_MATCH)
    }
}
</script>
