import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Bell, 
  Heart,
  Users,
  Shield,
  Key,
  Mail,
  Phone,
  HelpCircle,
  LogOut,
  Check,
  ChevronRight,
  Settings as SettingsIcon
} from 'lucide-react'
import FamilyNav from '../components/FamilyNav'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'

/**
 * FamilySettings - Settings page for caregivers
 * 
 * Features:
 * - Comprehensive settings management
 * - Family member permissions
 * - Notification preferences
 * - Account management
 */
export default function FamilySettings() {
  const navigate = useNavigate()
  const { logout, user, profile, roles, setActiveRole } = useAuth()
  const hasElderRole = roles?.includes('elderly')
  const userId = user?.id || profile?.id

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    medicationReminders: true,
    emergencyAlerts: true,
    dailySummary: true,
  })

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Keys are never stored or displayed in the browser - only a masked
  // preview + whether a key is set. `apiKeyInputs` holds what the user is
  // currently typing (cleared after a successful save) and is only ever
  // sent to the backend, never persisted client-side.
  const hasInitialized = useRef(false)
  const [keyStatus, setKeyStatus] = useState({ GROQ_API_KEY: null, GEMINI_API_KEY: null })
  const [apiKeyInputs, setApiKeyInputs] = useState({ groqApiKey: '', geminiApiKey: '' })
  const [apiKeyStatus, setApiKeyStatus] = useState('')

  // Load masked key status from the server on mount only.
  useEffect(() => {
    if (!hasInitialized.current && userId) {
      hasInitialized.current = true
      api.getUserApiKeys(userId).then((result) => {
        if (result.success) {
          setKeyStatus({
            GROQ_API_KEY: result.keys.GROQ_API_KEY || null,
            GEMINI_API_KEY: result.keys.GEMINI_API_KEY || null,
          })
        }
      })
    }
  }, [userId])

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const SettingSection = ({ title, children }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-primary-dark mb-4 px-6">{title}</h2>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )

  const SettingItem = ({ icon: Icon, title, description, toggle, onToggle, action, onAction }) => (
    <motion.div
      whileTap={action ? { scale: 0.98 } : {}}
      onClick={action ? onAction : undefined}
      className={`bg-white mx-6 rounded-2xl p-5 shadow-sm border border-primary-light/20 ${
        action ? 'cursor-pointer hover:shadow-md hover:border-primary-light/40' : ''
      } transition-all`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-bg flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-primary-dark">{title}</h3>
          {description && <p className="text-sm text-primary mt-0.5">{description}</p>}
        </div>
        {toggle !== undefined && (
          <Toggle enabled={toggle} onChange={onToggle} label={title} />
        )}
        {action && (
          <ChevronRight className="w-6 h-6 text-primary-light flex-shrink-0" />
        )}
      </div>
    </motion.div>
  )

  const Toggle = ({ enabled, onChange, label }) => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={`relative inline-flex items-center h-10 w-20 rounded-full transition-colors flex-shrink-0 ${
        enabled ? 'bg-primary' : 'bg-secondary-dark'
      }`}
      aria-label={label}
      role="switch"
      aria-checked={enabled}
    >
      <motion.span
        className="inline-block h-8 w-8 rounded-full bg-white shadow-lg"
        initial={false}
        animate={{ x: enabled ? 44 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
      {enabled && (
        <Check className="absolute left-2 w-4 h-4 text-white" strokeWidth={3} />
      )}
    </button>
  )

  const handleLogout = async () => {
    sessionStorage.removeItem('sessionActiveRole')
    sessionStorage.removeItem('intendedRole')
    await logout()
    navigate('/')
  }

  const handleSwitchToElder = async () => {
    await setActiveRole('elderly')
    navigate('/elder/dashboard')
  }

  const handleSaveApiKeys = async () => {
    if (!userId) {
      setApiKeyStatus('✗ Error: You must be signed in to save keys.')
      return
    }

    const result = await api.saveUserApiKeys(userId, apiKeyInputs)
    if (result.success) {
      const nextStatus = { ...keyStatus }
      for (const row of result.saved || []) {
        nextStatus[row.setting_key] = { maskedValue: row.masked_value, hasValue: row.has_value }
      }
      setKeyStatus(nextStatus)
      setApiKeyInputs({ groqApiKey: '', geminiApiKey: '' })
      setApiKeyStatus('✓ Your API keys were saved securely.')
    } else {
      const errorMsg = result.error || 'Could not save API keys.'
      setApiKeyStatus(`✗ Error: ${errorMsg}`)
    }
  }

  const handleClearApiKeys = async () => {
    if (!userId) {
      setApiKeyStatus('✗ Error: You must be signed in to clear keys.')
      return
    }

    const result = await api.clearUserApiKeys(userId)
    if (result.success) {
      setKeyStatus({ GROQ_API_KEY: null, GEMINI_API_KEY: null })
      setApiKeyInputs({ groqApiKey: '', geminiApiKey: '' })
      setApiKeyStatus('✓ API keys were removed.')
    } else {
      const errorMsg = result.error || 'Could not clear API keys.'
      setApiKeyStatus(`✗ Error: ${errorMsg}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-primary-bg to-secondary pb-24 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-lg border-b-2 border-primary-light/30 px-6 py-5 z-40">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-primary-bg flex items-center justify-center text-primary"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </motion.button>
          <div>
            <h1 className="text-4xl font-bold text-primary-dark">Settings</h1>
            <p className="text-base text-primary mt-1">Manage your preferences</p>
          </div>
        </div>
      </header>

      <main className="py-8">
        {/* Account Section */}
        <SettingSection title="Account">
          {hasElderRole && (
            <SettingItem
              icon={Heart}
              title="Switch to Elder View"
              description="View your own health dashboard"
              action
              onAction={handleSwitchToElder}
            />
          )}
          <SettingItem
            icon={Users}
            title="Manage Roles"
            description="Switch between caregiver and elder accounts"
            action
            onAction={() => navigate('/onboarding/role-select')}
          />
          <SettingItem
            icon={Shield}
            title="Privacy & Security"
            description="Control your data and security settings"
            action
          />
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="Notifications">
          <SettingItem
            icon={Bell}
            title="Push Notifications"
            description="Get alerts on your device"
            toggle={settings.pushNotifications}
            onToggle={() => toggleSetting('pushNotifications')}
          />
          <SettingItem
            icon={Mail}
            title="Email Updates"
            description="Receive updates via email"
            toggle={settings.emailNotifications}
            onToggle={() => toggleSetting('emailNotifications')}
          />
          <SettingItem
            icon={Heart}
            title="Medication Reminders"
            description="Alert when meds are due or missed"
            toggle={settings.medicationReminders}
            onToggle={() => toggleSetting('medicationReminders')}
          />
          <SettingItem
            icon={Phone}
            title="Emergency Alerts"
            description="Immediate notifications for SOS"
            toggle={settings.emergencyAlerts}
            onToggle={() => toggleSetting('emergencyAlerts')}
          />
        </SettingSection>

        {/* Care Team Section */}
        <SettingSection title="Care Team">
          <SettingItem
            icon={Users}
            title="Family Members"
            description="Manage who has access to health data"
            action
            onAction={() => navigate('/family/members')}
          />
          <SettingItem
            icon={Key}
            title="Permissions"
            description="Control what family members can see"
            action
            onAction={() => navigate('/family/permissions')}
          />
        </SettingSection>

        {/* Support Section */}
        <SettingSection title="Support">
          <SettingItem
            icon={HelpCircle}
            title="Help Center"
            description="Get answers to common questions"
            action
          />
          <SettingItem
            icon={Mail}
            title="Contact Support"
            description="Reach out to our support team"
            action
          />
        </SettingSection>

        <SettingSection title="AI Integration">
          <motion.div className="bg-white mx-6 rounded-2xl p-5 shadow-sm border border-primary-light/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-bg flex items-center justify-center flex-shrink-0">
                <Key className="w-6 h-6 text-primary" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-dark">Your AI API Keys</h3>
                <p className="text-sm text-primary">Use your own Groq and Gemini keys for diagnosis features.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-primary mb-1">
                  Groq API Key
                  {keyStatus.GROQ_API_KEY?.hasValue && (
                    <span className="ml-2 font-normal text-primary/70">
                      Saved ({keyStatus.GROQ_API_KEY.maskedValue})
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  value={apiKeyInputs.groqApiKey}
                  onChange={(e) => setApiKeyInputs((prev) => ({ ...prev, groqApiKey: e.target.value }))}
                  placeholder={keyStatus.GROQ_API_KEY?.hasValue ? 'Enter a new key to replace it' : 'gsk_...'}
                  className="w-full rounded-xl border-2 border-primary-light/30 px-4 py-3 text-base text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-primary mb-1">
                  Gemini API Key
                  {keyStatus.GEMINI_API_KEY?.hasValue && (
                    <span className="ml-2 font-normal text-primary/70">
                      Saved ({keyStatus.GEMINI_API_KEY.maskedValue})
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  value={apiKeyInputs.geminiApiKey}
                  onChange={(e) => setApiKeyInputs((prev) => ({ ...prev, geminiApiKey: e.target.value }))}
                  placeholder={keyStatus.GEMINI_API_KEY?.hasValue ? 'Enter a new key to replace it' : 'AIza...'}
                  className="w-full rounded-xl border-2 border-primary-light/30 px-4 py-3 text-base text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveApiKeys}
                  className="bg-primary text-white font-bold py-3 px-4 rounded-xl"
                >
                  Save Keys
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClearApiKeys}
                  className="bg-primary-bg text-primary-dark font-bold py-3 px-4 rounded-xl border border-primary-light/40"
                >
                  Clear Keys
                </motion.button>
              </div>

              {apiKeyStatus && (
                <p className="text-sm text-primary">{apiKeyStatus}</p>
              )}
            </div>
          </motion.div>
        </SettingSection>

        {/* Sign Out Button */}
        <div className="px-6 mt-12">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-accent-light hover:bg-accent text-accent hover:text-white font-bold py-5 px-6 rounded-2xl transition-all text-xl flex items-center justify-center gap-3 border-2 border-accent"
          >
            <LogOut className="w-6 h-6" strokeWidth={2.5} />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-3xl font-bold text-primary-dark mb-3">Sign Out?</h2>
              <p className="text-xl text-primary mb-8">Are you sure you want to sign out?</p>
              
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="bg-primary-bg text-primary-dark font-bold py-4 rounded-2xl text-lg"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="bg-accent text-white font-bold py-4 rounded-2xl text-lg"
                >
                  Sign Out
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FamilyNav />
    </div>
  )
}
