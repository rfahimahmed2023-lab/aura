import { motion, useReducedMotion } from 'framer-motion'

/* Fixed positions so the field is stable across renders; transform/opacity
   only, so everything stays on the GPU compositor. */
const PARTICLES = [
  { left: '6%', top: '18%', size: 3, dur: 12, delay: 0, violet: false },
  { left: '14%', top: '64%', size: 2, dur: 15, delay: 2, violet: true },
  { left: '23%', top: '35%', size: 2, dur: 10, delay: 4, violet: false },
  { left: '31%', top: '78%', size: 3, dur: 14, delay: 1, violet: false },
  { left: '42%', top: '12%', size: 2, dur: 16, delay: 3, violet: true },
  { left: '55%', top: '82%', size: 2, dur: 11, delay: 5, violet: false },
  { left: '63%', top: '28%', size: 3, dur: 13, delay: 2, violet: true },
  { left: '71%', top: '58%', size: 2, dur: 15, delay: 0, violet: false },
  { left: '80%', top: '16%', size: 2, dur: 12, delay: 4, violet: false },
  { left: '87%', top: '72%', size: 3, dur: 14, delay: 1, violet: true },
  { left: '93%', top: '40%', size: 2, dur: 16, delay: 3, violet: false },
  { left: '48%', top: '48%', size: 2, dur: 13, delay: 6, violet: true },
]

export default function AmbientBackground() {
  const reduceMotion = useReducedMotion()

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="bg-grid absolute inset-0" />

      {/* Slow-drifting gradient orbs */}
      <motion.div
        className="absolute -top-40 -left-40 h-[34rem] w-[34rem] rounded-full bg-neon-cyan/10 blur-[130px]"
        animate={reduceMotion ? undefined : { x: [0, 70, -30, 0], y: [0, 45, 90, 0] }}
        transition={{ duration: 46, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-48 -right-32 h-[36rem] w-[36rem] rounded-full bg-neon-violet/10 blur-[140px]"
        animate={reduceMotion ? undefined : { x: [0, -80, 40, 0], y: [0, -50, -100, 0] }}
        transition={{ duration: 52, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 top-1/3 h-[26rem] w-[26rem] rounded-full bg-neon-violet/[0.06] blur-[120px]"
        animate={
          reduceMotion
            ? undefined
            : { x: ['-50%', '-32%', '-62%', '-50%'], y: [0, 60, -40, 0] }
        }
        style={{ x: '-50%' }}
        transition={{ duration: 58, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Faint floating particle field */}
      {!reduceMotion &&
        PARTICLES.map(({ left, top, size, dur, delay, violet }, i) => (
          <motion.span
            key={i}
            className={`absolute rounded-full ${violet ? 'bg-neon-violet' : 'bg-neon-cyan'}`}
            style={{
              left,
              top,
              width: size,
              height: size,
              boxShadow: violet
                ? '0 0 8px 1px rgba(122, 92, 255, 0.55)'
                : '0 0 8px 1px rgba(0, 229, 255, 0.55)',
            }}
            animate={{ y: [0, -28, 0], opacity: [0.12, 0.55, 0.12] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
    </div>
  )
}
