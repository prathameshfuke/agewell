import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, User, Phone, Heart, Shield, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Card, Button } from '../components/ui'

import oneSticker from '../assets/images/stickers/one.jpeg'

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
                            className={`w-3 h-3 rounded-full transition-colors ${
                                s === step ? 'bg-sage-500' : s < step ? 'bg-sage-300' : 'bg-sage-100'
                            }`} 
                        />
                    ))}
                </div>
                <div className="w-16" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                <motion.img 
                    src={oneSticker} 
                    alt="Welcome" 
                    className="w-24 h-24 rounded-3xl shadow-lg border-4 border-white mb-6"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                />

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full text-center">
                            <h1 className="text-2xl font-serif font-bold text-sage-900 mb-2">Let's get to know you</h1>
                            <p className="text-sage-600 mb-8">What should we call you?</p>
                            <Card>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center">
                                        <User className="w-5 h-5 text-sage-600" />
                                    </div>
                                    <span className="text-sage-700 font-bold">Your Name</span>
                                </div>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => handleChange('full_name', e.target.value)}
                                    placeholder="Enter your full name"
                                    className="input mb-4"
                                />
                                <div>
                                    <label className="block text-sage-600 text-sm font-medium mb-2">Date of Birth (optional)</label>
                                    <input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => handleChange('date_of_birth', e.target.value)}
                                        className="input"
                                    />
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full text-center">
                            <h1 className="text-2xl font-serif font-bold text-sage-900 mb-2">Emergency Contact</h1>
                            <p className="text-sage-600 mb-8">Who should we contact in case of emergency?</p>
                            <Card className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                            <Heart className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <span className="text-sage-700 font-bold">Contact Name</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.emergency_contact_name}
                                        onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                                        placeholder="e.g. John (Son)"
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center">
                                            <Phone className="w-5 h-5 text-sage-600" />
                                        </div>
                                        <span className="text-sage-700 font-bold">Phone Number</span>
                                    </div>
                                    <input
                                        type="tel"
                                        value={formData.emergency_contact_phone}
                                        onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                                        placeholder="+1 (555) 123-4567"
                                        className="input"
                                    />
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full text-center">
                            <h1 className="text-2xl font-serif font-bold text-sage-900 mb-2">Almost done!</h1>
                            <p className="text-sage-600 mb-8">Just one more thing</p>
                            <Card>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-sage-600" />
                                    </div>
                                    <span className="text-sage-700 font-bold">Privacy & Safety</span>
                                </div>
                                <p className="text-sage-600 text-sm text-left mb-4">
                                    AgeWell helps you manage medications and connect with caregivers. Your information is private and secure.
                                </p>
                                <label className="flex items-start gap-3 cursor-pointer bg-sage-50 p-4 rounded-xl border-2 border-sage-100 hover:border-sage-200 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.consent_acknowledged}
                                        onChange={(e) => handleChange('consent_acknowledged', e.target.checked)}
                                        className="w-5 h-5 mt-0.5 accent-sage-500"
                                    />
                                    <span className="text-sage-700 text-sm text-left">
                                        I agree to share my health info with my designated caregivers
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
                            variant="primary"
                            fullWidth
                            icon={ArrowRight}
                            iconPosition="right"
                            onClick={handleNext}
                        >
                            Continue
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            fullWidth
                            icon={Check}
                            loading={loading}
                            onClick={handleComplete}
                        >
                            Complete Setup
                        </Button>
                    )}
                </div>

                <p className="text-sage-400 text-sm mt-4 font-medium">Step {step} of 3</p>
            </div>
        </div>
    )
}
