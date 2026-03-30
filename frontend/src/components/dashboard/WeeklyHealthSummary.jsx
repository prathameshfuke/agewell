import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import Card, { CardHeader } from '../ui/Card'
import TrendChart from '../ui/TrendChart'
import AnimatedCounter from '../ui/AnimatedCounter'

/**
 * WeeklyHealthSummary - Displays 7-day health trends
 * 
 * Shows heart rate and activity trends with animated stats
 */
export default function WeeklyHealthSummary({
  healthData = [],
  averageHeartRate = null,
  averageSteps = null,
  trend = 'stable',
  className = ''
}) {
  // Use real data or show empty state
  const weeklyData = healthData.length > 0 ? healthData : []
  const hasData = weeklyData.length > 0 || averageHeartRate || averageSteps

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-sage-600" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-rose-500" />
    return <Minus className="w-4 h-4 text-sage-400" />
  }

  const getTrendText = () => {
    if (trend === 'up') return 'Improving'
    if (trend === 'down') return 'Declining'
    return 'Stable'
  }

  const summaryTiles = [
    {
      key: 'avg-hr',
      title: 'Avg HR',
      value: averageHeartRate,
      suffix: 'bpm',
    },
    {
      key: 'avg-steps',
      title: 'Avg Steps',
      value: averageSteps,
      suffix: 'daily',
    },
    {
      key: 'trend',
      title: 'Trend',
      custom: true,
    },
  ]

  return (
    <Card className={className}>
      <CardHeader
        icon={<Activity className="w-5 h-5 text-sage-500" />}
        label="Weekly Summary"
      />

      {/* Chart */}
      <div className="mb-4">
        {weeklyData.length > 0 ? (
          <TrendChart
            data={weeklyData}
            color="#7C9A8E"
            height={80}
            showTooltip={true}
          />
        ) : (
          <div className="h-20 flex items-center justify-center text-sage-400 text-sm">No health data yet</div>
        )}
      </div>

      {/* Stats Row - Mobile-first: stack on tiny screens, 3 cols from xs up */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 xs:gap-3">
        {summaryTiles.map((tile, index) => (
          <motion.div
            key={tile.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + index * 0.06 }}
            className="bg-sage-50 rounded-2xl p-3 text-center border border-sage-100"
          >
            <div className="text-sage-500 text-[11px] font-semibold uppercase tracking-wide mb-1 break-words">
              {tile.title}
            </div>

            {tile.custom ? (
              <div className="flex items-center justify-center gap-1">
                {getTrendIcon()}
                <span className="text-sm font-bold text-sage-700 break-words">{getTrendText()}</span>
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-sage-800 leading-none">
                  {tile.value ? <AnimatedCounter value={tile.value} /> : <span className="text-sage-400">--</span>}
                </div>
                <div className="text-sage-500 text-xs break-words mt-1">{tile.suffix}</div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
