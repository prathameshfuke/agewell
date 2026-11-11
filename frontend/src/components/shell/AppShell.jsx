import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Repeat } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import BottomNav, { isActive, useNav } from '../BottomNav'
import { logo } from '../../assets/images'

/** Desktop sidebar (>=1024px): logo, labelled nav, profile and role switch at the bottom. */
function Sidebar({ nav }) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const { profile, user, roles, setActiveRole } = useAuth()
  const name = profile?.full_name || user?.email || 'You'
  const other = nav.role === 'caregiver' ? 'elderly' : 'caregiver'
  const canSwitch = roles?.includes('elderly') && roles?.includes('caregiver')

  const switchRole = async () => {
    await setActiveRole(other)
    navigate(other === 'caregiver' ? '/family/dashboard' : '/elder/dashboard')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-paper px-4 py-6 lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        <img src={logo} alt="" width="36" height="36" className="sticker h-9 w-9 object-contain" />
        <span className="font-serif text-2xl">AgeWell</span>
      </div>
      <nav aria-label="Main" className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
        {nav.tabs.map((tab) => {
          const active = isActive(nav.pathname, tab)
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-12 items-center gap-3 rounded-2xl px-3 text-base ${active ? 'text-primary' : 'text-sage-700 hover:bg-paper-2'}`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-pill"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-2xl bg-primary-bg"
                />
              )}
              <Icon aria-hidden="true" strokeWidth={1.75} className={`relative h-6 w-6 shrink-0 ${!active && tab.danger ? 'text-rose-600' : ''}`} />
              <span className="relative">{tab.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="mt-4 border-t border-line pt-4">
        <p className="truncate px-2 text-base font-bold">{name}</p>
        <p className="px-2 text-sm text-sage-600">{nav.role === 'caregiver' ? 'Caregiver' : 'Elder'} mode</p>
        {canSwitch && (
          <button type="button" onClick={switchRole} className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-2xl px-2 text-sm text-sage-700 hover:bg-paper-2">
            <Repeat className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Switch to {other === 'caregiver' ? 'caregiver' : 'elder'}
          </button>
        )}
      </div>
    </aside>
  )
}

/**
 * One responsive shell for elder and caregiver screens.
 * <1024px: content full width + bottom tab bar. >=1024px: 240px sidebar, content to the right.
 * Pages own their inner max-width (~1120px) and grids.
 */
export default function AppShell({ children }) {
  const nav = useNav()
  return (
    <div data-role={nav?.role} className={nav ? 'lg:pl-60' : ''}>
      {nav && <Sidebar nav={nav} />}
      {children}
      <BottomNav />
    </div>
  )
}
