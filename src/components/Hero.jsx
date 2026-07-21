import { motion } from 'framer-motion'
import AuraOrb from './AuraOrb'
import { buttonMotion, pageLoadedHidden } from '../lib/motion'

const HIGHLIGHTS = [
  { icon: '📄', label: 'Analyze your resume' },
  { icon: '🎯', label: 'Discover matching careers' },
  { icon: '📊', label: 'See your skill gaps' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Hero({ onStart }) {
  return (
    <motion.div
      variants={container}
      initial={pageLoadedHidden ? false : 'hidden'}
      animate="show"
      className="flex flex-col items-center gap-8 text-center lg:items-start lg:text-left"
    >
      <motion.div variants={item} className="lg:self-start">
        <AuraOrb size={160} />
      </motion.div>

      <motion.h1
        variants={item}
        className="font-display text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl"
      >
        <span className="gradient-text">AURA</span> — Your AI Career Guide
      </motion.h1>

      <motion.p variants={item} className="max-w-xl text-lg leading-relaxed text-gray-400">
        <span className="font-medium text-gray-200">
          AI-powered Universal Recommendation Assistant
        </span>{' '}
        — chat with AURA to map your strengths, explore career paths, and get a
        personalized plan for what to learn next.
      </motion.p>

      <motion.ul variants={item} className="flex flex-wrap justify-center gap-3 lg:justify-start">
        {HIGHLIGHTS.map(({ icon, label }) => (
          <li
            key={label}
            className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-gray-200"
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </li>
        ))}
      </motion.ul>

      <motion.div variants={item} className="lg:hidden">
        <StartButton onClick={onStart} />
      </motion.div>
    </motion.div>
  )
}

export function StartButton({ onClick, className = '' }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...buttonMotion}
      className={`group btn-primary relative rounded-full bg-gradient-to-r from-neon-cyan to-neon-violet px-8 py-3.5 font-display text-base font-semibold text-abyss focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-abyss ${className}`}
    >
      Start chatting
      <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">
        →
      </span>
    </motion.button>
  )
}
