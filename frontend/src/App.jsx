import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGuard, ProtectedRoute, PostLoginResolver } from './components/guards'

import DemoSimulationPanel from './components/DemoSimulationPanel'

// Lazy Load Pages for Performance
const Home = lazy(() => import('./pages/Home'))
const Auth = lazy(() => import('./pages/Auth'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const DemoPage = lazy(() => import('./pages/DemoPage'))

// Onboarding
const RoleSelect = lazy(() => import('./pages/RoleSelect'))
const ElderlyOnboarding = lazy(() => import('./pages/ElderlyOnboarding'))
const CaregiverOnboarding = lazy(() => import('./pages/CaregiverOnboarding'))

// Elder Pages
const ElderDashboard = lazy(() => import('./pages/ElderDashboard'))
const ElderMeds = lazy(() => import('./pages/ElderMeds'))
const ElderHistory = lazy(() => import('./pages/ElderHistory'))
const ElderEmergency = lazy(() => import('./pages/ElderEmergency'))
const ElderSummary = lazy(() => import('./pages/ElderSummary'))
const ElderHealth = lazy(() => import('./pages/ElderHealth'))
const ElderSettings = lazy(() => import('./pages/ElderSettings'))

// Family/Caregiver Pages
const FamilyDashboard = lazy(() => import('./pages/FamilyDashboard'))
const FamilyReplay = lazy(() => import('./pages/FamilyReplay'))
const FamilyMembers = lazy(() => import('./pages/FamilyMembers'))
const FamilyPermissions = lazy(() => import('./pages/FamilyPermissions'))
const FamilyMeds = lazy(() => import('./pages/FamilyMeds'))
const FamilySettings = lazy(() => import('./pages/FamilySettings'))
const PrescriptionUpload = lazy(() => import('./pages/PrescriptionUpload'))
const PrescriptionReview = lazy(() => import('./pages/PrescriptionReview'))
const HealthMonitor = lazy(() => import('./pages/HealthMonitor'))
const DispenserSetup = lazy(() => import('./pages/DispenserSetup'))

// Diagnosis Pages
const DiagnosisHome = lazy(() => import('./pages/Diagnosis/DiagnosisHome'))
const SymptomInput = lazy(() => import('./pages/Diagnosis/SymptomInput'))
const QAFlow = lazy(() => import('./pages/Diagnosis/QAFlow'))
const DiagnosisReport = lazy(() => import('./pages/Diagnosis/DiagnosisReport'))
const DiagnosisHistory = lazy(() => import('./pages/Diagnosis/DiagnosisHistory'))

// Voice Memos (Shared or specific? Looks shared based on imports previously, but path was 'pages/VoiceMemos')
const VoiceMemos = lazy(() => import('./pages/VoiceMemos'))

// Loading Component
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-600 rounded-full animate-spin"></div>
            <p className="text-sage-600 font-medium animate-pulse">Loading AgeWell...</p>
        </div>
    </div>
)

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

function App() {
    return (
        <AuthProvider>
            <DemoSimulationPanel />
            <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* HOME - PostLoginResolver redirects authenticated users */}
                        <Route path="/" element={
                            <ResetHandler>
                                <PostLoginResolver>
                                    <Home />
                                </PostLoginResolver>
                            </ResetHandler>
                        } />

                        {/* AUTH - Open to all */}
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/demo" element={<DemoPage />} />

                        {/* ONBOARDING - Auth required */}
                        <Route path="/onboarding/role-select" element={
                            <AuthGuard><RoleSelect /></AuthGuard>
                        } />
                        <Route path="/onboarding/elderly" element={
                            <AuthGuard><ElderlyOnboarding /></AuthGuard>
                        } />
                        <Route path="/onboarding/caregiver" element={
                            <AuthGuard><CaregiverOnboarding /></AuthGuard>
                        } />

                        {/* ELDER DASHBOARD - Protected */}
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

                        {/* FAMILY DASHBOARD - Protected */}
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

                        {/* SHARED */}
                        <Route path="/dispenser/setup" element={
                            <AuthGuard><DispenserSetup /></AuthGuard>
                        } />

                        {/* ASSISTIVE DIAGNOSIS - Protected */}
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

                        {/* CATCH-ALL */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
