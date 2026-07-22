import { useState } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

/**
 * Magnetic wrapper — children are gently pulled toward the cursor while it
 * hovers them, then spring back. Pure transform, one spring pair per
 * instance. Passthrough (no listeners, no motion) on coarse pointers or
 * reduced motion, so touch devices pay zero cost.
 *
 * Usage: <Magnetic><PrimaryButton …/></Magnetic> — the child is untouched.
 */
export default function Magnetic({ children, className = '', strength = 0.32 }) {
  const reduce = useReducedMotion()
  const [fine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  )

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 260, damping: 19, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 260, damping: 19, mass: 0.5 })

  if (!fine || reduce) {
    return <div className={className}>{children}</div>
  }

  const onPointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const onPointerLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      className={className}
      style={{ x: sx, y: sy }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </motion.div>
  )
}
