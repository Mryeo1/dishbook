<template>
    <auth-layout :title="$t('Login')" :subtitle="$t('SignInSubtitle')">

        <v-alert class="auth-alert" variant="tonal" type="warning" density="compact" v-if="sessionExpired">
            {{ $t('SessionExpired') }}
        </v-alert>

        <v-form v-if="!serverSettings.socialaccountOnly" class="auth-form" @submit.prevent="login()">
            <v-alert class="auth-alert" variant="tonal" type="error" density="compact" v-if="generalError">{{ generalError }}</v-alert>

            <div class="auth-fields">
                <v-text-field :label="$t('Email')" autofocus autocomplete="email" type="email" prepend-inner-icon="fa-solid fa-envelope"
                              variant="outlined" density="default" hide-details="auto"
                              v-model="email" :disabled="loading" :error-messages="emailError" :error="!!emailError"/>

                <v-text-field :label="$t('Password')" autocomplete="current-password" prepend-inner-icon="fa-solid fa-lock"
                              :type="showPassword ? 'text' : 'password'"
                              :append-inner-icon="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
                              @click:append-inner="showPassword = !showPassword"
                              variant="outlined" density="default" hide-details="auto"
                              v-model="password" :disabled="loading" :error-messages="passwordError" :error="!!passwordError"/>
            </div>

            <div class="auth-aside">
                <router-link class="auth-link" :to="{name: 'PasswordResetPage'}">{{ $t('ForgotPassword') }}</router-link>
            </div>

            <v-btn class="auth-submit" type="submit" block variant="flat" color="primary"
                   :loading="loading" :disabled="providerLoading != ''">{{ $t('Login') }}</v-btn>
        </v-form>

        <template v-if="socialProviders.length > 0">
            <div class="auth-divider" v-if="!serverSettings.socialaccountOnly"><span>{{ $t('or') }}</span></div>

            <div class="auth-providers">
                <v-btn class="auth-provider" block variant="outlined" v-for="p in socialProviders" :key="p.id"
                       :disabled="providerLoading != '' || loading" :loading="providerLoading == p.id"
                       @click="startProviderFlow(p.id)">
                    {{ p.name }}
                </v-btn>
            </div>
        </template>

        <div class="auth-switch" v-if="serverSettings.enableSignup && !serverSettings.socialaccountOnly">
            {{ $t('NoAccountYet') }}
            <router-link class="auth-link" :to="{name: 'SignUpPage'}">{{ $t('SignUp') }}</router-link>
        </div>

    </auth-layout>
</template>

<script setup lang="ts">

import {computed, onMounted, ref} from "vue";
import {AuthenticationAccountApi, AuthenticationProvidersApi, ConfigurationApi, Provider} from "@/authapi";
import {ErrorMessageType, useMessageStore} from "@/stores/MessageStore.ts";
import {useRouter} from "vue-router";
import {useUserPreferenceStore} from "@/stores/UserPreferenceStore.ts";
import {useI18n} from "vue-i18n";
import {getCookie} from "@/utils/cookie.ts";
import {useDjangoUrls} from "@/composables/useDjangoUrls.ts";
import AuthLayout from "@/components/account/AuthLayout.vue";
import {consumeSessionExpired} from "@/utils/sessionStorage";

const router = useRouter()
const {t} = useI18n()

const serverSettings = computed(() => useUserPreferenceStore().serverSettings)

const loading = ref(false)
const providerLoading = ref("")
const email = ref('')
const password = ref('')
const showPassword = ref(false)

const generalError = ref('')
const passwordError = ref('')
const emailError = ref('')

const socialProviders = ref<Provider[]>([] as Provider[])

const next = useRouter().currentRoute.value.query.next

/**
 * set when we redirected here because the idle session ran out; it is a one-shot
 * value, so reloading the page does not show the notice again
 */
const sessionExpired = ref(false)

onMounted(() => {
    // old bookmarks/links may still carry ?expired=1 - honour it once, then drop
    // the parameter from the URL so a reload starts clean
    if (router.currentRoute.value.query.expired === '1') {
        sessionExpired.value = true
        const query = {...router.currentRoute.value.query}
        delete query.expired
        router.replace({name: 'LoginPage', query})
    }
    if (consumeSessionExpired()) {
        sessionExpired.value = true
    }

    loadProviders()

    useUserPreferenceStore().loadServerSettings()
})

function login() {
    let accountApi = new AuthenticationAccountApi()
    loading.value = true

    generalError.value = ''
    passwordError.value = ''
    emailError.value = ''

    accountApi.allauthClientV1AuthLoginPost({
        client: 'browser',
        login: {email: email.value.trim().toLowerCase(), password: password.value} as any
    }).then(r => {
        useUserPreferenceStore().init().then(r => {
            if (next && typeof next === 'string') {
                router.push(next)
            } else {
                router.push({name: 'StartPage'})
            }
        })

    }).catch(err => {
        try {
            err.response.json().then(responseJson => {
                if (responseJson.status == 429) {
                    generalError.value = t('RateLimitHelp')
                } else if (responseJson.status == 401) {
                    generalError.value = t('AwaitingEmailConfirmation')
                } else {
                    responseJson.errors.forEach(error => {
                        if (error.code == 'email_password_mismatch') {
                            // the message is about the pair, not about one single field
                            generalError.value = error.message
                        } else if (error.param == 'password') {
                            passwordError.value = error.message
                        } else if (error.param == 'email') {
                            emailError.value = error.message
                        } else {
                            generalError.value += error.message + '\n'
                        }
                    })

                }
            })
        } catch (e) {
            console.error(e)
            useMessageStore().addError(ErrorMessageType.UPDATE_ERROR, err)
        }
        loading.value = false
    })
}

function loadProviders() {
    const configurationApi = new ConfigurationApi()

    configurationApi.allauthClientV1ConfigGet({client: "browser"}).then(r => {
        if (r.data.socialaccount) {
            socialProviders.value = r.data.socialaccount.providers
        }
    }).catch(err => {
        useMessageStore().addError(ErrorMessageType.FETCH_ERROR, err)
    })
}

function startProviderFlow(provider: string) {

    providerLoading.value = provider

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = useDjangoUrls().getDjangoUrl(`/_allauth/browser/v1/auth/provider/redirect`, false);

    const fields: Record<string, string> = {
        provider: provider,
        process: 'login',
        callback_url: useDjangoUrls().getDjangoUrl(`/account/social-signup/`),
    };

    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
        fields['csrfmiddlewaretoken'] = csrfToken;
    }

    for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

</script>
