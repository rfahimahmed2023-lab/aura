import { useState } from 'react'

/**
 * Renders the user-provided brand image, trying each candidate source in
 * order. Falls back to the generated AURA orb until image files are dropped
 * into public/ (see README).
 */
export default function BrandMark({ sources, alt, className = '' }) {
  const [index, setIndex] = useState(0)

  if (index >= sources.length) {
    return <span aria-hidden="true" className={`orb-core block rounded-full ${className}`} />
  }

  return (
    <img
      src={sources[index]}
      alt={alt}
      onError={() => setIndex(index + 1)}
      className={`rounded-full object-cover ${className}`}
    />
  )
}

export const LOGO_SOURCES = ['/aura-logo.png', '/aura-logo.svg', '/aura-logo.jpg']
export const AVATAR_SOURCES = ['/aura-avatar.png', '/aura-avatar.svg', '/aura-avatar.jpg']
