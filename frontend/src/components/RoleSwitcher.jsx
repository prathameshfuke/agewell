import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, UserRound, UsersRound } from 'lucide-react'

const normalizeRole = (role) => {
  if (!role) return null
  const normalized = role.toLowerCase()
  if (normalized === 'elder') return 'elderly'
  if (normalized === 'elderly') return 'elderly'
  if (normalized === 'caregiver') return 'caregiver'
  return null
}

const ROLE_LABELS = {
  elderly: 'Elder',
  caregiver: 'Caregiver'
}

const ROLE_ICONS = {
  elderly: UserRound,
  caregiver: UsersRound
}

export default function RoleSwitcher({ currentRole, availableRoles = [], onSwitch }) {
  const [open, setOpen] = useState(false)

  const roles = useMemo(() => {
    const normalized = availableRoles.map(normalizeRole).filter(Boolean)
    return [...new Set(normalized)]
  }, [availableRoles])

  const activeRole = normalizeRole(currentRole)

  if (roles.length < 2 || !onSwitch) {
    return null
  }

  const ActiveIcon = ROLE_ICONS[activeRole] || UserRound

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-primary-light/30 bg-primary-bg/60 text-primary-dark"
      >
        <span className="flex items-center gap-2">
          <ActiveIcon className="w-4 h-4" strokeWidth={2.3} />
          <span className="text-sm font-semibold">
            {ROLE_LABELS[activeRole] || 'Select role'}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2.3} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute top-full mt-2 left-0 right-0 z-40 bg-white border border-primary-light/30 rounded-2xl shadow-xl p-1"
            >
              {roles.map((role) => {
                const isSelected = role === activeRole
                const RoleIcon = ROLE_ICONS[role] || UserRound

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={async () => {
                      setOpen(false)
                      if (!isSelected) {
                        await onSwitch(role)
                      }
                    }}
                    className="w-full px-3 py-3 rounded-xl text-left flex items-center justify-between hover:bg-primary-bg/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-primary-dark">
                      <RoleIcon className="w-4 h-4" strokeWidth={2.3} />
                      <span className="text-sm font-semibold">{ROLE_LABELS[role]}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-primary" strokeWidth={2.6} />}
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
