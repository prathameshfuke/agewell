import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import CareTeamAvatars from '../components/dashboard/CareTeamAvatars'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export default function FamilyMembers() {
    const navigate = useNavigate()
    const { user, profile, linkedElderId } = useAuth()
    const [caregivers, setCaregivers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const load = useCallback(async () => {
        if (!linkedElderId) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await api.getLinkedCaregivers(linkedElderId)
            if (!res?.success) throw new Error(res?.error || 'The server did not return the care team.')
            setCaregivers(res.caregivers || [])
        } catch (err) {
            setError(err.message || 'Could not load the care team.')
        } finally {
            setLoading(false)
        }
    }, [linkedElderId])

    useEffect(() => {
        load()
    }, [load])

    const members = caregivers
        .filter((c) => c.caregiver)
        .map((c) => ({
            id: c.caregiver.id,
            name: c.caregiver.full_name || 'Unnamed',
            avatar: c.caregiver.avatar_url,
            role: c.status === 'active' || !c.status ? 'Caregiver' : `Caregiver (${c.status})`,
            isMe: c.caregiver.id === user?.id,
        }))
    // The signed-in caregiver may not be in the list (for example a dual-role account watching itself).
    if (user?.id && !members.some((m) => m.id === user.id)) {
        members.unshift({ id: user.id, name: profile?.full_name || 'You', role: 'Caregiver', isMe: true })
    }

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-24 md:pb-8">
            <header className="px-4 md:px-6 py-4 flex items-center gap-3 border-b border-sage-200 sticky top-0 bg-cream-50 z-20">
                <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className={`w-11 h-11 rounded-full flex items-center justify-center text-sage-700 hover:bg-sage-100 ${focusRing}`}>
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-serif text-2xl text-sage-900">Care team</h1>
                    <p className="text-sm text-sage-500">People who can see this health data</p>
                </div>
                <CareTeamAvatars members={members} maxDisplay={4} />
            </header>

            <main className="px-4 md:px-6 py-5 space-y-4 max-w-2xl mx-auto">
                {!linkedElderId ? (
                    <section className="rounded-2xl border border-sage-200 bg-white p-6">
                        <h2 className="font-serif text-xl text-sage-900">You are not linked to anyone yet</h2>
                        <p className="text-sage-600 mt-1">Enter a pairing code to start caring for someone.</p>
                        <button type="button" onClick={() => navigate('/link')} className="btn-primary mt-4 !min-h-[44px] !text-base">Enter a pairing code</button>
                    </section>
                ) : (
                    <>
                        <button type="button" onClick={() => navigate('/link')} className={`w-full min-h-[56px] rounded-2xl border border-dashed border-sage-300 bg-white text-sage-800 font-semibold flex items-center justify-center gap-2 hover:bg-sage-50 ${focusRing}`}>
                            <UserPlus className="w-5 h-5" aria-hidden="true" />
                            Add someone with a pairing code
                        </button>

                        {loading ? (
                            <p className="text-sage-500 text-center py-6">Loading care team...</p>
                        ) : error ? (
                            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                <p className="text-rose-800">Could not load the care team. {error}</p>
                                <button type="button" onClick={load} className={`mt-3 min-h-[44px] px-4 rounded-full border border-rose-300 text-sm font-semibold text-rose-800 hover:bg-rose-100 ${focusRing}`}>Try again</button>
                            </div>
                        ) : null}

                        {!loading && (
                            <ul className="rounded-2xl border border-sage-200 bg-white divide-y divide-sage-100">
                                {members.map((m) => (
                                    <li key={m.id} className="flex items-center gap-4 p-4">
                                        <CareTeamAvatars members={[m]} size="lg" />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sage-900 truncate">{m.name}{m.isMe && <span className="text-sage-500"> (you)</span>}</div>
                                            <div className="text-sm text-sage-500">{m.role}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <button type="button" onClick={() => navigate('/family/permissions')} className={`min-h-[44px] px-3 text-sm font-semibold text-primary rounded-full ${focusRing}`}>
                            Manage permissions
                        </button>
                    </>
                )}
            </main>
        </div>
    )
}
