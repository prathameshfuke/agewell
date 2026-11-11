import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Siren } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { ElderPage } from '../components/ElderNav'

const EMERGENCY_NUMBER = '112'

export default function ElderEmergency() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [step, setStep] = useState('ask') // ask | confirm | sent
  const [sending, setSending] = useState(false)
  const [alertFailed, setAlertFailed] = useState(false)

  const name = profile?.emergency_contact_name
  const phone = profile?.emergency_contact_phone

  const sendAlert = async () => {
    setSending(true)
    setAlertFailed(false)
    try {
      // alerts.alert_type only allows medication/health/environmental/device/checkin
      const result = await api.createAlert({
        user_id: user.id,
        alert_type: 'health',
        severity: 'critical',
        title: 'Emergency: needs help now',
        message: `${profile?.full_name || 'Your family member'} pressed the emergency button.`,
      })
      if (!result?.success) setAlertFailed(true)
    } catch {
      setAlertFailed(true)
    } finally {
      setSending(false)
      setStep('sent')
    }
  }

  const callCls = 'btn-primary min-h-[64px] w-full text-2xl'

  return (
    <ElderPage title="Emergency">
      {step === 'ask' && (
        <>
          <p className="text-2xl">Do you need help right now?</p>
          <button type="button" onClick={() => setStep('confirm')} className="btn-danger min-h-[72px] w-full text-3xl">
            <Siren className="h-8 w-8" aria-hidden="true" /> I need help
          </button>
          <a href={`tel:${EMERGENCY_NUMBER}`} className="btn-secondary min-h-[64px] w-full text-2xl">
            <Phone className="h-7 w-7" aria-hidden="true" /> Call {EMERGENCY_NUMBER} directly
          </a>
        </>
      )}

      {step === 'confirm' && (
        <div className="card" role="alertdialog" aria-label="Confirm emergency">
          <h2 className="font-serif text-3xl font-bold">Send an alert?</h2>
          <p className="mt-2 text-xl text-sage-700">
            Your caregivers will get an urgent alert. Then you can call for help.
          </p>
          <button type="button" onClick={sendAlert} disabled={sending} className="btn-danger mt-6 min-h-[64px] w-full text-2xl">
            {sending ? 'Sending...' : 'Yes, send the alert'}
          </button>
          <button type="button" onClick={() => setStep('ask')} disabled={sending} className="btn-secondary mt-3 w-full">
            No, I am okay
          </button>
        </div>
      )}

      {step === 'sent' && (
        <>
          <div className={`rounded-3xl border p-5 ${alertFailed ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`} role={alertFailed ? 'alert' : 'status'}>
            <p className="text-2xl font-bold">
              {alertFailed ? 'The alert did not send.' : 'Your caregivers have been alerted.'}
            </p>
            {alertFailed && <p className="mt-1 text-xl">Please call now. Check your internet connection.</p>}
          </div>
          <a href={`tel:${EMERGENCY_NUMBER}`} className="btn-danger min-h-[64px] w-full text-2xl">
            <Phone className="h-7 w-7" aria-hidden="true" /> Call {EMERGENCY_NUMBER}
          </a>
          {phone && (
            <a href={`tel:${phone}`} className={callCls}>
              <Phone className="h-7 w-7" aria-hidden="true" /> Call {name || phone}
            </a>
          )}
          <button type="button" onClick={() => navigate('/elder/dashboard')} className="btn-ghost w-full">
            I am safe now
          </button>
        </>
      )}

      <section className="card" aria-label="Emergency contact">
        <p className="text-lg font-bold text-sage-600">Your emergency contact</p>
        {phone ? (
          <>
            <p className="mt-1 text-2xl font-bold">{name || 'Emergency contact'}</p>
            <p className="text-xl text-sage-700">{phone}</p>
            <a href={`tel:${phone}`} className="btn-secondary mt-4 w-full">
              <Phone className="h-6 w-6" aria-hidden="true" /> Call {name || 'contact'}
            </a>
          </>
        ) : (
          <>
            <p className="mt-1 text-xl text-sage-700">You have not added an emergency contact yet.</p>
            <button type="button" onClick={() => navigate('/elder/settings')} className="btn-secondary mt-4 w-full">
              Add a contact in settings
            </button>
          </>
        )}
      </section>
    </ElderPage>
  )
}
