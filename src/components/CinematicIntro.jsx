import { motion, useReducedMotion } from 'framer-motion'
import { EASE, pageLoadedHidden } from '../lib/motion'

/**
 * Cinematic intro primitives (add-only).
 *
 * RevealWord — masked line reveal: each word rises out of an overflow-hidden
 * clip, transform-only. Words inherit the parent's variant orchestration, so
 * wrapping an <h1> with `revealLine` variants staggers them.
 *
 * IgnitionBloom — a one-shot radial flare that blooms and dissipates once at
 * load, giving the orb an "ignition" beat before settling into its calm loop.
 */

/** Orchestration-only variants for the line containing RevealWords. */
export const revealLine = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075, delayChildren: 0.05 } },
}

const wordVariant = {
  hidden: { y: '112%' },
  show: { y: '0%', transition: { duration: 0.7, ease: EASE } },
}

export function RevealWord({ children, className = '' }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.06em] -mb-[0.06em] align-bottom">
      <motion.span variants={wordVariant} className={`inline-block ${className}`}>
        {children}
      </motion.span>
    </span>
  )
}

export function IgnitionBloom() {
  const reduce = useReducedMotion()
  if (reduce || pageLoadedHidden) return null
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-[40%] rounded-full"
      style={{
        background:
          'radial-gradient(circle, rgba(0, 229, 255, 0.5), rgba(122, 92, 255, 0.28) 45%, transparent 70%)',
      }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1.25, 1.6] }}
      transition={{ duration: 1.4, ease: 'easeOut', times: [0, 0.35, 1], delay: 0.15 }}
    />
  )
}
