import { Activity, AlertTriangle, Bell, Home, HeartPulse, Pill, Stethoscope, User, Users } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { useAuth } from '../contexts/AuthContext'

const HIDDEN_PREFIXES = ['/auth', '/onboarding']

// `side: true` items only appear in the desktop sidebar; the bottom bar keeps the core five or fewer.
export const ELDER_TABS = [
  { key: 'home', label: 'Home', path: '/elder/dashboard', icon: Home, match: ['/elder/dashboard'] },
  { key: 'meds', label: 'Meds', path: '/elder/meds', icon: Pill, match: ['/elder/meds'] },
  { key: 'symptoms', label: 'Symptoms', path: '/diagnosis/input', icon: Stethoscope, match: ['/diagnosis'] },
  { key: 'health', label: 'Health', path: '/elder/health', icon: HeartPulse, match: ['/elder/health'], side: true },
  { key: 'emergency', label: 'Emergency', path: '/elder/emergency', icon: AlertTriangle, match: ['/elder/emergency'], danger: true },
  { key: 'profile', label: 'Profile', path: '/elder/settings', icon: User, match: ['/elder/settings', '/settings', '/link'] },
]

export const CAREGIVER_TABS = [
  { key: 'home', label: 'Home', path: '/family/dashboard', icon: Home, match: ['/family/dashboard', '/caregiver/dashboard'] },
  { key: 'meds', label: 'Medicines', path: '/family/meds', icon: Pill, match: ['/family/meds', '/family/prescription'], side: true },
  { key: 'monitor', label: 'Monitor', path: '/family/health', icon: Activity, match: ['/family/health', '/caregiver/health'] },
  { key: 'alerts', label: 'Alerts', path: '/family/day-replay', icon: Bell, match: ['/family/day-replay', '/caregiver/day-replay'] },
  { key: 'members', label: 'Family', path: '/family/members', icon: Users, match: ['/family/members', '/family/permissions'], side: true },
  { key: 'profile', label: 'Profile', path: '/family/settings', icon: User, match: ['/family/settings', '/caregiver/settings', '/settings', '/link'] },
]

export const normalizeRole = (role) => {
  if (!role) return null
  const normalized = role.toLowerCase()
  if (normalized === 'elder' || normalized === 'elderly') return 'elderly'
  if (normalized === 'caregiver') return 'caregiver'
  return null
}

export const isActive = (pathname, tab) => tab.match.some((m) => pathname.startsWith(m))

/** Which nav to show: null on public/onboarding screens or while signed out. */
export function useNav() {
  const { pathname } = useLocation()
  const { user, role, loading, isOnboardingComplete } = useAuth()
  const normalizedRole = normalizeRole(role)
  const hidden = pathname === '/' || pathname.startsWith('/auth/callback') || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  if (loading || hidden || !user || !normalizedRole || !isOnboardingComplete(normalizedRole)) return null
  return { pathname, role: normalizedRole, tabs: normalizedRole === 'caregiver' ? CAREGIVER_TABS : ELDER_TABS }
}

/** Bottom tab bar: phones and tablets (<1024px). 64px, safe-area aware, active pill slides via layoutId. */
export default function BottomNav() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const nav = useNav()
  if (!nav) return null
  const tabs = nav.tabs.filter((t) => !t.side)

  return (
    <nav aria-label="Main" className="bottom-nav z-40 lg:hidden">
      <div className="mx-auto flex h-16 w-full max-w-2xl items-stretch gap-1 px-2">
        {tabs.map((tab) => {
          const active = isActive(nav.pathname, tab)
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              className="relative my-1.5 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl"
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-2xl bg-primary-bg"
                />
              )}
              <Icon aria-hidden="true" strokeWidth={1.75} className={`relative h-6 w-6 ${active ? 'text-primary' : tab.danger ? 'text-rose-600' : 'text-sage-600'}`} />
              <span className={`relative max-w-full truncate px-1 text-[13px] leading-none ${active ? 'text-primary' : 'text-sage-600'}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
