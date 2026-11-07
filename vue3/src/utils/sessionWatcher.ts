import type {Router} from 'vue-router'
import {registerDefaultMiddleware} from '@/openapi'
import {useUserPreferenceStore} from '@/stores/UserPreferenceStore'
import {handleSessionLost} from '@/utils/sessionGuard'

let redirecting = false

/**
 * Asks allauth whether the current session is still authenticated.
 *
 * A 403 from a regular API call can also mean "you are signed in but lack the
 * permission", so the call that failed cannot decide on its own whether the
 * user has to sign in again. The session endpoint answers that question with a
 * plain 200 / 401.
 */
async function sessionIsAlive(): Promise<boolean> {
    const base = new URL(document.baseURI).pathname.replace(/\/+$/, '')
    try {
        const response = await fetch(`${base}/_allauth/browser/v1/auth/session`, {
            credentials: 'include',
            headers: {Accept: 'application/json'},
        })
        return response.status !== 401
    } catch (e) {
        // network problem - do not sign the user out because of that
        return true
    }
}

/**
 * Watches every API response and, once the session ran out, sends the user back
 * to the login page (with a notice, or with the "signed in for too long" dialog
 * when the three hour limit is the reason). Installed once from main.ts.
 */
export function installSessionWatcher(router: Router): void {
    registerDefaultMiddleware({
        post: async (context) => {
            const status = context.response.status
            if ((status !== 401 && status !== 403) || redirecting) {
                return context.response
            }

            const store = useUserPreferenceStore()
            // only a user who *was* signed in can have an expired session;
            // anonymous pages (share links) must keep working
            if (!store.isAuthenticated) {
                return context.response
            }
            if (await sessionIsAlive()) {
                return context.response
            }

            redirecting = true
            try {
                await handleSessionLost(router)
            } finally {
                redirecting = false
            }
            return context.response
        },
    })
}
