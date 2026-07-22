import { useEffect, useState } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { acquireMouse } from '../lib/mouseSource'

/**
 * Background-only depth layer: combines subtle mouse parallax (spring-
 * smoothed, radiating from viewport center) with a gentle upward scroll
 * drift. Applied ONLY to ambient/background elements — never text or
 * interactive UI.
 *
 * Props:
 *  - mouse: movement multiplier vs distance from viewport center
 *           (deep ~0.015, mid ~0.045, close ~0.07)
 *  - scroll: max translateY (px) reached over the first ~900px of scroll
 *  - maxMouse: displacement clamp in px so layers never expose edges
 *  - scale: optional oversize factor for full-bleed layers (e.g. 1.06)
 *
 * Transform/opacity only; will-change applies only while the effect is
 * active. On coarse pointers or prefers-reduced-motion the wrapper renders
 * inert — no listeners, no springs, no battery cost — leaving the existing
 * breathing/float animations untouched.
 */
export default function ParallaxLayer({
  children,
  mouse = 0,
  scroll = 0,
  maxMouse = 60,
  scale,
  className = '',
  style,
}) {
  const reduce = useReducedMotion()
  const [fine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  )
  const enabled = fine && !reduce

  // Shared mouse source — acquired only when the effect is active
  const [src] = useState(() => (enabled ? acquireMouse() : null))
  useEffect(() => () => src?.release(), [src])

  const zero = useMotionValue(0)
  const clampPx = (v) => Math.max(-maxMouse, Math.min(maxMouse, v))

  const txRaw = useTransform(src ? src.mx : zero, (v) =>
    clampPx(v * mouse * (window.innerWidth / 2)),
  )
  const tyRaw = useTransform(src ? src.my : zero, (v) =>
    clampPx(v * mouse * (window.innerHeight / 2)),
  )
  // Premium "settle" feel per spec
  const sx = useSpring(txRaw, { stiffness: 80, damping: 20, mass: 1 })
  const syMouse = useSpring(tyRaw, { stiffness: 80, damping: 20, mass: 1 })

  // Scroll drift: classic depth illusion, transform-only, clamped
  const { scrollY } = useScroll()
  const drift = useTransform(scrollY, [0, 900], [0, scroll], { clamp: true })

  const y = useTransform([syMouse, drift], ([a, b]) => a + b)

  if (!enabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={className}
      style={{
        ...style,
        x: sx,
        y,
        scale: scale ?? 1,
        willChange: 'transform',
      }}
    >
      {children}
    </motion.div>
  )
}
