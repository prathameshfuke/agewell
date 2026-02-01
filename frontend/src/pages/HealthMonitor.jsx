import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Thermometer, Wind, Droplets, AlertTriangle, Activity, RefreshCw } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { subscriptions } from '../lib/supabase'

// Import stickers
import goodmoodSticker from '../assets/images/stickers/goodmood.jpeg'
import notwellSticker from '../assets/images/stickers/notwell.jpeg'

export default function HealthMonitor() {
    const navigate = useNavigate()
    const { user, profile } = useAuth()
    const [healthData, setHealthData] = useState(null)
    const [environmentData, setEnvironmentData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState(null)

    // Get the elderly user ID (self if elderly, linked if caregiver)
    const elderlyId = profile?.role === 'caregiver'
        ? profile?.linked_elderly_id
        : user?.id || 'mock-elderly-1'

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
        if (!value) return { status: 'unknown', color: 'sage' }

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

    const getEnvironmentStatus = (type, value) => {
        if (!value) return { status: 'unknown', color: 'sage' }

        switch (type) {
            case 'humidity':
                if (value >= 30 && value <= 60) return { status: 'Comfortable', color: 'sage' }
                return { status: 'Uncomfortable', color: 'amber' }
            case 'gas':
                if (value < 200) return { status: 'Safe', color: 'sage' }
                if (value < 400) return { status: 'Caution', color: 'amber' }
                return { status: 'Danger', color: 'rose' }
            case 'ambient_temp':
                if (value >= 18 && value <= 26) return { status: 'Comfortable', color: 'sage' }
                return { status: 'Uncomfortable', color: 'amber' }
            default:
                return { status: 'Unknown', color: 'sage' }
        }
    }

    const spo2Status = getVitalStatus('spo2', healthData?.spo2)
    const hrStatus = getVitalStatus('heart_rate', healthData?.heart_rate)
    const tempStatus = getVitalStatus('temperature', healthData?.body_temperature)

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-8">
            {/* Header */}
            <header className="px-6 py-5 flex items-center gap-4 bg-cream-50 sticky top-0 z-10">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(-1)}
                    className="p-2 text-sage-500 hover:bg-sage-100 rounded-xl"
                >
                    <ArrowLeft className="w-6 h-6" />
                </motion.button>
                <div className="flex-1">
                    <h1 className="text-2xl font-serif font-bold text-sage-900">Health Monitor</h1>
                    <p className="text-sage-500">Real-time vital signs</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={loadData}
                    className="p-3 bg-sage-100 rounded-xl text-sage-600"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </motion.button>
            </header>

            <main className="px-6 space-y-6">
                {/* Overall Status */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 border-2 border-sage-100"
                >
                    <div className="flex items-center gap-4">
                        <img
                            src={spo2Status.color === 'rose' || hrStatus.color === 'rose' ? notwellSticker : goodmoodSticker}
                            alt="Status"
                            className="w-20 h-20 rounded-2xl object-cover"
                        />
                        <div>
                            <h2 className="text-2xl font-bold text-sage-800">
                                {spo2Status.color === 'rose' || hrStatus.color === 'rose'
                                    ? 'Needs Attention'
                                    : 'All Vitals Normal'}
                            </h2>
                            {lastUpdated && (
                                <p className="text-sage-500">
                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Vital Signs */}
                <section>
                    <h2 className="text-lg font-bold text-sage-800 mb-4">Vital Signs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* SpO2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`bg-white rounded-2xl p-5 border-2 ${spo2Status.color === 'rose' ? 'border-rose-200' :
                                    spo2Status.color === 'amber' ? 'border-amber-200' : 'border-sage-100'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${spo2Status.color === 'rose' ? 'bg-rose-100' :
                                        spo2Status.color === 'amber' ? 'bg-amber-100' : 'bg-sage-100'
                                    }`}>
                                    <Activity className={`w-6 h-6 ${spo2Status.color === 'rose' ? 'text-rose-600' :
                                            spo2Status.color === 'amber' ? 'text-amber-600' : 'text-sage-600'
                                        }`} />
                                </div>
                                <div>
                                    <div className="text-sage-500 text-sm font-bold uppercase">Blood Oxygen</div>
                                    <div className={`text-sm font-bold ${spo2Status.color === 'rose' ? 'text-rose-600' :
                                            spo2Status.color === 'amber' ? 'text-amber-600' : 'text-sage-600'
                                        }`}>
                                        {spo2Status.status}
                                    </div>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-sage-900">
                                {healthData?.spo2 || '--'}
                                <span className="text-xl text-sage-500 font-normal">%</span>
                            </div>
                        </motion.div>

                        {/* Heart Rate */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className={`bg-white rounded-2xl p-5 border-2 ${hrStatus.color === 'rose' ? 'border-rose-200' :
                                    hrStatus.color === 'amber' ? 'border-amber-200' : 'border-sage-100'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hrStatus.color === 'rose' ? 'bg-rose-100' :
                                        hrStatus.color === 'amber' ? 'bg-amber-100' : 'bg-rose-50'
                                    }`}>
                                    <Heart className={`w-6 h-6 ${hrStatus.color === 'rose' ? 'text-rose-600' :
                                            hrStatus.color === 'amber' ? 'text-amber-600' : 'text-rose-500'
                                        }`} />
                                </div>
                                <div>
                                    <div className="text-sage-500 text-sm font-bold uppercase">Heart Rate</div>
                                    <div className={`text-sm font-bold ${hrStatus.color === 'rose' ? 'text-rose-600' :
                                            hrStatus.color === 'amber' ? 'text-amber-600' : 'text-sage-600'
                                        }`}>
                                        {hrStatus.status}
                                    </div>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-sage-900">
                                {healthData?.heart_rate || '--'}
                                <span className="text-xl text-sage-500 font-normal"> bpm</span>
                            </div>
                        </motion.div>

                        {/* Temperature */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className={`bg-white rounded-2xl p-5 border-2 ${tempStatus.color === 'rose' ? 'border-rose-200' :
                                    tempStatus.color === 'amber' ? 'border-amber-200' : 'border-sage-100'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tempStatus.color === 'rose' ? 'bg-rose-100' :
                                        tempStatus.color === 'amber' ? 'bg-amber-100' : 'bg-blue-50'
                                    }`}>
                                    <Thermometer className={`w-6 h-6 ${tempStatus.color === 'rose' ? 'text-rose-600' :
                                            tempStatus.color === 'amber' ? 'text-amber-600' : 'text-blue-500'
                                        }`} />
                                </div>
                                <div>
                                    <div className="text-sage-500 text-sm font-bold uppercase">Body Temp</div>
                                    <div className={`text-sm font-bold ${tempStatus.color === 'rose' ? 'text-rose-600' :
                                            tempStatus.color === 'amber' ? 'text-amber-600' : 'text-sage-600'
                                        }`}>
                                        {tempStatus.status}
                                    </div>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-sage-900">
                                {healthData?.body_temperature || '--'}
                                <span className="text-xl text-sage-500 font-normal">°C</span>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Environmental Monitoring */}
                <section>
                    <h2 className="text-lg font-bold text-sage-800 mb-4">Environmental Safety</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Ambient Temperature */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white rounded-2xl p-5 border-2 border-sage-100"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <Thermometer className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <div className="text-sage-500 text-sm font-bold uppercase">Room Temp</div>
                                    <div className="text-sm font-bold text-sage-600">Comfortable</div>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-sage-900">
                                {environmentData?.ambient_temperature || 24}°C
                            </div>
                        </motion.div>

                        {/* Humidity */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl p-5 border-2 border-sage-100"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Droplets className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <div className="text-sage-500 text-sm font-bold uppercase">Humidity</div>
                                    <div className="text-sm font-bold text-sage-600">Normal</div>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-sage-900">
                                {environmentData?.humidity || 45}%
                            </div>
                        </motion.div>

                        {/* Air Quality */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white rounded-2xl p-5 border-2 border-sage-100"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                                    <Wind className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <div className="text-sage-500 text-sm font-bold uppercase">Air Quality</div>
                                    <div className="text-sm font-bold text-sage-600">Good</div>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-sage-900">
                                {environmentData?.air_quality || 'Good'}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Sensor Fusion Info */}
                <div className="bg-sage-50 rounded-2xl p-5 border-2 border-sage-100">
                    <h3 className="font-bold text-sage-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-sage-600" />
                        Context-Aware Monitoring
                    </h3>
                    <p className="text-sage-600 text-sm">
                        The system correlates vital signs with environmental conditions. For example,
                        elevated heart rate during high room temperature is analyzed differently than
                        elevated heart rate in normal conditions.
                    </p>
                </div>
            </main>
        </div>
    )
}
