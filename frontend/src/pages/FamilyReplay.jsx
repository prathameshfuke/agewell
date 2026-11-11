import { heart } from '../assets/images/gen'
import { useActivity } from '../hooks/useActivity'
import { useAuth } from '../contexts/AuthContext'
import FamilyPage, { Notice, NotLinked } from '../components/family/FamilyPage'

const PERIODS = [
    { key: 'morning', label: 'Morning' },
    { key: 'afternoon', label: 'Afternoon' },
    { key: 'evening', label: 'Evening' },
]

const todayKey = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function FamilyReplay() {
    const { linkedElderId } = useAuth()
    const { activities, grouped, loading, error, stats, selectedDate, changeDate, refresh } = useActivity(linkedElderId)

    // Parse YYYY-MM-DD as a local date so the label never shifts by timezone.
    const label = (selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date()).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })

    const summary = stats.alerts > 0
        ? `${stats.alerts} alert${stats.alerts > 1 ? 's' : ''} to review`
        : activities.length === 0 ? 'No activity recorded' : 'No alerts'

    const datePicker = (
        <>
            <label className="sr-only" htmlFor="replay-date">Choose a date</label>
            <input
                id="replay-date"
                type="date"
                max={todayKey()}
                value={selectedDate || todayKey()}
                onChange={(e) => e.target.value && changeDate(e.target.value)}
                className="input !min-h-[48px] !w-auto !px-3 !text-base"
            />
        </>
    )

    return (
        <FamilyPage title="Day replay" sub={label} art={heart} action={datePicker}>
            {!linkedElderId ? (
                <NotLinked text="Link an account to see their day." />
            ) : (
                <>
                    <section>
                        <h2 className={`font-serif text-3xl ${stats.alerts > 0 ? 'text-clay-600' : ''}`}>{summary}</h2>
                        <p className="mt-1 text-ink-2">{stats.medicationsTaken} medications taken, {stats.checkIns} check-ins</p>
                    </section>

                    {loading && <p className="text-ink-2">Loading timeline...</p>}

                    {error && !loading && <Notice onRetry={refresh}>Could not load activity. {typeof error === 'string' ? error : ''}</Notice>}

                    {!loading && !error && PERIODS.map((p) => {
                        const items = grouped?.[p.key] || []
                        if (items.length === 0) return null
                        return (
                            <section key={p.key} aria-label={p.label}>
                                <h2 className="font-serif text-2xl">{p.label}</h2>
                                <ul className="mt-2 divide-y divide-line">
                                    {items.map((e, i) => {
                                        const warn = e.status === 'warning' || e.type === 'alert'
                                        return (
                                            <li key={e.id || i} className="flex items-baseline gap-4 py-3">
                                                <span className="w-20 shrink-0 text-ink-2">{e.time}</span>
                                                <div className="min-w-0 flex-1">
                                                    <div className={warn ? 'font-bold text-clay-600' : ''}>{e.title}</div>
                                                    {e.detail && <div className="break-words text-ink-2">{e.detail}</div>}
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </section>
                        )
                    })}

                    {!loading && !error && activities.length === 0 && (
                        <p className="text-ink-2">Nothing recorded on this day. Pick another date, or check back later today.</p>
                    )}
                </>
            )}
        </FamilyPage>
    )
}
