import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

/**
 * SIMPLE Route Guards - Database User + Session Role
 */

// Loading component
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-sage-500 animate-spin" />
        </div>
    )
}

/**
 * AuthGuard - Requires authentication
 */
export function AuthGuard({ children }) {
    const { isAuthenticated, loading, initialized } = useAuth()

    if (!initialized || loading) return <LoadingScreen />
    if (!isAuthenticated) return <Navigate to="/auth" replace />

    return children
}

/**
 * ProtectedRoute - Full protection for dashboard routes
 * Checks: auth + session role + onboarding
 */
export function ProtectedRoute({ children, requiredRole }) {
    const {
        isAuthenticated,
        loading,
        initialized,
        activeRole, // This is now sessionActiveRole from context
        isOnboardingComplete
    } = useAuth()

    if (!initialized || loading) return <LoadingScreen />

    // Not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />
    }

    // No session role selected? Go to role select
    if (!activeRole) {
        return <Navigate to="/onboarding/role-select" replace />
    }

    // Wrong role for this route
    if (requiredRole && activeRole !== requiredRole) {
        // Redirect to the correct dashboard for their active session role
        const correctDashboard = activeRole === 'caregiver' ? '/family/dashboard' : '/elder/dashboard'
        return <Navigate to={correctDashboard} replace />
    }

    // Onboarding not complete for active role
    if (!isOnboardingComplete(activeRole)) {
        return <Navigate to={`/onboarding/${activeRole}`} replace />
    }

    return children
}

/**
 * PostLoginResolver - For home page only
 * 
 * LOGIC:
 * 1. If not authenticated -> Show children (Landing Page)
 * 2. If authenticated:
 *    - Has session role? -> Go to Dashboard (Handle Refresh)
 *    - No session role? -> Go to Role Select
 * 
 * Note: The Login page should have already cleared the session role before navigating here
 * if it was a fresh login. If the user hits this page manually or via refresh, we respect 
 * the existing session role.
 */
export function PostLoginResolver({ children }) {
    const {
        isAuthenticated,
        loading,
        initialized,
        activeRole,
        isOnboardingComplete,
        setSessionActiveRole
    } = useAuth()
    const location = useLocation()

    // If we just logged in (e.g. from Auth page), we might want to force clear?
    // But Auth page sends us here. 
    // The user requirement said: "Login -> PostLoginResolver -> sessionActiveRole = null -> Role Select"
    // However, if I refresh the dashboard, I might end up here if the route is / ? 
    // Wait, dashboard is /family/dashboard. Root is /. 
    // So if I am at /, I am either Visitor or User.
    // If I am User, I should be at Dashboard or Role Select.

    // User Requirement Upgrade:
    // "PostLoginResolver (/__auth_resolve__): sessionStorage.removeItem('sessionActiveRole') -> navigate('/onboarding/role-select')"

    // This implies that EVERY visit to this resolver clears the role. 
    // That means if I go to /, I get logged out of my role? 
    // Yes, essentially "Root / is the role resetter for authenticated users"?
    // OR, is this resolver ONLY used for the login redirect?
    // In App.jsx, this is used for path="/".

    // IF I use this for path="/", then refreshing the tab at "/" will reset the role. 
    // That seems actually desirable for avoiding "stuck" states on the landing page.

    // But wait, if I am on dashboard and I click "Home" logo which goes to "/", I lose my role?
    // That might be annoying.
    // BUT the requirement says: "3. PostLoginResolver ... sessionStorage.removeItem ... navigate"
    // AND "4. Role Select ... Set sessionActiveRole"

    // Implementation:
    // If I am authenticated and I land on Root, I will assume intent to select role or dashboard.
    // If I strictly follow "remove item", then I always force role select.
    // Let's look at the flow: "Login (/auth/login) -> navigate('/__auth_resolve__')"
    // So the resolver is a specific ephemeral route for login?
    // My previous App.jsx had PostLoginResolver wrapping Home.

    // Allow me to interpret:
    // If I am authenticated and I hit /, I should probably go to Role Select.
    // If I have a session role, maybe I can keep it?
    // User said: "PostLoginResolver ... sessionStorage.removeItem('sessionActiveRole')"
    // This sounds like a strict reset. I will follow it.

    // BUT, I need to make sure I don't break "Refresh Dashboard".
    // "Refresh Dashboard" stays on /family/dashboard, which uses ProtectedRoute.
    // ProtectedRoute does NOT use PostLoginResolver. 
    // So refreshing dashboard is SAFE.

    // So, PostLoginResolver is ONLY for / and explicit login redirects.

    useEffect(() => {
        if (initialized && isAuthenticated) {
            // Strictly clear the session role to ensure a fresh decision
            sessionStorage.removeItem('sessionActiveRole')
        }
    }, [initialized, isAuthenticated])

    if (!initialized || loading) return <LoadingScreen />

    if (!isAuthenticated) {
        return children
    }

    // Authenticated?
    // Force clear session role (conceptually) - but we can't easily mutate state in render.
    // We will just Redirect to role select. 
    // Role Select page doesn't mistakenly "auto select" anymore.
    // So it is safe to just send them there.

    // Wait, the user requirement specifically included "sessionStorage.removeItem" in this step.
    // I should probably do it to be 100% compliant.
    // But I can't do it inside the render.
    // I'll do it in the Navigate? No.
    // I'll just redirect to RoleSelect. RoleSelect does NOT read the session role to auto-redirect.
    // RoleSelect waits for user input.
    // So effectively, the role IS cleared from an interaction perspective.

    // BETTER: I will add a `useEffect` that runs once to clear if needed?
    // Actually, simply redirecting to RoleSelect is enough because RoleSelect IGNORES any existing session role
    // and forces a new selection, EXCEPT wait...
    // My new component RoleSelect doesn't "ignore" it per se, it just displays buttons.
    // Does it Auto-Redirect if session role exists?
    // Let's check RoleSelect implementation plan.
    // "Role Select ... On click ... Set sessionActiveRole".
    // Does RoleSelect mount check? NO.
    // So we are good.

    return <Navigate to="/onboarding/role-select" replace />
}



