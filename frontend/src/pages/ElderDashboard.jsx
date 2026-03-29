import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Heart, Check, ChevronDown, ChevronUp, Pill, X, Clock, HelpCircle, Activity, Droplets } from 'lucide-react'
import { api } from '../api/client'
import { useMedications } from '../hooks/useMedications'
import { useNotifications } from '../hooks/useNotifications'
import ElderNav from '../components/ElderNav'
import ProfileDropdown from '../components/ProfileDropdown'
import { Card, Button, IconButton, ProgressRing } from '../components/ui'
import { PageLayout, PageHeader, PageMain, PageSection } from '../components/layout'
import { WeeklyHealthSummary } from '../components/dashboard'
import QuickActionsGrid from '../components/dashboard/QuickActionsGrid'
import EnvironmentWidget from '../components/dashboard/EnvironmentWidget'
import PairingCodeDisplay from '../components/dashboard/PairingCodeDisplay' // New component

// Import stickers
import goodmoodSticker from '../assets/images/stickers/goodmood.jpeg'
import fineSticker from '../assets/images/stickers/fine.jpeg'
import notwellSticker from '../assets/images/stickers/notwell.jpeg'
import doneSticker from '../assets/images/stickers/done.jpeg'
import oneSticker from '../assets/images/stickers/one.jpeg'

import { useAuth } from '../contexts/AuthContext'

