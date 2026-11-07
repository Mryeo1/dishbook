<template>
    <auth-layout :title="$t('EmailConfirmation')" :subtitle="invalidToken ? '' : $t('EmailConfirmWait')">

        <v-alert class="auth-alert" variant="tonal" type="warning" density="compact" v-if="generalError">{{ generalError }}</v-alert>
        <v-alert class="auth-alert" variant="tonal" type="warning" density="compact" v-if="invalidToken">{{ invalidToken }}</v-alert>

        <template v-if="invalidToken">
            <p class="auth-note">{{ $t('EmailConfirmFail1') }}</p>
            <p class="auth-note">{{ $t('EmailConfirmFail2') }}</p>
            <p class="auth-note">{{ $t('EmailConfirmFail3') }}</p>
        </template>

        <div class="auth-loading" v-if="loading">
            <v-progress-circular indeterminate size="24" width="2" color="primary"/>
        </div>

        <template v-if="!loading">
            <v-btn class="auth-submit" block variant="flat" color="primary" :to="{name: 'LoginPage'}">{{ $t('Login') }}</v-btn>

            <div class="auth-signup">
                <router-link class="auth-link" :to="{name: 'PasswordResetPage'}">{{ $t('PasswordReset') }}</router-link>
            </div>
        </template>

    </auth-layout>
</template>

<script setup lang="ts">

import {onMounted, ref} from "vue";
import {AuthenticationAccountApi} from "@/authapi";
import {ErrorMessageType, PreparedMessage, useMessageStore} from "@/stores/MessageStore.ts";
import {useRouter} from "vue-router";
import {useRouteQuery} from "@vueuse/router";
import AuthLayout from "@/components/account/AuthLayout.vue";

const router = useRouter()

const invalidToken = ref('')
const generalError = ref('')

const loading = ref(false)

const key = useRouteQuery("key")

onMounted(() => {
    confirmEmail()
})

function confirmEmail() {
    let authenticationAccountApi = new AuthenticationAccountApi()

    loading.value = true
    authenticationAccountApi.allauthClientV1AuthEmailVerifyPost({client: "browser", verifyEmail: {key: key.value}}).then(r => {
        if (r.meta.isAuthenticated) {
            // this does not trigger because the response status is 401 and triggers the error block
            // leaving this in in case there is any case I missed
            router.push({name: 'StartPage'})
        } else {
            router.push({name: 'LoginPage'})
        }
    }).catch(err => {
        try {
            err.response.json().then(responseJson => {
                if (responseJson.status == 429) {
                    useMessageStore().addPreparedMessage(PreparedMessage.RATE_LIMIT)
                } else if (responseJson.status == 401) {
                    if (responseJson.meta.isAuthenticated) {
                        router.push({name: 'StartPage'})
                    } else {
                        router.push({name: 'LoginPage'})
                    }
                } else if (responseJson.status == 400 && responseJson.errors[0].code == "invalid_or_expired_key") {
                    invalidToken.value = responseJson.errors[0].message
                } else if (responseJson.status == 400) {
                    try {
                        responseJson.errors.forEach(error => {
                            generalError.value += error.message + "\n"
                        })
                    } catch (e) {
                        useMessageStore().addError(ErrorMessageType.UPDATE_ERROR, err)
                    }

                } else {
                    useMessageStore().addError(ErrorMessageType.UPDATE_ERROR, err)
                }
            })
        } catch (e) {
            console.error(e)
            useMessageStore().addError(ErrorMessageType.UPDATE_ERROR, err)
        }

    }).finally(() => {
        loading.value = false
    })
}

</script>
