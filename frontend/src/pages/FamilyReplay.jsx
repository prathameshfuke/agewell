import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Pill, Heart, AlertCircle, CheckCircle } from 'lucide-react'
import { useActivity } from '../hooks/useActivity'
import { useAuth } from '../contexts/AuthContext'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const PERIODS = [
    { key: 'morning', label: 'Morning' },
    { key: 'afternoon', label: 'Afternoon' },
    { key: 'evening', label: 'Evening' },
]

const todayKey = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const EVENT_ICON = { medication: Pill, check_in: Heart, alert: AlertCircle }

export default function FamilyReplay() {
    const navigate = useNavigate()
    const { linkedElderId } = useAuth()
    const { activities, grouped, loading, error, stats, selectedDate, changeDate, refresh } = useActivity(linkedElderId)

    // Parse YYYY-MM-DD as a local date so the label never shifts by timezone.
    const label = (selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date()).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })

    const summary = stats.alerts > 0
        ? `${stats.alerts} alert${stats.alerts > 1 ? 's' : ''} to review`
        : activities.length === 0 ? 'No activity recorded' : 'No alerts'

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-24 md:pb-8">
            <header className="px-4 md:px-6 py-4 flex items-center gap-3 border-b border-sage-200 sticky top-0 bg-cream-50 z-20">
                <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className={`w-11 h-11 rounded-full flex items-center justify-center text-sage-700 hover:bg-sage-100 ${focusRing}`}>
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-serif text-2xl text-sage-900">Day replay</h1>
                    <p className="text-sm text-sage-500 truncate">{label}</p>
                </div>
                <label className="sr-only" htmlFor="replay-date">Choose a date</label>
                <input
                    id="replay-date"
                    type="date"
                    max={todayKey()}
                    value={selectedDate || todayKey()}
                    onChange={(e) => e.target.value && changeDate(e.target.value)}
                    className={`min-h-[44px] rounded-full border border-sage-300 bg-white px-3 text-sm text-sage-800 ${focusRing}`}
                />
            </header>

            <main className="px-4 md:px-6 py-5 space-y-5 max-w-2xl mx-auto">
                {!linkedElderId ? (
                    <section className="rounded-2xl border border-sage-200 bg-white p-6">
                        <h2 className="font-serif text-xl text-sage-900">You are not linked to anyone yet</h2>
                        <p className="text-sage-600 mt-1">Link an account to see their day.</p>
                        <button type="button" onClick={() => navigate('/link')} className="btn-primary mt-4 !min-h-[44px] !text-base">Enter a pairing code</button>
                    </section>
                ) : (
                    <>
                        <section className="rounded-2xl border border-sage-200 bg-white p-5">
                            <div className={`font-serif text-xl ${stats.alerts > 0 ? 'text-amber-800' : 'text-sage-900'}`}>{summary}</div>
                            <div className="text-sage-500 text-sm mt-1">
                                {stats.medicationsTaken} medications taken, {stats.checkIns} check-ins
                            </div>
                        </section>

                        {loading && <p className="text-sage-500 text-center py-8">Loading timeline...</p>}

                        {error && !loading && (
                            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                <p className="text-rose-800">Could not load activity. {typeof error === 'string' ? error : ''}</p>
                                <button type="button" onClick={refresh} className={`mt-3 min-h-[44px] px-4 rounded-full border border-rose-300 text-sm font-semibold text-rose-800 hover:bg-rose-100 ${focusRing}`}>Try again</button>
                            </div>
                        )}

                        {!loading && !error && PERIODS.map((p) => {
                            const items = grouped?.[p.key] || []
                            if (items.length === 0) return null
                            return (
                                <section key={p.key} aria-label={p.label}>
                                    <h2 className="font-serif text-lg text-sage-900 mb-2">{p.label}</h2>
                                    <ul className="rounded-2xl border border-sage-200 bg-white divide-y divide-sage-100">
                                        {items.map((e, i) => {
                                            const Icon = EVENT_ICON[e.type] || CheckCircle
                                            const warn = e.status === 'warning' || e.type === 'alert'
                                            return (
                                                <li key={e.id || i} className="flex items-start gap-3 p-4">
                                                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${warn ? 'text-amber-700' : 'text-sage-500'}`} aria-hidden="true" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sage-900">{e.title}</div>
                                                        {e.detail && <div className="text-sm text-sage-500 break-words">{e.detail}</div>}
                                                    </div>
                                                    <span className="text-sm text-sage-500 flex-shrink-0">{e.time}</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </section>
                            )
                        })}

                        {!loading && !error && activities.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-sage-800 font-semibold">Nothing recorded on this day</p>
                                <p className="text-sm text-sage-500 mt-1">Pick another date, or check back later today.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
