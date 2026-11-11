import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Bell, Check, Siren, X, ChevronRight } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useMedications } from '../hooks/useMedications'
import { useNotifications } from '../hooks/useNotifications'
import { useVitals } from '../hooks/useVitals'
import { Loading, ErrorNote } from '../components/ElderNav'
import Art from '../components/shared/Art'

import { danceSticker as goodmoodSticker, fineSticker, notwellSticker } from '../assets/images'

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
  const reduce = useReducedMotion()
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
    { label: 'My medicines', art: 'pills', onClick: () => navigate('/elder/meds') },
    { label: 'How I feel', art: 'voice', onClick: () => setShowMood(true) },
    {
      label: 'Call family',
      hint: profile?.emergency_contact_name || (contactPhone ? '' : 'Add a number first'),
      art: 'call',
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
    <div className="min-h-dvh bg-paper pb-28 font-sans text-sage-900 lg:pb-12">
      <div className="mx-auto w-full max-w-[1120px] px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:pt-10 lg:px-10">
        <header className="flex items-center gap-3 sm:gap-5">
          <Art name="morning" eager className="h-16 shrink-0 sm:h-24 lg:h-28" />
          <div className="min-w-0 flex-1">
            <h1 className="break-words">{firstName ? `Hello, ${firstName}` : 'Hello'}</h1>
            <p className="mt-1 text-lg text-sage-600">
              {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-white hover:bg-paper-2"
          >
            <Bell className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-saffron px-1 text-sm font-bold text-sage-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </header>

        <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 space-y-8 lg:col-span-8">
            {/* The one focal element: today */}
            <section className="card sm:!p-8" aria-live="polite" aria-label="Today">
              {loading ? (
                <Loading label="Checking your medicines..." />
              ) : error ? (
                <ErrorNote onRetry={() => refresh()}>
                  {error === 'timeout'
                    ? 'This is taking longer than usual. Check your connection and try again.'
                    : 'We could not load your medicines. Check your connection and try again.'}
                </ErrorNote>
              ) : nextMedication ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-base text-sage-600">Next medicine</p>
                      <h2 className="mt-1 break-words text-4xl">{nextMedication.medication?.name || 'Medicine'}</h2>
                      <p className="mt-2 text-xl text-sage-700">
                        {[nextMedication.medication?.dosage, timeOf(nextMedication.scheduled_time)].filter(Boolean).join(' at ')}
                      </p>
                      {countdown && (
                        <p className="mt-3 inline-flex rounded-full bg-saffron-light px-3.5 py-1.5 text-base font-bold text-saffron-dark">{countdown}</p>
                      )}
                    </div>
                    <Art name="pills" className="h-24 shrink-0 sm:h-32" />
                  </div>
                  <button type="button" onClick={tookIt} disabled={busy} className="btn-primary mt-6 w-full text-xl">
                    <Check strokeWidth={1.75} aria-hidden="true" /> Take now
                  </button>
                  <div className="mt-2 flex flex-col sm:flex-row sm:gap-2">
                    <button type="button" onClick={notSure} disabled={busy} className="btn-ghost min-h-12 px-4 text-base sm:w-auto">I am not sure</button>
                    <button type="button" onClick={skipIt} disabled={busy} className="btn-ghost min-h-12 px-4 text-base sm:w-auto">Skip this one</button>
                  </div>
                </>
              ) : schedule.length > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-4xl">All done for today</h2>
                    <p className="mt-2 text-xl text-sage-700">
                      You took {completedMeds.length} of {schedule.length} medicines
                      {missedMeds.length > 0 ? `, and skipped ${missedMeds.length}` : ''}.
                    </p>
                  </div>
                  <Art name="done" className="h-24 shrink-0 sm:h-32" />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-3xl">No medicines today</h2>
                    <p className="mt-2 text-lg text-sage-600">Nothing is scheduled. Add your medicines to get reminders.</p>
                    <button type="button" onClick={() => navigate('/elder/meds')} className="btn-secondary mt-5 w-full sm:w-auto">See my medicines</button>
                  </div>
                  <Art name="rest" className="hidden h-28 shrink-0 sm:block" />
                </div>
              )}
              {message && <p className="mt-4 text-center text-lg font-bold text-sage-800" role="status">{message}</p>}
            </section>

            <nav className="list" aria-label="Main actions">
              {actions.map(({ label, hint, art, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="flex min-h-[72px] w-full items-center gap-4 px-1 py-3 text-left text-xl hover:bg-paper-2 sm:px-3 sm:text-2xl"
                >
                  <span className="flex w-14 shrink-0 justify-center"><Art name={art} className="h-12" /></span>
                  <span className="min-w-0 flex-1">
                    {label}
                    {hint && <span className="block text-base font-normal text-sage-600">{hint}</span>}
                  </span>
                  <ChevronRight className="h-6 w-6 shrink-0 text-sage-400" strokeWidth={1.75} aria-hidden="true" />
                </button>
              ))}
            </nav>
          </div>

          <aside className="flex min-w-0 flex-col gap-8 lg:col-span-4">
            <button type="button" onClick={() => navigate('/elder/emergency')} className="btn-danger w-full text-xl lg:order-2">
              <Siren strokeWidth={1.75} aria-hidden="true" /> Emergency
            </button>
            <button
              type="button"
              onClick={() => navigate('/elder/health')}
              className="band flex w-full items-center gap-4 text-left transition-transform duration-200 hover:-translate-y-0.5 lg:order-1"
            >
              <Art name="heart" className="h-16 shrink-0" />
              <span className="min-w-0">
                <span className="block text-xl font-bold">My health</span>
                <span className="mt-1 block text-lg font-normal text-sage-700">
                  {vitalsLine || (connected ? 'Connected. Waiting for readings.' : 'Device not connected')}
                </span>
              </span>
            </button>
          </aside>
        </div>
      </div>
      <AnimatePresence>
      {showMood && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-sage-900/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center" role="dialog" aria-modal="true" aria-label="How do you feel">
          <motion.div
            initial={reduce ? false : { y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { y: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-elevated">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl">How do you feel?</h2>
              <button type="button" onClick={() => setShowMood(false)} aria-label="Close" className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-paper-2">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {MOODS.map((m) => (
                <button key={m.key} type="button" onClick={() => sendMood(m.key)} className="flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-2xl border border-line p-3 hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                  <img src={m.sticker} alt="" className="sticker h-14 w-auto object-contain" />
                  <span className="text-lg font-bold">{m.label}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => navigate('/diagnosis/input')} className="btn-secondary mt-5 w-full">
              Check my symptoms
            </button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {showNotifications && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] bg-sage-900/40" onClick={() => setShowNotifications(false)}>
          <motion.aside
            initial={reduce ? false : { x: '100%' }} animate={{ x: 0 }} exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 38 }}
            role="dialog" aria-modal="true" aria-label="Notifications" className="absolute bottom-0 right-0 top-0 w-full max-w-md overflow-y-auto bg-white shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line p-5">
              <h2 className="text-3xl">Notifications</h2>
              <button type="button" onClick={() => setShowNotifications(false)} aria-label="Close notifications" className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-paper-2">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-lg text-sage-600">You have no notifications.</p>
            ) : (
              <ul className="divide-y divide-line">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => acknowledgeNotification(n.id)} className="w-full p-5 text-left hover:bg-paper-2">
                      <span className={`block text-lg ${n.status === 'active' ? 'font-bold' : ''}`}>{n.title}</span>
                      <span className="mt-1 block text-base text-sage-600">{n.message_elderly}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.aside>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
