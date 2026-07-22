import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, ArrowLeft, X, MessageSquare } from 'lucide-react'
import { EASE, buttonMotion } from '../lib/motion'

/**
 * Previous-chats panel (slide-over inside the chat modal).
 *
 * Data comes from the webchat's own Chat API (webchat.botpress.cloud),
 * authenticated with the userKey that the PUBLIC window.botpress.getUser()
 * returns — no browser storage is read or written by this code.
 *
 * Botpress webchat v3.6 exposes no way to switch the live chat to an old
 * conversation, so past conversations open as native READ-ONLY transcripts.
 * "New chat" uses the public restartConversation().
 */

const API_BASE = 'https://webchat.botpress.cloud'

async function creds() {
  const bp = window.botpress
  const { userKey } = await bp.getUser()
  return { base: `${API_BASE}/${bp.clientId}`, headers: { 'x-user-key': userKey } }
}

async function fetchConversations() {
  const { base, headers } = await creds()
  const res = await fetch(`${base}/conversations`, { headers })
  if (!res.ok) throw new Error(`list failed: ${res.status}`)
  const body = await res.json()
  return (body.conversations || []).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  )
}

async function fetchMessages(conversationId) {
  const { base, headers } = await creds()
  const res = await fetch(`${base}/conversations/${conversationId}/messages`, { headers })
  if (!res.ok) throw new Error(`messages failed: ${res.status}`)
  const body = await res.json()
  // API returns newest first — flip to chronological for display
  return (body.messages || []).slice().reverse()
}

async function fetchMyUserId() {
  try {
    const { base, headers } = await creds()
    const res = await fetch(`${base}/users/me`, { headers })
    if (!res.ok) return null
    const body = await res.json()
    return body?.user?.id || null
  } catch {
    return null
  }
}

function relTime(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

function msgText(m) {
  const p = m?.payload || {}
  if (p.type === 'image') return '🖼 image'
  return (p.text || '').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1')
}

/** Transcript variant: markdown links keep their URL so Linkified can render
    a working anchor next to the label. */
function bubbleText(m) {
  const p = m?.payload || {}
  return (p.text || '').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1 $2')
}

/** Plain text with URLs turned into brand-styled anchors. */
function Linkified({ text }) {
  const parts = String(text).split(/(https?:\/\/[^\s)]+)/g)
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-cyan underline underline-offset-2 hover:text-violet"
      >
        {part}
      </a>
    ) : (
      part
    ),
  )
}

