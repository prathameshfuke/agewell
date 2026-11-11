import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import TrendChart from '../ui/TrendChart'

/**
 * HealthOverviewCard - heart rate, blood pressure and a 7-day trend.
 * Missing values render as "No data" rather than a made-up number.
 */
export default function HealthOverviewCard({
  elderlyName = '',
  status = '',
  heartRate = null,
  bloodPressure = { systolic: null, diastolic: null },
  lastUpdated = '',
  trendData = [],
  trend = 'stable',
  className = '',
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const hasBp = bloodPressure?.systolic != null && bloodPressure?.diastolic != null

  return (
    <section className={`rounded-2xl border border-sage-200 bg-white p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {elderlyName && <h2 className="font-serif text-lg text-sage-900 truncate">{elderlyName}</h2>}
          {(status || lastUpdated) && (
            <p className="text-sm text-sage-500">{[status, lastUpdated].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        <TrendIcon className="w-4 h-4 text-sage-400 flex-shrink-0 mt-1" aria-label={`Trend ${trend}`} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <div className="text-sm text-sage-500">Heart rate</div>
          <div className="text-2xl text-sage-900">
            {heartRate != null ? <>{heartRate} <span className="text-sm text-sage-500">bpm</span></> : <span className="text-base text-sage-400">No data</span>}
          </div>
        </div>
        <div>
          <div className="text-sm text-sage-500">Blood pressure</div>
          <div className="text-2xl text-sage-900">
            {hasBp ? <>{bloodPressure.systolic}/{bloodPressure.diastolic}</> : <span className="text-base text-sage-400">No data</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-sage-100">
        {trendData.length > 0 ? (
          <>
            <div className="text-sm text-sage-500 mb-2">Heart rate, last 7 days</div>
            <TrendChart data={trendData} color="#2F5BEA" height={50} showTooltip={false} />
          </>
        ) : (
          <p className="text-sm text-sage-500 text-center">The 7-day trend appears once readings come in.</p>
        )}
      </div>
    </section>
  )
}
