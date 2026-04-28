import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Settings, Clock, Phone, MessageCircle, AlertTriangle, Loader2, Calendar, Heart, FileText } from 'lucide-react'
import { api } from '../api/client'
import { supabase } from '../lib/supabase'
import { useActivity } from '../hooks/useActivity'
import { useNotifications } from '../hooks/useNotifications'
import FamilyNav from '../components/FamilyNav'
import ProfileDropdown from '../components/ProfileDropdown'
import { Card, IconButton } from '../components/ui'
import CalendarHeatmap from '../components/ui/CalendarHeatmap'
import { PageLayout, PageHeader, PageMain, PageSection } from '../components/layout'
import {
    HealthOverviewCard,
    VitalsStatsRow,
    ActivityTimeline,
    EmergencyContactCard,
    WeeklyHealthSummary,
    SmartControlPanel,
    CareTeamCard
} from '../components/dashboard'

import { useAuth } from '../contexts/AuthContext'

export default function FamilyDashboard() {
    const navigate = useNavigate()
    const { user, profile, loading: authLoading, logout, roles, setActiveRole } = useAuth()
    const hasElderRole = roles?.includes('elderly')

    const caregiverId = user?.id
    const linkedElderlyId = profile?.linked_elderly_id

    const [elderlyInfo, setElderlyInfo] = useState(null)
    const [healthStats, setHealthStats] = useState(null)
    const [adherenceStats, setAdherenceStats] = useState({ rate: 0, missed: 0 })
    const [adherenceCalendarData, setAdherenceCalendarData] = useState([])
    const [dashboardTab, setDashboardTab] = useState('overview')
    const [diagnosisHistory, setDiagnosisHistory] = useState([])

    const { activities, loading: activityLoading, stats, refresh: refreshActivity } = useActivity(linkedElderlyId)
    const { unreadCount, notifications } = useNotifications(caregiverId)

    // Data loading function wrapped in useCallback for reuse
    const loadData = useCallback(async () => {
        if (!linkedElderlyId) return

        try {
            const elderlyProfile = api.getProfile
                ? await api.getProfile(linkedElderlyId)
                : null
            const healthRes = await api.getHealthStats(linkedElderlyId)
            if (healthRes.success) {
                setHealthStats(healthRes.stats)
            }

            const adherenceRes = api.getAdherenceLogs
                ? await api.getAdherenceLogs(linkedElderlyId, 7)
                : { success: false }
            if (adherenceRes.success && adherenceRes.logs) {
                const taken = adherenceRes.logs.filter(l => l.status === 'taken').length
                const missed = adherenceRes.logs.filter(l => l.status === 'missed').length
                const total = adherenceRes.logs.length
                setAdherenceStats({
                    rate: total > 0 ? Math.round((taken / total) * 100) : 0,
                    missed
                })

                // Generate calendar data for heatmap
                const calendarData = generateCalendarData(adherenceRes.logs)
                setAdherenceCalendarData(calendarData)
            }

            const diagnosisRes = await api.getDiagnosisHistory(linkedElderlyId)
            if (diagnosisRes.success && diagnosisRes.history) {
                setDiagnosisHistory(diagnosisRes.history)
            }

            setElderlyInfo({
                name: elderlyProfile?.full_name || 'Your Loved One',
                status: 'Active',
                summary: 'All systems normal',
                detail: 'Last activity 5 min ago',
            })
        } catch (err) {
            console.error('Failed to load data:', err)
        }
    }, [linkedElderlyId])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Real-time subscriptions
    useEffect(() => {
        if (!linkedElderlyId || !supabase) return

        const channel = supabase
            .channel(`dashboard-subscription-${linkedElderlyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'adherence_logs'
                },
                () => {
                    console.log('Adherence changed, refreshing dashboard...')
                    loadData()
                    refreshActivity()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'health_readings',
                    filter: `user_id=eq.${linkedElderlyId}`
                },
                () => {
                    console.log('Health stats changed, refreshing dashboard...')
                    loadData()
                    refreshActivity()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'alerts',
                    filter: `user_id=eq.${linkedElderlyId}`
                },
                () => {
                    console.log('Alerts changed, refreshing dashboard...')
                    refreshActivity()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [linkedElderlyId, loadData, refreshActivity])

    // Generate calendar heatmap data from adherence logs
    const generateCalendarData = (logs) => {
        const now = new Date()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const data = []

        for (let day = 1; day <= daysInMonth; day++) {
            const dayLogs = logs.filter(l => {
                const logDate = new Date(l.scheduled_time || l.created_at)
                return logDate.getDate() === day && logDate.getMonth() === now.getMonth()
            })

            if (dayLogs.length === 0) {
                if (day <= now.getDate()) {
                    data.push({ day, status: 'empty', value: 0 })
                }
            } else {
                const taken = dayLogs.filter(l => l.status === 'taken').length
                const total = dayLogs.length
                const percentage = Math.round((taken / total) * 100)

                let status = 'taken'
                if (percentage < 50) status = 'missed'
                else if (percentage < 100) status = 'partial'

                data.push({ day, status, value: percentage })
            }
        }

        return data
    }

    const recentActivities = activities.slice(0, 5).map(a => ({
        id: a.id,
        type: a.type || 'default',
        icon: a.icon || '📌',
        title: a.title,
        time: a.time,
        detail: a.detail,
        status: a.status || 'completed'
    }))

    const lastCheckIn = activities.find(a => a.type === 'check_in' || a.type === 'medication')
    const lastCheckInTime = lastCheckIn?.time || '—'

    // Extract vitals from health stats (no fake fallbacks)
    const vitals = healthStats?.latest || {}

    // Get current month name
    const currentMonth = new Date().toLocaleString('default', { month: 'long' })
    const currentYear = new Date().getFullYear()

    const urgencyRank = {
        GO_NOW: 0,
        CONSULT_SOON: 1,
        ROUTINE: 2
    }

    const sortedDiagnosisHistory = [...diagnosisHistory].sort((a, b) => {
        const rankDiff = (urgencyRank[a.urgency_level] ?? 9) - (urgencyRank[b.urgency_level] ?? 9)
        if (rankDiff !== 0) return rankDiff
        return new Date(b.created_at) - new Date(a.created_at)
    })

    const urgencyClass = (urgency) => {
        if (urgency === 'GO_NOW') return 'bg-rose-100 text-rose-700 border-rose-200'
        if (urgency === 'CONSULT_SOON') return 'bg-amber-100 text-amber-800 border-amber-200'
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }

    return (
        <PageLayout
            header={
                <PageHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-14 h-14 rounded-full bg-primary-light/30 flex items-center justify-center overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                <span className="text-3xl">👵</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-primary text-base">Caring for</div>
                                <h1 className="text-2xl font-serif font-bold text-primary-dark truncate">{elderlyInfo?.name || 'Loading...'}</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <IconButton
                                icon={Bell}
                                variant="primary"
                                badge={unreadCount}
                                size="lg"
                                aria-label="View Notifications"
                            />
                            <ProfileDropdown
                                user={user}
                                profile={profile}
                                onLogout={logout}
                                hasElderRole={hasElderRole}
                                onSwitchRole={setActiveRole}
                                currentRole="caregiver"
                                triggerContent={
                                    <div className="w-12 h-12 rounded-full bg-primary-bg flex items-center justify-center border-2 border-primary-light">
                                        <Settings className="w-6 h-6 text-primary" strokeWidth={2.5} />
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </PageHeader>
            }
            nav={<FamilyNav />}
        >
            <PageMain>
                {/* Not Linked Banner */}
                {!linkedElderlyId ? (
                    <PageSection>
                        <Card className="bg-amber-50 border-amber-200">
                            <h2 className="text-xl font-bold text-amber-900 mb-2">Connect to a Senior</h2>
                            <p className="text-amber-700 mb-4">You haven't linked to an elderly account yet.</p>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/onboarding/caregiver')}
                                className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold text-sm min-h-[48px]"
                            >
                                Connect Now
                            </motion.button>
                        </Card>
                    </PageSection>
                ) : (
                    <>
                        <PageSection>
                            <div className="bg-white border-2 border-sage-200 rounded-2xl p-1 flex gap-1">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setDashboardTab('overview')}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                                        dashboardTab === 'overview'
                                            ? 'bg-sage-500 text-white'
                                            : 'text-sage-600 hover:bg-sage-50'
                                    }`}
                                >
                                    Overview
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setDashboardTab('symptom_reports')}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                                        dashboardTab === 'symptom_reports'
                                            ? 'bg-sage-500 text-white'
                                            : 'text-sage-600 hover:bg-sage-50'
                                    }`}
                                >
                                    Symptom Reports
                                </motion.button>
                            </div>
                        </PageSection>

                        {dashboardTab === 'overview' && (
                            <>
                                {/* Health Overview Card */}
                                <PageSection>
                                    <HealthOverviewCard
                                        elderlyName={elderlyInfo?.name || 'Your Loved One'}
                                        status={elderlyInfo?.status || 'Active'}
                                        heartRate={vitals.heart_rate || null}
                                        bloodPressure={{
                                            systolic: vitals.blood_pressure_systolic || null,
                                            diastolic: vitals.blood_pressure_diastolic || null
                                        }}
                                        lastUpdated={elderlyInfo?.detail || 'Just now'}
                                        trendData={healthStats?.weekly || []}
                                        trend={healthStats?.trend || 'stable'}
                                    />
                                </PageSection>

                                {/* Vitals Stats Row */}
                                <PageSection delay={0.05}>
                                    <VitalsStatsRow
                                        heartRate={vitals.heart_rate || null}
                                        bloodPressure={{
                                            systolic: vitals.blood_pressure_systolic || null,
                                            diastolic: vitals.blood_pressure_diastolic || null
                                        }}
                                        steps={vitals.steps || null}
                                        sleep={vitals.sleep || null}
                                        trends={{
                                            heartRate: healthStats?.trends?.heartRate || 'stable',
                                            steps: healthStats?.trends?.steps || 'stable',
                                            sleep: healthStats?.trends?.sleep || 'stable'
                                        }}
                                    />
                                </PageSection>

                                {/* Weekly Summary */}
                                <PageSection delay={0.1}>
                                    <WeeklyHealthSummary
                                        healthData={healthStats?.weekly || []}
                                        averageHeartRate={vitals.heart_rate || null}
                                        averageSteps={vitals.steps || null}
                                        trend={healthStats?.trend || 'stable'}
                                    />
                                </PageSection>

                                {/* Care Team - Animated Avatar Group */}
                                <PageSection delay={0.11}>
                                    <CareTeamCard />
                                </PageSection>

                                {/* Smart Home Control */}
                                <PageSection delay={0.13}>
                                    <SmartControlPanel />
                                </PageSection>

                                {/* Medication Adherence Calendar */}
                                <PageSection delay={0.15}>
                                    <Card>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Calendar className="w-5 h-5 text-sage-500" />
                                            <span className="text-sage-600 font-bold uppercase tracking-wider text-sm">Medication Adherence</span>
                                        </div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="text-3xl font-bold text-sage-900">{adherenceStats.rate}%</div>
                                                <div className="text-sage-500 text-sm">This month's adherence</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-rose-500 font-bold">{adherenceStats.missed}</div>
                                                <div className="text-sage-400 text-sm">Missed doses</div>
                                            </div>
                                        </div>
                                        <CalendarHeatmap
                                            data={adherenceCalendarData}
                                            month={currentMonth}
                                            year={currentYear}
                                        />
                                    </Card>
                                </PageSection>

                                {/* Recent Activity Timeline */}
                                <PageSection delay={0.2}>
                                    <ActivityTimeline
                                        activities={recentActivities}
                                        maxItems={5}
                                        onViewAll={() => navigate('/family/day-replay')}
                                    />
                                </PageSection>

                                {/* Quick Contacts & Emergency */}
                                <PageSection delay={0.25}>
                                    <EmergencyContactCard
                                        contacts={[
                                            { id: 1, name: 'Dr. Smith', role: 'Primary Doctor', phone: '+1 555-0123', avatar: '👨‍⚕️' },
                                            { id: 2, name: elderlyInfo?.name?.split(' ')[0] || 'Mom', role: 'Direct Line', phone: '+1 555-0456', avatar: '👵' },
                                        ]}
                                        onCall={(contact) => window.location.href = `tel:${contact.phone}`}
                                        onMessage={(contact) => navigate('/family/voice-memos')}
                                        onEmergency={() => navigate('/elder/emergency')}
                                    />
                                </PageSection>

                                {/* Quick Action Buttons */}
                                <PageSection delay={0.3}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => navigate('/family/meds')}
                                            className="bg-sage-500 text-white py-3 sm:py-4 rounded-2xl font-bold flex items-center justify-center gap-2 min-h-[52px] sm:min-h-[56px] shadow-soft hover:bg-sage-600 transition-colors text-sm sm:text-base"
                                        >
                                            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>Manage Meds</span>
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => navigate('/family/health')}
                                            className="bg-white text-sage-700 py-3 sm:py-4 rounded-2xl font-bold border-2 border-sage-200 flex items-center justify-center gap-2 min-h-[52px] sm:min-h-[56px] hover:bg-sage-50 transition-colors text-sm sm:text-base"
                                        >
                                            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>Health Monitor</span>
                                        </motion.button>
                                    </div>
                                </PageSection>
                            </>
                        )}

                        {dashboardTab === 'symptom_reports' && (
                            <PageSection>
                                <Card>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-sage-600" />
                                            <h2 className="text-2xl font-bold text-sage-900">Symptom Reports</h2>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => navigate('/diagnosis/history')}
                                            className="px-4 py-2 rounded-xl bg-sage-100 text-sage-700 font-semibold"
                                        >
                                            View All
                                        </motion.button>
                                    </div>

                                    {sortedDiagnosisHistory.length === 0 ? (
                                        <p className="text-sage-600 text-lg">No symptom reports found yet for this elder profile.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {sortedDiagnosisHistory.map((session) => (
                                                <motion.button
                                                    key={session.session_id}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        if (session.report_json) {
                                                            navigate('/diagnosis/report', {
                                                                state: {
                                                                    report: session.report_json,
                                                                    session_id: session.session_id,
                                                                    urgency_level: session.urgency_level,
                                                                    patient_name: elderlyInfo?.name || 'Patient'
                                                                }
                                                            })
                                                        } else {
                                                            navigate('/diagnosis/history')
                                                        }
                                                    }}
                                                    className="w-full text-left"
                                                >
                                                    <div className={`p-4 rounded-2xl border-2 transition-colors ${
                                                        session.urgency_level === 'GO_NOW'
                                                            ? 'border-rose-300 bg-rose-50'
                                                            : 'border-sage-200 bg-white hover:border-sage-300'
                                                    }`}>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sage-900 font-semibold text-lg break-words">{session.raw_complaint}</p>
                                                                <p className="text-sage-500 text-sm mt-1">{new Date(session.created_at).toLocaleString()}</p>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-xl border text-xs font-bold flex-shrink-0 ${urgencyClass(session.urgency_level)}`}>
                                                                {session.urgency_level || 'ROUTINE'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            </PageSection>
                        )}
                    </>
                )}
            </PageMain>
        </PageLayout>
    )
}
