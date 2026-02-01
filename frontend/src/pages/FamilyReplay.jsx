import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Pill, Heart, AlertCircle, CheckCircle } from 'lucide-react'
import { useActivity } from '../hooks/useActivity'
import FamilyNav from '../components/FamilyNav'

const USER_ID = 2; // Caregiver

export default function FamilyReplay() {
    const navigate = useNavigate()
    const { activities, grouped, loading, error, stats, selectedDate } = useActivity(USER_ID)

    const formatDate = (dateStr) => {
        if (!dateStr) {
            return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        }
        return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }

    const getEventIcon = (type) => {
        switch (type) {
            case 'medication':
                return <Pill className="w-5 h-5" />
            case 'check_in':
                return <Heart className="w-5 h-5" />
            case 'alert':
                return <AlertCircle className="w-5 h-5" />
            default:
                return <CheckCircle className="w-5 h-5" />
        }
    }

    const getEventColor = (type, status) => {
        if (status === 'warning') return 'bg-amber-100 border-amber-200 text-amber-700'
        switch (type) {
            case 'medication':
                return 'bg-sage-100 border-sage-200 text-sage-700'
            case 'check_in':
                return 'bg-rose-50 border-rose-100 text-rose-600'
            case 'alert':
                return 'bg-amber-100 border-amber-200 text-amber-700'
            default:
                return 'bg-sage-50 border-sage-100 text-sage-600'
        }
    }

    const periods = [
        { key: 'morning', label: 'Morning', icon: '🌅' },
        { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
        { key: 'evening', label: 'Evening', icon: '🌙' },
    ]

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-28">
            {/* Header */}
            <header className="px-6 py-5 flex items-center gap-4 sticky top-0 bg-cream-50 z-10 border-b border-sage-100">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(-1)}
                    className="p-3 text-sage-500 hover:bg-sage-50 rounded-xl"
                >
                    <ArrowLeft className="w-6 h-6" />
                </motion.button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-sage-800">Day Replay</h1>
                    <div className="text-sage-500">{formatDate(selectedDate)}</div>
                </div>
                <button className="p-3 text-sage-400 hover:bg-sage-50 rounded-xl">
                    <Calendar className="w-6 h-6" />
                </button>
            </header>

            <main className="px-6 py-5 space-y-6">
                {/* Summary Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-5 border-2 border-sage-100 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-sage-100 rounded-2xl flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-sage-600" />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-sage-800">
                                {stats.alerts > 0 ? 'Needs Attention' : 'All Good Today'}
                            </div>
                            <div className="text-sage-500">
                                {stats.medicationsTaken} medications • {stats.checkIns} check-ins
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Loading */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="loading-spinner mx-auto" />
                        <p className="text-sage-500 mt-4 text-lg">Loading timeline...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 text-center">
                        <p className="text-rose-600">Failed to load activity</p>
                    </div>
                )}

                {/* Narrative Timeline by Period */}
                {!loading && !error && periods.map((period, periodIdx) => {
                    const items = grouped[period.key] || []
                    if (items.length === 0) return null

                    return (
                        <motion.div
                            key={period.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: periodIdx * 0.1 }}
                        >
                            {/* Period Header */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">{period.icon}</span>
                                <span className="text-lg font-bold text-sage-700">{period.label}</span>
                            </div>

                            {/* Event Cards */}
                            <div className="space-y-3">
                                {items.map((event, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white rounded-2xl p-4 border-2 border-sage-100"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getEventColor(event.type, event.status)}`}>
                                                {event.icon ? (
                                                    <span className="text-lg">{event.icon}</span>
                                                ) : (
                                                    getEventIcon(event.type)
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-sage-800">{event.title}</span>
                                                    <span className="text-sage-400 text-sm">{event.time}</span>
                                                </div>
                                                <p className="text-sage-500 mt-1">{event.detail}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )
                })}

                {/* Empty State */}
                {!loading && !error && activities.length === 0 && (
                    <div className="text-center py-16 text-sage-400">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-xl">No activity recorded</p>
                    </div>
                )}
            </main>

            <FamilyNav />
        </div>
    )
}
