import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import TrendChart from '../ui/TrendChart'

/**
 * WeeklyHealthSummary - 7-day heart rate trend from real readings.
 * Empty states are honest: no data means no chart and no averages.
 */
export default function WeeklyHealthSummary({ healthData = [], averageHeartRate = null, averageSteps = null, trend = 'stable' }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendText = trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Steady'

  return (
    <section aria-labelledby="weekly-title">
      <h2 id="weekly-title" className="font-serif text-2xl">This week</h2>

      {healthData.length > 0 ? (
        <>
          <div className="mt-3">
            <TrendChart data={healthData} color="#1F5F4A" height={96} showTooltip={true} />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <dt className="text-sm text-ink-2">Avg heart rate</dt>
              <dd className="text-lg">{averageHeartRate != null ? `${averageHeartRate} bpm` : 'No data'}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-2">Avg steps</dt>
              <dd className="text-lg">{averageSteps != null ? averageSteps : 'No data'}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-2">Trend</dt>
              <dd className="flex items-center gap-1 text-lg"><TrendIcon className="h-4 w-4 text-ink-2" aria-hidden="true" />{trendText}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-2 text-ink-2">No readings this week yet. Connect a device to see trends.</p>
      )}
    </section>
  )
}
