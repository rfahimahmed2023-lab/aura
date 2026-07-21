import { motion } from 'framer-motion'
import { FileSearch, Target, Radar, FileDown } from 'lucide-react'
import { EASE, scrollReveal, pageLoadedHidden } from '../lib/motion'

const CARDS = [
  {
    icon: FileSearch,
    title: 'Resume Analysis',
    body: 'Upload your resume and AURA reads it instantly to understand your background.',
  },
  {
    icon: Target,
    title: 'Career Matching',
    body: 'Get career recommendations tailored to your skills, interests, and goals.',
  },
  {
    icon: Radar,
    title: 'Skill-Gap Radar',
    body: 'See exactly where to level up with a clear visual of your skill gaps.',
  },
  {
    icon: FileDown,
    title: 'Downloadable PDF Report',
    body: 'Take away a polished career report to keep, revisit, or share.',
  },
]

export default function Capabilities() {
  return (
    <section
      aria-labelledby="capabilities-heading"
      className="mx-auto w-full max-w-[1120px] px-6 py-24 sm:py-28 lg:py-32"
    >
      <motion.div
        {...(pageLoadedHidden ? {} : scrollReveal)}
        className="mb-12 text-center"
      >
        <p className="eyebrow">What AURA can do</p>
        <h2
          id="capabilities-heading"
          className="mt-3 font-display font-bold text-text-primary"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.02em' }}
        >
          Everything you need to plan your next move
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map(({ icon: Icon, title, body }, i) => (
          <motion.article
            key={title}
            initial={pageLoadedHidden ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
            whileHover={{ y: -4 }}
            className="card group p-8 transition-colors duration-200 hover:border-cyan/25"
          >
            <span
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] transition-colors duration-200 group-hover:border-cyan/30"
              aria-hidden="true"
            >
              <Icon size={20} strokeWidth={2} className="text-cyan" />
            </span>
            <h3 className="mt-5 font-display text-lg font-semibold text-text-primary">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {body}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
