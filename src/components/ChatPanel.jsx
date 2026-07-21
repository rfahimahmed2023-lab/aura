import { AnimatePresence, motion } from 'framer-motion'
import { WEBCHAT_CONTAINER_ID } from '../hooks/useBotpress'
import { StartButton } from './Hero'
import BrandMark, { AVATAR_SOURCES } from './BrandMark'
import { buttonMotion, pageLoadedHidden } from '../lib/motion'

export default function ChatPanel({ started, status, onStart }) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } }}
      className="glass neon-border relative flex h-full w-full flex-col overflow-hidden rounded-3xl"
    >
      {/* Panel header */}
      <div className="relative z-20 flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3.5">
        <BrandMark
          sources={AVATAR_SOURCES}
          alt="AURA avatar"
          className="h-8 w-8 shrink-0"
        />
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold tracking-wide text-white">AURA</p>
          <p className="truncate text-xs text-gray-400">
            {status === 'error' ? 'Connection issue — retry below' : 'AI Career Guide · online'}
          </p>
        </div>
        {started && status === 'ready' && (
          <motion.button
            type="button"
            {...buttonMotion}
            onClick={() => window.botpress?.restartConversation?.()}
            aria-label="Restart conversation"
            title="Restart conversation"
            className="btn-ghost ml-auto rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          </motion.button>
        )}
        <span
          aria-hidden="true"
          className={`${started && status === 'ready' ? 'ml-2' : 'ml-auto'} h-2 w-2 rounded-full ${
            status === 'ready'
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
              : status === 'error'
                ? 'bg-rose-400'
                : 'animate-pulse bg-amber-300'
          }`}
        />
      </div>

      {/* Botpress mounts here (embeddedChatId) */}
      <div className="relative min-h-0 flex-1">
        <div id={WEBCHAT_CONTAINER_ID} />

        {/* Teaser overlay before the user starts chatting */}
        <AnimatePresence>
          {!started && (
            <motion.div
              key="teaser"
              initial={false}
              exit={{ opacity: 0, transition: { duration: 0.45 } }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-[rgba(10,10,15,0.72)] px-8 text-center backdrop-blur-md"
            >
              <motion.p
                initial={pageLoadedHidden ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="max-w-xs text-sm leading-relaxed text-gray-300"
              >
                Upload a resume, explore matching careers, and get a skill-gap
                report — all in one conversation.
              </motion.p>
              <motion.div
                initial={pageLoadedHidden ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <StartButton onClick={onStart} />
              </motion.div>
              {status === 'loading' && (
                <motion.p
                  initial={pageLoadedHidden ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xs text-gray-500"
                >
                  Waking AURA up…
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection failure state */}
        {status === 'error' && started && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[rgba(10,10,15,0.85)] px-8 text-center">
            <p className="text-sm text-gray-300">
              AURA couldn't connect to the chat service.
            </p>
            <motion.button
              type="button"
              {...buttonMotion}
              onClick={() => window.location.reload()}
              className="btn-ghost rounded-full border border-neon-cyan/50 px-5 py-2 text-sm text-neon-cyan transition-colors hover:bg-neon-cyan/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              Reload
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
