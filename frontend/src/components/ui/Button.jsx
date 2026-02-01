import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

/**
 * Button Component - Unified button styling for AgeWell+
 * Mobile-First Design for Elderly Users
 * 
 * Variants:
 * - primary: Sage green filled button (main actions)
 * - secondary: Outlined button (secondary actions)
 * - ghost: Transparent background (tertiary actions)
 * - danger: Soft red for destructive actions
 * - cream: Cream colored for caregiver flows
 * 
 * Mobile-First Principles:
 * - Minimum 48px touch targets
 * - Responsive font sizes
 * - Text wrapping enabled
 * - Touch-friendly spacing
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses = 'font-bold transition-all duration-200 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed break-words'
  
  const variantClasses = {
    primary: 'bg-sage-600 text-white hover:bg-sage-700 shadow-soft',
    secondary: 'bg-white text-sage-700 border-2 border-sage-200 hover:border-sage-300 hover:bg-sage-50',
    ghost: 'bg-transparent text-sage-600 hover:bg-sage-50',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    cream: 'bg-cream-600 text-white hover:bg-cream-700',
    'soft-sage': 'bg-sage-100 text-sage-700 hover:bg-sage-200 border-2 border-sage-200',
    'soft-amber': 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-2 border-amber-200',
  }

  const sizeClasses = {
    sm: 'px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-[44px]',
    default: 'px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg min-h-touch',
    lg: 'px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl min-h-touch-lg',
    icon: 'w-12 h-12 sm:w-14 sm:h-14 p-0',
  }

  const classes = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.default}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim()

  const content = (
    <>
      {loading && <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin flex-shrink-0" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
      {!loading && <span className="break-words text-center">{children}</span>}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
    </>
  )

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      {...props}
    >
      {content}
    </motion.button>
  )
}

/**
 * IconButton - Circular icon button
 * Mobile-optimized with larger touch targets
 */
export function IconButton({
  icon: Icon,
  variant = 'primary',
  size = 'default',
  badge,
  className = '',
  onClick,
  ...props
}) {
  const baseClasses = 'rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 relative flex-shrink-0'
  
  const variantClasses = {
    primary: 'bg-sage-100 text-sage-600 hover:bg-sage-200',
    secondary: 'bg-white border-2 border-sage-200 text-sage-600 hover:border-sage-300',
    ghost: 'bg-transparent text-sage-600 hover:bg-sage-50',
  }

  const sizeClasses = {
    sm: 'w-10 h-10 sm:w-11 sm:h-11 min-w-[40px]',
    default: 'w-12 h-12 sm:w-14 sm:h-14 min-w-touch',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 min-w-touch-lg',
  }

  const iconSizes = {
    sm: 'w-5 h-5',
    default: 'w-6 h-6 sm:w-7 sm:h-7',
    lg: 'w-7 h-7 sm:w-8 sm:h-8',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {badge !== undefined && badge > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{badge > 9 ? '9+' : badge}</span>
        </div>
      )}
    </motion.button>
  )
}
