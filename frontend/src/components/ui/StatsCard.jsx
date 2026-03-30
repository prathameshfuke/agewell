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
      className={`bg-white p-4 sm:p-5 rounded-2xl shadow-soft border border-sage-200 transition-all w-full break-words flex flex-col ${
        onClick ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${classes.bg}`}>
          {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${classes.icon}`} />}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs sm:text-sm font-semibold flex-shrink-0 ${getTrendColor()}`}>
            {getTrendIcon()}
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>

      <div className="text-sage-600 text-sm font-semibold mb-1 break-words">{label}</div>
      <div className="flex items-end gap-1.5 flex-wrap mt-1">
        <div className="text-3xl sm:text-4xl font-bold text-sage-900 leading-none break-all">{value ?? '--'}</div>
        {unit && <div className="text-sm text-sage-500 break-words">{unit}</div>}
      </div>

      {trendValue && <div className="text-xs text-sage-500 mt-2">Compared with previous period</div>}
    </motion.div>
  )
}
