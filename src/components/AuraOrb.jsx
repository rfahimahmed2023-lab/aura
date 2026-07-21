import { motion } from 'framer-motion'

export default function AuraOrb({ size = 180 }) {
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <motion.div
        className="orb-ring absolute -inset-4 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="orb-ring absolute -inset-9 rounded-full opacity-50"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="orb-core h-full w-full rounded-full"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}
