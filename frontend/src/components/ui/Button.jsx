import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

/**
 * Button Component - Unified button styling for AgeWell+
 * Mobile-First Design for Elderly Users
 * 
 * Variants:
 * - primary: Forest green filled pill (main actions)
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
  const baseClasses = 'font-bold !transition-colors duration-200 inline-flex items-center justify-center gap-2.5 rounded-full text-center leading-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-primary text-white border-2 border-transparent hover:bg-primary-dark',
    secondary: 'bg-transparent text-primary border-2 border-primary/40 hover:border-primary hover:bg-primary-bg',
    ghost: 'bg-transparent text-sage-700 border-2 border-transparent hover:bg-sage-100',
    danger: 'bg-rose-600 text-white border-2 border-transparent hover:bg-rose-700',
    cream: 'bg-sage-900 text-white border-2 border-transparent hover:bg-sage-700',
    'soft-sage': 'bg-primary-bg text-primary hover:bg-primary-200 border border-transparent',
    'soft-amber': 'bg-saffron-light text-saffron-dark hover:bg-amber-100 border border-transparent',
  }

  const sizeClasses = {
    sm: 'px-5 text-base min-h-[44px]',
    default: 'px-7 text-lg min-h-[56px]',
    lg: 'px-8 text-xl min-h-[64px]',
    icon: 'w-12 h-12 min-h-0 p-0',
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
      {loading && <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none shrink-0" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />}
      {!loading && <span>{children}</span>}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />}
    </>
  )

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
  const baseClasses = 'rounded-full flex items-center justify-center !transition-colors duration-200 relative shrink-0 min-h-0'
  
  const variantClasses = {
    primary: 'bg-primary-bg text-primary hover:bg-primary-200',
    secondary: 'bg-transparent border border-line text-sage-600 hover:border-sage-300',
    ghost: 'bg-transparent text-sage-600 hover:bg-sage-50',
  }

  const sizeClasses = {
    sm: 'w-11 h-11',
    default: 'w-12 h-12',
    lg: 'w-14 h-14',
  }

  const iconSizes = {
    sm: 'w-5 h-5',
    default: 'w-6 h-6',
    lg: 'w-7 h-7',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {badge !== undefined && badge > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{badge > 9 ? '9+' : badge}</span>
        </div>
      )}
    </motion.button>
  )
}
