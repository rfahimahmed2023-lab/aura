import { useEffect, useRef, useState } from 'react'

export const WEBCHAT_CONTAINER_ID = 'aura-webchat'

/**
 * CSS injected inside the webchat itself (Botpress `additionalStylesheet`)
 * so the inner chrome blends with the surrounding glass panel.
 */
const AURA_WEBCHAT_CSS = `
  .bpContainer {
    background: transparent !important;
  }
  /* Our glass panel provides the header — hide the built-in one */
  .bpHeaderContainer {
    display: none !important;
  }
  .bpMessageListMarqueeAvatarContainer, .bpMessageListMarqueeAvatarFallback {
    background: linear-gradient(135deg, #00e5ff, #7a5cff) !important;
    color: #0a0a0f !important;
  }
  .bpComposerInputContainer {
    background: rgba(255, 255, 255, 0.04) !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
  .bpComposerInputContainer:focus-within {
    border-color: rgba(34, 211, 238, 0.6) !important;
    box-shadow: 0 0 18px rgba(34, 211, 238, 0.18) !important;
  }
  /* Links in bot messages: brand cyan, violet on hover, always underlined */
  .bpMessageBlocksTextLink {
    color: #00e5ff !important;
    text-decoration: underline !important;
    text-underline-offset: 2px;
  }
  .bpMessageBlocksTextLink:hover {
    color: #7a5cff !important;
    opacity: 1 !important;
  }
  /* Chart/report images: render large and crisp, signal click-to-enlarge */
  .bpMessageBlocksImageImage,
  .bpMessageBlocksTextImage {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
    cursor: zoom-in;
    border-radius: 10px;
  }
  .bpMessageContainer:has(.bpMessageBlocksImageImage),
  .bpMessageBlocksBubble:has(.bpMessageBlocksImageImage) {
    max-width: 100% !important;
    width: 100% !important;
  }
  /* Native conversation-history view is driven programmatically behind our
     own panel — keep it dark so any transient frame looks native */
  .bpConversationHistoryContainer {
    background: #0f0f18 !important;
  }
`

const AURA_CONFIGURATION = {
  botName: 'AURA',
  botDescription: 'AI-powered Universal Recommendation Assistant',
  embeddedChatId: WEBCHAT_CONTAINER_ID,
  themeMode: 'dark',
  color: '#00e5ff',
  variant: 'solid',
  headerVariant: 'glass',
  radius: 2,
  fontFamily: 'inter',
  composerPlaceholder: 'Ask AURA about your career…',
  allowFileUpload: true,
  showPoweredBy: false,
  // `footer` is an officially exposed webchat config field (its default is
  // "[⚡ by Botpress](…)") — overriding it with an empty string is sanctioned
  // configuration, not a CSS hack.
  footer: '',
  // Enables the webchat's own multi-conversation support — required for
  // switching the active conversation (see switchConversation below).
  conversationHistory: true,
  additionalStylesheet: AURA_WEBCHAT_CSS,
}

/**
 * Merge a patch into the Botpress user's server-side data. updateUser
 * REPLACES the whole data object, so a read-merge-write is mandatory —
 * otherwise fields like the time-of-day greeting context get wiped.
 */
export async function mergeUserData(patch) {
  const bp = window.botpress
  const u = await bp.getUser().catch(() => null)
  await bp.updateUser({ data: { ...(u?.data || {}), ...patch } })
}

/** Focus the webchat composer so the user can type immediately. */
export function focusComposer() {
  const sr = document.querySelector(`#${WEBCHAT_CONTAINER_ID} .bpEmbeddedWebchat`)?.shadowRoot
  sr?.querySelector('textarea.bpComposerInput')?.focus()
}

/**
 * Switch the live webchat to another conversation and verify it took.
 *
 * v3.6 exposes no public method for this, but its built-in conversation
 * history (enabled above) can switch — so we drive that native mechanism:
 * open the history view (hidden behind our UI), match the target id inside
 * the native list via its React props, click the real item, then poll
 * window.botpress.conversationId until it equals the target. Returns false
 * rather than pretending, if any step fails. Stable here because the
 * embed pins inject.js to v3.6.
 */
