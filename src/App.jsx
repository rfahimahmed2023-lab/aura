import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import Hero from './components/Hero'
import Capabilities from './components/Capabilities'
import AboutCreator from './components/AboutCreator'
import ChatModal from './components/ChatModal'
import AmbientBackground from './components/AmbientBackground'
import BrandMark, { LOGO_SOURCES } from './components/BrandMark'
import { SecondaryButton } from './components/Buttons'
import { useBotpress, openWebchat, sendToAura } from './hooks/useBotpress'
import { EASE, pageLoadedHidden } from './lib/motion'

export default function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const { status } = useBotpress()

  const openChat = useCallback(() => {
    setChatOpen(true)
    openWebchat()
  }, [])

  const sendStarter = useCallback((text) => {
    setChatOpen(true)
    openWebchat()
    sendToAura(text)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />

      {/* Slim brand header — intentionally low-contrast so the hero stays the focus */}
      <motion.header
        initial={pageLoadedHidden ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative z-20 mx-auto flex w-full max-w-[1120px] items-center justify-between px-6 py-5"
      >
        <div className="flex items-center gap-2.5">
          <BrandMark sources={LOGO_SOURCES} alt="AURA logo" className="h-8 w-8" />
          <span className="font-display text-lg font-semibold tracking-wide text-text-primary">
            AURA
          </span>
        </div>
        <SecondaryButton onClick={openChat} className="!py-2 text-sm">
          Start chatting
        </SecondaryButton>
      </motion.header>

      <main className="relative z-10">
        <Hero onOpenChat={openChat} onSendStarter={sendStarter} />

        {/* Divider */}
        <div
          className="mx-auto h-px w-full max-w-[1120px]"
          style={{ background: 'var(--border-subtle)' }}
        />

        <Capabilities />

        {/* Divider */}
        <div
          className="mx-auto h-px w-full max-w-[1120px]"
          style={{ background: 'var(--border-subtle)' }}
        />

        <AboutCreator />
      </main>

      <footer
        className="relative z-10 border-t px-6 py-10 text-center"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <BrandMark sources={LOGO_SOURCES} alt="" className="h-6 w-6" />
            <span className="font-display text-sm font-semibold text-text-primary">AURA</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            AI-powered Universal Recommendation Assistant
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Built by Fahim Ahmed Rafi
          </p>
        </div>
      </footer>

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} status={status} />
    </div>
  )
}
