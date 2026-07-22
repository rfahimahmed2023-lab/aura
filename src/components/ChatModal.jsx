import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, RotateCcw } from 'lucide-react'
import { WEBCHAT_CONTAINER_ID } from '../hooks/useBotpress'
import BrandMark, { AVATAR_SOURCES } from './BrandMark'
import { EASE } from '../lib/motion'
import { buttonMotion } from '../lib/motion'

/**
 * Centered chat overlay. The #aura-webchat container is ALWAYS mounted so the
 * Botpress webchat is never torn down — we only animate visibility. This keeps
 * the conversation and time-context user data intact across open/close.
 */
export default function ChatModal({ open, onClose, status }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 max-sm:bottom-auto max-sm:h-dvh sm:p-6"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-[rgba(8,8,13,0.72)] backdrop-blur-md"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Chat with AURA"
        className="gradient-border relative flex h-full w-full flex-col overflow-hidden sm:h-[min(680px,88vh)] sm:max-w-[460px]"
        style={{ boxShadow: 'var(--shadow-card)' }}
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          scale: open ? 1 : 0.94,
          y: open ? 0 : 18,
        }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        {/* Header */}
        <div className="relative z-10 flex items-center gap-3 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
          <BrandMark sources={AVATAR_SOURCES} alt="AURA avatar" className="h-8 w-8 shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-text-primary">AURA</p>
            <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
              {status === 'error' ? 'Connection issue' : 'AI Career Guide · online'}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <motion.button
              type="button"
              {...buttonMotion}
              onClick={() => window.botpress?.restartConversation?.()}
              aria-label="Restart conversation"
              title="Restart conversation"
              className="btn-ghost focusable rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
            </motion.button>
            <motion.button
              type="button"
              {...buttonMotion}
              onClick={onClose}
              aria-label="Close chat"
              title="Close"
              className="btn-ghost focusable rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </motion.button>
          </div>
        </div>

        {/* Botpress mounts here (embeddedChatId) — never unmounted */}
        <div className="relative min-h-0 flex-1">
          <div id={WEBCHAT_CONTAINER_ID} />

          {status === 'error' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[rgba(8,8,13,0.9)] px-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                AURA couldn't connect to the chat service.
              </p>
              <motion.button
                type="button"
                {...buttonMotion}
                onClick={() => window.location.reload()}
                className="btn-secondary focusable rounded-xl px-5 py-2 text-sm"
              >
                Reload
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
