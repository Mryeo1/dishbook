/**
 * Tandoor signs users out after SESSION_IDLE_TIMEOUT (5 minutes by default) of
 * inactivity. The browser cannot read the session cookie's expiry, so this
 * marker lets us tell "the user was signed in a moment ago" apart from "this is
 * a first visit", which decides whether we show the "session expired" notice.
 */

const LAST_AUTH_KEY = 'TANDOOR_LAST_AUTH'
const AUTH_STARTED_KEY = 'TANDOOR_AUTH_STARTED'

/**
 * how long a single sign-in may last, must match SESSION_MAX_AGE on the server
 * (3 hours by default)
 */
export const SESSION_MAX_AGE_MS = 3 * 60 * 60 * 1000

export function markSessionActive(): void {
    try {
        localStorage.setItem(LAST_AUTH_KEY, String(Date.now()))
    } catch (e) {
        // storage can be unavailable (private mode); the session itself still
        // works, we just cannot distinguish an expired session later on
    }
}

export function clearSessionMarker(): void {
    try {
        localStorage.removeItem(LAST_AUTH_KEY)
    } catch (e) {
        // ignore
    }
}

export function hadSession(): boolean {
    try {
        return localStorage.getItem(LAST_AUTH_KEY) != null
    } catch (e) {
        return false
    }
}

/**
 * Timestamp of the current sign-in, used for the absolute 3 hour limit.
 *
 * It is stored (not kept in memory) on purpose: closing the tab or reloading the
 * page must not restart the three hour window, only a new login may.
 */
export function markAuthStarted(): void {
    try {
        if (localStorage.getItem(AUTH_STARTED_KEY) == null) {
            localStorage.setItem(AUTH_STARTED_KEY, String(Date.now()))
        }
    } catch (e) {
        // ignore, the server still enforces its own limit
    }
}

export function getAuthStarted(): number | null {
    try {
        const raw = localStorage.getItem(AUTH_STARTED_KEY)
        const value = raw == null ? NaN : Number(raw)
        return Number.isFinite(value) ? value : null
    } catch (e) {
        return null
    }
}

export function clearAuthStarted(): void {
    try {
        localStorage.removeItem(AUTH_STARTED_KEY)
    } catch (e) {
        // ignore
    }
}

/**
 * moment at which the current sign-in has to end, null when nothing is signed in
 */
export function authDeadline(): number | null {
    const started = getAuthStarted()
    return started == null ? null : started + SESSION_MAX_AGE_MS
}

/**
 * "show the session expired notice on the next login page" ticket.
 *
 * It deliberately lives in memory only: the notice belongs to the moment the
 * session ran out, so a reload of the login page must not repeat it. Keeping it
 * in the URL (?expired=1) or in web storage would survive reloads and do
 * exactly that.
 */
let expiredNoticePending = false

export function markSessionExpired(): void {
    expiredNoticePending = true
    // this sign-in is over, the next one starts a fresh three hour window
    clearAuthStarted()
    // the marker did its job, drop it so the next cold start stays quiet
    clearSessionMarker()
}

/**
 * Returns whether the notice should be shown and clears the ticket, so it can
 * be displayed at most once per page load.
 */
export function consumeSessionExpired(): boolean {
    const pending = expiredNoticePending
    expiredNoticePending = false
    return pending
}
