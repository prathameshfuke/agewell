import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Loader2, CheckCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui'

// Import stickers
import oneSticker from '../assets/images/stickers/one.jpeg'
import twoSticker from '../assets/images/stickers/two.jpeg'

/**
 * Role Selection - Explicit Session Role Setting
 * Consistent styling with design system
 */
export default function RoleSelect() {
    const navigate = useNavigate()
    const {
        user,
        profile,
        roles,
        addRole,
        setSessionActiveRole,
        logout,
        loading: authLoading,
        initialized,
        isOnboardingComplete
    } = useAuth()

    const [loading, setLoading] = useState(false)
    const [selectedRole, setSelectedRole] = useState(null)
    const [error, setError] = useState(null)

    const userName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Friend'
    const hasElderRole = roles?.includes('elderly')
    const hasCaregiverRole = roles?.includes('caregiver')

    const withTimeout = (promise, ms = 15000, message = 'Request timed out. Please try again.') => {
        let timeoutId
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(message)), ms)
        })

        return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId))
    }

    const handleSelectRole = async (role) => {
        setLoading(true)
        setSelectedRole(role)
        setError(null)

        try {
            await withTimeout(
                addRole(role),
                15000,
                'Role selection is taking too long. Please try again.'
            )
            setSessionActiveRole(role)

            if (!isOnboardingComplete(role)) {
                navigate(`/onboarding/${role}`)
            } else {
                const dashboard = role === 'caregiver' ? '/family/dashboard' : '/elder/dashboard'
                navigate(dashboard, { replace: true })
            }
        } catch (err) {
            console.error('Error:', err)
            setError(err.message || 'Something went wrong. Please try again.')
            setLoading(false)
            setSelectedRole(null)
        }
    }

    const handleSignOut = async () => {
        setLoading(true)
        try {
            await logout()
        } catch (err) {
            console.error('Sign out warning:', err)
        } finally {
            setLoading(false)
            navigate('/auth', { replace: true })
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
            <button
                onClick={handleSignOut}
                disabled={loading}
                className="text-sage-500 hover:text-sage-700 flex items-center gap-2 text-sm font-bold mb-8 min-h-[44px]"
            >
                <LogOut className="w-5 h-5" /> Sign Out
            </button>

            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-serif font-bold text-sage-900 mb-2">
                        Welcome, {userName}!
                    </h1>
                    <p className="text-sage-600 text-lg">
                        How would you like to use AgeWell?
                    </p>
                </motion.div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full bg-rose-50 border-2 border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm mb-6 font-medium"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid gap-4 w-full">
                    {/* Elder */}
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectRole('elderly')}
                        disabled={loading}
                        className={`bg-white rounded-3xl p-6 text-left border-2 shadow-soft hover:shadow-card-hover transition-all min-h-[120px] ${selectedRole === 'elderly' ? 'border-sage-500' : hasElderRole ? 'border-sage-300' : 'border-sage-100 hover:border-sage-200'
                            } ${loading && selectedRole !== 'elderly' ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                                <img src={oneSticker} alt="Elderly" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-serif font-bold text-sage-900">I'm an Elderly User</h2>
                                    {hasElderRole && <CheckCircle className="w-5 h-5 text-sage-500 flex-shrink-0" />}
                                </div>
                                <p className="text-sage-600 text-sm">Access medications, health tracking, and emergency contacts.</p>
                            </div>
                            {loading && selectedRole === 'elderly' ? (
                                <Loader2 className="w-6 h-6 text-sage-500 animate-spin flex-shrink-0" />
                            ) : (
                                <ChevronRight className="w-6 h-6 text-sage-400 flex-shrink-0" />
                            )}
                        </div>
                    </motion.button>

                    {/* Caregiver */}
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectRole('caregiver')}
                        disabled={loading}
                        className={`bg-white rounded-3xl p-6 text-left border-2 shadow-soft hover:shadow-card-hover transition-all min-h-[120px] ${selectedRole === 'caregiver' ? 'border-cream-500' : hasCaregiverRole ? 'border-cream-300' : 'border-sage-100 hover:border-cream-200'
                            } ${loading && selectedRole !== 'caregiver' ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                                <img src={twoSticker} alt="Caregiver" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-serif font-bold text-sage-900">I'm a Caregiver</h2>
                                    {hasCaregiverRole && <CheckCircle className="w-5 h-5 text-cream-600 flex-shrink-0" />}
                                </div>
                                <p className="text-sage-600 text-sm">Monitor your loved one's health and manage medications.</p>
                            </div>
                            {loading && selectedRole === 'caregiver' ? (
                                <Loader2 className="w-6 h-6 text-cream-500 animate-spin flex-shrink-0" />
                            ) : (
                                <ChevronRight className="w-6 h-6 text-sage-400 flex-shrink-0" />
                            )}
                        </div>
                    </motion.button>
                </div>
            </div>
        </div>
    )
}
