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

        if (user) {
            setStatus('success')
            // Route guards at "/" resolve final onboarding/dashboard destination.
            setTimeout(() => navigate('/', { replace: true }), 500)
        } else if (!loading) {
            setStatus('error')
            setError((prev) => prev || 'Authentication failed')
            setTimeout(() => navigate('/auth', { replace: true }), 2000)
        }
    }, [user, loading, initialized, navigate])

    return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-sage-100 text-center max-w-sm">
                {status === 'processing' && (
                    <>
                        <Loader2 className="w-12 h-12 text-sage-500 animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-sage-800 mb-2">Signing you in...</h2>
                        <p className="text-sage-500">Please wait</p>
                        {fallbackVisible && (
                            <button
                                type="button"
                                onClick={() => navigate('/auth', { replace: true })}
                                className="mt-4 inline-flex items-center justify-center rounded-xl border border-sage-300 px-4 py-2 text-sm font-semibold text-sage-700 hover:bg-sage-50"
                            >
                                Back to Sign In
                            </button>
                        )}
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="w-12 h-12 text-sage-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-sage-800 mb-2">Welcome!</h2>
                        <p className="text-sage-500">Setting up...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-sage-800 mb-2">Error</h2>
                        <p className="text-rose-500 text-sm">{error}</p>
                    </>
                )}
            </div>
        </div>
    )
}
