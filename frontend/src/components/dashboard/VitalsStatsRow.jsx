import { motion } from 'framer-motion'
import { Heart, Activity, Footprints, Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import AnimatedCounter from '../ui/AnimatedCounter'

/**
 * VitalsStatsRow - Horizontal row of vital stat cards
 * 
 * Displays Heart Rate, Blood Pressure, Steps, and Sleep
 */
export default function VitalsStatsRow({
  heartRate = null,
  bloodPressure = { systolic: null, diastolic: null },
  steps = null,
  sleep = null,
  trends = { heartRate: 'stable', steps: 'stable', sleep: 'stable' },
  className = ''
}) {
  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-sage-600" />
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-rose-500" />
    return <Minus className="w-3 h-3 text-sage-400" />
  }

  const stats = [
    {
      icon: Heart,
      label: 'Heart Rate',
      value: heartRate,
      unit: 'bpm',
      trend: trends.heartRate,
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-500',
      borderColor: 'border-rose-100',
    },
    {
      icon: Activity,
      label: 'Blood Pressure',
      value: bloodPressure.systolic && bloodPressure.diastolic ? `${bloodPressure.systolic}/${bloodPressure.diastolic}` : '--',
      unit: 'mmHg',
      trend: 'stable',
      bgColor: 'bg-sage-50',
      iconColor: 'text-sage-600',
      borderColor: 'border-sage-100',
      isString: true,
    },
    {
      icon: Footprints,
      label: 'Steps',
      value: steps,
      unit: 'today',
      trend: trends.steps,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-100',
    },
    {
      icon: Moon,
      label: 'Sleep',
      value: sleep,
      unit: 'hours',
      trend: trends.sleep,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
      borderColor: 'border-indigo-100',
      suffix: 'h',
    },
  ]

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className={`
            bg-white border border-sage-200
            p-4 sm:p-5 rounded-2xl shadow-soft
          `}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
            </div>
            {getTrendIcon(stat.trend)}
          </div>

          <div className="text-sage-600 text-xs font-semibold uppercase tracking-wide mb-1">
            {stat.label}
          </div>

          <div className="flex items-baseline gap-1.5">
            {stat.isString ? (
              <span className="text-2xl sm:text-3xl font-bold text-sage-900 leading-none">{stat.value}</span>
            ) : stat.value != null ? (
              <span className="text-2xl sm:text-3xl font-bold text-sage-900 leading-none">
                <AnimatedCounter value={stat.value} suffix={stat.suffix || ''} />
              </span>
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-sage-400 leading-none">--</span>
            )}
            <span className="text-sage-500 text-xs">{stat.unit}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
