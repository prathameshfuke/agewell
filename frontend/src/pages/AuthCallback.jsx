import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { done } from '../assets/images/gen'
import { Art } from '../components/family/FamilyPage'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Auth Callback - Handles OAuth redirect
 */
export default function AuthCallback() {
    const navigate = useNavigate()
    const { user, loading, initialized } = useAuth()
    const [status, setStatus] = useState('processing')
    const [error, setError] = useState(null)
    const [fallbackVisible, setFallbackVisible] = useState(false)

    useEffect(() => {
        if (!isSupabaseConfigured() || !supabase) {
            setStatus('error')
            setError('Supabase is not configured. Please set your frontend environment variables.')
            return
        }

        let cancelled = false
        let fallbackTimer = null

        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

        const resolveSession = async () => {
            const currentUrl = new URL(window.location.href)
            const code = currentUrl.searchParams.get('code')
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
            const hasHashToken = Boolean(hashParams.get('access_token') && hashParams.get('refresh_token'))

            try {
                if (code && typeof supabase.auth.exchangeCodeForSession === 'function') {
                    await supabase.auth.exchangeCodeForSession(code)
                } else if (hasHashToken) {
                    await supabase.auth.setSession({
                        access_token: hashParams.get('access_token'),
                        refresh_token: hashParams.get('refresh_token'),
                    })
                }
            } catch (exchangeError) {
                if (!cancelled) {
                    setStatus('error')
                    setError(exchangeError?.message || 'Unable to complete sign-in callback.')
                }
                return
            }

            for (let attempt = 0; attempt < 12; attempt += 1) {
                const { data, error: sessionError } = await supabase.auth.getSession()
                if (sessionError) {
                    if (!cancelled) {
                        setStatus('error')
                        setError(sessionError.message || 'Failed to restore session.')
                    }
                    return
                }

                if (data?.session?.user) {
                    if (!cancelled) {
                        setStatus('success')
                    }
                    return
                }

                await wait(250)
            }

            if (!cancelled) {
                setStatus('error')
                setError('Sign-in callback completed, but no user session was found.')
            }
        }

        fallbackTimer = setTimeout(() => {
            if (!cancelled) {
                setFallbackVisible(true)
            }
        }, 3000)

        void resolveSession()

        return () => {
            cancelled = true
            if (fallbackTimer) clearTimeout(fallbackTimer)
        }
    }, [])

    useEffect(() => {
        if (!initialized) return

        let t
        if (user) {
            setStatus('success')
            // Route guards at "/" resolve final onboarding/dashboard destination.
            t = setTimeout(() => navigate('/', { replace: true }), 500)
        } else if (!loading) {
            setStatus('error')
            setError((prev) => prev || 'Authentication failed')
            t = setTimeout(() => navigate('/auth', { replace: true }), 2000)
        }
        return () => clearTimeout(t)
    }, [user, loading, initialized, navigate])

    return (
        <main className="flex min-h-screen items-center justify-center bg-paper px-4 font-sans text-ink">
            <div role="status" aria-live="polite" className="w-full max-w-sm text-center">
                {status === 'processing' && (
                    <>
                        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
                        <h1 className="font-serif text-4xl">Signing you in...</h1>
                        <p className="mt-2 text-ink-2">This only takes a moment.</p>
                        {fallbackVisible && (
                            <button type="button" onClick={() => navigate('/auth', { replace: true })} className="btn-secondary mt-6 w-full">
                                Back to sign in
                            </button>
                        )}
                    </>
                )}
                {status === 'success' && (
                    <>
                        <Art src={done} className="mx-auto mb-4 w-32" />
                        <h1 className="font-serif text-4xl">Signed in</h1>
                        <p className="mt-2 text-ink-2">Setting things up...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <h1 className="font-serif text-4xl">Sign-in failed</h1>
                        <p className="mt-2 text-rose-700">{error}</p>
                        <button type="button" onClick={() => navigate('/auth', { replace: true })} className="btn-secondary mt-6 w-full">
                            Back to sign in
                        </button>
                    </>
                )}
            </div>
        </main>
    )
}
