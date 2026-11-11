import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete, Lock } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const PIN_LENGTH = 4
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'blank', '0', 'back']

const formatLockMessage = (lockedUntil) => {
    const minutes = Math.max(1, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000))
    return `Too many wrong PINs. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
}

/**
 * Gate for the caregiver dashboard when one account holds both roles.
 * Modes: loading -> enter (PIN exists) | create -> confirm (no PIN yet) | reset (after fresh sign-in)
 */
export default function PinGate() {
    const navigate = useNavigate()
    const reduce = useReducedMotion()
    const {
        hasCaregiverPin, unlockCaregiver, setCaregiverPin, resetCaregiverPin,
        recentSignIn, setActiveRole, logout, profile,
    } = useAuth()

    const [mode, setMode] = useState('loading')
    const [digits, setDigits] = useState('')
    const [firstEntry, setFirstEntry] = useState('')
    const [message, setMessage] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let active = true
        hasCaregiverPin()
            .then((exists) => { if (active) setMode(exists ? 'enter' : 'create') })
            .catch(() => {
                if (!active) return
                setMode('enter')
                setMessage('Could not check your PIN. Check your connection and try again.')
            })
        return () => { active = false }
    }, [hasCaregiverPin])

    const submit = useCallback(async (pin) => {
        setBusy(true)
        setMessage('')
        try {
            if (mode === 'enter') {
                const result = await unlockCaregiver(pin)
                if (!result.ok) {
                    if (result.error === 'locked') setMessage(formatLockMessage(result.locked_until))
                    else if (result.error === 'no_pin') setMode('create')
                    else setMessage(`Wrong PIN. ${result.attempts_left ?? 0} attempts left.`)
                }
            } else if (mode === 'create' || mode === 'reset') {
                setFirstEntry(pin)
                setMode(mode === 'reset' ? 'confirm-reset' : 'confirm')
            } else if (pin !== firstEntry) {
                setMessage('The PINs did not match. Enter a new PIN to start again.')
                setMode(mode === 'confirm-reset' ? 'reset' : 'create')
                setFirstEntry('')
            } else {
                const result = mode === 'confirm-reset'
                    ? await resetCaregiverPin(pin)
                    : await setCaregiverPin(pin)
                if (!result.ok) {
                    setMessage(result.error === 'recent_sign_in_required'
                        ? 'Sign in again to reset your PIN.'
                        : 'Could not save the PIN. Try again.')
                    setMode(mode === 'confirm-reset' ? 'reset' : 'create')
                }
            }
        } catch (err) {
            console.error('PIN error:', err)
            setMessage('Something went wrong. Check your connection and try again.')
        } finally {
            setDigits('')
            setBusy(false)
        }
    }, [mode, firstEntry, unlockCaregiver, setCaregiverPin, resetCaregiverPin])

    const press = useCallback((key) => {
        if (busy || mode === 'loading') return
        if (key === 'back') {
            setDigits((d) => d.slice(0, -1))
            return
        }
        setDigits((d) => (d.length >= PIN_LENGTH ? d : d + key))
    }, [busy, mode])

    useEffect(() => {
        if (digits.length === PIN_LENGTH) void submit(digits)
    }, [digits, submit])

    useEffect(() => {
        const onKey = (event) => {
            if (/^[0-9]$/.test(event.key)) press(event.key)
            else if (event.key === 'Backspace') press('back')
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [press])

    const leave = async () => {
        await setActiveRole('elderly')
        navigate('/elder/dashboard', { replace: true })
    }

    const forgot = async () => {
        if (recentSignIn) {
            setMessage('')
            setMode('reset')
            return
        }
        await logout()
        navigate('/auth', { replace: true })
    }

    const title = {
        loading: 'Checking…',
        enter: 'Enter caregiver PIN',
        create: 'Create a caregiver PIN',
        confirm: 'Enter the PIN again',
        reset: 'Choose a new PIN',
        'confirm-reset': 'Enter the new PIN again',
    }[mode]

    const hint = {
        enter: 'This keeps the caregiver dashboard private on this device.',
        create: 'Choose 4 digits. You will need them each time you open caregiver mode.',
    }[mode]

    return (
        <main className="min-h-screen flex items-center justify-center bg-cream-50 px-5 py-8">
            <section className="w-full max-w-sm rounded-3xl border border-sage-200/70 bg-white px-6 py-8 text-center shadow-elevated" aria-labelledby="pin-title">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-bg">
                    <Lock className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h1 id="pin-title" className="font-serif text-3xl text-sage-900">{title}</h1>
                {hint && <p className="mt-2 text-base text-sage-600 font-normal">{hint}</p>}
                {profile?.full_name && mode === 'enter' && (
                    <p className="mt-1 text-sm text-sage-500 font-normal">Signed in as {profile.full_name}</p>
                )}

                <div className="my-8 flex justify-center gap-4" role="status" aria-label={`${digits.length} of ${PIN_LENGTH} digits entered`}>
                    {Array.from({ length: PIN_LENGTH }, (_, i) => (
                        <motion.span
                            key={i}
                            animate={{ scale: i < digits.length && !reduce ? [1, 1.25, 1] : 1 }}
                            transition={{ duration: 0.2 }}
                            className={`h-4 w-4 rounded-full border-2 border-sage-900 ${i < digits.length ? 'bg-sage-900' : 'bg-transparent'}`}
                        />
                    ))}
                </div>

                <p className="min-h-[1.5rem] text-base font-bold text-rose-600" role="alert">{message}</p>

                <div className="mt-4 grid grid-cols-3 gap-3 justify-items-center">
                    {KEYS.map((key) => {
                        if (key === 'blank') return <span key={key} aria-hidden="true" />
                        const isBack = key === 'back'
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => press(key)}
                                disabled={busy || mode === 'loading'}
                                aria-label={isBack ? 'Delete last digit' : key}
                                className="flex h-16 w-full max-w-[5.5rem] items-center justify-center rounded-full border border-sage-200 bg-white text-3xl font-bold text-sage-900 shadow-soft hover:bg-sage-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-sage-100 disabled:opacity-50"
                            >
                                {isBack ? <Delete className="mx-auto h-6 w-6" aria-hidden="true" /> : key}
                            </button>
                        )
                    })}
                </div>

                <div className="mt-6 flex flex-col items-stretch gap-1 text-base">
                    {mode === 'enter' && (
                        <button type="button" onClick={forgot} className="min-h-[44px] rounded-full px-4 font-bold text-primary hover:bg-primary-bg">
                            {recentSignIn ? 'Reset PIN' : 'Forgot PIN? Sign in again to reset it'}
                        </button>
                    )}
                    <button type="button" onClick={leave} className="min-h-[44px] rounded-full px-4 font-bold text-sage-600 hover:bg-sage-100">
                        Back to elder mode
                    </button>
                </div>
            </section>
        </main>
    )
}