export default function ElderDashboard() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading, logout, roles } = useAuth()
  const userId = user?.id
  const hasCaregiverRole = roles?.includes('caregiver')

  const [showOkModal, setShowOkModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [vitalsExpanded, setVitalsExpanded] = useState(true)
  const [selectedMood, setSelectedMood] = useState(null)
  const [healthStats, setHealthStats] = useState(null)
  const [countdown, setCountdown] = useState(null)

  const {
    nextMedication,
    adherenceRate,
    loading: medsLoading,
    markAsTaken,
    pendingMeds,
    completedMeds
  } = useMedications(userId)

  const {
    notifications,
    unreadCount,
    acknowledgeNotification,
    markAllRead
  } = useNotifications(userId)

  useEffect(() => {
    if (!userId) return

    const loadHealth = async () => {
      const result = await api.getHealthStats(userId)
      if (result.success) {
        setHealthStats(result.stats)
      }
    }
    loadHealth()
  }, [userId])

  // Countdown timer
  useEffect(() => {
    if (!nextMedication) {
      setCountdown(null)
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const scheduled = new Date(nextMedication.scheduled_time)
      const diff = scheduled - now

      if (diff <= 0) {
        setCountdown({ text: 'Now', overdue: true })
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        if (hours > 0) {
          setCountdown({ text: `in ${hours}h ${minutes}m`, overdue: false })
        } else {
          setCountdown({ text: `in ${minutes}m`, overdue: false })
        }
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    return () => clearInterval(interval)
  }, [nextMedication])

  const handleMarkTaken = async () => {
    if (!nextMedication) return
    const logId = nextMedication.log?.id || nextMedication.id
    if (logId) {
      await markAsTaken(logId)
    }
  }

  const handleNotSure = async () => {
    if (!userId) return
    await api.createAlert({
      user_id: userId,
      alert_type: 'medication',
      severity: 'medium',
      title: 'Medication Uncertainty',
      message_elderly: 'We\'ve notified your caregiver.',
      message_caregiver: `${nextMedication?.medication?.name || 'Medication'}: User is unsure about this dose.`
    })
    alert('We\'ve notified your caregiver.')
  }

  const handleSkipped = async () => {
    if (!nextMedication) return
    const logId = nextMedication.log?.id || nextMedication.id
    if (logId) {
      await api.markTaken(logId, 'missed')
    }
  }

  const submitMood = async (mood) => {
    if (!userId) return
    setSelectedMood(mood)
    await api.submitCheckIn(userId, mood)
  }

  const vitals = healthStats?.latest || {}

  // Calculate weekly health data for chart
  const weeklyHealthData = healthStats?.weekly || []

  return (
    <PageLayout
      header={
        <PageHeader
          title={`Hello, ${profile?.full_name?.split(' ')[0] || 'User'}`}
          subtitle="Here's your health summary for today"
          status={hasCaregiverRole ? 'caregiver' : 'connected'}
          rightContent={
            <div className="flex items-center gap-2">
              <IconButton
                icon={Pill}
                variant="secondary"
                aria-label="Setup Dispenser"
                onClick={() => navigate('/dispenser/setup')}
              />
              <IconButton
                icon={Bell}
                variant="primary"
                badge={unreadCount}
                aria-label="View Notifications"
                onClick={() => setShowNotifications(true)}
              />
              <ProfileDropdown
                user={user}
                profile={profile}
                onLogout={logout}
                currentRole="elderly"
              />
            </div>
          }
        />
      }
      nav={<ElderNav onImOk={() => setShowOkModal(true)} />}
    >
      <PageMain>
        {/* Pairing Code Display - Only show if not linked */}
        {profile?.pairing_code && !profile.linked_elderly_id && (
          <PairingCodeDisplay code={profile.pairing_code} />
        )}

        {/* Quick Actions Grid */}
        <QuickActionsGrid />
        {/* ADHERENCE + WEEKLY SUMMARY ROW */}
        <PageSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Adherence Ring */}
            <div className="col-span-1">
              <Card className="h-full flex flex-col items-center justify-center py-4">
                <ProgressRing
                  progress={adherenceRate || 85}
                  size={90}
                  strokeWidth={8}
                  label="Adherence"
                />
                <div className="text-sage-500 text-xs mt-2 text-center">This Week</div>
              </Card>
            </div>

            {/* Weekly Summary */}
            <div className="col-span-2">
              <WeeklyHealthSummary
                healthData={weeklyHealthData}
                averageHeartRate={vitals.heart_rate || 72}
                averageSteps={healthStats?.avgSteps || 4500}
                trend={healthStats?.trend || 'stable'}
              />
            </div>
          </div>
        </PageSection>

        {/* QUICK ACTIONS */}
        <PageSection delay={0.05}>
          <QuickActionsGrid />
        </PageSection>

        {/* TODAY STATUS & ENVIRONMENT */}
        <PageSection delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-sage-500 rounded-full" />
                  <span className="text-sage-600 font-bold uppercase tracking-wider text-sm">Next Medication</span>
                </div>

                {medsLoading ? (
                  <div className="text-center py-8">
                    <div className="loading-spinner mx-auto" />
                    <p className="text-sage-500 mt-4 text-lg">Loading...</p>
                  </div>
                ) : nextMedication ? (
                  <>
                    {/* Next Medication */}
                    <div className="bg-sage-50 rounded-2xl p-5 mb-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-sage-500 rounded-xl flex items-center justify-center">
                          <Pill className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1" style={{ minWidth: '120px' }}>
                          <div className="text-xl font-bold text-sage-900 break-words" style={{ wordBreak: 'normal', overflowWrap: 'break-word', hyphens: 'auto' }}>{nextMedication.medication?.name || 'Medication'}</div>
                          <div className="text-sage-600 text-lg break-words">{nextMedication.medication?.dosage || '1 dose'}</div>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 p-3 rounded-xl ${countdown?.overdue ? 'bg-rose-100' : 'bg-sage-100'}`}>
                        <Clock className={`w-5 h-5 ${countdown?.overdue ? 'text-rose-600' : 'text-sage-600'}`} />
                        <span className={`text-lg font-bold ${countdown?.overdue ? 'text-rose-700' : 'text-sage-700'}`}>
                          {countdown?.overdue ? 'Take now!' : countdown?.text || 'Loading...'}
                        </span>
                      </div>
                    </div>

                    {/* THREE LARGE ACTION BUTTONS - Mobile optimized (stack) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        variant="primary"
                        icon={Check}
                        onClick={handleMarkTaken}
                        className="flex-col py-5"
                      >
                        Taken
                      </Button>

                      <Button
                        variant="soft-amber"
                        icon={HelpCircle}
                        onClick={handleNotSure}
                        className="flex-col py-5"
                      >
                        Not Sure
                      </Button>

                      <Button
                        variant="soft-sage"
                        icon={X}
                        onClick={handleSkipped}
                        className="flex-col py-5"
                      >
                        Skipped
                      </Button>
                    </div>
                  </>
                ) : (
                  /* ALL DONE STATE with sticker */
                  <div className="text-center py-6">
                    <motion.img
                      src={doneSticker}
                      alt="All done!"
                      className="w-28 h-auto max-h-36 mx-auto mb-4 rounded-2xl object-contain"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.4 }}
                    />
                    <h2 className="text-2xl font-serif font-bold text-sage-800 mb-2">All Done for Today!</h2>
                    <p className="text-sage-500 text-lg">No more medications scheduled</p>
                    <p className="text-sage-400 text-base mt-2">{completedMeds.length} medications taken today</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Environment Widget (Right Column) */}
            <div className="lg:col-span-1">
              <EnvironmentWidget />
            </div>
          </div>
        </PageSection>

        {/* WELLNESS CHECK with stickers */}
        <PageSection delay={0.15}>
          <Card>
            <h3 className="text-xl font-bold text-sage-800 mb-5">How are you feeling today?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Good */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => submitMood('good')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 min-h-[100px] ${selectedMood === 'good'
                  ? 'bg-sage-100 border-sage-400'
                  : 'bg-sage-50 border-sage-100'
                  }`}
              >
                <img src={goodmoodSticker} alt="Good" className="w-14 h-14 object-contain rounded-xl" />
                <span className="text-base font-bold text-sage-700">Good</span>
              </motion.button>

              {/* Okay */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => submitMood('fine')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 min-h-[100px] ${selectedMood === 'fine'
                  ? 'bg-cream-100 border-cream-400'
                  : 'bg-cream-50 border-cream-100'
                  }`}
              >
                <img src={fineSticker} alt="Okay" className="w-14 h-14 object-contain rounded-xl" />
                <span className="text-base font-bold text-sage-700">Okay</span>
              </motion.button>

              {/* Not Well */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => submitMood('unwell')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 min-h-[100px] ${selectedMood === 'unwell'
                  ? 'bg-rose-100 border-rose-300'
                  : 'bg-rose-50 border-rose-100'
                  }`}
              >
                <img src={notwellSticker} alt="Not Well" className="w-14 h-14 object-contain rounded-xl" />
                <span className="text-base font-bold text-sage-700">Not Well</span>
              </motion.button>
            </div>
          </Card>
        </PageSection>

        {/* VITALS SECTION - Expanded by default */}
        <PageSection delay={0.2}>
          <Card className="overflow-hidden p-0">
            <button
              onClick={() => setVitalsExpanded(!vitalsExpanded)}
              className="w-full px-6 py-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-rose-400" />
                <span className="font-bold text-sage-800 text-lg">Your Vitals</span>
              </div>
              {vitalsExpanded ? (
                <ChevronUp className="w-6 h-6 text-sage-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-sage-400" />
              )}
            </button>

            <AnimatePresence>
              {vitalsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Heart Rate */}
                    <div className="bg-rose-50 rounded-2xl p-5 border-2 border-rose-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-rose-500" />
                        <div className="text-sage-500 text-sm font-bold uppercase tracking-wide">Heart Rate</div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-sage-800">{vitals.heart_rate || 72}</span>
                        <span className="text-sage-500 text-lg">bpm</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-sage-500 rounded-full" />
                        <span className="text-sage-600 font-medium">Normal</span>
                      </div>
                    </div>

                    {/* Blood Pressure */}
                    <div className="bg-sage-50 rounded-2xl p-5 border-2 border-sage-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-4 h-4 text-sage-500" />
                        <div className="text-sage-500 text-sm font-bold uppercase tracking-wide">Blood Pressure</div>
                      </div>
                      <div className="text-3xl font-bold text-sage-800">
                        {vitals.blood_pressure_systolic || 120}/{vitals.blood_pressure_diastolic || 80}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-sage-500 rounded-full" />
                        <span className="text-sage-600 font-medium">Normal</span>
                      </div>
                    </div>
                  </div>

                  {/* View More Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/elder/health')}
                    className="w-full mt-4 py-3 bg-sage-100 text-sage-700 rounded-xl font-bold text-sm hover:bg-sage-200 transition-colors"
                  >
                    View Health Details
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </PageSection>
      </PageMain>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-sage-900/30 backdrop-blur-sm"
            onClick={() => setShowNotifications(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-sage-100 flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-sage-900">Notifications</h2>
                <IconButton
                  icon={X}
                  variant="ghost"
                  aria-label="Close Notifications"
                  onClick={() => setShowNotifications(false)}
                />
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-100px)]">
                {notifications.length === 0 ? (
                  <div className="text-center py-16 text-sage-400">
                    <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-sage-50">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-5 cursor-pointer hover:bg-sage-50 transition-colors ${notif.status === 'active' ? 'bg-sage-50' : ''}`}
                        onClick={() => acknowledgeNotification(notif.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-3 h-3 rounded-full mt-2 ${notif.status === 'active' ? 'bg-sage-500' : 'bg-transparent'}`} />
                          <div className="flex-1">
                            <div className="font-bold text-sage-800 text-lg">{notif.title}</div>
                            <div className="text-sage-500 mt-1">{notif.message_elderly}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* I'm OK Modal with stickers */}
      <AnimatePresence>
        {showOkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-sage-900/30 backdrop-blur-sm"
            onClick={() => setShowOkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 text-center relative border-2 border-sage-100 shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowOkModal(false)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-sage-400 hover:text-sage-600 hover:bg-sage-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-serif font-bold text-sage-900 mb-6">How are you feeling?</h3>

              <div className="grid grid-cols-1 gap-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { if (userId) api.submitCheckIn(userId, 'good'); setShowOkModal(false); }}
                  className="p-4 rounded-2xl border-2 bg-sage-50 border-sage-100 flex flex-col items-center gap-2 hover:bg-sage-100 transition-colors min-h-[100px]"
                >
                  <img src={goodmoodSticker} alt="Good" className="w-12 h-12 object-contain rounded-lg" />
                  <span className="font-bold text-sage-700">Good</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { if (userId) api.submitCheckIn(userId, 'fine'); setShowOkModal(false); }}
                  className="p-4 rounded-2xl border-2 bg-cream-50 border-cream-100 flex flex-col items-center gap-2 hover:bg-cream-100 transition-colors min-h-[100px]"
                >
                  <img src={fineSticker} alt="Okay" className="w-12 h-12 object-contain rounded-lg" />
                  <span className="font-bold text-sage-700">Okay</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { if (userId) api.submitCheckIn(userId, 'unwell'); setShowOkModal(false); }}
                  className="p-4 rounded-2xl border-2 bg-rose-50 border-rose-100 flex flex-col items-center gap-2 hover:bg-rose-100 transition-colors min-h-[100px]"
                >
                  <img src={notwellSticker} alt="Not Well" className="w-12 h-12 object-contain rounded-lg" />
                  <span className="font-bold text-sage-700">Not Well</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout >
  )
}
