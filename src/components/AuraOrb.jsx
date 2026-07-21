import { motion, useReducedMotion } from 'framer-motion'

/**
 * The AURA hero anchor: a calm, hypnotic orb.
 * Breathing scale (1.0↔1.04, ~4s) + gentle float (±6px, ~6s) + soft glow pulse.
 */
export default function AuraOrb({ size = 132 }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={reduce ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      {/* Soft pulsing glow — low opacity, premium */}
      <motion.div
        className="absolute -inset-10 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(0,229,255,0.28), rgba(122,92,255,0.18) 55%, transparent 72%)',
          filter: 'blur(14px)',
        }}
        animate={reduce ? undefined : { opacity: [0.4, 0.72, 0.4], scale: [0.94, 1.06, 0.94] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rotating rings */}
      <motion.div
        className="orb-ring absolute -inset-3 rounded-full"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="orb-ring absolute -inset-7 rounded-full opacity-40"
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
      />

      {/* Core with breathing scale */}
      <motion.div
        className="orb-core h-full w-full rounded-full"
        animate={reduce ? undefined : { scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}
