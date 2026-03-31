import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ArrowLeft, AlertTriangle, Edit3, Loader2, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '../api/client'
import FamilyNav from '../components/FamilyNav'
import { useAuth } from '../contexts/AuthContext'

const PRESCRIPTION_REVIEW_STORAGE_KEY = 'agewell_prescription_review_data'
const PRESCRIPTION_MEDS_DRAFT_KEY = 'agewell_prescription_review_meds_draft'

export default function PrescriptionReview() {
    const navigate = useNavigate()
    const location = useLocation()
    const { profile } = useAuth()
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [medications, setMedications] = useState([])
    const [editingId, setEditingId] = useState(null)

    // Get prescription data from navigation state, or restore after refresh.
    const prescriptionData = useState(() => {
        if (location.state?.prescription) return location.state.prescription

        try {
            const raw = sessionStorage.getItem(PRESCRIPTION_REVIEW_STORAGE_KEY)
            return raw ? JSON.parse(raw) : null
        } catch {
            return null
        }
    })[0]
    const parsedMeds = prescriptionData?.parsed_data?.medications || []

    // Initialize medications from parsed data
    useEffect(() => {
        if (!prescriptionData) {
            navigate('/family/prescription/upload', { replace: true })
            return
        }

        let draftMeds = null
        try {
            const rawDraft = sessionStorage.getItem(PRESCRIPTION_MEDS_DRAFT_KEY)
            draftMeds = rawDraft ? JSON.parse(rawDraft) : null
        } catch {
            draftMeds = null
        }

        if (Array.isArray(draftMeds) && draftMeds.length > 0) {
            setMedications(draftMeds)
            return
        }

        const meds = parsedMeds.map((med, i) => ({
            id: i,
            name: med.name || '',
            dosage: med.dosage || '',
            frequency: med.frequency || '',
            type: med.type || 'pill',
            schedule_times: med.schedule_times || ['08:00'],
            special_instructions: med.special_instructions || '',
            confirmed: false,
            uncertain: !med.dosage || !med.name || med.name.toLowerCase().includes('unknown')
        }))
        setMedications(meds)
    }, [navigate, parsedMeds, prescriptionData])

    useEffect(() => {
        if (!Array.isArray(medications) || medications.length === 0) return
        try {
            sessionStorage.setItem(PRESCRIPTION_MEDS_DRAFT_KEY, JSON.stringify(medications))
        } catch {
            // Ignore storage failures.
        }
    }, [medications])

    const uncertainCount = medications.filter(m => m.uncertain && !m.confirmed).length

    const handleConfirm = (id) => {
        setMedications(prev => prev.map(m =>
            m.id === id ? { ...m, confirmed: true } : m
        ))
        setEditingId(null)
    }

    const handleEdit = (id, field, value) => {
        setMedications(prev => prev.map(m =>
            m.id === id ? { ...m, [field]: value, uncertain: false } : m
        ))
    }

    const handleConfirmAll = async () => {
        if (!profile?.linked_elderly_id) {
            alert('No elder linked. Please pair first.')
            return
        }

        setSaving(true)

        try {
            // Add each medication to the backend
            for (const med of medications) {
                await api.addMedication({
                    user_id: profile.linked_elderly_id,
                    name: med.name,
                    dosage: med.dosage,
                    frequency: med.frequency,
                    type: med.type,
                    schedule_times: med.schedule_times,
                    special_instructions: med.special_instructions,
                    start_date: new Date().toISOString().split('T')[0]
                })
            }

            setSaved(true)
            sessionStorage.removeItem(PRESCRIPTION_REVIEW_STORAGE_KEY)
            sessionStorage.removeItem(PRESCRIPTION_MEDS_DRAFT_KEY)
            setTimeout(() => {
                navigate('/family/dashboard')
            }, 1500)
        } catch (err) {
            console.error('Failed to save medications:', err)
            alert('Failed to save. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-24 md:pb-0">
            {/* Header */}
            <header className="px-6 py-5 flex items-center gap-4 sticky top-0 bg-cream-50 z-10 border-b border-sage-100">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(-1)}
                    className="p-3 text-sage-500 hover:bg-sage-50 rounded-xl"
                >
                    <ArrowLeft className="w-6 h-6" />
                </motion.button>
                <h1 className="text-xl font-bold text-sage-800">Review Medicines</h1>
            </header>

            <main className="px-6 py-5 space-y-5">
                {/* Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="text-5xl font-bold text-sage-800">{medications.length}</div>
                    <div className="text-xl text-sage-500">medicines found</div>
                    {uncertainCount > 0 && (
                        <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-700">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">{uncertainCount} need your review</span>
                        </div>
                    )}
                </motion.div>

                {/* Medicine Cards */}
                <div className="space-y-4">
                    {medications.map((med, i) => (
                        <motion.div
                            key={med.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`bg-white rounded-2xl p-5 border-2 ${med.confirmed ? 'border-sage-300 bg-sage-50/50' :
                                med.uncertain ? 'border-amber-200' : 'border-sage-100'
                                } shadow-sm`}
                        >
                            {/* Medicine Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    {editingId === med.id ? (
                                        <input
                                            type="text"
                                            value={med.name}
                                            onChange={(e) => handleEdit(med.id, 'name', e.target.value)}
                                            placeholder="Medicine name"
                                            className="text-xl font-bold text-sage-800 bg-transparent border-b-2 border-sage-300 focus:outline-none focus:border-sage-500 w-full"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="text-xl font-bold text-sage-800">{med.name || 'Unknown Medicine'}</div>
                                    )}
                                </div>

                                {/* Status Badge */}
                                {med.confirmed ? (
                                    <span className="px-3 py-1 bg-sage-100 text-sage-700 rounded-full text-sm font-bold flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" />
                                        Confirmed
                                    </span>
                                ) : med.uncertain ? (
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        Review
                                    </span>
                                ) : null}
                            </div>

                            {/* Medicine Details */}
                            <div className="space-y-2 text-sage-600">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">💊</span>
                                    {editingId === med.id ? (
                                        <input
                                            type="text"
                                            value={med.dosage}
                                            onChange={(e) => handleEdit(med.id, 'dosage', e.target.value)}
                                            placeholder="Dosage (e.g., 10mg)"
                                            className="bg-transparent border-b border-sage-300 focus:outline-none focus:border-sage-500 flex-1"
                                        />
                                    ) : (
                                        <span>{med.dosage || 'Dosage not specified'}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🕐</span>
                                    {editingId === med.id ? (
                                        <input
                                            type="text"
                                            value={med.frequency}
                                            onChange={(e) => handleEdit(med.id, 'frequency', e.target.value)}
                                            placeholder="Frequency (e.g., Once daily)"
                                            className="bg-transparent border-b border-sage-300 focus:outline-none focus:border-sage-500 flex-1"
                                        />
                                    ) : (
                                        <span>{med.frequency || 'Timing not specified'}</span>
                                    )}
                                </div>
                            </div>

                            {/* Warning for uncertain items */}
                            {med.uncertain && !med.confirmed && editingId !== med.id && (
                                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                    <p className="text-amber-700 text-sm">
                                        Please verify this medicine's details before confirming.
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            {!med.confirmed && (
                                <div className="flex gap-3 mt-4">
                                    {editingId === med.id ? (
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleConfirm(med.id)}
                                            disabled={!med.name}
                                            className="flex-1 bg-sage-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Save & Confirm
                                        </motion.button>
                                    ) : (
                                        <>
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleConfirm(med.id)}
                                                className="flex-1 bg-sage-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Confirm
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setEditingId(med.id)}
                                                className="px-4 py-3 bg-sage-100 text-sage-700 rounded-xl font-bold flex items-center justify-center gap-2"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                                Edit
                                            </motion.button>
                                        </>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Re-upload Option */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => navigate('/family/prescription/upload')}
                    className="w-full text-sage-400 font-medium py-4 text-center"
                >
                    Not right? Go back and re-upload →
                </motion.button>
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-16 left-0 right-0 p-6 bg-white border-t border-sage-100">
                <motion.button
                    whileTap={{ scale: saved || saving ? 1 : 0.98 }}
                    onClick={handleConfirmAll}
                    disabled={saved || saving || medications.length === 0}
                    className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 ${saved
                        ? 'bg-sage-500 text-white'
                        : 'bg-sage-800 text-white disabled:opacity-50'
                        }`}
                >
                    <AnimatePresence mode="wait">
                        {saving ? (
                            <motion.span
                                key="saving"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Creating Schedule...
                            </motion.span>
                        ) : saved ? (
                            <motion.span
                                key="saved"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-2"
                            >
                                <CheckCircle className="w-6 h-6" />
                                Schedule Created!
                            </motion.span>
                        ) : (
                            <motion.span
                                key="default"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                Confirm & Generate Schedule
                                <ArrowRight className="w-6 h-6" />
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
                <p className="text-center text-sage-400 text-sm mt-3">
                    You can edit the schedule anytime after confirmation
                </p>
            </div>

            <FamilyNav />
        </div>
    )
}
