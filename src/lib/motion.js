/** Premium "settle" easing used across the whole app. */
export const EASE = [0.22, 1, 0.36, 1]

/**
 * True when the page loaded in a hidden/background tab. Browsers freeze
 * requestAnimationFrame there, which would leave entrance animations stuck
 * at opacity 0 — so in that case we skip them and show content immediately.
 */
export const pageLoadedHidden =
  typeof document !== 'undefined' && document.visibilityState === 'hidden'

/** Shared micro-interaction for every button in the app (snappy). */
export const buttonMotion = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.18, ease: EASE },
}

/** Staggered container for the hero reveal. */
export const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

/** Individual hero item: fade in + rise 16px. */
export const heroItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

/** Scroll-reveal for sections: fade + slide up 24px, once. */
export const scrollReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: EASE },
}
