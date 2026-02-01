import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Tooltip - Simple tooltip component using Framer Motion
 * Mobile-optimized for touch devices
 */
export function TooltipProvider({ children, delayDuration = 0 }) {
  return <div className="inline-flex">{children}</div>
}

export function Tooltip({ children, open: controlledOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const handleOpenChange = (newOpen) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <TooltipContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </TooltipContext.Provider>
  )
}

const TooltipContext = ({ open: false, onOpenChange: () => {} })

export function TooltipTrigger({ children, asChild, ...props }) {
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)

  const handleMouseEnter = () => {
    setOpen(true)
  }

  const handleMouseLeave = () => {
    setOpen(false)
  }

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-flex"
      {...props}
    >
      {children}
    </div>
  )
}

export function TooltipContent({ 
  children, 
  side = 'top',
  sideOffset = 8,
  align = 'center',
  className = '',
  ...props 
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 5 : -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        className={`
          absolute z-50 px-3 py-1.5 text-xs sm:text-sm font-medium
          bg-sage-900 text-white rounded-lg shadow-elevated
          pointer-events-none whitespace-nowrap
          ${side === 'top' ? 'bottom-full mb-2' : ''}
          ${side === 'bottom' ? 'top-full mt-2' : ''}
          ${side === 'left' ? 'right-full mr-2' : ''}
          ${side === 'right' ? 'left-full ml-2' : ''}
          ${align === 'center' ? 'left-1/2 -translate-x-1/2' : ''}
          ${align === 'start' ? 'left-0' : ''}
          ${align === 'end' ? 'right-0' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
