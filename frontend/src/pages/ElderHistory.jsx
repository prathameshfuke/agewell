import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { ElderPage, Loading, ErrorNote, EmptyNote } from '../components/ElderNav'

const dayLabel = (d) => d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
const timeOf = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const STATUS = { taken: 'Taken', missed: 'Skipped', pending: 'Not taken' }

export default function ElderHistory() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [logs, setLogs] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user?.id) return
    setError('')
    setLogs(null)
    const result = await api.getAdherenceLogs(user.id, 14)
    if (result.success) setLogs(result.logs || [])
    else setError('We could not load your past medicines. Check your connection and try again.')
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  // Group by calendar day, newest first (logs already come newest first).
  const days = []
  for (const log of logs || []) {
    const when = new Date(log.scheduled_time)
    const label = dayLabel(when)
    let day = days.find((d) => d.label === label)
    if (!day) days.push((day = { label, items: [] }))
    day.items.push({ ...log, when })
  }

  return (
    <ElderPage title="Past medicines" subtitle="The last 14 days" art="done" backTo="/elder/meds">
      {error ? (
        <ErrorNote onRetry={load}>{error}</ErrorNote>
      ) : logs === null ? (
        <Loading />
      ) : days.length === 0 ? (
        <EmptyNote
          title="Nothing here yet"
          action={<button type="button" onClick={() => navigate('/elder/meds')} className="btn-secondary">See today's medicines</button>}
        >
          Your past medicines will show here after your first day.
        </EmptyNote>
      ) : (
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-x-12">
        {days.map((day) => (
          <section key={day.label} aria-label={day.label} className="min-w-0">
            <h2 className="mb-2 text-2xl">{day.label}</h2>
            <ul className="list">
              {day.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="break-words text-xl font-bold">{item.medication?.name || 'Medicine'}</p>
                    <p className="text-base text-sage-600">{timeOf(item.when)}</p>
                  </div>
                  <span className={item.status === 'taken' ? 'badge-success' : item.status === 'missed' ? 'badge-danger' : 'badge-neutral'}>
                    {STATUS[item.status] || 'Not taken'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        </div>
      )}
    </ElderPage>
  )
}
