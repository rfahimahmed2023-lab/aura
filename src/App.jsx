import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import Hero from './components/Hero'
import ChatPanel from './components/ChatPanel'
import Capabilities from './components/Capabilities'
import AmbientBackground from './components/AmbientBackground'
import BrandMark, { LOGO_SOURCES } from './components/BrandMark'
import { useBotpress } from './hooks/useBotpress'
import { buttonMotion, pageLoadedHidden } from './lib/motion'

export default function App() {
  const [started, setStarted] = useState(false)
  const { status } = useBotpress()

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />

      {/* Persistent header */}
      <motion.header
        initial={pageLoadedHidden ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8"
      >
        <div className="flex items-center gap-3">
          <span className="logo-glow">
            <BrandMark sources={LOGO_SOURCES} alt="AURA logo" className="h-9 w-9" />
          </span>
          <span className="font-display text-xl font-bold tracking-wide text-white">
            AURA
          </span>
          <span className="glass hidden rounded-full px-3 py-1 text-xs text-gray-400 sm:inline-block">
            AI Career Guide
          </span>
        </div>
        <AnimatePresence>
          {started && (
            <motion.button
              key="back"
              type="button"
              {...buttonMotion}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              onClick={() => setStarted(false)}
              className="glass btn-ghost rounded-full px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              ← Back to intro
            </motion.button>
          )}
        </AnimatePresence>
      </motion.header>

      <LayoutGroup>
        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 pb-16 pt-4 sm:px-8">
          <div
            className={
              started
                ? 'flex justify-center'
                : 'grid items-center gap-12 lg:grid-cols-2 lg:gap-16'
            }
          >
            {/* Hero — hidden once the chat takes focus */}
            <AnimatePresence mode="popLayout">
              {!started && (
                <motion.section
                  key="hero"
                  layout
                  exit={{ opacity: 0, x: -48, transition: { duration: 0.4 } }}
                  className="py-6 lg:py-12"
                >
                  <Hero onStart={() => setStarted(true)} />
                </motion.section>
              )}
            </AnimatePresence>

            {/* Chat panel — grows to focus when started */}
            <motion.section
              layout
              initial={pageLoadedHidden ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                opacity: { duration: 0.65, delay: 0.2, ease: 'easeOut' },
                y: { duration: 0.65, delay: 0.2, ease: 'easeOut' },
                layout: { duration: 0.55, ease: [0.32, 0.72, 0, 1] },
              }}
              className={
                started
                  ? 'h-[min(78vh,52rem)] w-full max-w-4xl'
                  : 'h-[32rem] w-full sm:h-[34rem]'
              }
              aria-label="AURA chat"
            >
              <ChatPanel
                started={started}
                status={status}
                onStart={() => setStarted(true)}
              />
            </motion.section>
          </div>

          <AnimatePresence>
            {!started && (
              <motion.div
                key="capabilities"
                exit={{ opacity: 0, y: 24, transition: { duration: 0.3 } }}
              >
                <Capabilities />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </LayoutGroup>

      <motion.footer
        initial={pageLoadedHidden ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-10 pb-6 text-center text-xs text-gray-600"
      >
        AURA — AI-powered Universal Recommendation Assistant
      </motion.footer>
    </div>
  )
}
