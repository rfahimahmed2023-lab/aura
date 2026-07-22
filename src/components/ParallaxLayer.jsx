import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

/**
 * Scroll-linked depth wrapper (add-only). Children drift vertically as the
 * layer travels through the viewport, and can optionally fade as they leave.
 * Transform/opacity only; passthrough under prefers-reduced-motion.
 */
export default function ParallaxLayer({
  children,
  from = 28,
  to = -28,
  fade = false,
  offset = ['start end', 'end start'],
  className = '',
}) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset })
  const y = useTransform(scrollYProgress, [0, 1], [from, to])
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.6, 1],
    [1, 1, fade ? 0.25 : 1],
  )

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div ref={ref} style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  )
}
