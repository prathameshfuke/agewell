import { motion } from 'framer-motion'

/**
 * Card Component - Unified card styling for AgeWell+
 * Mobile-First Design for Elderly Users
 * 
 * Variants:
 * - default: Standard card with border and shadow
 * - interactive: Clickable card with hover effects
 * - elevated: Card with stronger shadow
 * 
 * Mobile-First Principles:
 * - Auto-expanding height (no fixed heights)
 * - Text wrapping enabled by default
 * - Generous padding for readability
 * - Single column layout on mobile
 */
export default function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  animate = true,
  ...props
}) {
  // Mobile-first: Start with mobile padding, scale up for desktop
  // No fixed heights - cards auto-expand with content
  const baseClasses = 'bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border-2 border-sage-100 w-full break-words'

  const variantClasses = {
    default: 'shadow-soft',
    interactive: 'shadow-soft hover:shadow-card-hover hover:border-sage-200 cursor-pointer transition-all duration-200 active:scale-[0.98]',
    elevated: 'shadow-elevated',
    flush: '', // No shadow or extra styling
  }

  const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.default} ${className}`

  if (animate && onClick) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={classes}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div onClick={onClick} className={classes} {...props}>
      {children}
    </div>
  )
}

/**
 * CardHeader - Consistent header for cards
 * Mobile-optimized with proper spacing and text wrapping
 */
export function CardHeader({ icon, label, action, className = '' }) {
  return (
    <div className={`flex items-start sm:items-center justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {icon && (
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: 'currentColor' }} />
        )}
        {typeof icon === 'string' ? null : icon}
        <span className="text-sage-600 font-bold uppercase tracking-wider text-xs sm:text-sm break-words">{label}</span>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

/**
 * CardSection - For grouping content within cards
 * Mobile-first with responsive padding
 */
export function CardSection({ children, className = '' }) {
  return (
    <div className={`bg-sage-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 break-words ${className}`}>
      {children}
    </div>
  )
}
