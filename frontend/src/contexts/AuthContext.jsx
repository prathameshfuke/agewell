import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
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

const UNLOCK_KEY = 'caregiverUnlockUntil'
const UNLOCK_MINUTES = 30

function readUnlockUntil() {
    try {
        const stored = Number(sessionStorage.getItem(UNLOCK_KEY)) || 0
        return stored > Date.now() ? stored : 0
    } catch {
        return 0
    }
}

function getStoredRole() {
    try {
        return normalizeRole(localStorage.getItem('activeRole') || sessionStorage.getItem('sessionActiveRole'))
    } catch {
        return null // storage blocked (private window): a throw here would blank the whole app
    }
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
    const [unlockUntil, setUnlockUntilState] = useState(readUnlockUntil)
    const signedInUserId = useRef(null) // Supabase re-emits SIGNED_IN on tab refocus: ignore it for the same user

    const setUnlockUntil = useCallback((timestamp) => {
        try {
            if (timestamp) sessionStorage.setItem(UNLOCK_KEY, String(timestamp))
            else sessionStorage.removeItem(UNLOCK_KEY)
        } catch { /* storage unavailable: unlock lasts until reload */ }
        setUnlockUntilState(timestamp || 0)
    }, [])

    // Re-lock automatically when the unlock window ends.
    useEffect(() => {
        const remaining = unlockUntil - Date.now()
        if (remaining <= 0) return undefined
        const timer = setTimeout(() => setUnlockUntilState(0), remaining)
        return () => clearTimeout(timer)
    }, [unlockUntil])

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
        setUnlockUntil(0)
        signedInUserId.current = null
    }, [setSessionActiveRole, setUnlockUntil])

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

        signedInUserId.current = session.user.id
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

                if (event === 'SIGNED_IN' && session?.user?.id && session.user.id === signedInUserId.current) {
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
            password
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

    // One email can be both the elder and the caregiver. Then the caregiver
    // dashboard sits behind a PIN, and it shows this same account's data.
    const isDualRole = roles.includes('elderly') && roles.includes('caregiver')
    const pinRequired = isDualRole
    const caregiverUnlocked = !pinRequired || unlockUntil > Date.now()
    const linkedElderId = profile?.linked_elderly_id || (roles.includes('elderly') ? user?.id || null : null)

    const callPinRpc = useCallback(async (fn, args) => {
        if (!supabase) throw new Error('Supabase not configured')
        const { data, error } = await supabase.rpc(fn, args)
        if (error) throw error
        return data || { ok: false, error: 'unknown' }
    }, [])

    const hasCaregiverPin = useCallback(async () => {
        if (!supabase) return false
        const { data, error } = await supabase.rpc('has_caregiver_pin')
        if (error) throw error
        return Boolean(data)
    }, [])

    const unlockCaregiver = useCallback(async (pin) => {
        const result = await callPinRpc('verify_caregiver_pin', { pin })
        if (result.ok) setUnlockUntil(Date.now() + UNLOCK_MINUTES * 60 * 1000)
        return result
    }, [callPinRpc, setUnlockUntil])

    const setCaregiverPin = useCallback(async (newPin, currentPin = null) => {
        const result = await callPinRpc('set_caregiver_pin', { new_pin: newPin, current_pin: currentPin })
        if (result.ok) setUnlockUntil(Date.now() + UNLOCK_MINUTES * 60 * 1000)
        return result
    }, [callPinRpc, setUnlockUntil])

    const resetCaregiverPin = useCallback(async (newPin) => {
        const result = await callPinRpc('reset_caregiver_pin', { new_pin: newPin })
        if (result.ok) setUnlockUntil(Date.now() + UNLOCK_MINUTES * 60 * 1000)
        return result
    }, [callPinRpc, setUnlockUntil])

    const lockCaregiver = useCallback(() => setUnlockUntil(0), [setUnlockUntil])
    const recentSignIn = Boolean(user?.last_sign_in_at) &&
        Date.now() - new Date(user.last_sign_in_at).getTime() < 5 * 60 * 1000

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
        isDualRole,
        pinRequired,
        caregiverUnlocked,
        linkedElderId,
        recentSignIn,
        hasCaregiverPin,
        unlockCaregiver,
        setCaregiverPin,
        resetCaregiverPin,
        lockCaregiver,

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


