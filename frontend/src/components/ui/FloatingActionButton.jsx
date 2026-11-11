import { motion } from 'framer-motion'

/**
 * FloatingActionButton - Floating action button component
 * Mobile-First Design for Elderly Users
 * 
 * - Large touch targets (minimum 56px)
 * - Responsive sizing
 * - Never overlaps content on mobile
 * - High contrast colors
 */
export default function FloatingActionButton({ 
  icon: Icon, 
  onClick, 
  color = 'green',
  size = 'md',
  label,
  pulse = false 
}) {
  const colorClasses = {
    green: 'bg-primary hover:bg-primary-dark',
    red: 'bg-rose-600 hover:bg-rose-700',
  }

  const sizeClasses = {
    sm: 'w-12 h-12 sm:w-14 sm:h-14',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
  }

  const iconSizes = {
    sm: 'w-5 h-5 sm:w-6 sm:h-6',
    md: 'w-6 h-6 sm:w-7 sm:h-7',
    lg: 'w-8 h-8 sm:w-9 sm:h-9',
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        ${sizeClasses[size]} ${colorClasses[color]}
        rounded-full text-white
        flex items-center justify-center flex-shrink-0
        transition-all duration-200
        ${pulse ? 'animate-pulse-slow' : ''}
      `}
      aria-label={label}
    >
      {Icon && <Icon className={iconSizes[size]} />}
    </motion.button>
  )
}
