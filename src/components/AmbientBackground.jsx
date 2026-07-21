import { motion, useReducedMotion } from 'framer-motion'

/* Fixed positions so the field is stable across renders; transform/opacity
   only, so everything stays on the GPU compositor. Very low opacity — must
   never reduce text legibility. */
const PARTICLES = [
  { left: '8%', top: '22%', size: 2, dur: 13, delay: 0, violet: false },
  { left: '18%', top: '68%', size: 2, dur: 16, delay: 2, violet: true },
  { left: '27%', top: '40%', size: 2, dur: 11, delay: 4, violet: false },
  { left: '39%', top: '14%', size: 2, dur: 17, delay: 3, violet: true },
  { left: '58%', top: '78%', size: 2, dur: 12, delay: 5, violet: false },
  { left: '67%', top: '30%', size: 2, dur: 14, delay: 2, violet: true },
  { left: '76%', top: '60%', size: 2, dur: 16, delay: 0, violet: false },
  { left: '85%', top: '20%', size: 2, dur: 13, delay: 4, violet: false },
  { left: '92%', top: '46%', size: 2, dur: 17, delay: 3, violet: true },
  { left: '48%', top: '52%', size: 2, dur: 14, delay: 6, violet: true },
]

export default function AmbientBackground() {
  const reduce = useReducedMotion()

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="bg-radial-hero absolute inset-0" />
      <div className="bg-grid absolute inset-0" />

      {/* Slow-drifting gradient mesh — subtle */}
      <motion.div
        className="absolute -top-48 -left-40 h-[38rem] w-[38rem] rounded-full bg-cyan/[0.07] blur-[150px]"
        animate={reduce ? undefined : { x: [0, 60, -20, 0], y: [0, 40, 80, 0] }}
        transition={{ duration: 50, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-52 -right-32 h-[40rem] w-[40rem] rounded-full bg-violet/[0.07] blur-[160px]"
        animate={reduce ? undefined : { x: [0, -70, 30, 0], y: [0, -40, -90, 0] }}
        transition={{ duration: 58, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Low-density starfield */}
      {!reduce &&
        PARTICLES.map(({ left, top, size, dur, delay, violet }, i) => (
          <motion.span
            key={i}
            className={`absolute rounded-full ${violet ? 'bg-violet' : 'bg-cyan'}`}
            style={{
              left,
              top,
              width: size,
              height: size,
              boxShadow: violet
                ? '0 0 6px 1px rgba(122, 92, 255, 0.4)'
                : '0 0 6px 1px rgba(0, 229, 255, 0.4)',
            }}
            animate={{ y: [0, -24, 0], opacity: [0.08, 0.4, 0.08] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
    </div>
  )
}
