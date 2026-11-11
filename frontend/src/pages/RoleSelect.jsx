import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Loader2, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { logo } from '../assets/images'
import { morning, together } from '../assets/images/gen'
import { Art, Notice, textBtn } from '../components/family/FamilyPage'


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
            <div className="min-h-screen bg-paper flex items-center justify-center" role="status" aria-label="Loading">
                <div className="loading-spinner" />
            </div>
        )
    }

    const Choice = ({ role, title, text, done, art, wide }) => (
        <button
            type="button"
            onClick={() => handleSelectRole(role)}
            disabled={loading}
            className={`card flex w-full items-center gap-5 text-left font-normal transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${selectedRole === role ? '!border-primary' : ''}`}
        >
            <Art src={art} wide={wide} className="w-20 shrink-0 sm:w-28" />
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    <span className="font-serif text-3xl">{title}</span>
                    {done && <Check className="h-5 w-5 shrink-0 text-emerald-700" aria-label="Already set up" />}
                    {loading && selectedRole === role && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary motion-reduce:animate-none" aria-label="Working" />}
                </span>
                <span className="mt-1 block text-ink-2">{text}</span>
            </span>
        </button>
    )

    return (
        <div className="min-h-screen bg-paper font-sans text-ink">
            <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-10">
                <header className="flex h-16 items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                        <img src={logo} alt="" width="48" height="48" className="sticker h-10 w-10 object-contain" />
                        <span className="font-serif text-2xl leading-none">AgeWell</span>
                    </span>
                    <button type="button" onClick={handleSignOut} disabled={loading} className="inline-flex min-h-[44px] items-center gap-2 px-3 font-normal text-ink-2 hover:text-ink">
                        <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                    </button>
                </header>

                <main className="grid gap-x-14 gap-y-10 py-8 lg:grid-cols-12 lg:items-center lg:py-20">
                    <div className="lg:col-span-5">
                        <h1 className="font-serif text-5xl">Welcome, {userName}</h1>
                        <p className="mt-3 text-lg text-ink-2">How will you use AgeWell?</p>
                        <button type="button" onClick={() => handleSelectRole('elderly')} disabled={loading} className={`${textBtn} mt-6 disabled:opacity-60`}>
                            I'm both: use one account
                        </button>
                        <p className="mt-1 max-w-sm text-ink-2">
                            We set up elder mode first. Then you add caregiver mode from the role switcher, protected by a 4-digit PIN.
                        </p>
                    </div>

                    <div className="space-y-4 lg:col-span-7">
                        {error && <Notice>{error}</Notice>}
                        <Choice role="elderly" title="I'm an elder" text="Medicines, health readings, voice symptom check and an emergency button." done={hasElderRole} art={morning} />
                        <Choice role="caregiver" title="I'm a caregiver" text="Follow a loved one's medicines, alerts and health trends. You will need their link code." done={hasCaregiverRole} art={together} wide />
                    </div>
                </main>
            </div>
        </div>
    )
}
