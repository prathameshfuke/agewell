import { Activity, AlertTriangle, Bell, Home, Pill, Stethoscope, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { useAuth } from '../contexts/AuthContext'

const HIDDEN_PREFIXES = ['/auth', '/onboarding']

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

  const reduce = useReducedMotion()
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
    <nav aria-label="Main" className="bottom-nav z-40 md:hidden">
      <div className="mx-auto w-full max-w-xl px-2 pb-2 flex items-stretch gap-1">
        {tabs.map((tab) => {
          const isActive = isRouteMatch(pathname, tab.match)
          const Icon = tab.icon

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              className="relative flex-1 min-w-0 min-h-[60px] rounded-2xl flex flex-col items-center justify-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-2xl bg-primary-bg"
                />
              )}
              <Icon aria-hidden="true" className={`relative w-6 h-6 transition-colors ${isActive ? 'text-primary' : 'text-sage-500'}`} strokeWidth={2.2} />
              <span className={`relative text-sm leading-none font-bold transition-colors ${isActive ? 'text-primary' : 'text-sage-500'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
