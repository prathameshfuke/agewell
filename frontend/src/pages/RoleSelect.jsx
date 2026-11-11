import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Loader2, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { logo, danceSticker, chatSticker, familyPhoto } from '../assets/images'


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

    const Choice = ({ role, title, text, done, sticker, w, h }) => (
        <button
            type="button"
            onClick={() => handleSelectRole(role)}
            disabled={loading}
            className={`w-full flex items-center gap-4 text-left bg-white rounded-3xl p-4 sm:p-5 border-2 shadow-card transition-[border-color,box-shadow] hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${selectedRole === role ? 'border-primary' : 'border-transparent hover:border-sage-300'}`}
        >
            <span className="flex h-20 w-24 shrink-0 items-center justify-center rounded-2xl bg-cream-100">
                <img src={sticker} alt="" width={w} height={h} className="sticker h-16 w-auto max-w-[5rem] object-contain" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    <span className="font-serif text-2xl text-sage-900">{title}</span>
                    {done && <Check className="w-5 h-5 shrink-0 text-emerald-600" aria-label="Already set up" />}
                    {loading && selectedRole === role && <Loader2 className="w-5 h-5 shrink-0 text-primary animate-spin motion-reduce:animate-none" aria-label="Working" />}
                </span>
                <span className="mt-1 block text-base leading-snug text-sage-600 font-normal">{text}</span>
            </span>
        </button>
    )

    return (
        <div className="min-h-screen bg-cream-50 flex flex-col px-5 py-4">
            <header className="h-14 flex items-center justify-between">
                <span className="inline-flex items-center gap-2">
                    <img src={logo} alt="" width="48" height="48" className="sticker w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                    <span className="font-serif text-xl sm:text-2xl leading-none text-sage-900">AgeWell</span>
                </span>
                <button type="button" onClick={handleSignOut} disabled={loading} className="text-sage-600 hover:text-sage-900 inline-flex items-center gap-2 text-sm min-h-[44px] px-3 font-normal">
                    <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
                </button>
            </header>

            <main className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full pb-10">
                <img src={familyPhoto} alt="" width="1536" height="1024" className="mx-auto w-full max-h-44 sm:max-h-56 object-cover object-top rounded-3xl shadow-soft" />
                <h1 className="mt-8 font-serif text-3xl sm:text-4xl text-sage-900 text-center">Welcome, {userName}</h1>
                <p className="mt-2 text-sage-600 text-lg text-center font-normal">How will you use AgeWell?</p>

                {error && (
                    <p role="alert" className="mt-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm font-normal">{error}</p>
                )}

                <div className="mt-6 grid gap-4">
                    <Choice role="elderly" title="I'm an elder" text="Medicines, health readings, voice symptom check and an emergency button." done={hasElderRole} sticker={danceSticker} w={287} h={340} />
                    <Choice role="caregiver" title="I'm a caregiver" text="Follow a loved one's medicines, alerts and health trends. You will need their link code." done={hasCaregiverRole} sticker={chatSticker} w={472} h={340} />
                </div>

                <button
                    type="button"
                    onClick={() => handleSelectRole('elderly')}
                    disabled={loading}
                    className="mt-4 mx-auto px-4 text-primary hover:text-primary-dark underline underline-offset-4 min-h-[44px] font-normal disabled:opacity-60"
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
