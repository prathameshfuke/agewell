import { useState, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * AvatarGroup - Animated avatar group with overlapping avatars
 * Based on animate-ui.com avatar-group component
 * Mobile-optimized for elderly users
 * 
 * Features:
 * - Overlapping avatars that shift forward on hover
 * - Smooth spring animations
 * - Tooltips on hover
 * - Responsive sizing
 */

const AvatarGroupContext = createContext({
  hoveredIndex: null,
  setHoveredIndex: () => {},
  translate: '-30%',
  transition: { type: 'spring', stiffness: 300, damping: 17 },
  tooltipTransition: { type: 'spring', stiffness: 300, damping: 35 },
  side: 'top',
  sideOffset: 25,
})

export function AvatarGroup({
  children,
  invertOverlap = true,
  translate = '-30%',
  transition = { type: 'spring', stiffness: 300, damping: 17 },
  tooltipTransition = { type: 'spring', stiffness: 300, damping: 35 },
  side = 'top',
  sideOffset = 25,
  className = '',
  ...props
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  
  const childArray = Array.isArray(children) ? children : [children]
  const totalChildren = childArray.length

  return (
    <AvatarGroupContext.Provider
      value={{
        hoveredIndex,
        setHoveredIndex,
        translate,
        transition,
        tooltipTransition,
        side,
        sideOffset,
      }}
    >
      <div
        className={`relative inline-flex items-center ${className}`}
        style={{
          direction: invertOverlap ? 'rtl' : 'ltr',
        }}
        {...props}
      >
        {childArray.map((child, index) => {
          const actualIndex = invertOverlap ? totalChildren - 1 - index : index
          const isHovered = hoveredIndex === actualIndex
          const isBeforeHovered = hoveredIndex !== null && actualIndex < hoveredIndex
          const isAfterHovered = hoveredIndex !== null && actualIndex > hoveredIndex

          let translateValue = 0
          if (isHovered) {
            translateValue = 0
          } else if (isBeforeHovered) {
            // Shift back if an avatar after this is hovered
            const translateNum = parseFloat(translate)
            const translateUnit = translate.includes('%') ? '%' : 'px'
            translateValue = `${translateNum * (hoveredIndex - actualIndex)}${translateUnit}`
          } else if (isAfterHovered) {
            // Shift forward if an avatar before this is hovered
            const translateNum = parseFloat(translate)
            const translateUnit = translate.includes('%') ? '%' : 'px'
            translateValue = `${-translateNum * (actualIndex - hoveredIndex)}${translateUnit}`
          }

          return (
            <motion.div
              key={actualIndex}
              className="relative inline-flex"
              style={{
                marginLeft: index === 0 ? 0 : translate,
                zIndex: isHovered ? 50 : totalChildren - index,
                direction: 'ltr',
              }}
              animate={{
                x: translateValue,
              }}
              transition={transition}
              onMouseEnter={() => setHoveredIndex(actualIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {child}
            </motion.div>
          )
        })}
      </div>
    </AvatarGroupContext.Provider>
  )
}

/**
 * AvatarGroupTooltip - Tooltip for avatar group items
 */
export function AvatarGroupTooltip({
  children,
  layout = 'preserve-aspect',
  className = '',
  ...props
}) {
  const { hoveredIndex, tooltipTransition, side, sideOffset } = useContext(AvatarGroupContext)
  const [currentIndex, setCurrentIndex] = useState(null)

  // Get the index of the parent avatar
  const parentElement = props['data-index']
  const shouldShow = hoveredIndex === parentElement

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          layout={layout}
          initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 5 : -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 5 : -5 }}
          transition={tooltipTransition}
          className={`
            absolute z-[100] px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium
            bg-sage-900 text-white rounded-lg shadow-elevated
            pointer-events-none whitespace-nowrap
            ${side === 'top' ? `bottom-full mb-[${sideOffset}px]` : ''}
            ${side === 'bottom' ? `top-full mt-[${sideOffset}px]` : ''}
            ${side === 'left' ? `right-full mr-[${sideOffset}px]` : ''}
            ${side === 'right' ? `left-full ml-[${sideOffset}px]` : ''}
            left-1/2 -translate-x-1/2
            ${className}
          `}
          style={{
            [side === 'top' ? 'bottom' : side === 'bottom' ? 'top' : side === 'left' ? 'right' : 'left']: 
              side === 'top' || side === 'bottom' ? `calc(100% + ${sideOffset}px)` : `calc(100% + ${sideOffset}px)`,
          }}
          {...props}
        >
          {children}
          {/* Tooltip arrow */}
          <div
            className={`
              absolute w-2 h-2 bg-sage-900 transform rotate-45
              ${side === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${side === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${side === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
              ${side === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
            `}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
