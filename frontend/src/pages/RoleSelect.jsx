import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Loader2, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'


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
                navigate(`/onboarding/${role}`, { replace: true })
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
            <div className="min-h-screen bg-cream-50 flex items-center justify-center" role="status" aria-label="Loading">
                <div className="loading-spinner" />
            </div>
        )
    }

    const Choice = ({ role, title, text, done, children }) => (
        <button
            type="button"
            onClick={() => handleSelectRole(role)}
            disabled={loading}
            className={`w-full text-left bg-white rounded-3xl p-5 sm:p-6 border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${selectedRole === role ? 'border-primary' : 'border-sage-200 hover:border-sage-900'}`}
        >
            <span className="flex items-center gap-3">
                <span className="font-serif text-2xl text-sage-900 flex-1">{title}</span>
                {done && <Check className="w-5 h-5 text-emerald-600" aria-label="Already set up" />}
                {loading && selectedRole === role && <Loader2 className="w-5 h-5 text-primary animate-spin motion-reduce:animate-none" aria-label="Working" />}
            </span>
            <span className="block mt-1 text-sage-600 font-normal">{text}</span>
            {children}
        </button>
    )

    return (
        <div className="min-h-screen bg-cream-50 flex flex-col px-5 py-4">
            <header className="flex justify-end">
                <button type="button" onClick={handleSignOut} disabled={loading} className="text-sage-600 hover:text-sage-900 inline-flex items-center gap-2 text-sm min-h-[44px] font-normal">
                    <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
                </button>
            </header>

            <main className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full pb-10">
                <h1 className="font-serif text-3xl sm:text-4xl text-sage-900 text-center">Welcome, {userName}</h1>
                <p className="mt-2 text-sage-600 text-lg text-center font-normal">How will you use AgeWell?</p>

                {error && (
                    <p role="alert" className="mt-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm font-normal">{error}</p>
                )}

                <div className="mt-8 grid gap-3">
                    <Choice role="elderly" title="I'm an elder" text="Medicines, health readings, voice symptom check and an emergency button." done={hasElderRole} />
                    <Choice role="caregiver" title="I'm a caregiver" text="Follow a loved one's medicines, alerts and health trends. You will need their link code." done={hasCaregiverRole} />
                </div>

                <button
                    type="button"
                    onClick={() => handleSelectRole('elderly')}
                    disabled={loading}
                    className="mt-5 mx-auto text-primary hover:text-primary-dark underline underline-offset-4 min-h-[44px] font-normal disabled:opacity-60"
                >
                    I'm both: use one account
                </button>
                <p className="text-center text-sm text-sage-600 font-normal">
                    We set up elder mode first. Then you add caregiver mode from the role switcher, protected by a 4-digit PIN.
                </p>
            </main>
        </div>
    )
}
