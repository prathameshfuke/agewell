import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertCircle, Pill, Plus, RefreshCw } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const localKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export default function FamilyMeds() {
    const navigate = useNavigate()
    const { linkedElderId } = useAuth()
    const [medications, setMedications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const loadMedications = useCallback(async () => {
        if (!linkedElderId) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError('')
        try {
            const [medsRes, logsRes] = await Promise.all([
                api.getMedications(linkedElderId),
                api.getAdherenceLogs(linkedElderId, 7),
            ])
            if (!medsRes?.success) throw new Error(medsRes?.error || 'The server did not return medications.')
            const logs = logsRes?.success ? logsRes.logs || [] : []
            const today = new Date()

            setMedications((medsRes.medications || []).map((med) => {
                const lastWeek = Array.from({ length: 7 }, (_, i) => {
                    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i))
                    const key = localKey(day)
                    return logs.some((l) => {
                        if (l.medication_id !== med.id && l.medication?.id !== med.id) return false
                        const ts = l.scheduled_time || l.created_at
                        return l.status === 'taken' && ts && localKey(new Date(ts)) === key
                    }) ? 1 : 0
                })
                const taken = lastWeek.filter(Boolean).length
                return { ...med, lastWeek, rate: Math.round((taken / 7) * 100), status: taken >= 5 ? 'consistent' : 'attention' }
            }))
            if (logsRes && logsRes.success === false) setError("Medications loaded, but the last 7 days of doses could not be loaded.")
        } catch (err) {
            setError(err.message || 'Could not load medications.')
        } finally {
            setLoading(false)
        }
    }, [linkedElderId])

    useEffect(() => {
        loadMedications()
    }, [loadMedications])

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-24 md:pb-8">
            <header className="px-4 md:px-6 py-4 flex items-center gap-3 border-b border-sage-200 sticky top-0 bg-cream-50 z-20">
                <button type="button" onClick={() => navigate('/family/dashboard')} aria-label="Back to dashboard" className={`w-11 h-11 rounded-full flex items-center justify-center text-sage-700 hover:bg-sage-100 ${focusRing}`}>
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-serif text-2xl text-sage-900">Medications</h1>
                    <p className="text-sm text-sage-500">Doses taken over the last 7 days</p>
                </div>
                <button type="button" onClick={loadMedications} disabled={loading} aria-label="Refresh medications" className={`w-11 h-11 rounded-full border border-sage-300 flex items-center justify-center text-sage-700 hover:bg-sage-50 disabled:opacity-50 ${focusRing}`}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            <main className="px-4 md:px-6 py-5 space-y-4 max-w-2xl mx-auto">
                {!linkedElderId ? (
                    <section className="rounded-2xl border border-sage-200 bg-white p-6">
                        <h2 className="font-serif text-xl text-sage-900">You are not linked to anyone yet</h2>
                        <p className="text-sage-600 mt-1">Link an account to see their medications.</p>
                        <button type="button" onClick={() => navigate('/link')} className="btn-primary mt-4 btn-sm">Enter a pairing code</button>
                    </section>
                ) : (
                    <>
                        {error && (
                            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                <p className="text-rose-800">{error}</p>
                                <button type="button" onClick={loadMedications} className={`mt-3 min-h-[44px] px-4 rounded-full border border-rose-300 text-sm font-semibold text-rose-800 hover:bg-rose-100 ${focusRing}`}>Try again</button>
                            </div>
                        )}

                        {loading && medications.length === 0 ? (
                            <p className="text-sage-500 text-center py-8">Loading medications...</p>
                        ) : medications.length === 0 && !error ? (
                            <section className="rounded-2xl border border-sage-200 bg-white p-8 text-center">
                                <Pill className="w-6 h-6 mx-auto text-sage-400 mb-2" aria-hidden="true" />
                                <h2 className="font-serif text-xl text-sage-900">No medications yet</h2>
                                <p className="text-sage-600 mt-1">Upload a prescription and we will add the medications for you.</p>
                                <button type="button" onClick={() => navigate('/family/prescription/upload')} className="btn-primary mt-4 btn-sm">
                                    <Plus className="w-4 h-4" /> Add a prescription
                                </button>
                            </section>
                        ) : (
                            <>
                                <ul className="space-y-3">
                                    {medications.map((med, i) => (
                                        <li key={med.id || i} className="rounded-2xl border border-sage-200 bg-white p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h2 className="text-sage-900 text-lg break-words">{med.name}</h2>
                                                    {med.dosage && <div className="text-sm text-sage-500">{med.dosage}</div>}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 ${med.status === 'consistent' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                                                    {med.status === 'consistent' ? <><CheckCircle className="w-3.5 h-3.5" /> Consistent</> : <><AlertCircle className="w-3.5 h-3.5" /> Needs attention</>}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-4" role="img" aria-label={`Taken on ${med.lastWeek.filter(Boolean).length} of the last 7 days`}>
                                                {med.lastWeek.map((d, j) => (
                                                    <div key={j} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${d ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-sage-50 text-sage-400 border border-sage-200'}`}>
                                                        {d ? '✓' : '–'}
                                                    </div>
                                                ))}
                                                <span className="text-sm text-sage-500 ml-auto">{med.rate}% this week</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <button type="button" onClick={() => navigate('/family/prescription/upload')} className="btn-secondary w-full btn-sm">
                                    <Plus className="w-4 h-4" /> Add a prescription
                                </button>
                            </>
                        )}
                        <p className="text-center text-sage-500 text-sm pt-2">View only. Medications are added by uploading a prescription.</p>
                    </>
                )}
            </main>
        </div>
    )
}
