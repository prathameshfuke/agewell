import { useNavigate, useLocation } from 'react-router-dom'
import { notify } from '../lib/notify'
import { Loader2 } from 'lucide-react'
import { done } from '../assets/images/gen'
import { useState, useEffect } from 'react'
import { api } from '../api/client'
import FamilyPage, { Art, lone, textBtn } from '../components/family/FamilyPage'
import { useAuth } from '../contexts/AuthContext'

const PRESCRIPTION_REVIEW_STORAGE_KEY = 'agewell_prescription_review_data'
const PRESCRIPTION_MEDS_DRAFT_KEY = 'agewell_prescription_review_meds_draft'

export default function PrescriptionReview() {
    const navigate = useNavigate()
    const location = useLocation()
    const { profile, linkedElderId } = useAuth()
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
        if (!linkedElderId) {
            notify('No elder linked. Please pair first.', { error: true })
            return
        }

        setSaving(true)

        try {
            // Add each medication to the backend
            for (const med of medications) {
                await api.addMedication({
                    user_id: linkedElderId,
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
            notify('Failed to save. Please try again.', { error: true })
        } finally {
            setSaving(false)
        }
    }

    const field = 'input !min-h-[48px]'

    return (
        <FamilyPage
            title="Review medicines"
            sub="Check each medicine before it is added to the schedule."
            back
            aside={
                <section>
                    <p className="font-serif text-6xl leading-none">{medications.length}</p>
                    <p className="mt-1 text-lg text-ink-2">medicines found</p>
                    {uncertainCount > 0 && <p className="mt-2 font-bold text-clay-600">{uncertainCount} need your review</p>}
                    <button
                        type="button"
                        onClick={handleConfirmAll}
                        disabled={saved || saving || medications.length === 0}
                        className={`btn-primary mt-6 ${lone}`}
                    >
                        {saving ? <><Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Creating schedule...</> : saved ? 'Schedule created' : 'Confirm and create schedule'}
                    </button>
                    <p className="mt-3 text-ink-2">You can edit the schedule anytime after confirming.</p>
                    <button type="button" onClick={() => navigate('/family/prescription/upload')} className={`${textBtn} mt-2`}>Not right? Upload again</button>
                </section>
            }
        >
            {saved && (
                <section className="flex items-center gap-5">
                    <Art src={done} className="w-24 shrink-0" />
                    <p className="font-serif text-3xl">Schedule created. Taking you to the dashboard.</p>
                </section>
            )}

            <section aria-label="Medicines">
                <ul className="divide-y divide-line border-y border-line">
                    {medications.map((med) => {
                        const editing = editingId === med.id
                        return (
                            <li key={med.id} className="py-5">
                                {editing ? (
                                    <div className="max-w-md space-y-3">
                                        <input type="text" aria-label="Medicine name" value={med.name} onChange={(e) => handleEdit(med.id, 'name', e.target.value)} placeholder="Medicine name" className={field} autoFocus />
                                        <input type="text" aria-label="Dosage" value={med.dosage} onChange={(e) => handleEdit(med.id, 'dosage', e.target.value)} placeholder="Dosage (e.g. 10mg)" className={field} />
                                        <input type="text" aria-label="Frequency" value={med.frequency} onChange={(e) => handleEdit(med.id, 'frequency', e.target.value)} placeholder="Frequency (e.g. once daily)" className={field} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between gap-3">
                                            <h2 className="break-words font-sans text-xl font-bold">{med.name || 'Unknown medicine'}</h2>
                                            {med.confirmed ? (
                                                <span className="shrink-0 font-bold text-emerald-700">Confirmed</span>
                                            ) : med.uncertain ? (
                                                <span className="shrink-0 font-bold text-clay-600">Check this one</span>
                                            ) : null}
                                        </div>
                                        <p className="text-ink-2">{med.dosage || 'Dosage not specified'} · {med.frequency || 'Timing not specified'}</p>
                                        {med.uncertain && !med.confirmed && <p className="mt-1 text-clay-600">Please verify this medicine before confirming.</p>}
                                    </>
                                )}

                                {!med.confirmed && (
                                    <div className="btn-row mt-4 sm:max-w-xs">
                                        <button type="button" onClick={() => handleConfirm(med.id)} disabled={!med.name} className="btn-secondary btn-sm">{editing ? 'Save' : 'Confirm'}</button>
                                        {!editing && <button type="button" onClick={() => setEditingId(med.id)} className="btn-secondary btn-sm">Edit</button>}
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </section>
        </FamilyPage>
    )
}
