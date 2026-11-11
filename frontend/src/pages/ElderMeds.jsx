import { useNavigate } from 'react-router-dom'
import { Check, Clock, Pill } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMedications } from '../hooks/useMedications'
import { ElderPage, Loading, ErrorNote, EmptyNote } from '../components/ElderNav'

const PERIODS = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
]

const timeOf = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '')

function Status({ status }) {
  if (status === 'taken') return <span className="badge-success"><Check className="h-4 w-4" aria-hidden="true" />Taken</span>
  if (status === 'missed') return <span className="badge-neutral">Skipped</span>
  return <span className="badge-warning"><Clock className="h-4 w-4" aria-hidden="true" />To take</span>
}

export default function ElderMeds() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { groupedSchedule, schedule, loading, error, refresh, completedMeds, pendingMeds } = useMedications(user?.id)

  return (
    <ElderPage
      title="My medicines"
      backTo="/elder/dashboard"
      subtitle={new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
    >
      {loading ? (
        <Loading label="Loading your medicines..." />
      ) : error ? (
        <ErrorNote onRetry={() => refresh()}>We could not load your medicines. Check your connection and try again.</ErrorNote>
      ) : schedule.length === 0 ? (
        <EmptyNote title="No medicines today">
          Nothing is scheduled for today. Your caregiver can add medicines for you.
        </EmptyNote>
      ) : (
        <>
          <p className="text-2xl font-bold" aria-live="polite">
            {pendingMeds.length === 0
              ? 'You have taken all your medicines today'
              : `You have taken ${completedMeds.length} of ${schedule.length}`}
          </p>
          {PERIODS.map(({ key, label }) => {
            const items = groupedSchedule[key] || []
            if (items.length === 0) return null
            return (
              <section key={key} aria-label={label}>
                <h2 className="mb-3 font-serif text-2xl font-bold">{label}</h2>
                <ul className="space-y-3">
                  {items.map((item, i) => (
                    <li key={item.log?.id || item.id || i} className="card flex items-center gap-4 !p-5">
                      <Pill className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold break-words">{item.medication?.name || 'Medicine'}</p>
                        <p className="text-lg text-sage-600">
                          {[item.medication?.dosage, timeOf(item.scheduled_time)].filter(Boolean).join(' at ')}
                        </p>
                      </div>
                      <Status status={item.status} />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </>
      )}
      <button type="button" onClick={() => navigate('/elder/meds/history')} className="btn-secondary w-full">
        See past days
      </button>
    </ElderPage>
  )
}
