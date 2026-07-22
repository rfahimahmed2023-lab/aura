import { motion } from 'framer-motion'
import { FileText, Compass, BarChart3, ArrowRight } from 'lucide-react'
import AuraOrb from './AuraOrb'
import Magnetic from './Magnetic'
import ParallaxLayer from './ParallaxLayer'
import { RevealWord, revealLine, IgnitionBloom } from './CinematicIntro'
import { PrimaryButton, SecondaryButton } from './Buttons'
import { heroStagger, heroItem, pageLoadedHidden } from '../lib/motion'

const FEATURES = [
  {
    label: 'Analyze your resume',
    icon: FileText,
    starter: "I'd like to analyze my resume.",
  },
  {
    label: 'Discover matching careers',
    icon: Compass,
    starter: 'Help me discover careers that match my skills.',
  },
  {
    label: 'See your skill gaps',
    icon: BarChart3,
    starter: 'Can you show me my skill gaps for a career?',
  },
]

export default function Hero({ onOpenChat, onSendStarter }) {
  return (
    <motion.section
      variants={heroStagger}
      initial={pageLoadedHidden ? false : 'hidden'}
      animate="show"
      className="flex flex-col items-center px-6 pt-20 pb-24 text-center sm:pt-28 lg:pt-32"
    >
      {/* Orb — hero anchor; closest parallax depth (background element) */}
      <motion.div variants={heroItem}>
        <ParallaxLayer mouse={0.07} scroll={-24} maxMouse={52} className="relative">
          <IgnitionBloom />
          <AuraOrb size={132} />
        </ParallaxLayer>
      </motion.div>

      {/* Eyebrow / tagline */}
      <motion.p variants={heroItem} className="eyebrow mt-10">
        AI-powered Universal Recommendation Assistant
      </motion.p>

      {/* H1 — same text, revealed word by word through a masked line */}
      <motion.h1
        variants={revealLine}
        className="mt-5 max-w-4xl font-display font-bold text-text-primary"
        style={{
          fontSize: 'clamp(48px, 7vw, 88px)',
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
        }}
      >
        <RevealWord className="gradient-text">AURA</RevealWord>{' '}
        <RevealWord>—</RevealWord> <RevealWord>Your</RevealWord>{' '}
        <RevealWord>AI</RevealWord> <RevealWord>Career</RevealWord>{' '}
        <RevealWord>Guide</RevealWord>
      </motion.h1>

      {/* Sub-headline */}
      <motion.p
        variants={heroItem}
        className="mt-6 max-w-2xl"
        style={{
          fontSize: 'clamp(18px, 2.2vw, 24px)',
          lineHeight: 1.5,
          fontWeight: 400,
          color: 'var(--text-secondary)',
        }}
      >
        Map your strengths, explore career paths, and get a personalized plan for
        what to learn next — all in one conversation.
      </motion.p>

      {/* Primary CTA */}
      <motion.div variants={heroItem} className="mt-10">
        <Magnetic>
          <PrimaryButton onClick={onOpenChat} className="text-base">
            Start chatting
            <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
          </PrimaryButton>
        </Magnetic>
      </motion.div>

      {/* Feature buttons — one evenly-spaced row (equal width via grid) */}
      <motion.div
        variants={heroItem}
        className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {FEATURES.map(({ label, icon, starter }) => (
          <Magnetic key={label} className="w-full" strength={0.22}>
            <SecondaryButton
              icon={icon}
              onClick={() => onSendStarter(starter)}
              className="w-full"
            >
              {label}
            </SecondaryButton>
          </Magnetic>
        ))}
      </motion.div>
    </motion.section>
  )
}
