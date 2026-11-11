import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Pill, Stethoscope, Phone, Siren, X, ChevronRight } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useMedications } from '../hooks/useMedications'
import { useNotifications } from '../hooks/useNotifications'
import { useVitals } from '../hooks/useVitals'
import { Loading, ErrorNote } from '../components/ElderNav'

import goodmoodSticker from '../assets/images/stickers/goodmood.jpeg'
import fineSticker from '../assets/images/stickers/fine.jpeg'
import notwellSticker from '../assets/images/stickers/notwell.jpeg'

const MOODS = [
  { key: 'good', label: 'Good', sticker: goodmoodSticker },
  { key: 'fine', label: 'Okay', sticker: fineSticker },
  { key: 'unwell', label: 'Not well', sticker: notwellSticker },
]

const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

function useCountdown(iso) {
  const [text, setText] = useState('')
  useEffect(() => {
    if (!iso) return undefined
    const tick = () => {
      const diff = new Date(iso) - new Date()
      if (diff <= 0) return setText('Time to take it now')
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setText(h > 0 ? `In ${h} h ${m} min` : `In ${m} min`)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [iso])
  return iso ? text : ''
}

export default function ElderDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const userId = user?.id

  const meds = useMedications(userId)
  const { nextMedication, schedule, completedMeds, missedMeds, loading, error, refresh } = meds
  const { notifications, unreadCount, acknowledgeNotification } = useNotifications(userId)
  const { readings, connected } = useVitals(userId)

  const [showNotifications, setShowNotifications] = useState(false)
  const [showMood, setShowMood] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const countdown = useCountdown(nextMedication?.scheduled_time)
  const firstName = profile?.full_name?.split(' ')[0]
  const contactPhone = profile?.emergency_contact_phone

  const logIdOf = (item) => item?.log?.id || item?.id

  const run = async (fn, failText) => {
    setBusy(true)
    setMessage('')
    try {
      const result = await fn()
      if (result && result.success === false) setMessage(failText)
      return result
    } catch {
      setMessage(failText)
      return null
    } finally {
      setBusy(false)
    }
  }

  const tookIt = () => {
    const id = logIdOf(nextMedication)
    if (!id) return setMessage('We could not find this dose. Please pull to refresh and try again.')
    return run(() => meds.markAsTaken(id), 'We could not save that. Check your connection and press the button again.')
  }

  const skipIt = () => {
    const id = logIdOf(nextMedication)
    if (id) run(() => meds.markAsMissed(id), 'We could not save that. Please try again.')
  }

  const notSure = async () => {
    const result = await run(
      () =>
        api.createAlert({
          user_id: userId,
          alert_type: 'medication',
          severity: 'medium',
          title: 'Unsure about a dose',
          message: `${nextMedication?.medication?.name || 'A medicine'}: unsure whether this dose was taken.`,
        }),
      'We could not tell your caregiver. Please call them instead.'
    )
    if (result?.success) setMessage('Your caregiver has been told. Wait before taking it.')
  }

  const sendMood = async (mood) => {
    setShowMood(false)
    const result = await run(() => api.submitCheckIn(userId, mood), 'We could not save how you feel. Please try again.')
    if (result?.success) setMessage(mood === 'unwell' ? 'Saved. If you feel worse, use Emergency.' : 'Saved. Thank you.')
  }

  const callFamily = () => {
    if (contactPhone) window.location.href = `tel:${contactPhone}`
    else navigate('/elder/settings')
  }

  const actions = [
    { label: 'My medicines', icon: Pill, onClick: () => navigate('/elder/meds') },
    { label: 'How I feel', icon: Stethoscope, onClick: () => setShowMood(true) },
    {
      label: 'Call family',
      hint: profile?.emergency_contact_name || (contactPhone ? '' : 'Add a number first'),
      icon: Phone,
      onClick: callFamily,
    },
  ]

  const vitalsLine = connected
    ? [
        readings.heartRate != null && `Heart rate ${readings.heartRate} bpm`,
        readings.spo2 != null && `Oxygen ${readings.spo2}%`,
      ].filter(Boolean).join('  ·  ')
    : ''

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-xl text-sage-900 pb-32 md:pb-12">
      <div className="mx-auto w-full max-w-2xl px-5 pt-8">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-4xl font-bold">{firstName ? `Hello, ${firstName}` : 'Hello'}</h1>
            <p className="mt-1 text-xl text-sage-600">
              {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            className="relative flex h-14 w-14 items-center justify-center rounded-full border border-sage-200 bg-white hover:bg-sage-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Bell className="h-6 w-6" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1 text-sm font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </header>

        {/* The one focal element: today */}
        <section className="card mt-8 animate-fade-in" aria-live="polite" aria-label="Today">
          {loading ? (
            <Loading label="Checking your medicines..." />
          ) : error ? (
            <ErrorNote onRetry={() => refresh()}>We could not load your medicines. Check your connection and try again.</ErrorNote>
          ) : nextMedication ? (
            <>
              <p className="text-lg font-bold text-sage-600">Next medicine</p>
              <h2 className="mt-1 font-serif text-4xl font-bold break-words">{nextMedication.medication?.name || 'Medicine'}</h2>
              <p className="mt-2 text-2xl text-sage-700">
                {[nextMedication.medication?.dosage, timeOf(nextMedication.scheduled_time)].filter(Boolean).join(' at ')}
              </p>
              {countdown && <p className="mt-1 text-xl text-sage-600">{countdown}</p>}
              <button type="button" onClick={tookIt} disabled={busy} className="btn-primary mt-6 w-full min-h-[64px] text-2xl">
                <Check className="h-7 w-7" aria-hidden="true" /> I took it
              </button>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={notSure} disabled={busy} className="btn-ghost">I am not sure</button>
                <button type="button" onClick={skipIt} disabled={busy} className="btn-ghost">Skip this one</button>
              </div>
            </>
          ) : schedule.length > 0 ? (
            <>
              <h2 className="font-serif text-4xl font-bold">All done for today</h2>
              <p className="mt-2 text-2xl text-sage-700">
                You took {completedMeds.length} of {schedule.length} medicines
                {missedMeds.length > 0 ? `, and skipped ${missedMeds.length}` : ''}.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-serif text-3xl font-bold">No medicines today</h2>
              <p className="mt-2 text-xl text-sage-600">Nothing is scheduled. Add your medicines to get reminders.</p>
              <button type="button" onClick={() => navigate('/elder/meds')} className="btn-secondary mt-5">See my medicines</button>
            </>
          )}
          {message && <p className="mt-4 text-center text-xl font-bold text-sage-800" role="status">{message}</p>}
        </section>

        <nav className="mt-6 space-y-3" aria-label="Main actions">
          {actions.map(({ label, hint, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="flex min-h-[64px] w-full items-center gap-4 rounded-full border border-sage-200 bg-white px-6 text-left text-2xl font-bold hover:border-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
              <span className="flex-1">
                {label}
                {hint && <span className="block text-base font-normal text-sage-600">{hint}</span>}
              </span>
              <ChevronRight className="h-6 w-6 text-sage-400" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => navigate('/elder/emergency')}
            className="btn-danger min-h-[64px] w-full justify-start gap-4 px-6 text-2xl"
          >
            <Siren className="h-7 w-7" aria-hidden="true" /> Emergency
          </button>
        </nav>

        <button
          type="button"
          onClick={() => navigate('/elder/health')}
          className="mt-6 w-full rounded-3xl border border-sage-200 bg-white p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="text-lg font-bold text-sage-600">My health</span>
          <span className="mt-1 block text-xl">
            {vitalsLine || (connected ? 'Connected. Waiting for readings.' : 'Device not connected')}
          </span>
        </button>
      </div>

      {showMood && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-sage-900/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="How do you feel">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl font-bold">How do you feel?</h2>
              <button type="button" onClick={() => setShowMood(false)} aria-label="Close" className="flex h-14 w-14 items-center justify-center rounded-full hover:bg-sage-100">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {MOODS.map((m) => (
                <button key={m.key} type="button" onClick={() => sendMood(m.key)} className="flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-2xl border border-sage-200 p-3 hover:border-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                  <img src={m.sticker} alt="" className="h-14 w-14 rounded-xl object-contain" />
                  <span className="text-lg font-bold">{m.label}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => navigate('/diagnosis/input')} className="btn-secondary mt-5 w-full">
              Check my symptoms
            </button>
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 z-[60] bg-sage-900/40" onClick={() => setShowNotifications(false)}>
          <aside role="dialog" aria-modal="true" aria-label="Notifications" className="absolute bottom-0 right-0 top-0 w-full max-w-md overflow-y-auto bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-sage-200 p-5">
              <h2 className="font-serif text-3xl font-bold">Notifications</h2>
              <button type="button" onClick={() => setShowNotifications(false)} aria-label="Close notifications" className="flex h-14 w-14 items-center justify-center rounded-full hover:bg-sage-100">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-xl text-sage-600">You have no notifications.</p>
            ) : (
              <ul className="divide-y divide-sage-100">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => acknowledgeNotification(n.id)} className="w-full p-5 text-left hover:bg-sage-50">
                      <span className={`block text-xl ${n.status === 'active' ? 'font-bold' : ''}`}>{n.title}</span>
                      <span className="mt-1 block text-lg text-sage-600">{n.message_elderly}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