export async function switchConversation(targetId) {
  const bp = window.botpress
  if (!bp?.initialized) return false
  if (bp.conversationId === targetId) return true
  const sr = document.querySelector(`#${WEBCHAT_CONTAINER_ID} .bpEmbeddedWebchat`)?.shadowRoot
  if (!sr) return false

  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const poll = async (fn, timeout, step = 150) => {
    const t0 = Date.now()
    for (;;) {
      const v = fn()
      if (v) return v
      if (Date.now() - t0 > timeout) return null
      await wait(step)
    }
  }
  const synthClick = (el) =>
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }))

  try {
    // 1. Ensure the native history view is open (works while display:none —
    //    clicks are synthetic and React handlers don't need layout)
    if (!sr.querySelector('.bpConversationHistoryContainer')) {
      let icon = sr.querySelector('.bpHeaderConversationHistoryButton svg')
      if (!icon) {
        sr.querySelector('button[aria-label="Expand Header Button"]')?.click()
        icon = await poll(
          () => sr.querySelector('.bpHeaderConversationHistoryButton svg'),
          2500,
        )
      }
      if (!icon) return false
      synthClick(icon)
    }

    // 2. Wait for the native list items
    const firstItem = await poll(
      () => sr.querySelector('.bpConversationHistoryConversationContainer'),
      6000,
    )
    if (!firstItem) return false

    // 3. Map target id → native item index via the panel's React props
    const fiberKey = Object.keys(firstItem).find((k) => k.startsWith('__reactFiber'))
    let fiber = firstItem[fiberKey]
    let panelProps = null
    for (let i = 0; i < 10 && fiber; i++) {
      const p = fiber.memoizedProps
      if (p?.conversations && p?.onConversationClick) {
        panelProps = p
        break
      }
      fiber = fiber.return
    }
    if (!panelProps) return false
    const items = [...sr.querySelectorAll('.bpConversationHistoryConversationContainer')]
    const idx = panelProps.conversations.findIndex((c) => c.id === targetId)
    if (idx < 0 || items.length !== panelProps.conversations.length || !items[idx]) {
      const closeBtn = sr.querySelector('.bpConversationHistoryCloseButton')
      if (closeBtn) synthClick(closeBtn)
      return false
    }

    // 4. Click the real native item, then verify the switch actually landed
    items[idx].click()
    const ok = await poll(() => bp.conversationId === targetId, 5000, 200)
    return !!ok
  } catch {
    return false
  }
}

/**
 * Opens the underlying Botpress webchat (verified v3.6 API:
 * window.botpress.open). Safe to call repeatedly.
 */
export function openWebchat() {
  try {
    window.botpress?.open?.()
  } catch (err) {
    console.warn('[AURA] openWebchat failed', err)
  }
}

/**
 * Sends a starter message to AURA on the user's behalf (verified v3.6 API:
 * window.botpress.sendMessage). Used by the feature buttons.
 */
export function sendToAura(text) {
  try {
    const p = window.botpress?.sendMessage?.(text)
    if (p?.catch) p.catch((err) => console.warn('[AURA] sendMessage failed', err))
  } catch (err) {
    console.warn('[AURA] sendToAura failed', err)
  }
}

/**
 * Waits for the Botpress webchat (loaded via the two script tags in
 * index.html) to initialize, then re-configures it to mount embedded
 * inside #aura-webchat with the AURA dark/neon theme.
 *
 * Verified against the v3.6 inject.js API:
 *  - window.botpress.on('webchat:initialized', cb)
 *  - window.botpress.config({ configuration })  → emits webchat:config,
 *    which re-mounts the chat into configuration.embeddedChatId
 *  - window.botpress.open()
 */
