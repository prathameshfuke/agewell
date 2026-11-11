import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { familyPhoto, chatSticker } from '../assets/images'
import { api } from '../api/client'
import { supabase } from '../lib/supabase'
import { useActivity } from '../hooks/useActivity'
import { useNotifications } from '../hooks/useNotifications'
import { useVitals } from '../hooks/useVitals'
import { useMedications } from '../hooks/useMedications'
import { useAuth } from '../contexts/AuthContext'
import ProfileDropdown from '../components/ProfileDropdown'
import CalendarHeatmap from '../components/ui/CalendarHeatmap'
import {
    ActivityTimeline,
    EmergencyContactCard,
    WeeklyHealthSummary,
    CareTeamCard,
} from '../components/dashboard'

const timeOf = (iso) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

const ago = (iso) => {
    if (!iso) return ''
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return `${hrs} hr ago`
    return `${Math.round(hrs / 24)} d ago`
}

// Build per-day heatmap cells for the current month from adherence logs.
const buildCalendarData = (logs) => {
    const now = new Date()
    const data = []
    for (let day = 1; day <= now.getDate(); day++) {
        const dayLogs = logs.filter((l) => {
            const d = new Date(l.scheduled_time || l.created_at)
            return d.getDate() === day && d.getMonth() === now.getMonth()
        })
        if (dayLogs.length === 0) {
            data.push({ day, status: 'empty', value: 0 })
            continue
        }
        const taken = dayLogs.filter((l) => l.status === 'taken').length
        const pct = Math.round((taken / dayLogs.length) * 100)
        data.push({ day, status: pct < 50 ? 'missed' : pct < 100 ? 'partial' : 'taken', value: pct })
    }
    return data
}

