import { motionValue } from 'framer-motion'

/**
 * Shared normalized mouse position (-1..1 from viewport center) as Framer
 * motion values. ONE passive pointermove listener feeds every parallax layer
 * — motion values update outside React, so there are zero re-renders. The
 * listener attaches on first acquire and detaches when the last layer
 * releases (coarse-pointer devices never acquire, so they never listen).
 */
const mx = motionValue(0)
const my = motionValue(0)

let subscribers = 0
let attached = false

const onMove = (e) => {
  mx.set((e.clientX / window.innerWidth) * 2 - 1)
  my.set((e.clientY / window.innerHeight) * 2 - 1)
}

export function acquireMouse() {
  subscribers += 1
  if (!attached) {
    window.addEventListener('pointermove', onMove, { passive: true })
    attached = true
  }
  return {
    mx,
    my,
    release() {
      subscribers -= 1
      if (subscribers <= 0 && attached) {
        window.removeEventListener('pointermove', onMove)
        attached = false
      }
    },
  }
}
