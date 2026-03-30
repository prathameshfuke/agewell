import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import FullScreenLoader from './components/FullScreenLoader'
import BottomNav from './components/BottomNav'
import AppErrorBoundary from './components/AppErrorBoundary'

import DemoSimulationPanel from './components/DemoSimulationPanel'

const CHUNK_ERROR_RE = /chunkloaderror|failed to fetch dynamically imported module|importing a module script failed|loading chunk [\d\w-]+ failed|unexpected token '<'/i
const LAZY_RELOAD_FLAG = 'agewell-lazy-reload-attempted'

const lazyWithRetry = (importer) => {
    return lazy(async () => {
        try {
            const loaded = await importer()
            if (typeof window !== 'undefined') {
                window.sessionStorage.removeItem(LAZY_RELOAD_FLAG)
            }
            return loaded
        } catch (error) {
            const message = String(error?.message || '')
            const isChunkError = CHUNK_ERROR_RE.test(message)

            if (typeof window !== 'undefined' && isChunkError) {
                const hasRetried = window.sessionStorage.getItem(LAZY_RELOAD_FLAG) === '1'
                if (!hasRetried) {
                    window.sessionStorage.setItem(LAZY_RELOAD_FLAG, '1')
                    window.location.reload()
                    return new Promise(() => { })
                }
                window.sessionStorage.removeItem(LAZY_RELOAD_FLAG)
            }

            throw error
        }
    })
}

// Lazy Load Pages for Performance
const Home = lazyWithRetry(() => import('./pages/Home'))
const Auth = lazyWithRetry(() => import('./pages/Auth'))
const AuthCallback = lazyWithRetry(() => import('./pages/AuthCallback'))
const DemoPage = lazyWithRetry(() => import('./pages/DemoPage'))

// Onboarding
const RoleSelect = lazyWithRetry(() => import('./pages/RoleSelect'))
const ElderlyOnboarding = lazyWithRetry(() => import('./pages/ElderlyOnboarding'))
const CaregiverOnboarding = lazyWithRetry(() => import('./pages/CaregiverOnboarding'))

// Elder Pages
const ElderDashboard = lazyWithRetry(() => import('./pages/ElderDashboard'))
const ElderMeds = lazyWithRetry(() => import('./pages/ElderMeds'))
const ElderHistory = lazyWithRetry(() => import('./pages/ElderHistory'))
const ElderEmergency = lazyWithRetry(() => import('./pages/ElderEmergency'))
const ElderSummary = lazyWithRetry(() => import('./pages/ElderSummary'))
const ElderHealth = lazyWithRetry(() => import('./pages/ElderHealth'))
const ElderSettings = lazyWithRetry(() => import('./pages/ElderSettings'))
const Settings = lazyWithRetry(() => import('./pages/Settings'))
const CaregiverLink = lazyWithRetry(() => import('./pages/CaregiverLink'))

// Family/Caregiver Pages
const FamilyDashboard = lazyWithRetry(() => import('./pages/FamilyDashboard'))
const FamilyReplay = lazyWithRetry(() => import('./pages/FamilyReplay'))
const FamilyMembers = lazyWithRetry(() => import('./pages/FamilyMembers'))
const FamilyPermissions = lazyWithRetry(() => import('./pages/FamilyPermissions'))
const FamilyMeds = lazyWithRetry(() => import('./pages/FamilyMeds'))
const FamilySettings = lazyWithRetry(() => import('./pages/FamilySettings'))
const PrescriptionUpload = lazyWithRetry(() => import('./pages/PrescriptionUpload'))
const PrescriptionReview = lazyWithRetry(() => import('./pages/PrescriptionReview'))
const HealthMonitor = lazyWithRetry(() => import('./pages/HealthMonitor'))
const DispenserSetup = lazyWithRetry(() => import('./pages/DispenserSetup'))

// Diagnosis Pages
const DiagnosisHome = lazyWithRetry(() => import('./pages/Diagnosis/DiagnosisHome'))
const SymptomInput = lazyWithRetry(() => import('./pages/Diagnosis/SymptomInput'))
const QAFlow = lazyWithRetry(() => import('./pages/Diagnosis/QAFlow'))
const DiagnosisReport = lazyWithRetry(() => import('./pages/Diagnosis/DiagnosisReport'))
const DiagnosisHistory = lazyWithRetry(() => import('./pages/Diagnosis/DiagnosisHistory'))

// Voice Memos (Shared or specific? Looks shared based on imports previously, but path was 'pages/VoiceMemos')
const VoiceMemos = lazyWithRetry(() => import('./pages/VoiceMemos'))

const normalizeRole = (role) => {
    if (!role) return null
    const normalized = role.toLowerCase()
    if (normalized === 'elder') return 'elderly'
    if (normalized === 'elderly') return 'elderly'
    if (normalized === 'caregiver') return 'caregiver'
    return null
}

