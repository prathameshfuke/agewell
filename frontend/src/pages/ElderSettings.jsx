import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Volume2, 
  Bell, 
  Type, 
  Heart,
  Wifi,
  Key,
  User,
  Shield,
  HelpCircle,
  LogOut,
  Check
} from 'lucide-react'
import ElderNav from '../components/ElderNav'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'

/**
 * ElderSettings - Settings page optimized for elderly users
 * 
 * Features:
 * - Large, clear options with icons
 * - Simple toggles and selections
 * - High contrast design
 * - Easy navigation
 */
export default function ElderSettings() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  
  const [settings, setSettings] = useState({
    theme: 'light',
    fontSize: 'large',
    soundEnabled: true,
    notificationsEnabled: true,
    voiceReminders: true,
  })

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  
  // Use a ref to store the initial load flag to prevent re-initialization
  const hasInitialized = useRef(false)
  const [apiKeys, setApiKeys] = useState({ groqApiKey: '', geminiApiKey: '' })
  const [apiKeyStatus, setApiKeyStatus] = useState('')

  // Load API keys on mount only - never reinitialize from localStorage
  useEffect(() => {
    if (!hasInitialized.current) {
      const savedKeys = api.getUserApiKeys()
      setApiKeys(savedKeys)
      hasInitialized.current = true
    }
  }, [])

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const SettingCard = ({ icon: Icon, title, description, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-card border-2 border-primary-light/20"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-bg flex items-center justify-center flex-shrink-0">
          <Icon className="w-7 h-7 text-primary" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-primary-dark mb-1">{title}</h3>
          <p className="text-base text-primary">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  )

  const Toggle = ({ enabled, onChange, label }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex items-center h-12 w-24 rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-secondary-dark'
      }`}
      aria-label={label}
      role="switch"
      aria-checked={enabled}
    >
      <motion.span
        className="inline-block h-10 w-10 rounded-full bg-white shadow-lg"
        initial={false}
        animate={{ x: enabled ? 52 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
      {enabled && (
        <Check className="absolute left-3 w-5 h-5 text-white" strokeWidth={3} />
      )}
    </button>
  )

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleSaveApiKeys = () => {
    const result = api.saveUserApiKeys(apiKeys)
    if (result.success) {
      setApiKeyStatus('✓ Your API keys were saved on this device.')
    } else {
      const errorMsg = result.error || 'Could not save API keys.'
      setApiKeyStatus(`✗ Error: ${errorMsg}`)
    }
  }

  const handleClearApiKeys = () => {
    const result = api.clearUserApiKeys()
    if (result.success) {
      setApiKeys({ groqApiKey: '', geminiApiKey: '' })
      setApiKeyStatus('✓ API keys were removed from this device.')
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
            <p className="text-base text-primary mt-1">Customize your experience</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-6">
        {/* Theme Settings */}
        <SettingCard
          icon={settings.theme === 'light' ? Sun : Moon}
          title="Display"
          description="Adjust brightness and theme"
        >
          <div className="flex items-center justify-between pt-2">
            <span className="text-xl font-semibold text-primary-dark">Light Mode</span>
            <Toggle
              enabled={settings.theme === 'light'}
              onChange={() => setSettings(prev => ({ 
                ...prev, 
                theme: prev.theme === 'light' ? 'dark' : 'light' 
              }))}
              label="Toggle theme"
            />
          </div>
        </SettingCard>

        {/* Sound & Notifications */}
        <SettingCard
          icon={Volume2}
          title="Sound"
          description="Manage alerts and reminders"
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-6 h-6 text-primary" />
                <span className="text-xl font-semibold text-primary-dark">Sound Effects</span>
              </div>
              <Toggle
                enabled={settings.soundEnabled}
                onChange={() => toggleSetting('soundEnabled')}
                label="Toggle sound effects"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-primary" />
                <span className="text-xl font-semibold text-primary-dark">Notifications</span>
              </div>
              <Toggle
                enabled={settings.notificationsEnabled}
                onChange={() => toggleSetting('notificationsEnabled')}
                label="Toggle notifications"
              />
            </div>
          </div>
        </SettingCard>

        {/* Device Settings */}
        <SettingCard
          icon={Wifi}
          title="Dispenser"
          description="Manage your medication dispenser"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dispenser/setup')}
            className="w-full mt-2 bg-primary-bg hover:bg-primary-light/30 text-primary-dark font-bold py-5 px-6 rounded-2xl transition-colors text-xl"
          >
            Configure Dispenser
          </motion.button>
        </SettingCard>

        {/* Account Actions */}
        <SettingCard
          icon={User}
          title="Account"
          description="Manage your profile and privacy"
        >
          <div className="space-y-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary-bg hover:bg-primary-light/30 text-primary-dark font-bold py-5 px-6 rounded-2xl transition-colors text-xl flex items-center gap-3"
            >
              <Shield className="w-6 h-6" />
              <span>Privacy Settings</span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary-bg hover:bg-primary-light/30 text-primary-dark font-bold py-5 px-6 rounded-2xl transition-colors text-xl flex items-center gap-3"
            >
              <HelpCircle className="w-6 h-6" />
              <span>Help & Support</span>
            </motion.button>
          </div>
        </SettingCard>

        <SettingCard
          icon={Key}
          title="AI API Keys"
          description="Use your own Groq and Gemini keys for diagnosis features"
        >
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-sm font-bold text-primary mb-1">Groq API Key</label>
              <input
                type="password"
                value={apiKeys.groqApiKey}
                onChange={(e) => setApiKeys((prev) => ({ ...prev, groqApiKey: e.target.value }))}
                placeholder="gsk_..."
                className="w-full rounded-xl border-2 border-primary-light/30 px-4 py-3 text-base text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-primary mb-1">Gemini API Key</label>
              <input
                type="password"
                value={apiKeys.geminiApiKey}
                onChange={(e) => setApiKeys((prev) => ({ ...prev, geminiApiKey: e.target.value }))}
                placeholder="AIza..."
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
        </SettingCard>

        {/* Sign Out */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-accent-light hover:bg-accent text-accent hover:text-white font-bold py-6 px-6 rounded-3xl transition-all text-2xl flex items-center justify-center gap-3 border-2 border-accent"
        >
          <LogOut className="w-7 h-7" strokeWidth={2.5} />
          <span>Sign Out</span>
        </motion.button>
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
              <p className="text-xl text-primary mb-8">Are you sure you want to sign out of your account?</p>
              
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="bg-primary-bg text-primary-dark font-bold py-5 rounded-2xl text-xl"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="bg-accent text-white font-bold py-5 rounded-2xl text-xl"
                >
                  Sign Out
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ElderNav />
    </div>
  )
}
