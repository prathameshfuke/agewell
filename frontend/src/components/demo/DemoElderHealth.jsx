import { motion } from 'framer-motion'
import { Heart, Moon, Footprints, ArrowLeft, Activity, Thermometer, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import DemoElderNav from './DemoElderNav'

export default function DemoElderHealth({ onNavigate, onImOk }) {

    // Mock health data
    const healthData = {
        heartRate: { value: 74, unit: 'bpm', status: 'normal', trend: 'stable' },
        bloodOxygen: { value: 98, unit: '%', status: 'normal', trend: 'stable' },
        sleep: { hours: 7, minutes: 20, quality: 'restful', trend: 'up' },
        steps: { current: 3500, goal: 5000, trend: 'up' },
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
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-sage-50 font-sans pb-28">
            {/* Header */}
            <header className="px-5 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-sage-100">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate('elder-dashboard')}
                        className="p-2 -ml-2 text-sage-500 hover:bg-sage-50 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </motion.button>
                    <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-xl flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-serif font-bold text-sage-900">Health</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-5 py-6 space-y-6">
                {/* Greeting Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                    <h2 className="text-3xl font-serif font-bold text-sage-900">Health Overview</h2>
                    <p className="text-sage-600 text-lg font-medium">Your vitals today, Grandma Martha</p>
                </motion.div>

                {/* Daily Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 rounded-3xl p-5 text-white shadow-lg"
                >
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">✓</span>
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-xl mb-1">All Vitals Normal</div>
                            <div className="text-white/90 text-base font-medium">Your health readings are within target range.</div>
                        </div>
                    </div>
                </motion.div>

                {/* Health Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Heart Rate Card */}
                    <div className="bg-white rounded-3xl p-5 border border-sage-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                <Heart className="w-5 h-5 text-rose-500" />
                            </div>
                            {getTrendIcon(healthData.heartRate.trend)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-sage-900">{healthData.heartRate.value}</span>
                                <span className="text-sage-600 text-base font-medium">{healthData.heartRate.unit}</span>
                            </div>
                            <div className="text-sage-500 text-sm font-bold uppercase tracking-wide">Heart Rate</div>
                        </div>
                    </div>

                    {/* Blood Oxygen Card */}
                    <div className="bg-white rounded-3xl p-5 border border-sage-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Droplets className="w-5 h-5 text-blue-500" />
                            </div>
                            {getTrendIcon(healthData.bloodOxygen.trend)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-sage-900">{healthData.bloodOxygen.value}</span>
                                <span className="text-sage-600 text-base font-medium">{healthData.bloodOxygen.unit}</span>
                            </div>
                            <div className="text-sage-500 text-sm font-bold uppercase tracking-wide">Blood Oxygen</div>
                        </div>
                    </div>
                </div>

                {/* Sleep Card - Full Width */}
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-3xl p-5 shadow-lg text-white">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                <Moon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-white/90 text-sm font-bold uppercase tracking-wide">Last Night's Sleep</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-bold">{healthData.sleep.hours}h {healthData.sleep.minutes}m</span>
                        </div>
                    </div>
                </div>

                {/* Steps Card */}
                <div className="bg-white rounded-3xl p-5 border border-sage-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Footprints className="w-5 h-5 text-amber-600" />
                            </div>
                            <span className="text-sage-500 text-sm font-bold uppercase tracking-wide">Today's Steps</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full">On Track! 🎯</span>
                    </div>

                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-sage-900">{healthData.steps.current.toLocaleString()}</span>
                            </div>
                            <div className="text-sage-500 text-sm font-medium">of {healthData.steps.goal.toLocaleString()} goal</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 bg-sage-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(healthData.steps.current / healthData.steps.goal) * 100}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                        />
                    </div>
                </div>
            </main>

            <DemoElderNav activeTab="elder-health" onNavigate={onNavigate} onImOk={onImOk} />
        </div>
    )
}
