import {ref} from 'vue'
import type {Router} from 'vue-router'
import {AuthenticationCurrentSessionApi} from '@/authapi'
import {useUserPreferenceStore} from '@/stores/UserPreferenceStore'
import {
    authDeadline,
    clearAuthStarted,
    clearSessionMarker,
    getAuthStarted,
    markSessionExpired,
} from '@/utils/sessionStorage'

/**
 * Two limits apply to a signed in user:
 *
 * - no request for SESSION_IDLE_TIMEOUT (5 minutes)  -> the server drops the session
 *   on its own, so a closed tab is signed out without the browser doing anything
 * - a single sign-in reaching SESSION_MAX_AGE (3 hours) -> signed out even while
 *   the page is open and active, announced with a dialog
 *
 * The heartbeat below is what makes the first limit harmless for an open page: a
 * tab that is left open keeps pinging, keeps the sliding window alive and only
 * the three hour cap ends it. Close the tab and the pings stop, so the five
 * minute rule takes over again.
 */

/** true while the "signed in for too long" dialog is on screen */
export const maxAgeDialogVisible = ref(false)

/** keeps the session alive while the page is open (well below the 5 minute window) */
const HEARTBEAT_MS = 60 * 1000
/** how often the three hour deadline is re-checked */
const DEADLINE_CHECK_MS = 20 * 1000
/**
 * the server may end the session a moment before the browser computes the
 * deadline (clock difference), this keeps that case on the right message
 */
const MAX_AGE_TOLERANCE_MS = 60 * 1000

let signingOut = false

/**
 * Deadline as announced by the server (header on every authenticated response).
 * Preferred over the locally guessed one because it cannot drift when the server
 * limit is configured differently from the default on the client.
 */
let serverRemainingMs: number | null = null
let serverRemainingAt = 0

function deadlineTs(): number | null {
    const started = getAuthStarted()
    // a measurement from a previous sign-in must not leak into the current one
    if (serverRemainingMs != null && started != null && serverRemainingAt >= started) {
        return serverRemainingAt + serverRemainingMs
    }
    return authDeadline()
}

function deadlinePassed(): boolean {
    const deadline = deadlineTs()
    return deadline != null && Date.now() >= deadline
}

function nearDeadline(): boolean {
    const deadline = deadlineTs()
    return deadline != null && Date.now() >= deadline - MAX_AGE_TOLERANCE_MS
}

function sessionEndpoint(): string {
    const base = new URL(document.baseURI).pathname.replace(/\/+$/, '')
    return `${base}/_allauth/browser/v1/auth/session`
}

/**
 * Single place that reacts to a session that is gone, whichever limit ended it.
 */
export async function handleSessionLost(router: Router, maxAge = false): Promise<void> {
    if (signingOut) {
        return
    }
    signingOut = true
    try {
        const store = useUserPreferenceStore()
        const dueToMaxAge = maxAge || nearDeadline()
        serverRemainingMs = null
        serverRemainingAt = 0

        store.isAuthenticated = false
        if (dueToMaxAge) {
            // the dialog explains it, no inline notice on the login page
            maxAgeDialogVisible.value = true
        } else {
            markSessionExpired()
        }
        clearAuthStarted()
        clearSessionMarker()

        try {
            await new AuthenticationCurrentSessionApi().allauthClientV1AuthSessionDelete({client: 'browser'})
        } catch (e) {
            // already gone - nothing to end
        }

        if (router.currentRoute.value.name !== 'LoginPage') {
            await router.push({name: 'LoginPage'})
        }
    } finally {
        signingOut = false
    }
}

/**
 * Installed once from main.ts.
 */
export function installSessionGuard(router: Router): void {
    let lastHeartbeat = 0

    const tick = async () => {
        const store = useUserPreferenceStore()
        if (!store.isAuthenticated) {
            return
        }

        if (deadlinePassed()) {
            await handleSessionLost(router, true)
            return
        }

        if (Date.now() - lastHeartbeat < HEARTBEAT_MS) {
            return
        }
        lastHeartbeat = Date.now()

        try {
            const response = await fetch(sessionEndpoint(), {
                credentials: 'include',
                headers: {Accept: 'application/json'},
                cache: 'no-store',
            })
            const remaining = response.headers.get('X-Session-Max-Age-Remaining')
            if (remaining != null && Number.isFinite(Number(remaining))) {
                serverRemainingMs = Number(remaining) * 1000
                serverRemainingAt = Date.now()
            }
            if (response.status === 401) {
                await handleSessionLost(router)
            }
        } catch (e) {
            // network hiccup - keep the page usable, the next tick retries
        }
    }

    setInterval(() => void tick(), DEADLINE_CHECK_MS)
    // background tabs get their timers throttled, catch up as soon as the user
    // comes back to the page
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            void tick()
        }
    })
}
