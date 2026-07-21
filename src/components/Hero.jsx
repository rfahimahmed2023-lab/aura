import { motion } from 'framer-motion'
import { FileText, Compass, BarChart3, ArrowRight } from 'lucide-react'
import AuraOrb from './AuraOrb'
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
      {/* Orb — hero anchor */}
      <motion.div variants={heroItem}>
        <AuraOrb size={132} />
      </motion.div>

      {/* Eyebrow / tagline */}
      <motion.p variants={heroItem} className="eyebrow mt-10">
        AI-powered Universal Recommendation Assistant
      </motion.p>

      {/* H1 */}
      <motion.h1
        variants={heroItem}
        className="mt-5 max-w-4xl font-display font-bold text-text-primary"
        style={{
          fontSize: 'clamp(48px, 7vw, 88px)',
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
        }}
      >
        <span className="gradient-text">AURA</span> — Your AI Career Guide
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
        <PrimaryButton onClick={onOpenChat} className="text-base">
          Start chatting
          <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
        </PrimaryButton>
      </motion.div>

      {/* Feature buttons — one evenly-spaced row (equal width via grid) */}
      <motion.div
        variants={heroItem}
        className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {FEATURES.map(({ label, icon, starter }) => (
          <SecondaryButton
            key={label}
            icon={icon}
            onClick={() => onSendStarter(starter)}
            className="w-full"
          >
            {label}
          </SecondaryButton>
        ))}
      </motion.div>
    </motion.section>
  )
}
