import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext({})

const ROLE_ALIASES = {
    elder: 'elderly',
    elderly: 'elderly',
    caregiver: 'caregiver'
}

function normalizeRole(role) {
    if (!role || typeof role !== 'string') return null
    return ROLE_ALIASES[role.trim().toLowerCase()] || null
}

function getStoredRole() {
    const raw = localStorage.getItem('activeRole') || sessionStorage.getItem('sessionActiveRole')
    return normalizeRole(raw)
}

function buildRoleList(profileData) {
    const fromArray = Array.isArray(profileData?.roles) ? profileData.roles : []
    const fromLegacyField = profileData?.role ? [profileData.role] : []

    const normalized = []
    for (const rawRole of [...fromArray, ...fromLegacyField]) {
        const roleText = String(rawRole || '').trim().toLowerCase()
        if (!roleText) continue

        if (roleText === 'both') {
            normalized.push('elderly', 'caregiver')
            continue
        }

        const normalizedRole = normalizeRole(roleText)
        if (normalizedRole) {
            normalized.push(normalizedRole)
        }
    }

    return [...new Set(normalized)]
}

function hasCompletedOnboarding(profileData, role) {
    if (!profileData || !role) return false

    const hasName = Boolean(profileData.full_name && profileData.full_name.trim().length > 0)
    if (!hasName) return false

    if (profileData.onboarding_completed === true) {
        return true
    }

    if (role === 'elderly') {
        return profileData.onboarding_elder_completed === true
    }

    if (role === 'caregiver') {
        return profileData.onboarding_caregiver_completed === true
    }

    return false
}

