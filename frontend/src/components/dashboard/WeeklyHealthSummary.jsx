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
  averageHeartRate = 72,
  averageSteps = 4500,
  trend = 'stable',
  className = ''
}) {
  // Generate mock weekly data if none provided
  const weeklyData = healthData.length > 0 ? healthData : [
    { value: 68, label: 'Mon' },
    { value: 72, label: 'Tue' },
    { value: 70, label: 'Wed' },
    { value: 74, label: 'Thu' },
    { value: 71, label: 'Fri' },
    { value: 69, label: 'Sat' },
    { value: 72, label: 'Sun' },
  ]

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

  return (
    <Card className={className}>
      <CardHeader 
        icon={<Activity className="w-5 h-5 text-sage-500" />} 
        label="Weekly Summary" 
      />
      
      {/* Chart */}
      <div className="mb-4">
        <TrendChart 
          data={weeklyData} 
          color="#7C9A8E" 
          height={80} 
          showTooltip={true}
        />
      </div>

      {/* Stats Row - Mobile-first: stack on tiny screens, 3 cols from xs up */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 xs:gap-3">
        <div className="bg-sage-50 rounded-xl p-3 text-center">
          <div className="text-sage-500 text-xs font-bold uppercase tracking-wide mb-1 break-words">Avg HR</div>
          <div className="text-xl sm:text-2xl font-bold text-sage-800">
            <AnimatedCounter value={averageHeartRate} />
          </div>
          <div className="text-sage-400 text-xs break-words">bpm</div>
        </div>

        <div className="bg-sage-50 rounded-xl p-3 text-center">
          <div className="text-sage-500 text-xs font-bold uppercase tracking-wide mb-1 break-words">Avg Steps</div>
          <div className="text-xl sm:text-2xl font-bold text-sage-800">
            <AnimatedCounter value={averageSteps} />
          </div>
          <div className="text-sage-400 text-xs break-words">daily</div>
        </div>

        <div className="bg-sage-50 rounded-xl p-3 text-center">
          <div className="text-sage-500 text-xs font-bold uppercase tracking-wide mb-1 break-words">Trend</div>
          <div className="flex items-center justify-center gap-1">
            {getTrendIcon()}
            <span className="text-sm font-bold text-sage-700 break-words">{getTrendText()}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