const URGENCY_RANK = { GO_NOW: 0, CONSULT_SOON: 1, ROUTINE: 2 }
const URGENCY_LABEL = { GO_NOW: 'Go now', CONSULT_SOON: 'See a doctor soon', ROUTINE: 'Routine' }
const urgencyClass = (u) =>
    u === 'GO_NOW'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : u === 'CONSULT_SOON'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export default function FamilyDashboard() {
    const reduce = useReducedMotion()
    const navigate = useNavigate()
    const { user, profile, logout, roles, setActiveRole, linkedElderId } = useAuth()
    const hasElderRole = roles?.includes('elderly')

    const [elderProfile, setElderProfile] = useState(null)
    const [healthStats, setHealthStats] = useState(null)
    const [adherence, setAdherence] = useState({ rate: null, missed: 0, calendar: [] })
    const [diagnosisHistory, setDiagnosisHistory] = useState([])
    const [caregivers, setCaregivers] = useState([])
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState([])
    const [tab, setTab] = useState('overview')

    const { activities, loading: activityLoading, error: activityError, refresh: refreshActivity } = useActivity(linkedElderId)
    const { notifications, acknowledgeNotification } = useNotifications(linkedElderId)
    const { readings, connected, lastUpdated } = useVitals(linkedElderId)
    const { schedule, pendingMeds, completedMeds, missedMeds, loading: medsLoading, error: medsError } = useMedications(linkedElderId)

    const loadData = useCallback(async () => {
        if (!linkedElderId) {
            setLoading(false)
            return
        }
        const [prof, stats, logs, diag, team] = await Promise.allSettled([
            api.getProfile(linkedElderId),
            api.getHealthStats(linkedElderId),
            api.getAdherenceLogs(linkedElderId, 30),
            api.getDiagnosisHistory(linkedElderId),
            api.getLinkedCaregivers(linkedElderId),
        ])
        const ok = (r) => r.status === 'fulfilled' && r.value && r.value.success !== false
        const problems = []

        if (prof.status === 'fulfilled' && prof.value) setElderProfile(prof.value)
        else problems.push('profile')

        if (ok(stats)) setHealthStats(stats.value.stats)
        else problems.push('health trends')

        if (ok(logs) && logs.value.logs) {
            const all = logs.value.logs
            const week = all.filter((l) => Date.now() - new Date(l.scheduled_time || l.created_at).getTime() < 7 * 864e5)
            const taken = week.filter((l) => l.status === 'taken').length
            setAdherence({
                rate: week.length ? Math.round((taken / week.length) * 100) : null,
                missed: week.filter((l) => l.status === 'missed').length,
                calendar: buildCalendarData(all),
            })
        } else problems.push('medication history')

        if (ok(diag)) setDiagnosisHistory(diag.value.history || [])
        else problems.push('symptom reports')

        if (ok(team)) setCaregivers(team.value.caregivers || [])
        else problems.push('care team')

        setFailed(problems)
        setLoading(false)
    }, [linkedElderId])

    useEffect(() => {
        setLoading(true)
        loadData()
    }, [loadData])

    // Refresh when medication logs or alerts change. Vitals are live through useVitals.
    useEffect(() => {
        if (!linkedElderId || !supabase) return undefined
        const channel = supabase
            .channel(`family-dashboard-${linkedElderId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'adherence_logs' }, () => {
                loadData()
                refreshActivity()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `user_id=eq.${linkedElderId}` }, () => {
                refreshActivity()
            })
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [linkedElderId, loadData, refreshActivity])

    const elderName = elderProfile?.full_name || ''
    const firstName = elderName.split(' ')[0]

    // Latest activity by timestamp (the API returns oldest first).
    const lastActivity = useMemo(
        () => [...activities].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))[0] || null,
        [activities]
    )
    const recentActivities = useMemo(
        () => [...activities].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)).slice(0, 5),
        [activities]
    )

    const overdue = pendingMeds.filter((m) => new Date(m.scheduled_time).getTime() < Date.now())
    const upcoming = pendingMeds.filter((m) => new Date(m.scheduled_time).getTime() >= Date.now())
    const openAlerts = notifications.filter((n) => !n.acknowledged).slice(0, 3)

    const hr = readings.heartRate
    const vitalsConcern =
        connected && ((readings.spo2 != null && readings.spo2 < 92) || (hr != null && (hr > 120 || hr < 45)))
    const hasVitals = readings.heartRate != null || readings.spo2 != null || readings.temperature != null
    const hasRecentActivity =
        lastActivity?.timestamp && Date.now() - new Date(lastActivity.timestamp).getTime() < 24 * 60 * 60 * 1000

    const concerns = []
    if (openAlerts.length) concerns.push(`${openAlerts.length} open alert${openAlerts.length > 1 ? 's' : ''}`)
    if (missedMeds.length) concerns.push(`${missedMeds.length} missed dose${missedMeds.length > 1 ? 's' : ''}`)
    if (overdue.length) concerns.push(`${overdue.length} overdue dose${overdue.length > 1 ? 's' : ''}`)
    if (vitalsConcern) concerns.push('vitals out of the usual range')

    let headline
    let tone
    if (concerns.length) {
        headline = 'Needs attention'
        tone = 'text-amber-800'
    } else if (hasRecentActivity || connected || schedule.length > 0) {
        headline = 'Nothing needs attention'
        tone = 'text-sage-900'
    } else {
        headline = 'No recent data'
        tone = 'text-sage-500'
    }

    const sortedDiagnosis = useMemo(
        () => [...diagnosisHistory].sort(
            (a, b) => (URGENCY_RANK[a.urgency_level] ?? 9) - (URGENCY_RANK[b.urgency_level] ?? 9) || new Date(b.created_at) - new Date(a.created_at)
        ),
        [diagnosisHistory]
    )

    // Contacts come from the elder's real profile only.
    const contacts = useMemo(() => {
        const list = []
        if (elderProfile?.emergency_contact_phone) {
            list.push({
                id: 'emergency',
                name: elderProfile.emergency_contact_name || 'Emergency contact',
                role: elderProfile.caregiver_relationship || 'Emergency contact',
                phone: elderProfile.emergency_contact_phone,
            })
        }
        if (elderProfile?.phone) {
            list.push({ id: 'elder', name: firstName || 'Phone', role: 'Direct line', phone: elderProfile.phone })
        }
        return list
    }, [elderProfile, firstName])

    const teamMembers = useMemo(() => {
        const people = caregivers
            .filter((c) => c.caregiver)
            .map((c) => ({ id: c.caregiver.id, name: c.caregiver.full_name || 'Unnamed', avatar: c.caregiver.avatar_url }))
        if (user?.id && !people.some((p) => p.id === user.id) && user.id !== linkedElderId) {
            people.unshift({ id: user.id, name: profile?.full_name || 'You' })
        }
        return people
    }, [caregivers, user?.id, linkedElderId, profile?.full_name])

    const unlinked = !linkedElderId

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-24 md:pb-8">
            <header className="px-5 md:px-6 min-h-[72px] py-3 flex items-center justify-between gap-3 border-b border-sage-200 bg-cream-50 sticky top-0 z-20">
                <div className="min-w-0">
                    <p className="text-sm text-sage-500">{unlinked ? 'Caregiver' : 'Caring for'}</p>
                    <h1 className="font-serif text-2xl text-sage-900 truncate">
                        {unlinked ? 'Home' : elderName || (loading ? 'Loading...' : 'Your elder')}
                    </h1>
                </div>
                <ProfileDropdown
                    user={user}
                    profile={profile}
                    onLogout={logout}
                    hasElderRole={hasElderRole}
                    onSwitchRole={setActiveRole}
                    currentRole="caregiver"
                    triggerContent={
                        <div className="w-11 h-11 rounded-full border border-sage-300 bg-white flex items-center justify-center text-sage-700 font-semibold">
                            {(profile?.full_name || 'Me')[0].toUpperCase()}
                        </div>
                    }
                />
            </header>

            <main className="px-5 md:px-6 py-6 space-y-5 max-w-3xl mx-auto">
                {unlinked ? (
                    <section className="overflow-hidden rounded-3xl border border-sage-200/70 bg-white shadow-card">
                        <img src={familyPhoto} alt="" width="1536" height="1024" className="h-40 w-full object-cover object-top sm:h-56" />
                        <div className="p-6">
                        <h2 className="font-serif text-2xl text-sage-900">Connect to someone you care for</h2>
                        <p className="text-sage-600 mt-1">You are not linked to anyone yet. Ask them for their 6-character pairing code.</p>
                        <button type="button" onClick={() => navigate('/link')} className="btn-primary mt-4 btn-sm">
                            Enter a pairing code
                        </button>
                        </div>
                    </section>
                ) : (
                    <>
                        {failed.length > 0 && !loading && (
                            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-amber-900">
                                    Could not load {failed.join(', ')}. Check your connection and try again.
                                </p>
                                <button type="button" onClick={() => { setLoading(true); loadData() }} className={`min-h-[44px] px-4 rounded-full border border-amber-300 text-sm font-semibold text-amber-900 hover:bg-amber-100 ${focusRing}`}>
                                    Try again
                                </button>
                            </div>
                        )}

                        {openAlerts.length > 0 && (
                            <section aria-label="Alerts" className="space-y-2">
                                {openAlerts.map((a) => (
                                    <div key={a.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-rose-900">{a.title || 'Alert'}</p>
                                            {a.message && <p className="text-sm text-rose-800 mt-0.5 break-words">{a.message}</p>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => acknowledgeNotification(a.id)}
                                            className={`min-h-[44px] px-4 rounded-full border border-rose-300 text-sm font-semibold text-rose-800 hover:bg-rose-100 flex-shrink-0 ${focusRing}`}
                                        >
                                            Mark as seen
                                        </button>
                                    </div>
                                ))}
                            </section>
                        )}

                        {/* The one focal element: how is today going */}
                        <section className="rounded-3xl border border-sage-200/70 bg-white p-6 shadow-card" aria-labelledby="today-title">
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm text-sage-500">Today</p>
                                    <h2 id="today-title" className={`font-serif text-2xl ${tone}`}>{headline}</h2>
                                </div>
                                <img src={chatSticker} alt="" width="472" height="340" className="sticker h-14 w-auto shrink-0" />
                            </div>
                            {concerns.length > 0 && <p className="text-sage-700 mt-1">{concerns.join(', ')}.</p>}

                            <dl className="mt-5 divide-y divide-sage-100">
                                <div className="py-3 sm:flex sm:gap-6">
                                    <dt className="sm:w-36 text-sm text-sage-500">Medications</dt>
                                    <dd className="text-sage-900 flex-1">
                                        {medsLoading ? (
                                            <span className="text-sage-500">Loading...</span>
                                        ) : medsError ? (
                                            <span className="text-rose-700">Could not load today's doses.</span>
                                        ) : schedule.length === 0 ? (
                                            <span className="text-sage-500">No doses scheduled today.{' '}
                                                <button type="button" onClick={() => navigate('/family/meds')} className="font-semibold text-primary underline underline-offset-2">View medications</button>
                                            </span>
                                        ) : (
                                            <>
                                                {completedMeds.length} of {schedule.length} taken
                                                {overdue.length > 0 && <span className="text-amber-800">, {overdue.length} overdue</span>}
                                                {upcoming[0] && (
                                                    <span className="block text-sm text-sage-500">
                                                        Next: {upcoming[0].medication?.name || 'Medication'} at {timeOf(upcoming[0].scheduled_time)}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </dd>
                                </div>
                                <div className="py-3 sm:flex sm:gap-6">
                                    <dt className="sm:w-36 text-sm text-sage-500">Vitals</dt>
                                    <dd className="text-sage-900 flex-1">
                                        {hasVitals ? (
                                            <>
                                                {[
                                                    hr != null && `${hr} bpm`,
                                                    readings.spo2 != null && `SpO2 ${readings.spo2}%`,
                                                    readings.temperature != null && `${readings.temperature}°F`,
                                                ].filter(Boolean).join(' · ')}
                                                <span className={`block text-sm ${connected ? 'text-sage-500' : 'text-amber-800'}`}>
                                                    {connected
                                                        ? `Updated ${lastUpdated}`
                                                        : `Device offline, last reading at ${lastUpdated}`}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sage-500">No readings yet. Vitals appear once the wearable syncs.</span>
                                        )}
                                    </dd>
                                </div>
                                <div className="py-3 sm:flex sm:gap-6">
                                    <dt className="sm:w-36 text-sm text-sage-500">Last activity</dt>
                                    <dd className="text-sage-900 flex-1">
                                        {activityLoading ? (
                                            <span className="text-sage-500">Loading...</span>
                                        ) : activityError ? (
                                            <span className="text-rose-700">Could not load activity.{' '}
                                                <button type="button" onClick={refreshActivity} className="font-semibold underline underline-offset-2">Retry</button>
                                            </span>
                                        ) : lastActivity ? (
                                            <>
                                                {lastActivity.title}
                                                <span className="block text-sm text-sage-500">{ago(lastActivity.timestamp) || lastActivity.time}</span>
                                            </>
                                        ) : (
                                            <span className="text-sage-500">Nothing recorded today.</span>
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <div role="tablist" aria-label="Dashboard sections" className="flex gap-1 rounded-full border border-sage-200 bg-white p-1 shadow-soft">
                            {[['overview', 'Overview'], ['symptom_reports', 'Symptom reports']].map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === key}
                                    onClick={() => setTab(key)}
                                    className={`relative flex-1 min-h-[44px] rounded-full px-4 text-base whitespace-nowrap transition-colors ${focusRing} ${tab === key ? 'text-white' : 'text-sage-700 hover:text-sage-900'}`}
                                >
                                    {tab === key && <motion.span layoutId="family-tab" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-full bg-sage-900" />}
                                    <span className="relative">{label}</span>
                                </button>
                            ))}
                        </div>

                        {tab === 'overview' && (
                            <>
                                <WeeklyHealthSummary
                                    healthData={healthStats?.weekly || []}
                                    averageHeartRate={healthStats?.avgHeartRate ?? null}
                                    averageSteps={healthStats?.avgSteps ?? null}
                                    trend={healthStats?.trend || 'stable'}
                                />

                                <section className="rounded-2xl border border-sage-200 bg-white p-5" aria-labelledby="adherence-title">
                                    <h2 id="adherence-title" className="font-serif text-lg text-sage-900">Medication adherence</h2>
                                    {loading ? (
                                        <p className="text-sm text-sage-500 mt-2">Loading...</p>
                                    ) : adherence.rate == null ? (
                                        <p className="text-sm text-sage-500 mt-2">No doses logged in the last 7 days.</p>
                                    ) : (
                                        <>
                                            <p className="text-sage-700 mt-1">
                                                <span className="text-2xl text-sage-900">{adherence.rate}%</span> of doses taken in the last 7 days
                                                {adherence.missed > 0 && <span className="text-rose-700">, {adherence.missed} missed</span>}
                                            </p>
                                            <div className="mt-4">
                                                <CalendarHeatmap
                                                    data={adherence.calendar}
                                                    month={new Date().toLocaleString('en-US', { month: 'long' })}
                                                    year={new Date().getFullYear()}
                                                />
                                            </div>
                                        </>
                                    )}
                                </section>

                                <ActivityTimeline activities={recentActivities} maxItems={5} onViewAll={() => navigate('/family/day-replay')} />

                                <CareTeamCard members={teamMembers} loading={loading} />

                                <EmergencyContactCard
                                    contacts={contacts}
                                    onCall={(c) => { window.location.href = `tel:${c.phone}` }}
                                    onEmergency={() => navigate('/elder/emergency')}
                                    onAddContact={() => navigate('/family/settings')}
                                />

                                <div className="btn-row">
                                    <button type="button" onClick={() => navigate('/family/meds')} className="btn-primary btn-sm">Manage medications</button>
                                    <button type="button" onClick={() => navigate('/family/health')} className="btn-secondary btn-sm">Health monitor</button>
                                </div>
                            </>
                        )}

                        {tab === 'symptom_reports' && (
                            <section className="rounded-2xl border border-sage-200 bg-white p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="font-serif text-lg text-sage-900">Symptom reports</h2>
                                    <button type="button" onClick={() => navigate('/diagnosis/history')} className={`min-h-[44px] px-3 text-sm font-semibold text-primary rounded-full ${focusRing}`}>
                                        View all
                                    </button>
                                </div>
                                {loading ? (
                                    <p className="text-sm text-sage-500 mt-2">Loading...</p>
                                ) : sortedDiagnosis.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <FileText className="w-6 h-6 mx-auto text-sage-400 mb-2" aria-hidden="true" />
                                        <p className="text-sage-800 font-semibold">No symptom reports yet</p>
                                        <p className="text-sm text-sage-500 mt-1">Reports appear here after {firstName || 'they'} checks symptoms.</p>
                                    </div>
                                ) : (
                                    <ul className="mt-3 space-y-2">
                                        {sortedDiagnosis.map((s) => (
                                            <li key={s.session_id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        s.report_json
                                                            ? navigate('/diagnosis/report', {
                                                                state: {
                                                                    report: s.report_json,
                                                                    session_id: s.session_id,
                                                                    urgency_level: s.urgency_level,
                                                                    patient_name: elderName || 'Patient',
                                                                },
                                                            })
                                                            : navigate('/diagnosis/history')
                                                    }
                                                    className={`w-full text-left rounded-2xl border p-4 min-h-[44px] hover:bg-sage-50 ${focusRing} ${s.urgency_level === 'GO_NOW' ? 'border-rose-300' : 'border-sage-200'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sage-900 break-words">{s.raw_complaint}</p>
                                                            <p className="text-sm text-sage-500 mt-1">{new Date(s.created_at).toLocaleString()}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full border text-xs font-semibold flex-shrink-0 ${urgencyClass(s.urgency_level)}`}>
                                                            {URGENCY_LABEL[s.urgency_level] || 'Routine'}
                                                        </span>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
