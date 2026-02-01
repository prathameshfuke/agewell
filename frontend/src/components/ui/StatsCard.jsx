import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * StatsCard - Unified stats display card
 * Mobile-First Design for Elderly Users
 * 
 * - Auto-expanding height (no fixed heights)
 * - Text wrapping enabled
 * - Larger touch targets on mobile
 * - Responsive font sizes
 */
export default function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  unit, 
  trend, 
  trendValue,
  color = 'sage',
  onClick,
  delay = 0
}) {
  const colorClasses = {
    sage: {
      bg: 'bg-sage-100',
      icon: 'text-sage-600',
    },
    cream: {
      bg: 'bg-cream-100',
      icon: 'text-cream-700',
    },
    rose: {
      bg: 'bg-rose-100',
      icon: 'text-rose-500',
    },
    amber: {
      bg: 'bg-amber-100',
      icon: 'text-amber-600',
    },
  }

  const classes = colorClasses[color] || colorClasses.sage

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
    if (trend === 'down') return <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
    return <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-sage-600'
    if (trend === 'down') return 'text-rose-600'
    return 'text-sage-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-soft border-2 border-sage-100 transition-all w-full break-words min-h-[120px] flex flex-col ${
        onClick ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${classes.bg}`}>
          {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${classes.icon}`} />}
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs sm:text-sm font-bold flex-shrink-0 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="text-sage-500 text-sm sm:text-base font-medium mb-1 break-words">{label}</div>
      <div className="flex items-baseline gap-1 flex-wrap mt-auto">
        <div className="text-2xl sm:text-3xl font-bold text-sage-900 break-all">{value}</div>
        {unit && <div className="text-xs sm:text-sm text-sage-400 break-words">{unit}</div>}
      </div>
    </motion.div>
  )
}
