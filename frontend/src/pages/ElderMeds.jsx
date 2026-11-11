import { useNavigate } from 'react-router-dom'
import { Check, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMedications } from '../hooks/useMedications'
import { ElderPage, Split, Loading, ErrorNote, EmptyNote } from '../components/ElderNav'

const PERIODS = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
]

const timeOf = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '')

function Status({ status }) {
  if (status === 'taken') return <span className="badge-success"><Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />Taken</span>
  if (status === 'missed') return <span className="badge-neutral">Skipped</span>
  return <span className="badge-warning"><Clock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />To take</span>
}

export default function ElderMeds() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { groupedSchedule, schedule, loading, error, refresh, completedMeds, pendingMeds } = useMedications(user?.id)

  return (
    <ElderPage
      title="My medicines"
      art="pills"
      backTo="/elder/dashboard"
      subtitle={new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
    >
      {loading ? (
        <Loading label="Loading your medicines..." />
      ) : error ? (
        <ErrorNote onRetry={() => refresh()}>We could not load your medicines. Check your connection and try again.</ErrorNote>
      ) : schedule.length === 0 ? (
        <EmptyNote
          title="No medicines today"
          art="rest"
          action={<button type="button" onClick={() => navigate('/elder/meds/history')} className="btn-secondary">See past days</button>}
        >
          Nothing is scheduled for today. Your caregiver can add medicines for you.
        </EmptyNote>
      ) : (
        <Split
          asideFirst
          aside={
            <div>
              <p className="text-xl" aria-live="polite">
                {pendingMeds.length === 0
                  ? 'You have taken all your medicines today'
                  : `You have taken ${completedMeds.length} of ${schedule.length}`}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-2" role="presentation">
                <div className="h-full rounded-full bg-saffron transition-[width] duration-500" style={{ width: `${(completedMeds.length / schedule.length) * 100}%` }} />
              </div>
              <button type="button" onClick={() => navigate('/elder/meds/history')} className="btn-secondary mt-6 w-full">
                See past days
              </button>
            </div>
          }
        >
          {PERIODS.map(({ key, label }) => {
            const items = groupedSchedule[key] || []
            if (items.length === 0) return null
            return (
              <section key={key} aria-label={label}>
                <h2 className="mb-2 text-2xl">{label}</h2>
                <ul className="list">
                  {items.map((item, i) => (
                    <li key={item.log?.id || item.id || i} className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <p className="break-words text-xl font-bold">{item.medication?.name || 'Medicine'}</p>
                        <p className="text-base text-sage-600">
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
        </Split>
      )}
    </ElderPage>
  )
}
