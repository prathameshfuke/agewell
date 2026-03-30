import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Moon, Footprints, ChevronRight, ArrowLeft, Activity, Thermometer, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import ElderNav from '../components/ElderNav'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'

export default function ElderHealth() {
    const navigate = useNavigate()
    const { user, profile } = useAuth()
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const getGreeting = () => {
        const hour = currentTime.getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    }

    const userName = profile?.full_name || user?.user_metadata?.full_name || 'there'

    const handleImOk = async () => {
        if (user?.id) {
            await api.submitCheckIn(user.id, 'good')
        }
        alert("Your family has been notified that you're doing well! 💚")
    }

    // Mock health data - in production, fetch from API/Supabase
    const healthData = {
        heartRate: { value: 72, unit: 'bpm', status: 'normal', trend: 'stable' },
        bloodOxygen: { value: 98, unit: '%', status: 'normal', trend: 'stable' },
        sleep: { hours: 7, minutes: 15, quality: 'restful', trend: 'up' },
        steps: { current: 3420, goal: 5000, trend: 'up' },
        temperature: { value: 98.4, unit: '°F', status: 'normal' }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'normal': return 'text-emerald-500'
            case 'low': return 'text-amber-500'
            case 'high': return 'text-rose-500'
            default: return 'text-sage-500'
        }
    }

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />
            case 'down': return <TrendingDown className="w-4 h-4 text-rose-500" />
            default: return <Minus className="w-4 h-4 text-sage-400" />
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50 font-sans pb-24 md:pb-0">
            {/* Header */}
            <header className="px-5 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-sage-100">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-sage-500 hover:bg-sage-50 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                    <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-xl flex items-center justify-center">
                                <Activity className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-xl font-serif font-bold text-sage-900">Health</h1>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center cursor-pointer"
                        >
                            <span className="text-lg">🔔</span>
                        </motion.div>
                    </div>
                </div>
            </header>

            <main className="px-5 py-6 space-y-6">
                {/* Greeting Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1"
                >
                    <h2 className="text-3xl font-serif font-bold text-sage-900">{getGreeting()}, {userName.split(' ')[0]}!</h2>
                    <p className="text-sage-500 text-lg">Your health overview for today</p>
                </motion.div>

                {/* Daily Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 rounded-3xl p-5 text-white shadow-lg"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8" />

                    <div className="relative z-10 flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center"
                        >
                            <span className="text-3xl">✓</span>
                        </motion.div>
                        <div className="flex-1">
                            <div className="font-bold text-xl mb-1">All Vitals Normal</div>
                            <div className="text-white/80 text-sm">Your health readings are within target range. Keep it up!</div>
                        </div>
                    </div>
                </motion.div>

                {/* Health Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Heart Rate Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-3xl p-5 border border-sage-100 shadow-sm cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                <Heart className="w-5 h-5 text-rose-500" />
                            </div>
                            {getTrendIcon(healthData.heartRate.trend)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-sage-900">{healthData.heartRate.value}</span>
                                <span className="text-sage-500 text-sm">{healthData.heartRate.unit}</span>
                            </div>
                            <div className="text-sage-500 text-xs font-medium uppercase tracking-wide">Heart Rate</div>
                            <div className={`text-sm font-medium capitalize ${getStatusColor(healthData.heartRate.status)}`}>
                                ● {healthData.heartRate.status}
                            </div>
                        </div>
                    </motion.div>

                    {/* Blood Oxygen Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-3xl p-5 border border-sage-100 shadow-sm cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Droplets className="w-5 h-5 text-blue-500" />
                            </div>
                            {getTrendIcon(healthData.bloodOxygen.trend)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-sage-900">{healthData.bloodOxygen.value}</span>
                                <span className="text-sage-500 text-sm">{healthData.bloodOxygen.unit}</span>
                            </div>
                            <div className="text-sage-500 text-xs font-medium uppercase tracking-wide">Blood Oxygen</div>
                            <div className={`text-sm font-medium capitalize ${getStatusColor(healthData.bloodOxygen.status)}`}>
                                ● {healthData.bloodOxygen.status}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sleep Card - Full Width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-3xl p-5 shadow-lg text-white overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16" />

                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                    <Moon className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-white/80 text-sm font-medium uppercase tracking-wide">Last Night's Sleep</span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-bold">{healthData.sleep.hours}h {healthData.sleep.minutes}m</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-white/80 capitalize">{healthData.sleep.quality} sleep</span>
                                <TrendingUp className="w-4 h-4 text-emerald-400 ml-2" />
                            </div>
                        </div>

                        {/* Sleep Quality Visualization */}
                        <div className="flex flex-col gap-1 items-end">
                            {['Deep', 'Light', 'REM', 'Awake'].map((stage, i) => (
                                <div key={stage} className="flex items-center gap-2 text-xs text-white/60">
                                    <span>{stage}</span>
                                    <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white/60 rounded-full"
                                            style={{ width: `${[75, 60, 45, 15][i]}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Steps Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-3xl p-5 border border-sage-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Footprints className="w-5 h-5 text-amber-600" />
                            </div>
                            <span className="text-sage-500 text-sm font-medium uppercase tracking-wide">Today's Steps</span>
                        </div>
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                            className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full"
                        >
                            On Track! 🎯
                        </motion.span>
                    </div>

                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-sage-900">{healthData.steps.current.toLocaleString()}</span>
                            </div>
                            <div className="text-sage-500 text-sm">of {healthData.steps.goal.toLocaleString()} goal</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-sage-700">
                                {Math.round((healthData.steps.current / healthData.steps.goal) * 100)}%
                            </div>
                            <div className="text-sage-400 text-xs">completed</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 bg-sage-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(healthData.steps.current / healthData.steps.goal) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </motion.div>
                    </div>

                    {/* Steps remaining */}
                    <div className="mt-3 text-center text-sage-500 text-sm">
                        Only <span className="font-bold text-sage-700">{(healthData.steps.goal - healthData.steps.current).toLocaleString()}</span> steps to go! Keep walking! 🚶
                    </div>
                </motion.div>

                {/* Temperature Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white rounded-3xl p-5 border border-sage-100 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Thermometer className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-sage-500 text-xs font-medium uppercase tracking-wide mb-1">Body Temperature</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-sage-900">{healthData.temperature.value}</span>
                                <span className="text-sage-500">{healthData.temperature.unit}</span>
                            </div>
                        </div>
                        <div className={`text-sm font-medium capitalize ${getStatusColor(healthData.temperature.status)}`}>
                            ● {healthData.temperature.status}
                        </div>
                    </div>
                </motion.div>

                {/* Quick Tip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-sage-50 to-cream-50 rounded-2xl p-4 border border-sage-100"
                >
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                            <div className="font-bold text-sage-800 mb-1">Daily Tip</div>
                            <div className="text-sage-600 text-sm">
                                Try to take a 10-minute walk after lunch. It helps with digestion and keeps your heart healthy!
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

            <ElderNav onImOk={handleImOk} />

            {/* Shimmer animation for progress bar */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    )
}
