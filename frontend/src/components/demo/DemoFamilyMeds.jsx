import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, AlertTriangle, CheckCircle, Plus, X } from 'lucide-react'
import DemoFamilyNav from './DemoFamilyNav'
import { Card, Button } from '../../components/ui'

export default function DemoFamilyMeds({ onNavigate, medications = [], onAddMedication }) {

    const [showAddModal, setShowAddModal] = useState(false)
    const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '' })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (newMed.name && newMed.dosage && newMed.time) {
            onAddMedication(newMed)
            setShowAddModal(false)
            setNewMed({ name: '', dosage: '', time: '' })
        }
    }

    return (
        <div className="min-h-screen bg-sage-50 font-sans pb-28 relative">
            <header className="px-5 py-5 bg-white border-b border-sage-100 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate('caregiver-dashboard')}
                        className="p-2 -ml-2 text-sage-500 hover:bg-sage-50 rounded-lg"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </motion.button>
                    <div>
                        <div className="text-sage-500 text-sm font-bold uppercase tracking-wide">Manage</div>
                        <h1 className="text-xl font-serif font-bold text-sage-900">Medications</h1>
                    </div>
                </div>
            </header>

            <div className="p-5 space-y-4">
                <Card className="bg-amber-50 border-amber-200">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-amber-500 mt-1" />
                        <div>
                            <h3 className="font-bold text-amber-900">Adherence Alert</h3>
                            <p className="text-amber-800 text-base mt-1">Metformin adherence has dropped below 90% this week.</p>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-between items-center pt-2">
                    <h2 className="font-bold text-sage-800 text-lg">Current Prescriptions</h2>
                    <Button size="sm" icon={Plus} onClick={() => setShowAddModal(true)} variant="primary">Add Med</Button>
                </div>

                {medications.map((med) => (
                    <motion.div key={med.id} whileTap={{ scale: 0.98 }}>
                        <Card>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-bold text-xl text-sage-900">{med.name}</div>
                                    <div className="text-sage-600 font-medium text-base">{med.dosage} • {med.freq || 'Daily'}</div>
                                </div>
                                <div className={`px-3 py-1 rounded-xl text-sm font-bold bg-sage-100 text-sage-800`}>
                                    Active
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-base text-sage-500 mt-2">
                                <Clock className="w-5 h-5" />
                                <span>Takes at {med.time}</span>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <DemoFamilyNav activeTab="caregiver-meds" onNavigate={onNavigate} />

            {/* Add Medication Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-sage-900/40 backdrop-blur-sm sm:p-4"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-serif font-bold text-sage-900">Add Medication</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 bg-sage-50 rounded-full text-sage-500">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-sage-700 mb-1">Medication Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. Lisinopril"
                                        value={newMed.name}
                                        onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-sage-700 mb-1">Dosage</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="e.g. 10mg"
                                            value={newMed.dosage}
                                            onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-sage-700 mb-1">Time</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="e.g. 8:00 AM"
                                            value={newMed.time}
                                            onChange={e => setNewMed({ ...newMed, time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" variant="primary" className="w-full">Add Schedule</Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
