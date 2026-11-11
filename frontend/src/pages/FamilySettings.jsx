import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { family } from '../assets/images/gen'
import { useAuth } from '../contexts/AuthContext'
import FamilyPage, { Notice, lone } from '../components/family/FamilyPage'

function Row({ title, description, onClick }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex min-h-[64px] w-full items-center gap-3 py-3 text-left font-normal hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <span className="min-w-0 flex-1">
          <span className="block text-lg">{title}</span>
          {description && <span className="block text-ink-2">{description}</span>}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-2" aria-hidden="true" />
      </button>
    </li>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-serif text-2xl">{title}</h2>
      <ul className="mt-2 divide-y divide-line border-y border-line">{children}</ul>
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
      <h2 className="font-serif text-2xl">Caregiver PIN</h2>
      <form onSubmit={submit} className="mt-3 max-w-sm space-y-4">
        <div>
          <label htmlFor="pin-current" className="mb-1 block">Current PIN</label>
          <input id="pin-current" type="password" inputMode="numeric" autoComplete="off" value={current} onChange={digits(setCurrent)} className="input" />
        </div>
        <div>
          <label htmlFor="pin-new" className="mb-1 block">New 4-digit PIN</label>
          <input id="pin-new" type="password" inputMode="numeric" autoComplete="off" value={next} onChange={digits(setNext)} className="input" />
        </div>
        <button type="submit" disabled={!valid || busy} className={`btn-primary btn-sm ${lone}`}>Change PIN</button>
        {status.text && <p role="status" className={status.ok ? 'text-ink-2' : 'text-rose-700'}>{status.text}</p>}
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

  return (
    <FamilyPage title="Settings" sub={profile?.full_name} art={family} wide>
      {actionError && <Notice>{actionError}</Notice>}

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

      <section>
        <button type="button" onClick={() => setConfirmingLogout(true)} className={`btn-secondary btn-sm ${lone}`}>Sign out</button>
      </section>

      {confirmingLogout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 !border-t-0 !px-4 !py-4 sm:items-center" onClick={() => setConfirmingLogout(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="logout-title" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && setConfirmingLogout(false)} className="card w-full max-w-sm !p-6">
            <h2 id="logout-title" className="font-serif text-2xl">Sign out?</h2>
            <p className="mt-1 text-ink-2">You will need to sign in again to see your dashboard.</p>
            <div className="btn-row mt-5">
              <button type="button" autoFocus onClick={() => setConfirmingLogout(false)} className="btn-secondary btn-sm">Cancel</button>
              <button type="button" onClick={handleLogout} className="btn-primary btn-sm">Sign out</button>
            </div>
          </div>
        </div>
      )}
    </FamilyPage>
  )
}
