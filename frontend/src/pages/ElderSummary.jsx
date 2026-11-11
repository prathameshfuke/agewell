import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useMedications } from '../hooks/useMedications'
import { ElderPage, Loading, ErrorNote } from '../components/ElderNav'

const MOOD = { good: 'Good', fine: 'Okay', unwell: 'Not well' }

export default function ElderSummary() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { schedule, completedMeds, missedMeds, loading, error, refresh } = useMedications(user?.id)
  const [checkins, setCheckins] = useState(null)

  useEffect(() => {
    if (!user?.id) return undefined
    let active = true
    api.getTodayCheckins(user.id).then((r) => active && setCheckins(r.success ? r.checkins || [] : []))
    return () => {
      active = false
    }
  }, [user?.id])

  const first = profile?.full_name?.split(' ')[0]
  const lastMood = checkins?.[0]?.mood

  return (
    <ElderPage title={first ? `Your day, ${first}` : 'Your day'} backTo="/elder/dashboard">
      {loading || checkins === null ? (
        <Loading />
      ) : error ? (
        <ErrorNote onRetry={() => refresh()}>We could not load your day. Check your connection and try again.</ErrorNote>
      ) : (
        <ul className="space-y-3">
          <li className="card !p-5">
            <p className="text-lg text-sage-600">Medicines</p>
            <p className="text-2xl font-bold">
              {schedule.length === 0
                ? 'None scheduled today'
                : `You took ${completedMeds.length} of ${schedule.length}${missedMeds.length ? `, skipped ${missedMeds.length}` : ''}`}
            </p>
          </li>
          <li className="card !p-5">
            <p className="text-lg text-sage-600">Check-ins</p>
            <p className="text-2xl font-bold">
              {checkins.length === 0 ? 'You have not checked in today' : `Checked in ${checkins.length} time${checkins.length > 1 ? 's' : ''}`}
            </p>
          </li>
          {lastMood && (
            <li className="card !p-5">
              <p className="text-lg text-sage-600">Last time you said you felt</p>
              <p className="text-2xl font-bold">{MOOD[lastMood] || lastMood}</p>
            </li>
          )}
        </ul>
      )}
      <button type="button" onClick={() => navigate('/elder/dashboard')} className="btn-primary w-full">Back to home</button>
    </ElderPage>
  )
}
