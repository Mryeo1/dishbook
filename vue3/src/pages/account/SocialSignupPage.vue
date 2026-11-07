<template>
    <auth-layout :title="$t('Login')">

        <div class="auth-loading" v-if="loading">
            <v-progress-circular indeterminate size="24" width="2" color="primary"/>
        </div>

        <template v-else>
            <v-alert class="auth-alert" variant="tonal" type="warning" density="compact">{{ $t('GenericSocialSignupError') }}</v-alert>
            <v-btn class="auth-submit" block variant="flat" color="primary" :to="{name: 'LoginPage'}">{{ $t('BackToLogin') }}</v-btn>
        </template>

    </auth-layout>
</template>

<script setup lang="ts">

import {AuthenticationCurrentSessionApi} from "@/authapi";
import {onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import AuthLayout from "@/components/account/AuthLayout.vue";

const router = useRouter()

const loading = ref(true)

onMounted(() => {
    authStatus()
})

function authStatus() {

    /**
     * the correct way seems to be to check the flows returned by the following api call
     * depending on the flows redirect to login or a form that gets pre filled with the provider data
     * and requires the user to perform a signup. In that signup errors (like duplicate usernames/emails) would be handled
     * properly and resovled
     *
     * i currently do not want to implement all the edgecases here, so providers must be configured to provide
     * all necessary fields (username/email) and if the account exists the user just needs to try something else
     * or you need to acitivate auto linking (attention, security implications)
     */

    let authenticationCurrentSessionApi = new AuthenticationCurrentSessionApi();
    authenticationCurrentSessionApi.allauthClientV1AuthSessionGet({client: "browser"}).then((response) => {
        if (response.meta.isAuthenticated) {
            router.push({name: 'StartPage'})
        }
    }).catch((error) => {
        console.log(error);
    }).finally(() => {
        setTimeout(() => {
            loading.value = false
        }, 400)
    })


}

</script>
