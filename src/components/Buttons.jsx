import { motion } from 'framer-motion'
import { buttonMotion } from '../lib/motion'

export function PrimaryButton({ children, onClick, className = '', ...rest }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...buttonMotion}
      className={`btn-primary focusable inline-flex items-center justify-center gap-2 px-7 py-3.5 ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

export function SecondaryButton({ children, onClick, icon: Icon, className = '', ...rest }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...buttonMotion}
      className={`btn-secondary focusable inline-flex items-center justify-center gap-2 px-5 py-3 ${className}`}
      {...rest}
    >
      {Icon && <Icon size={16} strokeWidth={2} className="shrink-0 text-cyan" aria-hidden="true" />}
      <span>{children}</span>
    </motion.button>
  )
}
