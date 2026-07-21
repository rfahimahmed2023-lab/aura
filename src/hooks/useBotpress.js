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
  additionalStylesheet: AURA_WEBCHAT_CSS,
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
        // These land in `userData` and are readable by the bot as user
        // attributes: user.data.timeOfDay, user.data.localHour, etc.
        const timeContext = getLocalTimeContext()
        try {
          await bp.updateUser({ data: timeContext })
        } catch (userErr) {
          console.warn('[AURA] Could not set local-time user data', userErr)
        }

        bp.open()
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
    }
  }, [])

  return { status }
}
