import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Pill, Plus, RefreshCw } from 'lucide-react'
import { api } from '../api/client'
import FamilyNav from '../components/FamilyNav'

import { useAuth } from '../contexts/AuthContext'

// Import sticker
import doneSticker from '../assets/images/stickers/done.jpeg'

export default function FamilyMeds() {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const [medications, setMedications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile) {
            loadMedications()
        }
    }, [profile])

    const loadMedications = async () => {
        setLoading(true)

        const elderId = profile?.linked_elderly_id

        if (!elderId) {
            setLoading(false)
            return
        }

        try {
            // Parallel fetch: Meds + Adherence Logs
            const [medsRes, logsRes] = await Promise.all([
                api.getMedications(elderId),
                api.getAdherenceLogs(elderId, 7) // Last 7 days
            ])

            if (medsRes.success) {
                const logs = logsRes.success ? logsRes.logs : []
                const now = new Date()
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

                const medsWithAdherence = (medsRes.medications || []).map(med => {
                    // Calculate last 7 days adherence
                    // Array of 0/1 for last 7 days (including today)
                    const lastWeek = Array(7).fill(0).map((_, i) => {
                        const d = new Date(today)
                        d.setDate(d.getDate() - (6 - i)) // 6 days ago ... to today
                        const dateStr = d.toISOString().split('T')[0]

                        // Find logs for this med on this date
                        // Note: logs might have taken_time or created_at
                        const dayLogs = logs.filter(l =>
                            (l.medication_id === med.id || l.medication?.id === med.id) &&
                            (l.taken_at || l.created_at)?.startsWith(dateStr)
                        )

                        return dayLogs.some(l => l.status === 'taken') ? 1 : 0
                    })

                    // Calculate status based on recent adherence
                    const takenCount = lastWeek.filter(x => x === 1).length
                    const status = takenCount >= 5 ? 'consistent' : 'attention'

                    return {
                        ...med,
                        status,
                        lastWeek
                    }
                })
                setMedications(medsWithAdherence)
            }
        } catch (error) {
            console.error("Error loading meds:", error)
        }
        setLoading(false)
    }

    const getAdherenceRate = (lastWeek) => {
        const taken = lastWeek.filter(d => d === 1).length
        return Math.round((taken / 7) * 100)
    }

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-24 md:pb-0">
            {/* Header */}
            <header className="px-6 py-5 flex items-center gap-4 bg-cream-50 sticky top-0 z-10">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/family/dashboard')}
                    className="p-2 text-sage-500 hover:bg-sage-100 rounded-xl"
                >
                    <ArrowLeft className="w-6 h-6" />
                </motion.button>
                <div className="flex-1">
                    <h1 className="text-2xl font-serif font-bold text-sage-900">Medications</h1>
                    <p className="text-sage-500">Oversight & adherence tracking</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={loadMedications}
                    className="p-3 bg-sage-100 rounded-xl text-sage-600"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </motion.button>
            </header>

            <main className="px-6 space-y-4">
                {loading ? (
                    <div className="bg-white rounded-3xl p-8 border-2 border-sage-100 text-center">
                        <RefreshCw className="w-8 h-8 text-sage-400 animate-spin mx-auto mb-2" />
                        <p className="text-sage-500">Loading medications...</p>
                    </div>
                ) : !profile?.linked_elderly_id ? (
                    <div className="bg-white rounded-3xl p-8 border-2 border-sage-100 text-center">
                        <AlertCircle className="w-12 h-12 text-sage-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-sage-800 mb-2">No Elder Linked</h3>
                        <p className="text-sage-500 mb-4">You need to pair with an elder to view their medications.</p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/family/dashboard')}
                            className="px-6 py-3 bg-sage-500 text-white rounded-xl font-bold mx-auto"
                        >
                            Go to Dashboard to Pair
                        </motion.button>
                    </div>
                ) : medications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-8 border-2 border-sage-100 text-center"
                    >
                        <div className="w-24 h-24 bg-sage-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Pill className="w-12 h-12 text-sage-400" />
                        </div>
                        <h3 className="text-xl font-bold text-sage-800 mb-2">No Medications</h3>
                        <p className="text-sage-500 mb-4">Upload a prescription to add medications</p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/family/prescription/upload')}
                            className="px-6 py-3 bg-sage-500 text-white rounded-xl font-bold flex items-center gap-2 mx-auto"
                        >
                            <Plus className="w-5 h-5" />
                            Add Prescription
                        </motion.button>
                    </motion.div>
                ) : (
                    <>
                        {medications.map((med, i) => (
                            <motion.div
                                key={med.id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white p-5 rounded-2xl border-2 border-sage-100"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center">
                                            <Pill className="w-6 h-6 text-sage-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-sage-900">{med.name}</h3>
                                            <div className="text-sage-500">{med.dosage}</div>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 ${med.status === 'consistent'
                                        ? 'bg-sage-100 text-sage-700'
                                        : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {med.status === 'consistent' ? (
                                            <><CheckCircle className="w-4 h-4" /> Consistent</>
                                        ) : (
                                            <><AlertCircle className="w-4 h-4" /> Attention</>
                                        )}
                                    </div>
                                </div>

                                {/* Last 7 Days */}
                                <div className="flex items-center gap-3 bg-sage-50 rounded-xl p-3">
                                    <Clock className="w-4 h-4 text-sage-400" />
                                    <div className="flex gap-1.5">
                                        {med.lastWeek.map((day, j) => (
                                            <div
                                                key={j}
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${day === 1
                                                    ? 'bg-sage-200 text-sage-700'
                                                    : 'bg-rose-100 text-rose-500'
                                                    }`}
                                            >
                                                {day === 1 ? '✓' : '✗'}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm text-sage-500 ml-auto font-medium">
                                        {getAdherenceRate(med.lastWeek)}% this week
                                    </span>
                                </div>
                            </motion.div>
                        ))}

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/family/prescription/upload')}
                            className="w-full py-4 bg-sage-100 text-sage-700 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 border-dashed border-sage-300"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Prescription
                        </motion.button>
                    </>
                )}

                <p className="text-center text-sage-400 text-sm pt-4">
                    View only. Medications are managed via Prescription Upload.
                </p>
            </main>

            <FamilyNav />
        </div>
    )
}
