<template>
    <auth-layout :title="$t('SignUp')" :subtitle="$t('SignUpSubtitle')" :show-legal="false">

        <v-form @submit.prevent="createAccount()" v-if="!awaitingEmailConfirmation">
            <v-alert class="auth-alert" variant="tonal" type="error" density="compact" v-if="generalError">{{ generalError }}</v-alert>

            <div class="auth-fields">
                <div class="auth-row">
                    <v-text-field :label="$t('First_name')" autofocus autocomplete="given-name"
                                  variant="outlined" density="default" hide-details="auto"
                                  v-model="firstName" :disabled="loading" :error-messages="firstNameError" :error="!!firstNameError"/>

                    <v-text-field :label="$t('Last_name')" autocomplete="family-name"
                                  variant="outlined" density="default" hide-details="auto"
                                  v-model="lastName" :disabled="loading" :error-messages="lastNameError" :error="!!lastNameError"/>
                </div>

                <v-text-field :label="$t('Email')" autocomplete="email" type="email" prepend-inner-icon="fa-solid fa-envelope"
                              variant="outlined" density="default" hide-details="auto"
                              v-model="email" :disabled="loading" :error-messages="emailError" :error="!!emailError"/>

                <div>
                    <v-text-field :label="$t('Password')" autocomplete="new-password" prepend-inner-icon="fa-solid fa-lock"
                                  :type="showPassword ? 'text' : 'password'"
                                  :append-inner-icon="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
                                  @click:append-inner="showPassword = !showPassword"
                                  variant="outlined" density="default" hide-details="auto"
                                  v-model="password" :disabled="loading" :error-messages="passwordError" :error="!!passwordError"/>
                    <p class="auth-hint">{{ $t('PasswordHint') }}</p>
                </div>

                <v-text-field :label="$t('ConfirmPassword')" autocomplete="new-password" prepend-inner-icon="fa-solid fa-lock"
                              :type="showConfirm ? 'text' : 'password'"
                              :append-inner-icon="showConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
                              @click:append-inner="showConfirm = !showConfirm"
                              variant="outlined" density="default" hide-details="auto"
                              v-model="passwordConfirm" :disabled="loading" :error-messages="confirmError" :error="!!confirmError"/>
            </div>

            <v-checkbox class="auth-consent" v-model="consent" :error="!!consentError" :error-messages="consentError"
                        v-if="showAcceptCheckbox">
                <template #label>
                    {{ $t('AcceptPrivacyTerms') }}
                </template>
                <template #details>
                    <a :href="useUserPreferenceStore().serverSettings.privacyUrl" target="_blank" class="me-4" v-if="useUserPreferenceStore().serverSettings.privacyUrl">{{ $t('PrivacyPolicy') }}</a>
                    <a :href="useUserPreferenceStore().serverSettings.termsUrl" target="_blank" class="me-4" v-if="useUserPreferenceStore().serverSettings.termsUrl">{{ $t('TermsOfService') }}</a>
                </template>
            </v-checkbox>

            <v-btn class="auth-submit mt-5" type="submit" block variant="flat" color="primary" :loading="loading">{{ $t('SignUp') }}</v-btn>
        </v-form>

        <v-alert v-if="awaitingEmailConfirmation" class="auth-alert" variant="tonal" type="info" density="default">
            {{ $t('PleaseConfirmMail') }}
        </v-alert>

        <div class="auth-switch">
            {{ $t('AlreadyHaveAccount') }}
            <router-link class="auth-link" :to="{name: 'LoginPage'}">{{ $t('Login') }}</router-link>
        </div>

    </auth-layout>
</template>

<script setup lang="ts">

import {computed, onMounted, ref} from "vue";
import {AuthenticationAccountApi} from "@/authapi";
import {ErrorMessageType, useMessageStore} from "@/stores/MessageStore.ts";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useUserPreferenceStore} from "@/stores/UserPreferenceStore.ts";
import AuthLayout from "@/components/account/AuthLayout.vue";

const router = useRouter()
const {t} = useI18n()

const loading = ref(false)

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const consent = ref(false)

const generalError = ref('')
const firstNameError = ref('')
const lastNameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const confirmError = ref('')
const consentError = ref('')

const awaitingEmailConfirmation = ref(false)

// mirrors the sign-up rules of the reference project: a real name, a valid
// e-mail address and a password of at least ten characters
const MIN_PASSWORD_LENGTH = 10

const showAcceptCheckbox = computed(() => {
    return (useUserPreferenceStore().serverSettings.termsUrl || useUserPreferenceStore().serverSettings.privacyUrl)
})

onMounted(() => {
    useUserPreferenceStore().loadServerSettings()
})

function createAccount() {
    generalError.value = ''
    firstNameError.value = ''
    lastNameError.value = ''
    emailError.value = ''
    passwordError.value = ''
    confirmError.value = ''
    consentError.value = ''

    // the backend runs the django password validators, but checking the obvious
    // cases here saves a round trip and keeps the error right next to the field
    if (!firstName.value.trim()) {
        firstNameError.value = t('FieldRequired')
        return
    }
    if (!lastName.value.trim()) {
        lastNameError.value = t('FieldRequired')
        return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        emailError.value = t('EmailInvalid')
        return
    }
    if (password.value.length < MIN_PASSWORD_LENGTH) {
        passwordError.value = t('PasswordHint')
        return
    }
    if (password.value !== passwordConfirm.value) {
        confirmError.value = t('PasswordsDoNotMatch')
        return
    }
    if (showAcceptCheckbox.value && !consent.value) {
        consentError.value = t('FieldRequired')
        return
    }

    let authenticationAccountApi = new AuthenticationAccountApi()
    loading.value = true

    authenticationAccountApi.allauthClientV1AuthSignupPost({
        client: 'browser',
        signup: {
            email: email.value.trim().toLowerCase(),
            password: password.value,
            first_name: firstName.value.trim(),
            last_name: lastName.value.trim(),
        } as any
    }).then(r => {
        if (r.meta.isAuthenticated) {
            setTimeout(() => {
                router.push({name: 'StartPage'})
                loading.value = false
            }, 1000)
        }
    }).catch(err => {
        try {
            err.response.json().then(responseJson => {
                if (responseJson.status == 429) {
                    generalError.value = t('RateLimitHelp')
                } else if (responseJson.status == 403) {
                    generalError.value = t('SignupDisabled')
                } else if (responseJson.status == 401) {
                    if (responseJson.meta.is_authenticated) {
                        router.push({name: 'StartPage'})
                    } else {
                        awaitingEmailConfirmation.value = true
                    }
                } else {
                    responseJson.errors.forEach(error => {
                        if (error.param == 'email') {
                            emailError.value = error.message
                        } else if (error.param == 'first_name') {
                            firstNameError.value = error.message
                        } else if (error.param == 'last_name') {
                            lastNameError.value = error.message
                        } else if (['password', 'password1', 'password2'].includes(error.param)) {
                            passwordError.value = error.message
                        } else {
                            generalError.value += error.message + ' (' + error.param + ')\n'
                        }
                    })

                }
            })
        } catch (e) {
            console.error(e)
            useMessageStore().addError(ErrorMessageType.CREATE_ERROR, err)
        }
        loading.value = false
    })
}

</script>
