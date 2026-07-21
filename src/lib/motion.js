/**
 * True when the page loaded in a hidden/background tab. Browsers freeze
 * requestAnimationFrame there, which would leave entrance animations stuck
 * at opacity 0 — so in that case we skip them and show content immediately.
 */
export const pageLoadedHidden =
  typeof document !== 'undefined' && document.visibilityState === 'hidden'

/** Shared micro-interaction for every button in the app. */
export const buttonMotion = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

/** Standard section entrance: fade + slide up. */
export const sectionEntrance = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
}
