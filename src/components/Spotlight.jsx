import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

/**
 * Cursor spotlight — a soft cyan/violet light field that trails the pointer,
 * lighting the atmosphere (grid, aurora) around the cursor. Screen-blended,
 * transform-only, rendered below content so text is never washed out.
 *
 * Desktop-only: renders nothing on coarse pointers or reduced motion.
 */
export default function Spotlight() {
  const reduce = useReducedMotion()
  const [fine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  )

  const x = useMotionValue(-2000)
  const y = useMotionValue(-2000)
  const sx = useSpring(x, { stiffness: 120, damping: 26, mass: 0.7 })
  const sy = useSpring(y, { stiffness: 120, damping: 26, mass: 0.7 })
  const opacity = useMotionValue(0)
  const sOpacity = useSpring(opacity, { stiffness: 90, damping: 22 })

  useEffect(() => {
    if (!fine || reduce) return
    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      opacity.set(1)
    }
    const leave = () => opacity.set(0)
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [fine, reduce, x, y, opacity])

  if (!fine || reduce) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ mixBlendMode: 'screen' }}
    >
      <motion.div
        className="absolute left-0 top-0 h-[560px] w-[560px] rounded-full"
        style={{
          x: sx,
          y: sy,
          opacity: sOpacity,
          marginLeft: -280,
          marginTop: -280,
          background:
            'radial-gradient(circle, rgba(0, 229, 255, 0.09), rgba(122, 92, 255, 0.055) 45%, transparent 70%)',
        }}
      />
    </div>
  )
}
