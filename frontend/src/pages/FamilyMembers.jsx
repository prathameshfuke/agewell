import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { family } from '../assets/images/gen'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import CareTeamAvatars from '../components/dashboard/CareTeamAvatars'
import FamilyPage, { Notice, NotLinked, lone, textBtn } from '../components/family/FamilyPage'

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
        <FamilyPage
            title="Care team"
            sub="People who can see this health data"
            back
            art={family}
            wide
            action={<CareTeamAvatars members={members} maxDisplay={4} className="hidden sm:flex" />}
        >
            {!linkedElderId ? (
                <NotLinked />
            ) : (
                <section>
                    {loading ? (
                        <p className="text-ink-2">Loading care team...</p>
                    ) : error ? (
                        <Notice onRetry={load}>Could not load the care team. {error}</Notice>
                    ) : (
                        <ul className="divide-y divide-line border-y border-line">
                            {members.map((m) => (
                                <li key={m.id} className="flex items-center gap-4 py-4">
                                    <CareTeamAvatars members={[m]} size="lg" />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-lg">{m.name}{m.isMe && <span className="text-ink-2"> (you)</span>}</div>
                                        <div className="text-sm text-ink-2">{m.role}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                        <button type="button" onClick={() => navigate('/link')} className={`btn-primary btn-sm ${lone}`}>Add someone with a pairing code</button>
                        <button type="button" onClick={() => navigate('/family/permissions')} className={`${textBtn} justify-center`}>Manage permissions</button>
                    </div>
                </section>
            )}
        </FamilyPage>
    )
}
