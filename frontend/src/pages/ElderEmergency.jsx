import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Siren } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { ElderPage, Split } from '../components/ElderNav'

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

  return (
    <ElderPage title="Emergency" art="shield">
      <Split
        aside={
          <section className="band" aria-label="Emergency contact">
            <h2 className="text-2xl">Your emergency contact</h2>
            {phone ? (
              <>
                <p className="mt-3 text-xl font-bold">{name || 'Emergency contact'}</p>
                <p className="text-lg text-sage-700">{phone}</p>
                <a href={`tel:${phone}`} className="btn-secondary mt-5 w-full">
                  <Phone strokeWidth={1.75} aria-hidden="true" /> Call {name || 'contact'}
                </a>
              </>
            ) : (
              <>
                <p className="mt-2 text-lg text-sage-700">You have not added an emergency contact yet.</p>
                <button type="button" onClick={() => navigate('/elder/settings')} className="btn-secondary mt-5 w-full">
                  Add a contact in settings
                </button>
              </>
            )}
          </section>
        }
      >
        {step === 'ask' && (
          <>
            <p className="text-2xl">Do you need help right now?</p>
            <div className="btn-row">
              <button type="button" onClick={() => setStep('confirm')} className="btn-danger text-xl">
                <Siren strokeWidth={1.75} aria-hidden="true" /> I need help
              </button>
              <a href={`tel:${EMERGENCY_NUMBER}`} className="btn-secondary text-xl">
                <Phone strokeWidth={1.75} aria-hidden="true" /> Call {EMERGENCY_NUMBER} directly
              </a>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <div className="card" role="alertdialog" aria-label="Confirm emergency">
            <h2 className="text-3xl">Send an alert?</h2>
            <p className="measure mt-2 text-lg text-sage-700">
              Your caregivers will get an urgent alert. Then you can call for help.
            </p>
            <div className="btn-row mt-6">
              <button type="button" onClick={sendAlert} disabled={sending} className="btn-danger text-xl">
                {sending ? 'Sending...' : 'Yes, send the alert'}
              </button>
              <button type="button" onClick={() => setStep('ask')} disabled={sending} className="btn-secondary">
                No, I am okay
              </button>
            </div>
          </div>
        )}

        {step === 'sent' && (
          <>
            <div className={`rounded-[20px] border p-5 ${alertFailed ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`} role={alertFailed ? 'alert' : 'status'}>
              <p className="text-2xl font-bold">
                {alertFailed ? 'The alert did not send.' : 'Your caregivers have been alerted.'}
              </p>
              {alertFailed && <p className="mt-1 text-lg">Please call now. Check your internet connection.</p>}
            </div>
            <div className="btn-row">
              <a href={`tel:${EMERGENCY_NUMBER}`} className="btn-danger text-xl">
                <Phone strokeWidth={1.75} aria-hidden="true" /> Call {EMERGENCY_NUMBER}
              </a>
              {phone && (
                <a href={`tel:${phone}`} className="btn-primary text-xl">
                  <Phone strokeWidth={1.75} aria-hidden="true" /> Call {name || phone}
                </a>
              )}
            </div>
            <button type="button" onClick={() => navigate('/elder/dashboard')} className="btn-ghost w-full sm:w-auto">
              I am safe now
            </button>
          </>
        )}
      </Split>
    </ElderPage>
  )
}
