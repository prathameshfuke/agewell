import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, signInWithGoogle, signOut, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext({})

/**
 * HEALTHCARE-GRADE Authentication Context
 * 
 * - User Identity: Persistent (Database)
 * - User Profile: Persistent (Database)
 * - Active Role: SESSION ONLY (sessionStorage) - NEVER persistent
 * 
 * This ensures no role leakage between shared devices/sessions.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [sessionActiveRole, setSessionActiveRoleState] = useState(() => {
        return sessionStorage.getItem('sessionActiveRole')
    })
    const [loading, setLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)

    // Fetch profile from database
    const fetchProfile = useCallback(async (userId) => {
        try {
            // Fetching profile
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('Profile fetch error:', error)
                return null
            }
            // Profile fetched successfully
            return data
        } catch (err) {
            console.error('Profile fetch exception:', err)
            return null
        }
    }, [])

    // Refresh profile from database
    const refreshProfile = useCallback(async () => {
        if (!user) return null
        const data = await fetchProfile(user.id)
        if (data) setProfile(data)
        return data
    }, [user, fetchProfile])

    // Update Session Active Role (State + Storage)
    const setSessionActiveRole = useCallback((role) => {
        if (role) {
            sessionStorage.setItem('sessionActiveRole', role)
        } else {
            sessionStorage.removeItem('sessionActiveRole')
        }
        setSessionActiveRoleState(role)
    }, [])

    // Initialize auth
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setLoading(false)
            setInitialized(true)
            return
        }

        let mounted = true

        const init = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user && mounted) {
                    setUser(session.user)
                    const profileData = await fetchProfile(session.user.id)
                    if (mounted) setProfile(profileData)
                }
            } catch (err) {
                console.error('Auth init error:', err)
            } finally {
                if (mounted) {
                    setLoading(false)
                    setInitialized(true)
                }
            }
        }

        init()

        // Auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return

            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user)
                const profileData = await fetchProfile(session.user.id)
                if (mounted) setProfile(profileData)
                setLoading(false)
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                setProfile(null)
                setSessionActiveRole(null) // Clear session role on logout
                setLoading(false)
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [fetchProfile, setSessionActiveRole])

    // Login with Google
    const login = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                skipBrowserRedirect: false
            }
        })
    }

    // Login with Email
    const loginWithEmail = async (email, password) => {
        // Attempting email login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) {
            console.error('Supabase Email Login Error:', error)
            throw error
        }
        // Login success
        return data
    }

    // Signup with Email
    const signupWithEmail = async (email, password) => {
        // Attempting email signup
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: 'Admin User'
                }
            }
        })
        if (error) {
            console.error('Supabase Email Signup Error:', error)
            throw error
        }
        // Signup success
        return data
    }

    // Logout
    const logout = async () => {
        await signOut()
        setSessionActiveRole(null)
        setUser(null)
        setProfile(null)
        // Explicitly clear storage just in case
        sessionStorage.removeItem('sessionActiveRole')
    }

    // Add role to user (Persistent)
    const addRole = async (role) => {
        if (!user) throw new Error('Not authenticated')

        const currentRoles = profile?.roles || []
        const newRoles = currentRoles.includes(role) ? currentRoles : [...currentRoles, role]

        // Try Update first
        let { data, error } = await supabase
            .from('profiles')
            .update({
                roles: newRoles,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single()

        // Handle missing row (PGRST116) by inserting
        if (error && (error.code === 'PGRST116' || error.message.includes('JSON object requested'))) {
            console.warn('Profile missing, creating new one...')
            const { data: insertData, error: insertError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    roles: newRoles,
                    updated_at: new Date().toISOString(),
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata?.avatar_url
                })
                .select()
                .single()

            if (insertError) throw insertError
            data = insertData
            error = null
        }

        if (error) throw error
        setProfile(data)

        // Also set as active for this session
        setSessionActiveRole(role)
        return data
    }

    // Complete onboarding for a role
    const completeOnboarding = async (role, profileData = {}) => {
        if (!user) throw new Error('Not authenticated')

        const onboardingField = role === 'elderly'
            ? 'onboarding_elder_completed'
            : 'onboarding_caregiver_completed'

        // Try Update first
        let { data, error } = await supabase
            .from('profiles')
            .update({
                ...profileData,
                [onboardingField]: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single()

        // Handle missing row (PGRST116) by inserting
        if (error && (error.code === 'PGRST116' || error.message.includes('JSON object requested'))) {
            console.warn('Profile missing during onboarding, creating new one...')
            const { data: insertData, error: insertError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...profileData,
                    [onboardingField]: true,
                    updated_at: new Date().toISOString(),
                    full_name: profileData.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata?.avatar_url
                })
                .select()
                .single()

            if (insertError) throw insertError
            data = insertData
            error = null
        }

        if (error) {
            console.error('Complete Onboarding Error:', error)
            throw error
        }
        setProfile(data)

        // Ensure session role is set
        setSessionActiveRole(role)
        return data
    }

    // Check if onboarding is complete for a role
    const isOnboardingComplete = (role) => {
        if (!profile) return false
        if (role === 'elderly') return profile.onboarding_elder_completed === true
        if (role === 'caregiver') return profile.onboarding_caregiver_completed === true
        return false
    }

    // Computed values
    const isAuthenticated = !!user
    const roles = profile?.roles || []
    // activeRole is NOW purely session-based
    const activeRole = sessionActiveRole
    const hasAnyRole = roles.length > 0

    const value = {
        // State
        user,
        profile,
        loading,
        initialized,

        // Computed
        isAuthenticated,
        roles,
        activeRole, // This is now sessionActiveRole
        hasAnyRole,

        // Actions
        login,
        loginWithEmail,
        signupWithEmail,
        logout,
        addRole,
        setSessionActiveRole, // Expose this explicit setter
        completeOnboarding,
        refreshProfile,
        isOnboardingComplete,

        // Legacy compat (if any)
        hasRole: hasAnyRole,
        isConfigured: isSupabaseConfigured()
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}

export default AuthContext


