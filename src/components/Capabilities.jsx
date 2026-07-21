import { motion } from 'framer-motion'
import { pageLoadedHidden } from '../lib/motion'

const CAPABILITIES = [
  {
    icon: '📄',
    title: 'Resume analysis',
    body: 'Upload your resume or documents and AURA reads them instantly.',
  },
  {
    icon: '🎯',
    title: 'Career matches',
    body: 'Get career recommendations tailored to your skills and interests.',
  },
  {
    icon: '📊',
    title: 'Skill-gap radar',
    body: 'Visual radar charts show exactly where to level up.',
  },
  {
    icon: '📥',
    title: 'PDF reports',
    body: 'Download a polished career report to keep or share.',
  },
]

export default function Capabilities() {
  return (
    <section aria-labelledby="capabilities-heading" className="mx-auto w-full max-w-6xl">
      <h2
        id="capabilities-heading"
        className="mb-6 text-center font-display text-sm font-semibold uppercase tracking-[0.25em] text-gray-500"
      >
        What AURA can do
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map(({ icon, title, body }, i) => (
          <motion.article
            key={title}
            initial={pageLoadedHidden ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: i * 0.08, ease: 'easeOut' }}
            className="glass rounded-2xl p-5 transition-colors hover:border-neon-cyan/30"
          >
            <span aria-hidden="true" className="text-2xl">
              {icon}
            </span>
            <h3 className="mt-3 font-display text-base font-semibold text-white">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-400">{body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
