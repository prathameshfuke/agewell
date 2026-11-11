import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { pills } from '../assets/images/gen'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import FamilyPage, { Art, Notice, NotLinked, lone } from '../components/family/FamilyPage'

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

    const refresh = (
        <button type="button" onClick={loadMedications} disabled={loading} aria-label="Refresh medications" className="btn-icon-ghost disabled:opacity-50">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
        </button>
    )
    const add = () => navigate('/family/prescription/upload')

    return (
        <FamilyPage title="Medications" sub="Doses taken over the last 7 days" back="/family/dashboard" art={pills} action={refresh}>
            {!linkedElderId ? (
                <NotLinked text="Link an account to see their medications." />
            ) : (
                <>
                    {error && <Notice onRetry={loadMedications}>{error}</Notice>}

                    {loading && medications.length === 0 ? (
                        <p className="text-ink-2">Loading medications...</p>
                    ) : medications.length === 0 && !error ? (
                        <section className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                            <Art src={pills} className="w-32 shrink-0 lg:hidden" />
                            <div>
                                <h2 className="font-serif text-3xl">No medications yet</h2>
                                <p className="mt-2 max-w-md text-ink-2">Upload a photo of a prescription and we will read the medicines for you to review.</p>
                                <button type="button" onClick={add} className={`btn-primary btn-sm mt-5 ${lone}`}>Add a prescription</button>
                            </div>
                        </section>
                    ) : medications.length > 0 && (
                        <section>
                            <ul className="divide-y divide-line border-y border-line">
                                {medications.map((med, i) => (
                                    <li key={med.id || i} className="py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
                                        <div className="min-w-0">
                                            <h2 className="break-words font-sans text-lg font-bold">{med.name}</h2>
                                            <p className={med.status === 'consistent' ? 'text-emerald-700' : 'text-clay-600'}>
                                                {med.dosage ? `${med.dosage} · ` : ''}{med.status === 'consistent' ? 'Consistent' : 'Needs attention'}, {med.rate}% this week
                                            </p>
                                        </div>
                                        <div className="mt-3 flex gap-1.5 sm:mt-0" role="img" aria-label={`Taken on ${med.lastWeek.filter(Boolean).length} of the last 7 days`}>
                                            {med.lastWeek.map((d, j) => (
                                                <span key={j} aria-hidden="true" className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${d ? 'bg-primary-100 text-primary-700' : 'bg-paper-2 text-ink-2'}`}>
                                                    {d ? '✓' : '–'}
                                                </span>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                                <button type="button" onClick={add} className={`btn-primary btn-sm ${lone}`}>Add a prescription</button>
                                <p className="text-ink-2">View only. Medications are added from a prescription.</p>
                            </div>
                        </section>
                    )}
                </>
            )}
        </FamilyPage>
    )
}
