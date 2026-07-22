import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

/**
 * Mouse parallax wrapper — children drift a few pixels opposite the cursor's
 * position in the viewport, adding gentle depth. Slow springs keep the
 * motion dreamy rather than jittery. Inert on touch / reduced motion.
 */
export default function MouseParallax({ children, strength = 10, className = '' }) {
  const reduce = useReducedMotion()
  const [fine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  )

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 46, damping: 20, mass: 1 })
  const sy = useSpring(y, { stiffness: 46, damping: 20, mass: 1 })

  useEffect(() => {
    if (!fine || reduce) return
    const move = (e) => {
      x.set((e.clientX / window.innerWidth - 0.5) * 2 * strength)
      y.set((e.clientY / window.innerHeight - 0.5) * 2 * strength * 0.7)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [fine, reduce, strength, x, y])

  if (!fine || reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={className} style={{ x: sx, y: sy }}>
      {children}
    </motion.div>
  )
}
