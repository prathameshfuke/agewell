import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
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
        <main className="min-h-screen bg-cream-50 flex items-center justify-center px-5">
            <div role="status" aria-live="polite" className="bg-white rounded-3xl p-8 border border-sage-200 text-center max-w-sm w-full">
                {status === 'processing' && (
                    <>
                        <Loader2 className="w-10 h-10 text-primary animate-spin motion-reduce:animate-none mx-auto mb-4" aria-hidden="true" />
                        <h1 className="text-2xl font-serif text-sage-900 mb-1">Signing you in…</h1>
                        <p className="text-sage-600 font-normal">This only takes a moment.</p>
                        {fallbackVisible && (
                            <button type="button" onClick={() => navigate('/auth', { replace: true })} className="btn-secondary mt-4 mx-auto">
                                Back to sign in
                            </button>
                        )}
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-4" aria-hidden="true" />
                        <h1 className="text-2xl font-serif text-sage-900 mb-1">Signed in</h1>
                        <p className="text-sage-600 font-normal">Setting things up…</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="w-10 h-10 text-rose-600 mx-auto mb-4" aria-hidden="true" />
                        <h1 className="text-2xl font-serif text-sage-900 mb-1">Sign-in failed</h1>
                        <p className="text-rose-700 text-sm font-normal">{error}</p>
                        <button type="button" onClick={() => navigate('/auth', { replace: true })} className="btn-secondary mt-4 mx-auto">
                            Back to sign in
                        </button>
                    </>
                )}
            </div>
        </main>
    )
}
