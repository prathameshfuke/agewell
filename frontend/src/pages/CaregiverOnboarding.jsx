import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowLeft, ArrowRight, User, Users, Bell, Loader2 } from 'lucide-react'
import { Card, Button } from '../components/ui'

import twoSticker from '../assets/images/stickers/two.jpeg'

/**
 * Caregiver Onboarding - Step-by-step setup
 * Consistent styling with design system
 */
export default function CaregiverOnboarding() {
    const navigate = useNavigate()
    const { user, profile, completeOnboarding, isOnboardingComplete, loading: authLoading, initialized } = useAuth()

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
        if (step === 2) {
            if (!formData.pairing_code.trim() || formData.pairing_code.length !== 6) {
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

    const handleComplete = async () => {
        if (!validateStep()) return

        setLoading(true)
        setError(null)

        try {
            // Find the elder user by pairing code - importing from lib/supabase here would be ideal but using global for now or assuming context doesn't expose raw client
            // We need to use the auth context's update function but also query via supabase first.
            // Since we don't have direct access here, we can rely on a helper or just do it if we import supabase. 
            // Ideally, completeOnboarding in AuthContext should handle this, but let's do it here.

            // NOTE: We need to import supabase to query. Let's assume it's available or we can use a server function. 
            // BUT, since we are "making it real" on frontend, let's import it dynamically or assume standard import.
            // I'll add the import at the top in a separate change if needed, but for now let's use the valid logic pattern.

            // Actually, best to fetch the elder profile first.
            const { supabase } = await import('../lib/supabase')

            const { data: elderProfile, error: searchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('pairing_code', formData.pairing_code)
                .single()

            if (searchError || !elderProfile) {
                throw new Error('Invalid pairing code. Please check and try again.')
            }

            await completeOnboarding('caregiver', {
                full_name: formData.full_name,
                caregiver_relationship: formData.relationship,
                notifications_enabled: formData.notifications_enabled,
                linked_elderly_id: elderProfile.id // Linking here!
            })
            navigate('/family/dashboard', { replace: true })
        } catch (err) {
            console.error('Error:', err)
            setError(err.message === 'Invalid pairing code. Please check and try again.' ? err.message : 'Failed to save. Please try again.')
            setLoading(false)
        }
    }

    if (!initialized || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-cream-100 via-cream-50 to-sage-100/40 flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-100 via-cream-50 to-sage-100/40 flex flex-col p-6">
            {/* Header with Progress */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => step > 1 && setStep(step - 1)}
                    disabled={step === 1}
                    className="text-sage-500 hover:text-sage-700 flex items-center gap-2 text-sm font-bold disabled:opacity-30 min-h-[44px]"
                >
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <div className="flex gap-2">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={`w-3 h-3 rounded-full transition-colors ${s === step ? 'bg-cream-500' : s < step ? 'bg-cream-300' : 'bg-cream-100'
                                }`}
                        />
                    ))}
                </div>
                <div className="w-16" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                <motion.img
                    src={twoSticker}
                    alt="Caregiver"
                    className="w-24 h-24 rounded-3xl shadow-lg border-4 border-white mb-6"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                />

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full text-center">
                            <h1 className="text-2xl font-serif font-bold text-sage-900 mb-2">Welcome, Caregiver!</h1>
                            <p className="text-sage-600 mb-8">Let's set up your account</p>
                            <Card>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center">
                                        <User className="w-5 h-5 text-cream-700" />
                                    </div>
                                    <span className="text-sage-700 font-bold">Your Name</span>
                                </div>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => handleChange('full_name', e.target.value)}
                                    placeholder="Enter your full name"
                                    className="input focus:border-cream-500"
                                />
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full text-center">
                            <h1 className="text-2xl font-serif font-bold text-sage-900 mb-2">Connect to Elder</h1>
                            <p className="text-sage-600 mb-8">Enter the pairing code from their device</p>
                            <Card className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center">
                                        <Users className="w-5 h-5 text-cream-700" />
                                    </div>
                                    <span className="text-sage-700 font-bold">Pairing Code</span>
                                </div>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={formData.pairing_code}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase()
                                        handleChange('pairing_code', val)
                                    }}
                                    placeholder="e.g. A7B2C9"
                                    className="input focus:border-cream-500 text-center text-2xl tracking-widest uppercase font-mono"
                                />
                                <div className="pt-2">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center">
                                            <Users className="w-5 h-5 text-cream-700" />
                                        </div>
                                        <span className="text-sage-700 font-bold">Relationship</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.relationship}
                                        onChange={(e) => handleChange('relationship', e.target.value)}
                                        placeholder="e.g. Son, Daughter"
                                        className="input focus:border-cream-500"
                                    />
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full text-center">
                            <h1 className="text-2xl font-serif font-bold text-sage-900 mb-2">Ready to start!</h1>
                            <p className="text-sage-600 mb-8">One last step</p>
                            <Card>
                                <p className="text-sage-600 text-sm text-left mb-4">
                                    As a caregiver, you'll be able to monitor your loved one's medication schedule, health stats, and receive important alerts.
                                </p>
                                <label className="flex items-start gap-3 cursor-pointer bg-cream-50 p-4 rounded-xl border-2 border-cream-100 hover:border-cream-200 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.consent_acknowledged}
                                        onChange={(e) => handleChange('consent_acknowledged', e.target.checked)}
                                        className="w-5 h-5 mt-0.5 accent-cream-500"
                                    />
                                    <span className="text-sage-700 text-sm text-left">
                                        I understand I will have access to my loved one's health information
                                    </span>
                                </label>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full bg-rose-50 border-2 border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm mt-4 font-medium"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="w-full mt-8">
                    {step < 3 ? (
                        <Button
                            variant="cream"
                            fullWidth
                            icon={ArrowRight}
                            iconPosition="right"
                            onClick={handleNext}
                        >
                            Continue
                        </Button>
                    ) : (
                        <Button
                            variant="cream"
                            fullWidth
                            icon={Check}
                            loading={loading}
                            onClick={handleComplete}
                        >
                            Complete Setup
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-sage-400 text-sm mt-4 font-medium">Step {step} of 3</p>
        </div>
    )
}
