import { textBtn } from '../family/FamilyPage'

/**
 * ActivityTimeline - recent real activity as a hairline list. Empty state says what will appear.
 */
export default function ActivityTimeline({ activities = [], maxItems = 5, onViewAll }) {
  const items = activities.slice(0, maxItems)

  return (
    <section aria-labelledby="activity-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="activity-title" className="font-serif text-2xl">Recent activity</h2>
        {onViewAll && <button type="button" onClick={onViewAll} className={textBtn}>View all</button>}
      </div>

      {items.length === 0 ? (
        <p className="mt-2 text-ink-2">Nothing yet. Medicines, check-ins and alerts show up here as they happen.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {items.map((a, i) => {
            const warn = a.status === 'missed' || a.status === 'alert' || a.status === 'warning'
            return (
              <li key={a.id || i} className="flex items-baseline gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className={`truncate ${warn ? 'text-rose-700' : ''}`}>{a.title}</div>
                  {a.detail && <div className="truncate text-sm text-ink-2">{a.detail}</div>}
                </div>
                <span className="shrink-0 text-sm text-ink-2">{a.time}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