export default function ChatHistory({ open, onClose }) {
  const reduce = useReducedMotion()
  const [conversations, setConversations] = useState(null) // null = loading
  const [error, setError] = useState(false)
  const [viewing, setViewing] = useState(null) // conversation object
  const [transcript, setTranscript] = useState(null)
  const [activeId, setActiveId] = useState('')
  const myIdRef = useRef(null)
  const titlesRef = useRef(new Map()) // conversationId -> derived title (in-memory only)
  const [, forceTick] = useState(0)

  const refresh = useCallback(async () => {
    setError(false)
    try {
      setActiveId(window.botpress?.conversationId || '')
      const list = await fetchConversations()
      setConversations(list)
      if (!myIdRef.current) myIdRef.current = await fetchMyUserId()
      // Derive titles from each conversation's first user message (cached)
      list.slice(0, 15).forEach(async (c) => {
        if (titlesRef.current.has(c.id)) return
        try {
          const msgs = await fetchMessages(c.id)
          const mine = msgs.find((m) => !myIdRef.current || m.userId === myIdRef.current)
          const src = mine || msgs[0]
          if (src) {
            titlesRef.current.set(c.id, msgText(src).slice(0, 60))
            forceTick((t) => t + 1)
          }
        } catch {
          /* keep fallback title */
        }
      })
    } catch {
      setError(true)
      setConversations([])
    }
  }, [])

  useEffect(() => {
    if (open) {
      setViewing(null)
      setTranscript(null)
      refresh()
    }
  }, [open, refresh])

  const openTranscript = async (conv) => {
    setViewing(conv)
    setTranscript(null)
    try {
      setTranscript(await fetchMessages(conv.id))
    } catch {
      setTranscript([])
    }
  }

  const newChat = async () => {
    try {
      await window.botpress?.restartConversation?.()
    } catch {
      /* chat stays usable either way */
    }
    onClose()
  }

  const title = (c) =>
    titlesRef.current.get(c.id) ||
    msgText(c.lastMessage).slice(0, 60) ||
    'Conversation'

  return (
    <div
      className="absolute inset-0 z-30"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
      aria-hidden={!open}
    >
      {/* Backdrop within the chat panel */}
      <motion.div
        className="absolute inset-0 bg-[rgba(8,8,13,0.55)] backdrop-blur-[2px]"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
        onClick={onClose}
      />

      {/* Slide-over drawer */}
      <motion.aside
        aria-label="Previous chats"
        className="absolute inset-y-0 left-0 flex w-full flex-col border-r sm:w-[300px]"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
        initial={false}
        animate={{ x: open ? 0 : '-105%' }}
        transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
      >
        {/* Drawer header */}
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
          {viewing ? (
            <motion.button
              type="button"
              {...buttonMotion}
              onClick={() => { setViewing(null); setTranscript(null) }}
              aria-label="Back to list"
              className="btn-ghost focusable rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
            </motion.button>
          ) : (
            <MessageSquare size={15} strokeWidth={2} className="text-cyan" aria-hidden="true" />
          )}
          <p className="font-display text-sm font-semibold text-text-primary">
            {viewing ? 'Transcript' : 'Previous chats'}
          </p>
          {viewing && (
            <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
              View only
            </span>
          )}
          <motion.button
            type="button"
            {...buttonMotion}
            onClick={onClose}
            aria-label="Close history"
            className="btn-ghost focusable ml-auto rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X size={15} strokeWidth={2} aria-hidden="true" />
          </motion.button>
        </div>

        {!viewing ? (
          <>
            {/* New chat */}
            <div className="px-3 pt-3">
              <motion.button
                type="button"
                {...buttonMotion}
                onClick={newChat}
                className="btn-secondary focusable flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm"
              >
                <Plus size={15} strokeWidth={2} className="text-cyan" aria-hidden="true" />
                New chat
              </motion.button>
            </div>

            {/* Conversation list */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {conversations === null && (
                <p className="px-2 py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  Loading…
                </p>
              )}
              {error && (
                <p className="px-2 py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  Couldn't load history.
                </p>
              )}
              {conversations?.length === 0 && !error && (
                <p className="px-2 py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  No previous chats yet.
                </p>
              )}
              <ul className="flex flex-col gap-1.5">
                {(conversations || []).map((c) => {
                  const active = c.id === activeId
                  return (
                    <li key={c.id}>
                      <motion.button
                        type="button"
                        {...buttonMotion}
                        onClick={() => openTranscript(c)}
                        className={`focusable w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          active ? 'border-cyan/40 bg-cyan/[0.07]' : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
                        }`}
                      >
                        <p className="truncate text-[13px] text-text-primary">{title(c)}</p>
                        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {relTime(c.updatedAt)}
                          {active && <span className="ml-2 text-cyan">● current</span>}
                        </p>
                      </motion.button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        ) : (
          /* Read-only transcript */
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {transcript === null && (
              <p className="px-2 py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                Loading transcript…
              </p>
            )}
            <ul className="flex flex-col gap-2">
              {(transcript || []).map((m) => {
                const mine = myIdRef.current && m.userId === myIdRef.current
                const p = m.payload || {}
                return (
                  <li key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className="max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed"
                      style={
                        mine
                          ? { background: 'rgba(0, 229, 255, 0.9)', color: '#05070a' }
                          : { background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' }
                      }
                    >
                      {p.type === 'image' && p.imageUrl ? (
                        <a href={p.imageUrl} target="_blank" rel="noopener noreferrer">
                          <img src={p.imageUrl} alt="attachment" className="max-w-full rounded-lg" />
                        </a>
                      ) : (
                        <Linkified text={bubbleText(m)} />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            {transcript?.length === 0 && (
              <p className="px-2 py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                No messages in this conversation.
              </p>
            )}
          </div>
        )}
      </motion.aside>
    </div>
  )
}