const dashboardPathForRole = (role) => {
    const normalizedRole = normalizeRole(role)
    return normalizedRole === 'caregiver' ? '/family/dashboard' : '/elder/dashboard'
}

const onboardingPathForRole = (role) => {
    const normalizedRole = normalizeRole(role)
    return normalizedRole === 'caregiver' ? '/onboarding/caregiver' : '/onboarding/elderly'
}

// Emergency Reset Handler
const ResetHandler = ({ children }) => {
    if (window.location.search.includes('reset=true')) {
        console.warn('Emergency Reset Triggered')
        localStorage.clear()
        sessionStorage.clear()
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        window.location.href = '/'
        return null
    }
    return children
}

const RouteLoader = ({ message = 'Restoring your session...' }) => (
    <FullScreenLoader message={message} />
)

function AuthRoute({ children }) {
    const { user, loading, role, isOnboardingComplete } = useAuth()

    if (loading) return <RouteLoader />
    if (!user) return children

    if (!role) {
        return <Navigate to="/onboarding/role-select" replace />
    }

    if (!isOnboardingComplete(role)) {
        return <Navigate to={onboardingPathForRole(role)} replace />
    }

    return <Navigate to={dashboardPathForRole(role)} replace />
}

function OnboardingRoute({ children, requiredRole = null }) {
    const { user, loading, role, isOnboardingComplete } = useAuth()

    if (loading) return <RouteLoader />
    if (!user) return <Navigate to="/auth" replace />

    const normalizedRequiredRole = normalizeRole(requiredRole)
    const normalizedActiveRole = normalizeRole(role)

    if (normalizedRequiredRole) {
        if (!normalizedActiveRole) {
            return <Navigate to="/onboarding/role-select" replace />
        }

        if (normalizedActiveRole !== normalizedRequiredRole) {
            return <Navigate to={dashboardPathForRole(normalizedActiveRole)} replace />
        }

        if (isOnboardingComplete(normalizedRequiredRole)) {
            return <Navigate to={dashboardPathForRole(normalizedRequiredRole)} replace />
        }
    }

    return children
}

function ProtectedRoute({ children, requiredRole = null }) {
    const { user, loading, role, isOnboardingComplete } = useAuth()

    if (loading) return <RouteLoader />
    if (!user) return <Navigate to="/auth" replace />

    const normalizedActiveRole = normalizeRole(role)
    if (!normalizedActiveRole) {
        return <Navigate to="/onboarding/role-select" replace />
    }

    const normalizedRequiredRole = normalizeRole(requiredRole)
    if (normalizedRequiredRole && normalizedRequiredRole !== normalizedActiveRole) {
        return <Navigate to={dashboardPathForRole(normalizedActiveRole)} replace />
    }

    if (!isOnboardingComplete(normalizedActiveRole)) {
        return <Navigate to={onboardingPathForRole(normalizedActiveRole)} replace />
    }

    return children
}