function resolveSelectedRole(profileData, preferredRole = null) {
    const roles = buildRoleList(profileData)
    const candidates = [
        normalizeRole(preferredRole),
        normalizeRole(profileData?.active_role),
        getStoredRole()
    ]

    for (const candidate of candidates) {
        if (!candidate) continue
        if (roles.length === 0 || roles.includes(candidate)) {
            return candidate
        }
    }

    if (roles.length === 1) {
        return roles[0]
    }

    return null
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [activeRole, setActiveRoleState] = useState(() => getStoredRole())
    const [onboardingComplete, setOnboardingComplete] = useState(false)
    const [loading, setLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)

    const setSessionActiveRole = useCallback((role) => {
        const normalizedRole = normalizeRole(role)

        if (normalizedRole) {
            localStorage.setItem('activeRole', normalizedRole)
            sessionStorage.setItem('sessionActiveRole', normalizedRole)
        } else {
            localStorage.removeItem('activeRole')
            sessionStorage.removeItem('sessionActiveRole')
        }

        setActiveRoleState(normalizedRole)
    }, [])

    const clearAuthState = useCallback(() => {
        setUser(null)
        setProfile(null)
        setSessionActiveRole(null)
        setOnboardingComplete(false)
    }, [setSessionActiveRole])

    const applyProfileState = useCallback((profileData, preferredRole = null) => {
        setProfile(profileData)

        const selectedRole = resolveSelectedRole(profileData, preferredRole)
        setSessionActiveRole(selectedRole)
        setOnboardingComplete(hasCompletedOnboarding(profileData, selectedRole))

        return selectedRole
    }, [setSessionActiveRole])

    const fetchProfile = useCallback(async (userId, preferredRole = null) => {
        if (!supabase || !userId) {
            return null
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    setProfile(null)
                    setSessionActiveRole(null)
                    setOnboardingComplete(false)
                    return null
                }

                console.error('Profile fetch error:', error)
                return null
            }

            applyProfileState(data, preferredRole)
            return data
        } catch (err) {
            console.error('Profile fetch exception:', err)
            return null
        }
    }, [applyProfileState, setSessionActiveRole])

    const refreshProfile = useCallback(async () => {
        if (!user) return null
        return fetchProfile(user.id, activeRole)
    }, [user, fetchProfile, activeRole])

    const syncSession = useCallback(async (session, preferredRole = null) => {
        if (!session?.user) {
            clearAuthState()
            return
        }

        setUser(session.user)
        await fetchProfile(session.user.id, preferredRole)
    }, [clearAuthState, fetchProfile])

    useEffect(() => {
        if (!isSupabaseConfigured() || !supabase) {
            setLoading(false)
            setInitialized(true)
            return
        }

        let mounted = true

        const initializeAuth = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase.auth.getSession()
                if (error) {
                    console.error('Session restore error:', error)
                }

                if (!mounted) return
                await syncSession(data?.session || null)
            } catch (err) {
                console.error('Session initialization failed:', err)
            } finally {
                if (mounted) {
                    setLoading(false)
                    setInitialized(true)
                }
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return

            void (async () => {
                // Don't reload on TOKEN_REFRESHED if user hasn't changed
                if (event === 'TOKEN_REFRESHED') {
                    // Token refresh doesn't change user identity, skip full reload
                    return
                }

                setLoading(true)
                try {
                    if (event === 'SIGNED_OUT') {
                        clearAuthState()
                    } else {
                        await syncSession(session || null)
                    }
                } finally {
                    if (mounted) {
                        setLoading(false)
                        setInitialized(true)
                    }
                }
            })()
        })

        void initializeAuth()

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [clearAuthState, syncSession])

    const login = async () => {
        if (!supabase) throw new Error('Supabase not configured')

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                skipBrowserRedirect: false
            }
        })
    }

    const loginWithEmail = async (email, password) => {
        if (!supabase) throw new Error('Supabase not configured')

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            console.error('Supabase Email Login Error:', error)
            throw error
        }

        return data
    }

    const signupWithEmail = async (email, password) => {
        if (!supabase) throw new Error('Supabase not configured')

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

        return data
    }

    const signOutUser = useCallback(async () => {
        if (!supabase) {
            clearAuthState()
            return
        }

        const { error } = await supabase.auth.signOut({ scope: 'local' })
        if (error) {
            console.error('Logout warning:', error)
            throw error
        }
    }, [clearAuthState])

    const addRole = useCallback(async (role) => {
        if (!user) throw new Error('Not authenticated')
        if (!supabase) throw new Error('Supabase not configured')

        const normalizedRole = normalizeRole(role)
        if (!normalizedRole) throw new Error('Invalid role selected.')

        const currentRoles = buildRoleList(profile)
        const updatedRoles = currentRoles.includes(normalizedRole)
            ? currentRoles
            : [...currentRoles, normalizedRole]

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                roles: updatedRoles,
                active_role: normalizedRole,
                full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || null,
                avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
                updated_at: new Date().toISOString()
            })
            .select('*')
            .single()

        if (error) {
            throw error
        }

        applyProfileState(data, normalizedRole)
        return data
    }, [user, profile, applyProfileState])

    const updateRole = useCallback(async (role) => {
        const normalizedRole = normalizeRole(role)

        if (!normalizedRole) {
            setSessionActiveRole(null)
            setOnboardingComplete(false)
            return null
        }

        const availableRoles = buildRoleList(profile)
        if (availableRoles.length > 0 && !availableRoles.includes(normalizedRole)) {
            throw new Error('This role is not available for your account.')
        }

        setSessionActiveRole(normalizedRole)
        setOnboardingComplete(hasCompletedOnboarding(profile, normalizedRole))

        if (!user || !supabase) {
            return normalizedRole
        }

        let { data, error } = await supabase
            .from('profiles')
            .update({
                active_role: normalizedRole,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select('*')
            .single()

        if (error && error.code === 'PGRST116') {
            const { data: upserted, error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    active_role: normalizedRole,
                    roles: availableRoles.length > 0 ? availableRoles : [normalizedRole],
                    full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || null,
                    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
                    updated_at: new Date().toISOString()
                })
                .select('*')
                .single()

            data = upserted
            error = upsertError
        }

        if (error) {
            throw error
        }

        applyProfileState(data, normalizedRole)
        return normalizedRole
    }, [profile, user, setSessionActiveRole, applyProfileState])

    const completeOnboarding = useCallback(async (roleOrProfileData, maybeProfileData = {}) => {
        if (!user) throw new Error('Not authenticated')
        if (!supabase) throw new Error('Supabase not configured')

        const explicitRole = typeof roleOrProfileData === 'string'
            ? normalizeRole(roleOrProfileData)
            : normalizeRole(activeRole)

        const targetRole = explicitRole || activeRole
        const profileData = typeof roleOrProfileData === 'string'
            ? maybeProfileData
            : roleOrProfileData || {}

        const roleList = buildRoleList(profile)
        const nextRoles = targetRole && !roleList.includes(targetRole)
            ? [...roleList, targetRole]
            : roleList

        const updatePayload = {
            ...profileData,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
        }

        if (targetRole === 'elderly') {
            updatePayload.onboarding_elder_completed = true
        }

        if (targetRole === 'caregiver') {
            updatePayload.onboarding_caregiver_completed = true
        }

        if (targetRole) {
            updatePayload.active_role = targetRole
        }

        if (nextRoles.length > 0) {
            updatePayload.roles = nextRoles
        }

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: updatePayload.full_name || profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || null,
                avatar_url: updatePayload.avatar_url || profile?.avatar_url || user.user_metadata?.avatar_url || null,
                ...updatePayload
            })
            .select('*')
            .single()

        if (error) {
            console.error('Complete Onboarding Error:', error)
            throw error
        }

        applyProfileState(data, targetRole)
        return data
    }, [user, profile, activeRole, applyProfileState])

    const isOnboardingComplete = useCallback((role) => {
        const roleToCheck = normalizeRole(role || activeRole)
        if (!roleToCheck) return false

        if (roleToCheck === activeRole) {
            return onboardingComplete
        }

        return hasCompletedOnboarding(profile, roleToCheck)
    }, [activeRole, onboardingComplete, profile])

    const isAuthenticated = Boolean(user)
    const roles = buildRoleList(profile)
    const hasAnyRole = roles.length > 0

    const value = {
        user,
        profile,
        role: activeRole,
        activeRole,
        roles,
        loading,
        initialized,
        onboardingComplete,
        isAuthenticated,
        hasAnyRole,

        login,
        loginWithEmail,
        signupWithEmail,
        signOut: signOutUser,
        logout: signOutUser,
        addRole,
        updateRole,
        setActiveRole: updateRole,
        setSessionActiveRole,
        completeOnboarding,
        refreshProfile,
        fetchProfile,
        isOnboardingComplete,

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


