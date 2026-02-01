import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Auth Callback - Handles OAuth redirect
 */
export default function AuthCallback() {
    const navigate = useNavigate()
    const { user, loading, initialized } = useAuth()
    const [status, setStatus] = useState('processing')
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!initialized) return

        if (user) {
            setStatus('success')
            // Navigate to home - PostLoginResolver will handle routing
            setTimeout(() => navigate('/', { replace: true }), 500)
        } else if (!loading) {
            setStatus('error')
            setError('Authentication failed')
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
