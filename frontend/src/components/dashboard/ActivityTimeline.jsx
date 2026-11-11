import { Pill, Heart, MessageCircle, AlertTriangle, Check, Clock } from 'lucide-react'

const ICONS = { medication: Pill, check_in: Heart, message: MessageCircle, alert: AlertTriangle, completed: Check }

/**
 * ActivityTimeline - recent real activity. Shows an empty state when there is none.
 */
export default function ActivityTimeline({ activities = [], maxItems = 5, onViewAll, className = '' }) {
  const items = activities.slice(0, maxItems)

  return (
    <section className={`rounded-2xl border border-sage-200 bg-white p-5 ${className}`} aria-labelledby="activity-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="activity-title" className="font-serif text-lg text-sage-900">Recent activity</h2>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="min-h-[44px] px-3 text-sm font-semibold text-primary hover:text-primary-dark rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            View all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sage-800 font-semibold">No activity yet</p>
          <p className="text-sm text-sage-500 mt-1">Medications, check-ins and alerts will show up here as they happen.</p>
        </div>
      ) : (
        <ul className="divide-y divide-sage-100">
          {items.map((a, i) => {
            const Icon = ICONS[a.type] || Clock
            const warn = a.status === 'missed' || a.status === 'alert' || a.status === 'warning'
            return (
              <li key={a.id || i} className="flex items-center gap-3 py-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${warn ? 'text-rose-600' : 'text-sage-500'}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="text-sage-900 truncate">{a.title}</div>
                  {a.detail && <div className="text-sm text-sage-500 truncate">{a.detail}</div>}
                </div>
                <span className="text-sm text-sage-500 flex-shrink-0">{a.time}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
