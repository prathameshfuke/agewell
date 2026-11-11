import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import TrendChart from '../ui/TrendChart'

/**
 * WeeklyHealthSummary - 7-day heart rate trend from real readings.
 * Empty states are honest: no data means no chart and no averages.
 */
export default function WeeklyHealthSummary({
  healthData = [],
  averageHeartRate = null,
  averageSteps = null,
  trend = 'stable',
  className = '',
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendText = trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Steady'
  const hasData = healthData.length > 0

  return (
    <section className={`rounded-2xl border border-sage-200 bg-white p-5 ${className}`} aria-labelledby="weekly-title">
      <h2 id="weekly-title" className="font-serif text-lg text-sage-900">This week</h2>

      {hasData ? (
        <>
          <div className="mt-3">
            <TrendChart data={healthData} color="#2F5BEA" height={80} showTooltip={true} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-sage-100">
            <div>
              <div className="text-sm text-sage-500">Avg heart rate</div>
              <div className="text-lg text-sage-900">{averageHeartRate != null ? `${averageHeartRate} bpm` : 'No data'}</div>
            </div>
            <div>
              <div className="text-sm text-sage-500">Avg steps</div>
              <div className="text-lg text-sage-900">{averageSteps != null ? averageSteps : 'No data'}</div>
            </div>
            <div>
              <div className="text-sm text-sage-500">Trend</div>
              <div className="text-lg text-sage-900 flex items-center gap-1"><TrendIcon className="w-4 h-4 text-sage-500" aria-hidden="true" />{trendText}</div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-sage-500 mt-2">No readings this week yet. Connect a device to see trends.</p>
      )}
    </section>
  )
}
