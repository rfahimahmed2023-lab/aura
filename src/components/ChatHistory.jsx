import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus, X, MessageSquare, Pencil, Trash2, Loader2 } from 'lucide-react'
import { EASE, buttonMotion } from '../lib/motion'
import {
  WEBCHAT_CONTAINER_ID,
  switchConversation,
  focusComposer,
  mergeUserData,
} from '../hooks/useBotpress'

/**
 * Previous-chats panel (slide-over inside the chat modal).
 *
 * - Clicking a conversation SWITCHES the live webchat into it (full history,
 *   new messages continue there) via switchConversation(); on failure the
 *   row shows an error instead of pretending.
 * - Rename persists server-side in Botpress user data (mergeUserData).
 * - Delete uses the Chat API with inline confirmation; deleting the open
 *   conversation immediately starts a fresh one.
 *
 * No browser storage is read or written by this code.
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
  return (body.messages || []).slice().reverse()
}

async function deleteConversation(conversationId) {
  const { base, headers } = await creds()
  const res = await fetch(`${base}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error(`delete failed: ${res.status}`)
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

export default function ChatHistory({ open, onClose }) {
  const reduce = useReducedMotion()
  const [conversations, setConversations] = useState(null) // null = loading
  const [error, setError] = useState(false)
  const [notice, setNotice] = useState('')
  const [activeId, setActiveId] = useState('')
  const [switchingId, setSwitchingId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)
  const [userTitles, setUserTitles] = useState({})
  const myIdRef = useRef(null)
  const derivedTitlesRef = useRef(new Map()) // in-memory only (session cache)
  const renameCancelledRef = useRef(false)
  const [, forceTick] = useState(0)

  const refresh = useCallback(async () => {
    setError(false)
    setNotice('')
    try {
      const bp = window.botpress
      setActiveId(bp?.conversationId || '')
      const [list, user] = await Promise.all([
        fetchConversations(),
        bp.getUser().catch(() => null),
      ])
      setConversations(list)
      setUserTitles(user?.data?.convTitles || {})
      if (!myIdRef.current) myIdRef.current = await fetchMyUserId()
      // Derive fallback titles from each conversation's first user message
      list.slice(0, 15).forEach(async (c) => {
        if (derivedTitlesRef.current.has(c.id)) return
        try {
          const msgs = await fetchMessages(c.id)
          const mine = msgs.find((m) => !myIdRef.current || m.userId === myIdRef.current)
          const src = mine || msgs[0]
          if (src) {
            derivedTitlesRef.current.set(c.id, msgText(src).slice(0, 60))
            forceTick((t) => t + 1)
          }
        } catch {
          /* keep fallback */
        }
      })
    } catch {
      setError(true)
      setConversations([])
    }
  }, [])

  useEffect(() => {
    if (open) {
      setRenamingId(null)
      setConfirmingId(null)
      setSwitchingId(null)
      refresh()
    }
  }, [open, refresh])

  // Escape cancels rename / delete-confirm BEFORE the modal's own Escape
  // handling (capture phase wins over the modal's bubble listener).
  useEffect(() => {
    if (!renamingId && !confirmingId) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      if (renamingId) {
        renameCancelledRef.current = true
        setRenamingId(null)
      }
      setConfirmingId(null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [renamingId, confirmingId])

  const title = (c) =>
    userTitles[c.id] ||
    derivedTitlesRef.current.get(c.id) ||
    msgText(c.lastMessage).slice(0, 60) ||
    'Conversation'

  /* ----- switching (Change 1) ----- */
  const openConversation = async (c) => {
    if (switchingId) return
    if (c.id === activeId) {
      onClose()
      setTimeout(focusComposer, 400)
      return
    }
    setSwitchingId(c.id)
    setNotice('')
    // Subtle fade on the message area — never a hard swap
    const host = document.getElementById(WEBCHAT_CONTAINER_ID)
    if (host && !reduce) {
      host.style.transition = 'opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
      host.style.opacity = '0.25'
    }
    const ok = await switchConversation(c.id)
    if (host) host.style.opacity = '1'
    setSwitchingId(null)
    if (ok) {
      setActiveId(c.id)
      onClose()
      setTimeout(focusComposer, 450)
    } else {
      setNotice("Couldn't open that conversation. Please try again.")
    }
  }

  /* ----- new chat ----- */
  const newChat = async () => {
    try {
      await window.botpress?.restartConversation?.()
      setActiveId(window.botpress?.conversationId || '')
    } catch {
      /* chat stays usable */
    }
    onClose()
    setTimeout(focusComposer, 450)
  }

  /* ----- rename (Change 2) ----- */
  const startRename = (c) => {
    setConfirmingId(null)
    renameCancelledRef.current = false
    setRenameValue(title(c))
    setRenamingId(c.id)
  }

  const commitRename = async (c) => {
    if (renameCancelledRef.current) {
      renameCancelledRef.current = false
      return
    }
    const next = renameValue.trim()
    setRenamingId(null)
    if (!next || next === title(c)) return
    const updated = { ...userTitles, [c.id]: next }
    setUserTitles(updated) // optimistic
    try {
      await mergeUserData({ convTitles: updated })
    } catch {
      setUserTitles(userTitles) // roll back
      setNotice("Couldn't save the new name.")
    }
  }

  /* ----- delete (Change 2) ----- */
  const confirmDelete = async (c) => {
    setConfirmingId(null)
    try {
      await deleteConversation(c.id)
    } catch {
      setNotice("Couldn't delete that conversation.")
      return
    }
    setConversations((list) => (list || []).filter((x) => x.id !== c.id))
    // tidy the stored title map
    if (userTitles[c.id]) {
      const { [c.id]: _gone, ...rest } = userTitles
      setUserTitles(rest)
      mergeUserData({ convTitles: rest }).catch(() => {})
    }
    // If the open conversation was deleted, start a fresh one immediately
    if (c.id === activeId) {
      try {
        await window.botpress?.restartConversation?.()
        setActiveId(window.botpress?.conversationId || '')
      } catch {
        /* ignore */
      }
    }
  }

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
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <MessageSquare size={15} strokeWidth={2} className="text-cyan" aria-hidden="true" />
          <p className="font-display text-sm font-semibold text-text-primary">Previous chats</p>
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

        {notice && (
          <p className="px-4 pt-2 text-[11px] text-rose-300/90">{notice}</p>
        )}

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
            <AnimatePresence initial={false}>
              {(conversations || []).map((c) => {
                const active = c.id === activeId
                const renaming = renamingId === c.id
                const confirming = confirmingId === c.id
                const switching = switchingId === c.id
                return (
                  <motion.li
                    key={c.id}
                    layout={!reduce}
                    exit={
                      reduce
                        ? { opacity: 0 }
                        : { opacity: 0, x: -28, transition: { duration: 0.3, ease: EASE } }
                    }
                    className="group relative"
                  >
                    {confirming ? (
                      /* Inline delete confirmation */
                      <div
                        className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/[0.06] px-3 py-2.5"
                        role="alertdialog"
                        aria-label="Delete this chat?"
                      >
                        <p className="min-w-0 flex-1 truncate text-[12px] text-text-primary">
                          Delete this chat?
                        </p>
                        <motion.button
                          type="button"
                          {...buttonMotion}
                          onClick={() => confirmDelete(c)}
                          className="focusable rounded-lg border border-rose-400/50 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-400/10"
                        >
                          Confirm
                        </motion.button>
                        <motion.button
                          type="button"
                          {...buttonMotion}
                          onClick={() => setConfirmingId(null)}
                          className="focusable rounded-lg px-2 py-1 text-[11px] text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    ) : renaming ? (
                      /* Inline rename input — same typography as the row title */
                      <div
                        className="rounded-xl border border-cyan/40 bg-cyan/[0.05] px-3 py-2.5"
                      >
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur()
                          }}
                          onBlur={() => commitRename(c)}
                          autoFocus
                          onFocus={(e) => e.currentTarget.select()}
                          aria-label="Rename conversation"
                          className="w-full bg-transparent text-[13px] text-text-primary outline-none"
                          style={{ fontFamily: 'inherit' }}
                        />
                        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          Enter to save · Esc to cancel
                        </p>
                      </div>
                    ) : (
                      <>
                        <motion.button
                          type="button"
                          {...buttonMotion}
                          onClick={() => openConversation(c)}
                          disabled={!!switchingId}
                          className={`focusable w-full rounded-xl border py-2.5 pl-3 pr-16 text-left transition-colors ${
                            active
                              ? 'border-transparent border-l-2 !border-l-cyan bg-cyan/[0.07]'
                              : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
                          }`}
                        >
                          <p className="truncate text-[13px] text-text-primary">{title(c)}</p>
                          <p className="mt-0.5 flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {relTime(c.updatedAt)}
                            {active && <span className="text-cyan">● current</span>}
                            {switching && (
                              <Loader2
                                size={11}
                                className="animate-spin text-cyan"
                                aria-label="Opening…"
                              />
                            )}
                          </p>
                        </motion.button>

                        {/* Hover / focus actions */}
                        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-70">
                          <motion.button
                            type="button"
                            {...buttonMotion}
                            onClick={() => startRename(c)}
                            aria-label={`Rename "${title(c)}"`}
                            title="Rename"
                            className="focusable rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-cyan"
                          >
                            <Pencil size={13} strokeWidth={2} aria-hidden="true" />
                          </motion.button>
                          <motion.button
                            type="button"
                            {...buttonMotion}
                            onClick={() => {
                              setRenamingId(null)
                              setConfirmingId(c.id)
                            }}
                            aria-label={`Delete "${title(c)}"`}
                            title="Delete"
                            className="focusable rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-rose-300"
                          >
                            <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
                          </motion.button>
                        </div>
                      </>
                    )}
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </div>
      </motion.aside>
    </div>
  )
}
