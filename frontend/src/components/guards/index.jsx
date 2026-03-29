import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-sage-500 animate-spin" />
        </div>
    )
}

export function AuthGuard({ children }) {
    const { isAuthenticated, loading, initialized } = useAuth()

    if (!initialized || loading) return <LoadingScreen />
    if (!isAuthenticated) return <Navigate to="/auth" replace />

    return children
}

export function ProtectedRoute({ children, requiredRole }) {
    const {
        isAuthenticated,
        loading,
        initialized,
        activeRole,
        isOnboardingComplete,
    } = useAuth()

    if (!initialized || loading) return <LoadingScreen />

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />
    }

    if (!activeRole) {
        return <Navigate to="/onboarding/role-select" replace />
    }

    if (requiredRole && activeRole !== requiredRole) {
        const correctDashboard = activeRole === 'caregiver' ? '/family/dashboard' : '/elder/dashboard'
        return <Navigate to={correctDashboard} replace />
    }

    if (!isOnboardingComplete(activeRole)) {
        return <Navigate to={`/onboarding/${activeRole}`} replace />
    }

    return children
}

export function PostLoginResolver({ children }) {
    const {
        isAuthenticated,
        loading,
        initialized,
        activeRole,
        isOnboardingComplete,
    } = useAuth()

    if (!initialized || loading) return <LoadingScreen />

    if (!isAuthenticated) {
        return children
    }

    if (!activeRole) {
        return <Navigate to="/onboarding/role-select" replace />
    }

    if (!isOnboardingComplete(activeRole)) {
        return <Navigate to={`/onboarding/${activeRole}`} replace />
    }

    const dashboard = activeRole === 'caregiver' ? '/family/dashboard' : '/elder/dashboard'
    return <Navigate to={dashboard} replace />
}

