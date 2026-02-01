import { forwardRef } from 'react'

/**
 * Avatar - Base avatar component for displaying user images or initials
 * Mobile-First Design for AgeWell+
 */
export const Avatar = forwardRef(({ 
  children, 
  className = '',
  size = 'default',
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    default: 'w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 text-lg sm:text-xl',
    xl: 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl',
  }

  return (
    <div
      ref={ref}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-sage-100 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})

Avatar.displayName = 'Avatar'

/**
 * AvatarImage - Image component for Avatar
 */
export const AvatarImage = forwardRef(({ 
  src, 
  alt = 'Avatar',
  className = '',
  ...props 
}, ref) => {
  if (!src) return null

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
      {...props}
    />
  )
})

AvatarImage.displayName = 'AvatarImage'

/**
 * AvatarFallback - Fallback component for Avatar (shows initials)
 */
export const AvatarFallback = forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={`flex items-center justify-center w-full h-full bg-gradient-sage text-white font-bold ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})

AvatarFallback.displayName = 'AvatarFallback'
