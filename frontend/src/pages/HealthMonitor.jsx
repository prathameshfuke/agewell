import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { heart, done } from '../assets/images/gen'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { subscriptions } from '../lib/supabase'
import FamilyPage, { Art, NotLinked } from '../components/family/FamilyPage'

export default function HealthMonitor() {
    const { user, activeRole, linkedElderId } = useAuth()
    const [healthData, setHealthData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState(null)

    // Get the elderly user ID (self if elderly, linked if caregiver)
    const elderlyId = activeRole === 'caregiver' ? linkedElderId : user?.id

    useEffect(() => {
        loadData()

        // Subscribe to real-time health readings
        const unsubscribe = subscriptions.onHealthReading(elderlyId, (newReading) => {
            setHealthData(newReading)
            setLastUpdated(new Date())
        })

        return () => unsubscribe()
    }, [elderlyId])

    const loadData = async () => {
        setLoading(true)
        try {
            const result = await api.getHealthStats(elderlyId)
            if (result.success && result.stats) {
                setHealthData(result.stats.latest)
                setLastUpdated(new Date())
            }
        } catch (error) {
            console.error('Error loading health data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getVitalStatus = (type, value) => {
        if (!value) return { status: 'No reading', color: 'sage' }

        switch (type) {
            case 'spo2':
                if (value >= 95) return { status: 'Normal', color: 'sage' }
                if (value >= 90) return { status: 'Low', color: 'amber' }
                return { status: 'Critical', color: 'rose' }
            case 'heart_rate':
                if (value >= 60 && value <= 100) return { status: 'Normal', color: 'sage' }
                if (value >= 50 && value <= 110) return { status: 'Borderline', color: 'amber' }
                return { status: 'Abnormal', color: 'rose' }
            case 'temperature':
                if (value >= 36 && value <= 37.5) return { status: 'Normal', color: 'sage' }
                if (value >= 37.5 && value <= 38) return { status: 'Elevated', color: 'amber' }
                return { status: 'Fever', color: 'rose' }
            default:
                return { status: 'Unknown', color: 'sage' }
        }
    }

    const spo2Status = getVitalStatus('spo2', healthData?.spo2)
    const hrStatus = getVitalStatus('heart_rate', healthData?.heart_rate)
    const tempStatus = getVitalStatus('temperature', healthData?.body_temperature)

    const tone = { rose: 'text-rose-700', amber: 'text-clay-600', sage: 'text-ink-2' }
    const critical = spo2Status.color === 'rose' || hrStatus.color === 'rose' || tempStatus.color === 'rose'
    const hasData = healthData && (healthData.spo2 || healthData.heart_rate || healthData.body_temperature)
    const vitals = [
        ['Blood oxygen', healthData?.spo2, '%', spo2Status],
        ['Heart rate', healthData?.heart_rate, ' bpm', hrStatus],
        ['Body temperature', healthData?.body_temperature, '°C', tempStatus],
    ]

    return (
        <FamilyPage
            title="Health monitor"
            sub="Latest vital signs from the wearable"
            art={heart}
            action={
                <button type="button" onClick={loadData} aria-label="Refresh readings" className="btn-icon-ghost">
                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
                </button>
            }
        >
            {!elderlyId ? (
                <NotLinked text="Link an account to see their vital signs." />
            ) : (
                <>
                    <section className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className={`font-serif text-4xl ${critical ? 'text-clay-600' : ''}`}>
                                {loading && !healthData ? 'Loading...' : !hasData ? 'No readings yet' : critical ? 'Needs attention' : 'All vitals in range'}
                            </h2>
                            <p className="mt-1 text-ink-2">
                                {lastUpdated && hasData ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Readings appear once the wearable syncs.'}
                            </p>
                        </div>
                        {hasData && !critical && <Art src={done} className="hidden w-24 shrink-0 sm:block" />}
                    </section>

                    <section aria-label="Vital signs">
                        <dl className="grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                            {vitals.map(([label, value, unit, st]) => (
                                <div key={label} className="py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0">
                                    <dt className="text-ink-2">{label}</dt>
                                    <dd className="mt-1 font-serif text-5xl">{value || '--'}<span className="font-sans text-lg text-ink-2">{value ? unit : ''}</span></dd>
                                    <dd className={`mt-1 font-bold ${tone[st.color]}`}>{st.status}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                </>
            )}
        </FamilyPage>
    )
}
