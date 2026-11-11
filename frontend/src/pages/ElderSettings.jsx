import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ElderPage, Split } from '../components/ElderNav'

export default function ElderSettings() {
  const navigate = useNavigate()
  const { user, profile, roles, setActiveRole, refreshProfile, logout } = useAuth()
  const hasCaregiverRole = roles?.includes('caregiver')

  const [contact, setContact] = useState({ name: '', phone: '' })
  const [status, setStatus] = useState({ kind: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => {
    setContact({
      name: profile?.emergency_contact_name || '',
      phone: profile?.emergency_contact_phone || '',
    })
  }, [profile?.emergency_contact_name, profile?.emergency_contact_phone])

  const saveContact = async (e) => {
    e.preventDefault()
    const name = contact.name.trim()
    const phone = contact.phone.trim()
    if (!name || !/^[+\d][\d\s-]{5,}$/.test(phone)) {
      setStatus({ kind: 'error', text: 'Enter a name and a phone number, for example +91 98765 43210.' })
      return
    }
    setSaving(true)
    setStatus({ kind: '', text: '' })
    try {
      await db.profiles.update(user.id, { emergency_contact_name: name, emergency_contact_phone: phone })
      await refreshProfile?.()
      setStatus({ kind: 'ok', text: 'Saved. This contact is now used on the Emergency screen.' })
    } catch {
      setStatus({ kind: 'error', text: 'We could not save your contact. Check your connection and try again.' })
    } finally {
      setSaving(false)
    }
  }

  const switchToCaregiver = async () => {
    await setActiveRole('caregiver')
    navigate('/family/dashboard')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <ElderPage title="Settings" backTo="/elder/dashboard">
      <Split
        aside={
          <>
            <section aria-labelledby="cg-h">
              <h2 id="cg-h" className="text-2xl">Caregiver mode</h2>
              {hasCaregiverRole ? (
                <>
                  <p className="mt-2 text-lg text-sage-600">
                    This account can also look after someone. Caregiver mode is protected by your 4-digit PIN. To change the PIN, open caregiver mode and go to its settings.
                  </p>
                  <button type="button" onClick={switchToCaregiver} className="btn-secondary mt-4 w-full sm:w-auto">Switch to caregiver mode</button>
                </>
              ) : (
                <>
                  <p className="mt-2 text-lg text-sage-600">
                    Look after someone else from this account. A 4-digit PIN will protect caregiver mode, so only you can open it.
                  </p>
                  <button type="button" onClick={() => navigate('/onboarding/role-select')} className="btn-secondary mt-4 w-full sm:w-auto">Also use as caregiver</button>
                </>
              )}
            </section>

            <section className="border-t border-line pt-8" aria-labelledby="disp-h">
              <h2 id="disp-h" className="text-2xl">Medicine dispenser</h2>
              <button type="button" onClick={() => navigate('/dispenser/setup')} className="btn-secondary mt-4 w-full sm:w-auto">Set up my dispenser</button>
            </section>

            <div className="border-t border-line pt-8">
              {confirmLogout ? (
                <section role="alertdialog" aria-label="Confirm sign out">
                  <p className="text-xl font-bold">Sign out of AgeWell?</p>
                  <div className="btn-row mt-4">
                    <button type="button" onClick={() => setConfirmLogout(false)} className="btn-secondary">Stay</button>
                    <button type="button" onClick={handleLogout} className="btn-primary">Sign out</button>
                  </div>
                </section>
              ) : (
                <button type="button" onClick={() => setConfirmLogout(true)} className="btn-ghost w-full sm:w-auto">Sign out</button>
              )}
            </div>
          </>
        }
      >
        <section className="card" aria-labelledby="contact-h">
          <h2 id="contact-h" className="text-2xl">Emergency contact</h2>
          <p className="measure mt-1 text-lg text-sage-600">We call this person when you press Call family or Emergency.</p>
          <form onSubmit={saveContact} className="mt-5 space-y-4">
            <div>
              <label htmlFor="ec-name" className="mb-1 block text-lg font-bold">Name</label>
              <input id="ec-name" className="input" autoComplete="off" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="ec-phone" className="mb-1 block text-lg font-bold">Phone number</label>
              <input id="ec-phone" type="tel" inputMode="tel" className="input" autoComplete="off" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">{saving ? 'Saving...' : 'Save contact'}</button>
            {status.text && (
              <p role={status.kind === 'error' ? 'alert' : 'status'} className={`text-lg font-bold ${status.kind === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{status.text}</p>
            )}
          </form>
        </section>
      </Split>
    </ElderPage>
  )
}