function AppRoutes() {
    return (
        <Suspense fallback={<FullScreenLoader message="Loading AgeWell..." />}>
            <Routes>
                {/* HOME - redirect authenticated users into their flow */}
                <Route path="/" element={
                    <ResetHandler>
                        <AuthRoute>
                            <Home />
                        </AuthRoute>
                    </ResetHandler>
                } />

                {/* AUTH */}
                <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/signup" element={<Navigate to="/auth" replace />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/demo" element={<DemoPage />} />

                {/* ONBOARDING */}
                <Route path="/onboarding/role-select" element={
                    <OnboardingRoute><RoleSelect /></OnboardingRoute>
                } />
                <Route path="/onboarding/elderly" element={
                    <OnboardingRoute requiredRole="elderly"><ElderlyOnboarding /></OnboardingRoute>
                } />
                <Route path="/onboarding/elder" element={<Navigate to="/onboarding/elderly" replace />} />
                <Route path="/onboarding/caregiver" element={
                    <OnboardingRoute requiredRole="caregiver"><CaregiverOnboarding /></OnboardingRoute>
                } />

                {/* ELDER */}
                <Route path="/elder/dashboard" element={
                    <ProtectedRoute requiredRole="elderly"><ElderDashboard /></ProtectedRoute>
                } />
                <Route path="/elder/meds" element={
                    <ProtectedRoute requiredRole="elderly"><ElderMeds /></ProtectedRoute>
                } />
                <Route path="/elder/meds/history" element={
                    <ProtectedRoute requiredRole="elderly"><ElderHistory /></ProtectedRoute>
                } />
                <Route path="/elder/emergency" element={
                    <ProtectedRoute requiredRole="elderly"><ElderEmergency /></ProtectedRoute>
                } />
                <Route path="/elder/day-summary" element={
                    <ProtectedRoute requiredRole="elderly"><ElderSummary /></ProtectedRoute>
                } />
                <Route path="/elder/health" element={
                    <ProtectedRoute requiredRole="elderly"><ElderHealth /></ProtectedRoute>
                } />
                <Route path="/elder/settings" element={
                    <ProtectedRoute requiredRole="elderly"><ElderSettings /></ProtectedRoute>
                } />
                <Route path="/elder/voice-memos" element={
                    <ProtectedRoute requiredRole="elderly"><VoiceMemos /></ProtectedRoute>
                } />
                <Route path="/elder/symptoms" element={<Navigate to="/diagnosis/input" replace />} />
                <Route path="/settings" element={
                    <ProtectedRoute><Settings /></ProtectedRoute>
                } />
                <Route path="/link" element={
                    <ProtectedRoute><CaregiverLink /></ProtectedRoute>
                } />

                {/* FAMILY / CAREGIVER */}
                <Route path="/family/dashboard" element={
                    <ProtectedRoute requiredRole="caregiver"><FamilyDashboard /></ProtectedRoute>
                } />
                <Route path="/family/day-replay" element={
                    <ProtectedRoute requiredRole="caregiver"><FamilyReplay /></ProtectedRoute>
                } />
                <Route path="/family/members" element={
                    <ProtectedRoute requiredRole="caregiver"><FamilyMembers /></ProtectedRoute>
                } />
                <Route path="/family/permissions" element={
                    <ProtectedRoute requiredRole="caregiver"><FamilyPermissions /></ProtectedRoute>
                } />
                <Route path="/family/settings" element={
                    <ProtectedRoute requiredRole="caregiver"><FamilySettings /></ProtectedRoute>
                } />
                <Route path="/family/meds" element={
                    <ProtectedRoute requiredRole="caregiver"><FamilyMeds /></ProtectedRoute>
                } />
                <Route path="/family/prescription/upload" element={
                    <ProtectedRoute requiredRole="caregiver"><PrescriptionUpload /></ProtectedRoute>
                } />
                <Route path="/family/prescription/review" element={
                    <ProtectedRoute requiredRole="caregiver"><PrescriptionReview /></ProtectedRoute>
                } />
                <Route path="/family/health" element={
                    <ProtectedRoute requiredRole="caregiver"><HealthMonitor /></ProtectedRoute>
                } />
                <Route path="/family/voice-memos" element={
                    <ProtectedRoute requiredRole="caregiver"><VoiceMemos /></ProtectedRoute>
                } />

                {/* Caregiver compatibility aliases */}
                <Route path="/caregiver/dashboard" element={<Navigate to="/family/dashboard" replace />} />
                <Route path="/caregiver/day-replay" element={<Navigate to="/family/day-replay" replace />} />
                <Route path="/caregiver/members" element={<Navigate to="/family/members" replace />} />
                <Route path="/caregiver/permissions" element={<Navigate to="/family/permissions" replace />} />
                <Route path="/caregiver/settings" element={<Navigate to="/family/settings" replace />} />
                <Route path="/caregiver/meds" element={<Navigate to="/family/meds" replace />} />
                <Route path="/caregiver/prescription/upload" element={<Navigate to="/family/prescription/upload" replace />} />
                <Route path="/caregiver/prescription/review" element={<Navigate to="/family/prescription/review" replace />} />
                <Route path="/caregiver/health" element={<Navigate to="/family/health" replace />} />
                <Route path="/caregiver/voice-memos" element={<Navigate to="/family/voice-memos" replace />} />

                {/* SHARED */}
                <Route path="/dispenser/setup" element={
                    <ProtectedRoute><DispenserSetup /></ProtectedRoute>
                } />

                {/* DIAGNOSIS */}
                <Route path="/diagnosis" element={
                    <ProtectedRoute><DiagnosisHome /></ProtectedRoute>
                } />
                <Route path="/diagnosis/input" element={
                    <ProtectedRoute><SymptomInput /></ProtectedRoute>
                } />
                <Route path="/diagnosis/qa" element={
                    <ProtectedRoute><QAFlow /></ProtectedRoute>
                } />
                <Route path="/diagnosis/report" element={
                    <ProtectedRoute><DiagnosisReport /></ProtectedRoute>
                } />
                <Route path="/diagnosis/history" element={
                    <ProtectedRoute><DiagnosisHistory /></ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    )
}

function App() {
    return (
        <AuthProvider>
            <AppErrorBoundary>
                <BrowserRouter>
                    {import.meta.env.DEV && <DemoSimulationPanel />}
                    <BottomNav />
                    <AppRoutes />
                </BrowserRouter>
            </AppErrorBoundary>
        </AuthProvider>
    )
}

export default App
