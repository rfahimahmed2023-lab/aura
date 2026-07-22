import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import ParallaxLayer from './ParallaxLayer'

/**
 * Ambient aurora layer — Canvas 2D, add-only enhancement.
 *
 * Flowing ribbons of cyan/violet light drift behind the content. Motion is
 * driven by layered sines at irrational frequency ratios, so it never
 * visibly loops. Rendering uses two pre-baked radial-gradient sprites drawn
 * with additive blending — no per-frame gradient allocation, no ctx.filter —
 * to keep every frame comfortably inside a 60fps budget.
 *
 * Self-regulating: caps device-pixel-ratio at 1.5, drops to 2 ribbons under
 * 768px, pauses entirely when the tab is hidden, and renders a single dim
 * static frame when prefers-reduced-motion is set.
 */

const DPR_CAP = 1.5

/* Organic drift: three sines with irrational frequency ratios. */
function drift(t, a, b, c) {
  return (
    Math.sin(t * a) * 0.55 +
    Math.sin(t * b + 1.7) * 0.3 +
    Math.sin(t * c + 4.2) * 0.15
  )
}

function makeSprite(rgb) {
  const s = document.createElement('canvas')
  s.width = s.height = 256
  const g = s.getContext('2d')
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, `rgba(${rgb}, 0.55)`)
  grad.addColorStop(0.45, `rgba(${rgb}, 0.16)`)
  grad.addColorStop(1, `rgba(${rgb}, 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return s
}

/* Ribbon definitions: vertical anchor, amplitude, tempo, sprite, size. */
const RIBBONS = [
  { y: 0.24, amp: 0.1, speed: 0.021, phase: 0.0, color: 'cyan', size: 0.16, alpha: 0.05 },
  { y: 0.38, amp: 0.13, speed: 0.016, phase: 2.1, color: 'violet', size: 0.2, alpha: 0.045 },
  { y: 0.56, amp: 0.11, speed: 0.026, phase: 4.4, color: 'violet', size: 0.15, alpha: 0.04 },
  { y: 0.7, amp: 0.09, speed: 0.013, phase: 6.2, color: 'cyan', size: 0.18, alpha: 0.035 },
]

export default function AuroraCanvas() {
  const canvasRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const sprites = {
      cyan: makeSprite('0, 229, 255'),
      violet: makeSprite('122, 92, 255'),
    }

    let raf = 0
    let running = false
    let w = 0
    let h = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (tMs) => {
      const t = tMs / 1000
      const mobile = w < 768
      const ribbons = mobile ? RIBBONS.slice(0, 2) : RIBBONS
      const beads = mobile ? 30 : 46

      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      for (const r of ribbons) {
        const sprite = sprites[r.color]
        const tt = t * r.speed * 60 + r.phase
        // Whole ribbon slowly wanders vertically too
        const baseY = (r.y + drift(tt * 0.23, 0.11, 0.047, 0.083) * 0.045) * h
        const radius = r.size * Math.min(h, 900)

        for (let i = 0; i <= beads; i++) {
          const fx = i / beads
          const x = fx * (w + radius * 2) - radius
          const y =
            baseY +
            drift(tt + fx * 4.7, 0.9, 0.41, 1.73) * r.amp * h * 0.5 +
            Math.sin(fx * Math.PI * 2 + tt * 0.6) * r.amp * h * 0.18
          // Fade bead intensity toward ribbon ends, vary size along the path
          const edge = Math.sin(fx * Math.PI)
          const rr = radius * (0.65 + 0.35 * Math.sin(fx * 9.3 + tt))
          ctx.globalAlpha = r.alpha * edge
          ctx.drawImage(sprite, x - rr, y - rr, rr * 2, rr * 2)
        }
      }
      ctx.globalAlpha = 1
    }

    const loop = (tMs) => {
      draw(tMs)
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else if (!reduce) start()
    }

    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)

    if (reduce) {
      draw(0) // one dim static frame — atmosphere without motion
    } else {
      // Start unconditionally: rAF doesn't tick in hidden tabs (zero cost)
      // and resumes on its own when the tab becomes visible, so a page that
      // loads in a background tab still gets its aurora.
      start()
    }

    return () => {
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduce])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{
        // Fade the aurora toward the edges/bottom so text zones stay calm
        maskImage:
          'radial-gradient(ellipse 85% 72% at 50% 38%, black 30%, transparent 78%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 85% 72% at 50% 38%, black 30%, transparent 78%)',
      }}
    >
      {/* Deepest parallax layer; scale oversizes the canvas slightly so its
          edges can never be exposed by the clamped drift */}
      <ParallaxLayer
        mouse={0.015}
        scroll={-30}
        maxMouse={28}
        scale={1.06}
        className="absolute inset-0"
      >
        <canvas ref={canvasRef} className="h-full w-full" />
      </ParallaxLayer>
    </div>
  )
}