/**
 * Reads the user's real local time from their browser and derives the period
 * of day. Returned object is stored on the Botpress user (see updateUser
 * below), so the bot can greet with the correct time of day regardless of
 * where the server is.
 *
 * Period mapping (local hour):
 *   05:00–11:59 → morning
 *   12:00–16:59 → afternoon
 *   17:00–20:59 → evening
 *   21:00–04:59 → night
 */
function getLocalTimeContext() {
  const now = new Date()
  const localHour = now.getHours()

  let timeOfDay
  if (localHour >= 5 && localHour < 12) timeOfDay = 'morning'
  else if (localHour >= 12 && localHour < 17) timeOfDay = 'afternoon'
  else if (localHour >= 17 && localHour < 21) timeOfDay = 'evening'
  else timeOfDay = 'night'

  let timezone = ''
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    timezone = ''
  }

  return {
    timeOfDay,
    localHour,
    timezone,
    localTime: now.toLocaleTimeString(),
  }
}

/**
 * Display-layer repairs for the embedded webchat (no bot/logic changes).
 *
 * 1) LINK HREF REPAIR — Botpress v3.6's markdown renderer strips `href` from
 *    anchors and relies on window.open inside an onMouseUp handler, which
 *    popup blockers routinely kill. We capture link URLs from incoming
 *    message payloads (bp.on('message')), then patch rendered anchors with a
 *    real href + target="_blank" rel="noopener noreferrer". A native mouseup
 *    listener with stopPropagation() prevents Botpress's own handler from
 *    also firing (which would open the link twice).
 *
 * 2) IMAGE CLICK-TO-ENLARGE — chart images open full-size in a new tab.
 *
 * 3) BROWSER AI-COMPOSE SUPPRESSION — the "Write with AI" affordance is
 *    injected by the browser (Edge/Chrome writing assistance), not Botpress;
 *    the standard opt-out attributes are applied to the composer.
 *
 * Returns a cleanup function.
 */
