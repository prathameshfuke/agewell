import { motion } from 'framer-motion'
import { Activity, AlertTriangle, Bell, Home, Pill, Stethoscope, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'

const HIDDEN_PREFIXES = ['/auth', '/onboarding', '/demo']

const ELDER_TABS = [
  { key: 'home', label: 'Home', path: '/elder/dashboard', icon: Home, match: ['/elder/dashboard'] },
  { key: 'meds', label: 'Meds', path: '/elder/meds', icon: Pill, match: ['/elder/meds'] },
  { key: 'symptoms', label: 'Symptoms', path: '/diagnosis/input', icon: Stethoscope, match: ['/diagnosis'] },
  { key: 'emergency', label: 'Emergency', path: '/elder/emergency', icon: AlertTriangle, match: ['/elder/emergency'] },
  { key: 'profile', label: 'Profile', path: '/elder/settings', icon: User, match: ['/elder/settings', '/settings', '/link'] },
]

const CAREGIVER_TABS = [
  { key: 'home', label: 'Home', path: '/family/dashboard', icon: Home, match: ['/family/dashboard', '/caregiver/dashboard'] },
  { key: 'monitor', label: 'Monitor', path: '/family/health', icon: Activity, match: ['/family/health', '/caregiver/health'] },
  { key: 'alerts', label: 'Alerts', path: '/family/day-replay', icon: Bell, match: ['/family/day-replay', '/caregiver/day-replay'] },
  { key: 'profile', label: 'Profile', path: '/family/settings', icon: User, match: ['/family/settings', '/caregiver/settings', '/settings', '/link'] },
]

const normalizeRole = (role) => {
  if (!role) return null
  const normalized = role.toLowerCase()
  if (normalized === 'elder') return 'elderly'
  if (normalized === 'elderly') return 'elderly'
  if (normalized === 'caregiver') return 'caregiver'
  return null
}

const isRouteMatch = (pathname, candidates = []) => {
  return candidates.some((candidate) => pathname.startsWith(candidate))
}

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, loading, isOnboardingComplete } = useAuth()

  const pathname = location.pathname || ''

  const hideForPath = pathname === '/'
    || pathname.startsWith('/auth/callback')
    || HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  const normalizedRole = normalizeRole(role)

  if (loading || hideForPath || !user || !normalizedRole) {
    return null
  }

  if (!isOnboardingComplete(normalizedRole)) {
    return null
  }

  const tabs = normalizedRole === 'caregiver' ? CAREGIVER_TABS : ELDER_TABS

  return (
    <nav className="bottom-nav fixed inset-x-0 bottom-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-[#D8D2C6] shadow-[0_-8px_30px_rgba(20,24,30,0.08)]">
      <div className="mx-auto w-full max-w-xl px-2 py-2 flex items-center justify-between gap-1">
        {tabs.map((tab) => {
          const isActive = isRouteMatch(pathname, tab.match)
          const Icon = tab.icon

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              className="relative flex-1 min-h-[56px] rounded-2xl flex flex-col items-center justify-center gap-1"
              aria-label={tab.label}
            >
              {isActive && (
                <motion.span
                  layoutId="agewell-bottom-nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-2xl bg-[#EEF1EA] border border-[#D8E1D3]"
                />
              )}

              <span className="relative z-10 flex flex-col items-center gap-1">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#1B3D64]' : 'text-[#778488]'}`} strokeWidth={2.4} />
                <span className={`text-[11px] font-semibold tracking-wide ${isActive ? 'text-[#1B3D64]' : 'text-[#778488]'}`}>
                  {tab.label}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
