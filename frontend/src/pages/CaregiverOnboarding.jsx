import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'
import { together, call, shield } from '../assets/images/gen'
import OnboardingShell, { Field, Consent } from '../components/family/OnboardingShell'

/**
 * Caregiver Onboarding - Step-by-step setup
 * Consistent styling with design system
 */
export default function CaregiverOnboarding() {
    const navigate = useNavigate()
    const { user, profile, roles, completeOnboarding, isOnboardingComplete, loading: authLoading, initialized } = useAuth()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [formData, setFormData] = useState({
        full_name: '',
        relationship: '',
        notifications_enabled: true,
        consent_acknowledged: false,
        pairing_code: ''
    })

    // Same email is both elder and caregiver: nobody to pair with, the account watches itself.
    const isSelf = roles?.includes('elderly')

    const normalizedPairingCode = (formData.pairing_code || '').replace(/[^A-Z0-9]/gi, '').toUpperCase()

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                full_name: profile.full_name || ''
            }))
        }
    }, [profile])

    useEffect(() => {
        if (initialized && !authLoading && isOnboardingComplete('caregiver')) {
            navigate('/family/dashboard', { replace: true })
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
        if (step === 2 && !isSelf) {
            if (normalizedPairingCode.length !== 6) {
                setError('Please enter a valid 6-character pairing code')
                return false
            }
            if (!formData.relationship.trim()) {
                setError('Please enter your relationship')
                return false
            }
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
        if (!user?.id) {
            setError('Your session is not ready. Please try again.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            let linkedElderId = null
            if (!isSelf) {
                const linkResponse = await api.joinLinkCode(user.id, normalizedPairingCode)
                if (!linkResponse?.success) {
                    throw new Error(linkResponse?.error || 'Invalid pairing code. Please check and try again.')
                }

                linkedElderId = linkResponse?.link?.elder_id || linkResponse?.elder?.id
                if (!linkedElderId) {
                    throw new Error('Could not resolve linked elder from pairing code.')
                }
            }

            await completeOnboarding('caregiver', {
                full_name: formData.full_name,
                caregiver_relationship: isSelf ? 'Self' : formData.relationship,
                notifications_enabled: formData.notifications_enabled,
                ...(linkedElderId ? { linked_elderly_id: linkedElderId } : {})
            })
            navigate('/family/dashboard', { replace: true })
        } catch (err) {
            console.error('Error:', err)
            setError(err.message || 'Failed to save. Please try again.')
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
        1: { art: together, wide: true, title: 'Welcome, caregiver', lead: "Let's set up your account." },
        2: isSelf
            ? { art: call, title: 'Your own account', lead: 'Caregiver mode will show the health and medicine data of this account. You will create a 4-digit PIN next, so only you can open it.' }
            : { art: call, title: 'Connect to an elder', lead: 'Enter the pairing code from their device.' },
        3: { art: shield, title: 'Ready to start', lead: 'One last step.' },
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
                <Field id="full-name" label="Your name" type="text" value={formData.full_name} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="Enter your full name" autoComplete="name" />
            )}

            {step === 2 && !isSelf && (
                <>
                    <Field
                        id="pairing-code"
                        label="Pairing code"
                        type="text"
                        maxLength={6}
                        value={formData.pairing_code}
                        onChange={(e) => handleChange('pairing_code', e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase())}
                        placeholder="e.g. A7B2C9"
                        autoComplete="off"
                    />
                    <Field id="relationship" label="Your relationship to them" type="text" value={formData.relationship} onChange={(e) => handleChange('relationship', e.target.value)} placeholder="e.g. Son, Daughter" />
                </>
            )}

            {step === 3 && (
                <>
                    <p className="text-ink-2">As a caregiver you can follow your loved one's medicine schedule and health readings, and receive important alerts.</p>
                    <Consent checked={formData.consent_acknowledged} onChange={(e) => handleChange('consent_acknowledged', e.target.checked)}>
                        I understand I will have access to my loved one's health information
                    </Consent>
                </>
            )}
        </OnboardingShell>
    )
}