function installWebchatEnhancements(bp) {
  const linkMap = new Map() // link text -> url, harvested from payloads
  const cleanups = []

  // Harvest [text](url) pairs and bare URLs from every incoming message
  try {
    bp.on('message', (msg) => {
      try {
        const raw = JSON.stringify(msg ?? {})
        const mdLink = /\[([^\]]{1,200}?)\]\((https?:\/\/[^)\s"']+)\)/g
        let m
        while ((m = mdLink.exec(raw)) !== null) linkMap.set(m[1].trim(), m[2])
      } catch {
        /* never let harvesting break the chat */
      }
    })
  } catch {
    /* on() unavailable — link repair degrades gracefully */
  }

  const looksLikeUrl = (t) => /^https?:\/\/\S+$/.test(t)

  const patchAnchors = (root) => {
    root.querySelectorAll('a.bpMessageBlocksTextLink:not([href])').forEach((a) => {
      const text = a.textContent.trim()
      const url = linkMap.get(text) || (looksLikeUrl(text) ? text : null)
      if (!url) return
      a.setAttribute('href', url)
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
      // Block Botpress's React onMouseUp (window.open) so the link doesn't
      // open twice — the real href now handles navigation natively.
      a.addEventListener('mouseup', (e) => e.stopPropagation())
    })
  }

  const hardenComposer = (root) => {
    root.querySelectorAll('textarea.bpComposerInput').forEach((ta) => {
      ta.setAttribute('writingsuggestions', 'false')
      ta.setAttribute('data-gramm', 'false')
      ta.setAttribute('data-enable-grammarly', 'false')
    })
  }

  // The webchat renders inside an open shadow root that appears after config
  let tries = 0
  const hook = setInterval(() => {
    tries += 1
    const host = document.querySelector(`#${WEBCHAT_CONTAINER_ID} .bpEmbeddedWebchat`)
    const root = host?.shadowRoot
    if (!root) {
      if (tries > 100) clearInterval(hook) // ~15s — give up quietly
      return
    }
    clearInterval(hook)

    patchAnchors(root)
    hardenComposer(root)

    const observer = new MutationObserver(() => {
      patchAnchors(root)
      hardenComposer(root)
    })
    observer.observe(root, { childList: true, subtree: true })
    cleanups.push(() => observer.disconnect())

    // Click-to-enlarge for chart/report images (real user click → popup-safe)
    const onClick = (e) => {
      const img = e
        .composedPath()
        .find(
          (el) =>
            el instanceof HTMLImageElement &&
            (el.classList?.contains('bpMessageBlocksImageImage') ||
              el.classList?.contains('bpMessageBlocksTextImage')),
        )
      if (img?.src) {
        e.stopPropagation()
        window.open(img.src, '_blank', 'noopener,noreferrer')
      }
    }
    root.addEventListener('click', onClick, true)
    cleanups.push(() => root.removeEventListener('click', onClick, true))
  }, 150)
  cleanups.push(() => clearInterval(hook))

  return () => cleanups.forEach((fn) => fn())
}

/** First of these files that exists in public/ becomes the bot avatar. */
const AVATAR_CANDIDATES = ['/aura-avatar.png', '/aura-avatar.svg', '/aura-avatar.jpg']

async function findAvatarUrl() {
  for (const path of AVATAR_CANDIDATES) {
    try {
      const res = await fetch(path, { method: 'HEAD' })
      const type = res.headers.get('content-type') || ''
      // Vite serves index.html (text/html) for missing files, so check the type
      if (res.ok && type.startsWith('image/')) {
        return new URL(path, window.location.origin).href
      }
    } catch {
      // network hiccup — try the next candidate
    }
  }
  return null
}

export function useBotpress() {
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const configuredRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let pollId = null
    let timeoutId = null
    let enhancementsCleanup = null

    const configure = async () => {
      if (cancelled || configuredRef.current) return
      configuredRef.current = true
      const bp = window.botpress
      try {
        const avatarUrl = await findAvatarUrl()
        bp.config({
          configuration: {
            ...bp.configuration,
            ...AURA_CONFIGURATION,
            ...(avatarUrl ? { botAvatar: avatarUrl } : {}),
          },
        })

        // Store the user's real local time on the Botpress user BEFORE the
        // conversation opens, so the greeting reads the correct time of day.
        // MERGED into existing data (updateUser replaces the object, and
        // user.data also carries conversation titles — see mergeUserData).
        const timeContext = getLocalTimeContext()
        try {
          const existing = await bp.getUser().catch(() => null)
          await bp.updateUser({ data: { ...(existing?.data || {}), ...timeContext } })
        } catch (userErr) {
          console.warn('[AURA] Could not set local-time user data', userErr)
        }

        bp.open()

        // Always start every visit on a FRESH conversation. Past ones stay
        // intact (and reachable via the history panel); the new conversation
        // fires the bot's Conversation Started greeting. configuredRef above
        // guarantees this runs once per page load — no duplicates.
        try {
          await bp.restartConversation()
        } catch (freshErr) {
          console.warn('[AURA] Could not start a fresh conversation', freshErr)
        }

        enhancementsCleanup = installWebchatEnhancements(bp)
        setStatus('ready')
      } catch (err) {
        console.error('[AURA] Failed to configure Botpress webchat', err)
        setStatus('error')
      }
    }

    const attach = () => {
      const bp = window.botpress
      if (!bp?.on) return false
      if (bp.initialized) {
        configure()
      } else {
        bp.on('webchat:initialized', configure)
      }
      return true
    }

    if (!attach()) {
      pollId = setInterval(() => {
        if (attach()) clearInterval(pollId)
      }, 150)
    }

    timeoutId = setTimeout(() => {
      if (!configuredRef.current && !cancelled) {
        console.error('[AURA] Botpress webchat did not initialize within 25s')
        setStatus('error')
      }
    }, 25000)

    return () => {
      cancelled = true
      if (pollId) clearInterval(pollId)
      if (timeoutId) clearTimeout(timeoutId)
      if (enhancementsCleanup) enhancementsCleanup()
    }
  }, [])

  return { status }
}
