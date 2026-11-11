import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { morning, call, shield } from '../assets/images/gen'
import { useAuth } from '../contexts/AuthContext'
import OnboardingShell, { Field, Consent } from '../components/family/OnboardingShell'

/**
 * Elderly Onboarding - Step-by-step setup
 * Consistent styling with design system
 */
export default function ElderlyOnboarding() {
    const navigate = useNavigate()
    const { profile, completeOnboarding, isOnboardingComplete, loading: authLoading, initialized } = useAuth()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        consent_acknowledged: false
    })

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                full_name: profile.full_name || '',
                date_of_birth: profile.date_of_birth || '',
                emergency_contact_name: profile.emergency_contact_name || '',
                emergency_contact_phone: profile.emergency_contact_phone || ''
            }))
        }
    }, [profile])

    useEffect(() => {
        if (initialized && !authLoading && isOnboardingComplete('elderly')) {
            navigate('/elder/dashboard', { replace: true })
        }
    }, [initialized, authLoading, isOnboardingComplete, navigate])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setError(null)
    }

    const validateStep = () => {
        if (step === 1 && !formData.full_name.trim()) {
            setError('Please enter your name')
            return false
        }
        if (step === 2 && (!formData.emergency_contact_name.trim() || !formData.emergency_contact_phone.trim())) {
            setError('Please enter emergency contact details')
            return false
        }
        if (step === 3 && !formData.consent_acknowledged) {
            setError('Please acknowledge to continue')
            return false
        }
        return true
    }

    const handleNext = () => {
        if (!validateStep()) return
        setError(null)
        if (step < 3) setStep(step + 1)
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
            return
        }

        navigate('/onboarding/role-select')
    }

    const handleComplete = async () => {
        if (!validateStep()) return

        setLoading(true)
        setError(null)

        try {
            // Generate a random 6-character pairing code
            const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase()

            await completeOnboarding('elderly', {
                full_name: formData.full_name,
                date_of_birth: formData.date_of_birth || null,
                emergency_contact_name: formData.emergency_contact_name,
                emergency_contact_phone: formData.emergency_contact_phone,
                pairing_code: pairingCode
            })
            navigate('/elder/dashboard', { replace: true })
        } catch (err) {
            console.error('Error:', err)
            setError('Failed to save. Please try again.')
            setLoading(false)
        }
    }

    if (!initialized || authLoading) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center">
                <div className="loading-spinner" role="status" aria-label="Loading" />
            </div>
        )
    }

    const STEPS = {
        1: { art: morning, title: "Let's get to know you", lead: 'What should we call you?' },
        2: { art: call, title: 'Emergency contact', lead: 'Who should we contact in an emergency?' },
        3: { art: shield, title: 'Almost done', lead: 'One last thing before you start.' },
    }

    return (
        <OnboardingShell
            step={step}
            {...STEPS[step]}
            error={error}
            onBack={handleBack}
            onNext={step < 3 ? handleNext : handleComplete}
            last={step === 3}
            loading={loading}
        >
            {step === 1 && (
                <>
                    <Field id="full-name" label="Your name" type="text" value={formData.full_name} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="Enter your full name" autoComplete="name" />
                    <Field id="dob" label="Date of birth (optional)" type="date" value={formData.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} />
                </>
            )}

            {step === 2 && (
                <>
                    <Field id="ec-name" label="Contact name" type="text" value={formData.emergency_contact_name} onChange={(e) => handleChange('emergency_contact_name', e.target.value)} placeholder="e.g. John (Son)" />
                    <Field id="ec-phone" label="Phone number" type="tel" value={formData.emergency_contact_phone} onChange={(e) => handleChange('emergency_contact_phone', e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
                </>
            )}

            {step === 3 && (
                <>
                    <p className="text-ink-2">AgeWell helps you manage medicines and connect with caregivers. Your information is private and secure.</p>
                    <Consent checked={formData.consent_acknowledged} onChange={(e) => handleChange('consent_acknowledged', e.target.checked)}>
                        I agree to share my health info with my designated caregivers
                    </Consent>
                </>
            )}
        </OnboardingShell>
    )
}
