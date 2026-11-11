import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { done } from '../assets/images/gen'
import { api } from '../api/client'
import { supabase } from '../lib/supabase'
import { useActivity } from '../hooks/useActivity'
import { useNotifications } from '../hooks/useNotifications'
import { useVitals } from '../hooks/useVitals'
import { useMedications } from '../hooks/useMedications'
import { useAuth } from '../contexts/AuthContext'
import ProfileDropdown from '../components/ProfileDropdown'
import FamilyPage, { Art, Notice, NotLinked, textBtn } from '../components/family/FamilyPage'
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
const urgencyClass = (u) => (u === 'GO_NOW' ? 'text-rose-700' : u === 'CONSULT_SOON' ? 'text-clay-600' : 'text-emerald-700')

export default function FamilyDashboard() {
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
        tone = 'text-clay-600'
    } else if (hasRecentActivity || connected || schedule.length > 0) {
        headline = 'Nothing needs attention'
        tone = 'text-ink'
    } else {
        headline = 'No recent data'
        tone = 'text-ink-2'
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
    const muted = 'text-ink-2'
    const row = 'py-3 sm:flex sm:gap-6'

    const profileMenu = (
        <ProfileDropdown
            user={user}
            profile={profile}
            onLogout={logout}
            hasElderRole={hasElderRole}
            onSwitchRole={setActiveRole}
            currentRole="caregiver"
            triggerContent={
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper-2 font-bold text-ink-2">
                    {(profile?.full_name || 'Me')[0].toUpperCase()}
                </div>
            }
        />
    )

    if (unlinked) {
        return (
            <FamilyPage title="Home" sub="Caregiver" action={profileMenu}>
                <NotLinked text="Ask them for their 6-character pairing code, then enter it here." />
            </FamilyPage>
        )
    }

    return (
        <FamilyPage
            title={elderName || (loading ? 'Loading...' : 'Your elder')}
            sub="Caring for"
            action={profileMenu}
            aside={
                <>
                    <ActivityTimeline activities={recentActivities} maxItems={5} onViewAll={() => navigate('/family/day-replay')} />
                    <CareTeamCard members={teamMembers} loading={loading} />
                    <EmergencyContactCard
                        contacts={contacts}
                        onCall={(c) => { window.location.href = `tel:${c.phone}` }}
                        onEmergency={() => navigate('/elder/emergency')}
                        onAddContact={() => navigate('/family/settings')}
                    />
                </>
            }
        >
            {failed.length > 0 && !loading && (
                <Notice tone="warn" onRetry={() => { setLoading(true); loadData() }}>
                    Could not load {failed.join(', ')}. Check your connection and try again.
                </Notice>
            )}

            {openAlerts.length > 0 && (
                <section aria-label="Alerts" className="space-y-4">
                    {openAlerts.map((a) => (
                        <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-status-danger py-1 pl-4">
                            <div className="min-w-0">
                                <p className="font-bold text-rose-700">{a.title || 'Alert'}</p>
                                {a.message && <p className="break-words text-ink-2">{a.message}</p>}
                            </div>
                            <button type="button" onClick={() => acknowledgeNotification(a.id)} className="btn-secondary btn-sm">Mark as seen</button>
                        </div>
                    ))}
                </section>
            )}

            {/* The one focal element: how is today going */}
            <section aria-labelledby="today-title">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className={muted}>Today</p>
                        <h2 id="today-title" className={`font-serif text-5xl ${tone}`}>{headline}</h2>
                    </div>
                    {tone === 'text-ink' && <Art src={done} className="hidden w-24 shrink-0 sm:block" />}
                </div>
                {concerns.length > 0 && <p className="mt-2 text-lg">{concerns.join(', ')}.</p>}

                <dl className="mt-6 divide-y divide-line border-y border-line">
                    <div className={row}>
                        <dt className={`sm:w-36 ${muted}`}>Medications</dt>
                        <dd className="flex-1">
                            {medsLoading ? (
                                <span className={muted}>Loading...</span>
                            ) : medsError ? (
                                <span className="text-rose-700">Could not load today's doses.</span>
                            ) : schedule.length === 0 ? (
                                <span className={muted}>No doses scheduled today.{' '}
                                    <button type="button" onClick={() => navigate('/family/meds')} className="font-bold text-primary underline underline-offset-4">View medications</button>
                                </span>
                            ) : (
                                <>
                                    {completedMeds.length} of {schedule.length} taken
                                    {overdue.length > 0 && <span className="text-clay-600">, {overdue.length} overdue</span>}
                                    {upcoming[0] && (
                                        <span className={`block text-sm ${muted}`}>
                                            Next: {upcoming[0].medication?.name || 'Medication'} at {timeOf(upcoming[0].scheduled_time)}
                                        </span>
                                    )}
                                </>
                            )}
                        </dd>
                    </div>
                    <div className={row}>
                        <dt className={`sm:w-36 ${muted}`}>Vitals</dt>
                        <dd className="flex-1">
                            {hasVitals ? (
                                <>
                                    {[
                                        hr != null && `${hr} bpm`,
                                        readings.spo2 != null && `SpO2 ${readings.spo2}%`,
                                        readings.temperature != null && `${readings.temperature}°F`,
                                    ].filter(Boolean).join(' · ')}
                                    <span className={`block text-sm ${connected ? muted : 'text-clay-600'}`}>
                                        {connected ? `Updated ${lastUpdated}` : `Device offline, last reading at ${lastUpdated}`}
                                    </span>
                                </>
                            ) : (
                                <span className={muted}>No readings yet. Vitals appear once the wearable syncs.</span>
                            )}
                        </dd>
                    </div>
                    <div className={row}>
                        <dt className={`sm:w-36 ${muted}`}>Last activity</dt>
                        <dd className="flex-1">
                            {activityLoading ? (
                                <span className={muted}>Loading...</span>
                            ) : activityError ? (
                                <span className="text-rose-700">Could not load activity.{' '}
                                    <button type="button" onClick={refreshActivity} className="font-bold underline underline-offset-4">Retry</button>
                                </span>
                            ) : lastActivity ? (
                                <>
                                    {lastActivity.title}
                                    <span className={`block text-sm ${muted}`}>{ago(lastActivity.timestamp) || lastActivity.time}</span>
                                </>
                            ) : (
                                <span className={muted}>Nothing recorded today.</span>
                            )}
                        </dd>
                    </div>
                </dl>

                <div className="btn-row mt-6 sm:max-w-md">
                    <button type="button" onClick={() => navigate('/family/meds')} className="btn-primary btn-sm">Manage medications</button>
                    <button type="button" onClick={() => navigate('/family/health')} className="btn-secondary btn-sm">Health monitor</button>
                </div>
            </section>

            <WeeklyHealthSummary
                healthData={healthStats?.weekly || []}
                averageHeartRate={healthStats?.avgHeartRate ?? null}
                averageSteps={healthStats?.avgSteps ?? null}
                trend={healthStats?.trend || 'stable'}
            />

            <section aria-labelledby="adherence-title">
                <h2 id="adherence-title" className="font-serif text-2xl">Medication adherence</h2>
                {loading ? (
                    <p className={`mt-2 ${muted}`}>Loading...</p>
                ) : adherence.rate == null ? (
                    <p className={`mt-2 ${muted}`}>No doses logged in the last 7 days.</p>
                ) : (
                    <>
                        <p className="mt-1">
                            <span className="font-serif text-4xl">{adherence.rate}%</span> of doses taken in the last 7 days
                            {adherence.missed > 0 && <span className="text-rose-700">, {adherence.missed} missed</span>}
                        </p>
                        <div className="mt-4 max-w-md">
                            <CalendarHeatmap
                                data={adherence.calendar}
                                month={new Date().toLocaleString('en-US', { month: 'long' })}
                                year={new Date().getFullYear()}
                            />
                        </div>
                    </>
                )}
            </section>

            <section aria-labelledby="reports-title">
                <div className="flex items-center justify-between gap-3">
                    <h2 id="reports-title" className="font-serif text-2xl">Symptom reports</h2>
                    <button type="button" onClick={() => navigate('/diagnosis/history')} className={textBtn}>View all</button>
                </div>
                {loading ? (
                    <p className={`mt-2 ${muted}`}>Loading...</p>
                ) : sortedDiagnosis.length === 0 ? (
                    <p className={`mt-2 ${muted}`}>No reports yet. They appear here after {firstName || 'they'} checks symptoms.</p>
                ) : (
                    <ul className="mt-2 divide-y divide-line">
                        {sortedDiagnosis.slice(0, 5).map((s) => (
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
                                    className="flex min-h-[56px] w-full items-start justify-between gap-4 py-3 text-left font-normal hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                                >
                                    <span className="min-w-0">
                                        <span className="block break-words">{s.raw_complaint}</span>
                                        <span className="block text-sm text-ink-2">{new Date(s.created_at).toLocaleString()}</span>
                                    </span>
                                    <span className={`shrink-0 text-sm font-bold ${urgencyClass(s.urgency_level)}`}>
                                        {URGENCY_LABEL[s.urgency_level] || 'Routine'}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </FamilyPage>
    )
}
