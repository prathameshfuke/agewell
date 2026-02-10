import { motion } from 'framer-motion'
import { Heart, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import TrendChart from '../ui/TrendChart'
import AnimatedCounter from '../ui/AnimatedCounter'

/**
 * HealthOverviewCard - Gradient card showing health vitals summary
 * 
 * Displays heart rate, blood pressure, and mini trend chart
 */
export default function HealthOverviewCard({
  elderlyName = 'Your Loved One',
  status = 'Active',
  heartRate = null,
  bloodPressure = { systolic: null, diastolic: null },
  lastUpdated = 'Just now',
  trendData = [],
  trend = 'stable',
  className = ''
}) {
  // Use real trend data or show empty
  const chartData = trendData.length > 0 ? trendData : []

  const getStatusColor = () => {
    if (status === 'Active') return 'bg-white/30'
    if (status === 'Resting') return 'bg-sage-200/30'
    return 'bg-amber-200/30'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />
    return <Minus className="w-3 h-3" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-3xl p-6 
        bg-gradient-to-br from-sage-500 to-sage-600 
        text-white shadow-xl shadow-sage-200
        ${className}
      `}
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-sage-400/20 rounded-full blur-2xl -ml-12 -mb-12" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white/50" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl">{elderlyName}</h3>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor()}`}>
                  {status}
                </div>
                <span className="text-white/70 text-xs">{lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vitals Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-white/70" />
              <span className="text-white/70 text-xs font-bold uppercase">Heart Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                {heartRate ? <AnimatedCounter value={heartRate} /> : <span>--</span>}
              </span>
              <div className="ml-auto flex items-center gap-1 text-white/70">
                {getTrendIcon()}
              </div>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-white/70" />
              <span className="text-white/70 text-xs font-bold uppercase">Blood Pressure</span>
            </div>
            <div className="flex items-baseline gap-0.5 sm:gap-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold">{bloodPressure.systolic ?? '--'}</span>
              <span className="text-white/70 text-base sm:text-lg">/</span>
              <span className="text-xl sm:text-2xl font-bold">{bloodPressure.diastolic ?? '--'}</span>
            </div>
          </div>
        </div>

        {/* Mini Trend Chart */}
        {chartData.length > 0 ? (
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-white/70 text-xs font-bold uppercase mb-2">7-Day Trend</div>
            <TrendChart
              data={chartData}
              color="rgba(255,255,255,0.8)"
              height={50}
              showTooltip={false}
            />
          </div>
        ) : (
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-white/50 text-xs text-center">Trend data will appear here</div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
