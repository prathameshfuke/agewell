import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

function Row({ title, description, onClick }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={`w-full min-h-[56px] px-4 py-3 flex items-center gap-3 text-left hover:bg-sage-50 ${focusRing}`}>
        <span className="flex-1 min-w-0">
          <span className="block text-sage-900">{title}</span>
          {description && <span className="block text-sm text-sage-500">{description}</span>}
        </span>
        <ChevronRight className="w-5 h-5 text-sage-400 flex-shrink-0" aria-hidden="true" />
      </button>
    </li>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-serif text-lg text-sage-900 mb-2">{title}</h2>
      <ul className="rounded-2xl border border-sage-200 bg-white divide-y divide-sage-100 overflow-hidden">{children}</ul>
    </section>
  )
}

function ChangePin({ onChange }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [status, setStatus] = useState({ ok: true, text: '' })
  const [busy, setBusy] = useState(false)
  const valid = /^\d{4}$/.test(current) && /^\d{4}$/.test(next)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await onChange(next, current)
      if (result.ok) {
        setStatus({ ok: true, text: 'PIN changed.' })
        setCurrent('')
        setNext('')
      } else if (result.error === 'locked') {
        setStatus({ ok: false, text: 'Too many wrong PINs. Try again in 15 minutes.' })
      } else if (result.error === 'wrong_pin') {
        setStatus({ ok: false, text: `The current PIN is wrong. ${result.attempts_left ?? 0} attempts left.` })
      } else {
        setStatus({ ok: false, text: 'Could not change the PIN. Try again.' })
      }
    } catch {
      setStatus({ ok: false, text: 'Could not reach the server. Check your connection and try again.' })
    } finally {
      setBusy(false)
    }
  }

  const digits = (setter) => (event) => setter(event.target.value.replace(/\D/g, '').slice(0, 4))

  return (
    <section>
      <h2 className="font-serif text-lg text-sage-900 mb-2">Caregiver PIN</h2>
      <form onSubmit={submit} className="rounded-2xl border border-sage-200 bg-white p-5 space-y-3">
        <div>
          <label htmlFor="pin-current" className="block text-sm text-sage-700 mb-1">Current PIN</label>
          <input id="pin-current" type="password" inputMode="numeric" autoComplete="off" value={current} onChange={digits(setCurrent)} className="input" />
        </div>
        <div>
          <label htmlFor="pin-new" className="block text-sm text-sage-700 mb-1">New 4-digit PIN</label>
          <input id="pin-new" type="password" inputMode="numeric" autoComplete="off" value={next} onChange={digits(setNext)} className="input" />
        </div>
        <button type="submit" disabled={!valid || busy} className="btn-primary btn-sm disabled:opacity-50">Change PIN</button>
        {status.text && <p role="status" className={`text-sm ${status.ok ? 'text-sage-600' : 'text-rose-700'}`}>{status.text}</p>}
      </form>
    </section>
  )
}

export default function FamilySettings() {
  const navigate = useNavigate()
  const { logout, profile, roles, setActiveRole, pinRequired, setCaregiverPin } = useAuth()
  const hasElderRole = roles?.includes('elderly')

  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [actionError, setActionError] = useState('')

  const run = async (fn) => {
    setActionError('')
    try {
      await fn()
    } catch (err) {
      setActionError(err?.message || 'Something went wrong. Please try again.')
    }
  }

  const handleLogout = () =>
    run(async () => {
      sessionStorage.removeItem('sessionActiveRole')
      sessionStorage.removeItem('intendedRole')
      await logout()
      navigate('/')
    })

  const handleSwitchToElder = () =>
    run(async () => {
      await setActiveRole('elderly')
      navigate('/elder/dashboard')
    })

  const field = 'w-full min-h-[44px] rounded-xl border border-sage-300 bg-white px-4 py-2 text-base text-sage-900 focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30'

  return (
    <div className="min-h-screen bg-cream-50 font-sans pb-24 md:pb-8">
      <header className="px-4 md:px-6 py-4 flex items-center gap-3 border-b border-sage-200 sticky top-0 bg-cream-50 z-20">
        <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className={`w-11 h-11 rounded-full flex items-center justify-center text-sage-700 hover:bg-sage-100 ${focusRing}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl text-sage-900">Settings</h1>
          {profile?.full_name && <p className="text-sm text-sage-500">{profile.full_name}</p>}
        </div>
      </header>

      <main className="px-4 md:px-6 py-5 space-y-6 max-w-2xl mx-auto">
        {actionError && (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm">{actionError}</div>
        )}

        <Section title="Account">
          {hasElderRole && <Row title="Switch to elder view" description="See your own health dashboard" onClick={handleSwitchToElder} />}
          <Row title="Manage roles" description="Switch between caregiver and elder accounts" onClick={() => navigate('/onboarding/role-select')} />
          <Row title="Pairing code" description="Link to, or share a code with, another account" onClick={() => navigate('/link')} />
        </Section>

        <Section title="Care team">
          <Row title="Care team" description="See who has access to this health data" onClick={() => navigate('/family/members')} />
          <Row title="What caregivers can see" onClick={() => navigate('/family/permissions')} />
        </Section>

        {pinRequired && <ChangePin onChange={setCaregiverPin} />}

        <button type="button" onClick={() => setConfirmingLogout(true)} className="btn-secondary w-full btn-sm">Sign out</button>
      </main>

      {confirmingLogout && (
        <div className="fixed inset-0 z-50 bg-sage-900/40 flex items-center justify-center p-4" onClick={() => setConfirmingLogout(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="logout-title" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && setConfirmingLogout(false)} className="bg-white rounded-2xl border border-sage-200 p-6 max-w-sm w-full">
            <h2 id="logout-title" className="font-serif text-xl text-sage-900">Sign out?</h2>
            <p className="text-sage-600 mt-1">You will need to sign in again to see your dashboard.</p>
            <div className="btn-row mt-5">
              <button type="button" autoFocus onClick={() => setConfirmingLogout(false)} className="btn-secondary btn-sm">Cancel</button>
              <button type="button" onClick={handleLogout} className="btn-primary btn-sm">Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
