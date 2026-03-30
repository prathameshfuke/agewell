import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  LogOut, 
  Link2,
  User, 
  ChevronDown,
  HelpCircle 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import RoleSwitcher from './RoleSwitcher'

/**
 * ProfileDropdown - Accessible profile menu for elderly users
 * 
 * Features:
 * - Large touch targets (min 56px height)
 * - Clear icons and labels
 * - High contrast design
 * - Simple, clean layout
 */
export default function ProfileDropdown({ 
  user, 
  profile, 
  onLogout, 
  hasElderRole, 
  hasCaregiverRole,
  onSwitchRole,
  currentRole,
  triggerImage,
  triggerContent 
}) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const availableRoles = [
    hasElderRole ? 'elderly' : null,
    hasCaregiverRole ? 'caregiver' : null,
  ].filter(Boolean)

  const handleRoleSwitch = async (targetRole) => {
    if (!onSwitchRole) return
    await onSwitchRole(targetRole)
    const nextPath = targetRole === 'caregiver' ? '/family/dashboard' : '/elder/dashboard'
    navigate(nextPath, { replace: true })
  }

  const handleLogout = async () => {
    setIsOpen(false)
    sessionStorage.removeItem('intendedRole')
    if (onLogout) {
      await onLogout()
    }
    navigate('/auth', { replace: true })
  }

  const MenuItem = ({ icon: Icon, label, onClick, variant = 'default' }) => {
    const variants = {
      default: 'hover:bg-primary-bg text-primary-dark',
      danger: 'hover:bg-accent-light text-accent',
      primary: 'hover:bg-primary-bg text-primary',
    }

    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          setIsOpen(false)
          onClick()
        }}
        className={`w-full px-5 py-4 text-left flex items-center gap-4 transition-colors ${variants[variant]} min-h-[56px]`}
      >
        <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={2.5} />
        <span className="font-bold text-lg">{label}</span>
      </motion.button>
    )
  }

  const Divider = () => (
    <div className="border-t-2 border-primary-light/20 my-1" />
  )

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {triggerImage && (
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-light">
            {triggerImage}
          </div>
        )}
        {triggerContent && triggerContent}
        <ChevronDown 
          className={`w-5 h-5 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="absolute right-0 top-16 bg-white rounded-3xl shadow-2xl border-2 border-primary-light/30 py-2 min-w-[280px] z-50 overflow-hidden"
            >
              {/* User Info Header */}
              <div className="px-5 py-4 border-b-2 border-primary-light/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-bg flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-primary-dark truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-sm text-primary truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {onSwitchRole && availableRoles.length > 1 && (
                  <div className="px-5 pb-2">
                    <RoleSwitcher
                      currentRole={currentRole}
                      availableRoles={availableRoles}
                      onSwitch={handleRoleSwitch}
                    />
                  </div>
                )}

                {(onSwitchRole && availableRoles.length > 1) && <Divider />}

                {/* Settings */}
                <MenuItem
                  icon={Settings}
                  label="Settings"
                  onClick={() => navigate('/settings')}
                />

                <MenuItem
                  icon={Link2}
                  label="Caregiver Link"
                  onClick={() => navigate('/link')}
                />

                {/* Help */}
                <MenuItem
                  icon={HelpCircle}
                  label="Help & Support"
                  onClick={() => {
                    // Can add help page route here
                  }}
                />

                <Divider />

                {/* Sign Out */}
                <MenuItem
                  icon={LogOut}
                  label="Sign Out"
                  onClick={handleLogout}
                  variant="danger"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
