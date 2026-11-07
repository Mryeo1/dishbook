/**
 * Capture the screenshots used by the README and the user manual.
 *
 * Uses the Chrome DevTools Protocol directly (no puppeteer, no playwright) so it
 * runs on a bare Node install. Edge/Chrome has to be present.
 *
 * Usage:
 *   node scripts/capture_screenshots.mjs
 *   BASE_URL=http://127.0.0.1:8000 DEMO_USER=chenxiao@example.com DEMO_PASS=Tandoor@2026 \
 *     node scripts/capture_screenshots.mjs
 *
 * Output: docs/screenshots/*.png
 */
import {spawn} from 'node:child_process'
import {mkdirSync, mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8000'
const USER = process.env.DEMO_USER || 'chenxiao@example.com'
const PASS = process.env.DEMO_PASS || 'Tandoor@2026'
const OUT = process.env.OUT_DIR || 'docs/screenshots'
const PORT = Number(process.env.CDP_PORT || 9471)

const EDGE_CANDIDATES = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
]

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function findBrowser() {
    const {existsSync} = await import('node:fs')
    const found = EDGE_CANDIDATES.find(path => existsSync(path))
    if (!found) throw new Error('no Chrome/Edge binary found, set the path in EDGE_CANDIDATES')
    return found
}

async function connect() {
    for (let attempt = 0; attempt < 60; attempt++) {
        try {
            const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
            const page = targets.find(target => target.type === 'page')
            if (page) return page.webSocketDebuggerUrl
        } catch {
            // browser not up yet
        }
        await sleep(400)
    }
    throw new Error('devtools endpoint never came up')
}

async function main() {
    mkdirSync(OUT, {recursive: true})
    const browser = spawn(await findBrowser(), [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${mkdtempSync(join(tmpdir(), 'shot-'))}`,
        '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
        '--window-size=1440,900', 'about:blank',
    ], {stdio: 'ignore'})

    const ws = new WebSocket(await connect())
    await new Promise(resolve => ws.addEventListener('open', resolve, {once: true}))

    let nextId = 0
    const pending = new Map()
    ws.addEventListener('message', event => {
        const message = JSON.parse(event.data)
        if (message.id && pending.has(message.id)) {
            pending.get(message.id)(message.result)
            pending.delete(message.id)
        }
    })
    const send = (method, params = {}) => new Promise(resolve => {
        const id = ++nextId
        pending.set(id, resolve)
        ws.send(JSON.stringify({id, method, params}))
    })
    const evaluate = async (expression) => {
        const result = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true})
        if (result?.exceptionDetails) throw new Error(result.exceptionDetails.text)
        return result?.result?.value
    }
    const viewport = (width, height) => send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false})
    const go = async (path, settle = 2600) => {
        await send('Page.navigate', {url: BASE + path})
        await sleep(settle)
    }
    const shot = async (name) => {
        const result = await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false})
        writeFileSync(join(OUT, name), Buffer.from(result.data, 'base64'))
        console.log('captured', name)
    }

    await send('Runtime.enable')
    await send('Page.enable')

    // ---- login ----
    await viewport(1440, 900)
    await go('/account/login')
    for (let attempt = 0; attempt < 25; attempt++) {
        if (await evaluate(`!!document.querySelector('input[type=password]')`)) break
        await sleep(800)
    }
    await sleep(400)
    await shot('login.png')
    await evaluate(`(() => {
        const inputs = [...document.querySelectorAll('input')]
        const set = (el, value) => {
            Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, value)
            el.dispatchEvent(new Event('input', {bubbles: true}))
        }
        set(inputs.find(i => i.type === 'email' || i.type === 'text'), ${JSON.stringify(USER)})
        set(inputs.find(i => i.type === 'password'), ${JSON.stringify(PASS)})
        document.querySelector('button[type=submit]').click()
        return true
    })()`)
    await sleep(4500)

    // ---- pages ----
    await go('/')
    await shot('home.png')

    await go('/mealplan', 3200)
    await shot('mealplan-week.png')

    await go('/shopping')
    await shot('shopping.png')

    await go('/search?q=', 3200)
    await shot('search.png')

    // ---- an empty period ----
    // page forward until the visible range holds nothing, so the empty state is
    // on screen. the calendar has no url for "two weeks from now".
    await go('/mealplan', 3400)
    const nextPeriod = `(() => {
        const btn = [...document.querySelectorAll('.v-btn')].find(b => b.querySelector('.fa-chevron-right'))
        if (!btn) return false
        btn.click()
        return true
    })()`
    for (let i = 0; i < 12; i++) {
        if (await evaluate(`!!document.querySelector('.mp-empty')`)) break
        if (!await evaluate(nextPeriod)) break
        await sleep(1600)
    }
    if (await evaluate(`!!document.querySelector('.mp-empty')`)) {
        await shot('mealplan-empty.png')
    } else {
        console.warn('no empty period found, skipping mealplan-empty.png')
    }

    // ---- phone ----
    await viewport(390, 844)
    await go('/mealplan', 5000)
    await shot('mealplan-mobile.png')

    // ---- dark ----
    // flip the real theme through the store instead of adding a class: vuetify
    // resolves colours when it renders, so a class swap leaves the bar light.
    const goDark = `(() => {
        const app = document.querySelector('#app')?.__vue_app__
        const pinia = app?.config?.globalProperties?.$pinia
        const store = pinia?._s?.get('user_preference_store')
        if (!store) return false
        store.userSettings.theme = 'TANDOOR_DARK'
        store.updateTheme()
        return true
    })()`

    await viewport(1440, 900)
    await go('/mealplan', 3400)
    const switched = await evaluate(goDark)
    // the theme class lands after the next render, so check it separately
    await sleep(1200)
    const isDark = await evaluate(`!!document.querySelector('.v-application.v-theme--dark')`)

    if (switched && isDark) {
        await shot('mealplan-dark.png')

        await viewport(390, 844)
        await sleep(1400)
        await shot('mealplan-mobile-dark.png')
    } else {
        console.warn('could not switch to the dark theme, skipping the dark shots')
    }

    browser.kill()
    process.exit(0)
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})
