import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Heart, Check, ChevronDown, ChevronUp, Pill, X, Clock, HelpCircle,
  Settings, Activity, Droplets, Calendar, Phone, MessageCircle, AlertTriangle,
  User, LogOut
} from 'lucide-react'

import { Card, Button, IconButton, ProgressRing } from '../components/ui'
import { PageLayout, PageHeader, PageMain, PageSection } from '../components/layout'
import { WeeklyHealthSummary } from '../components/dashboard'

// DEMO COMPONENTS
import DemoElderMeds from '../components/demo/DemoElderMeds'
import DemoElderHealth from '../components/demo/DemoElderHealth'
import DemoElderHistory from '../components/demo/DemoElderHistory'
import DemoElderEmergency from '../components/demo/DemoElderEmergency'
import DemoElderNav from '../components/demo/DemoElderNav'
import DemoFamilyDashboard from '../components/demo/DemoFamilyDashboard'
import DemoFamilyMeds from '../components/demo/DemoFamilyMeds'
import DemoFamilyHealth from '../components/demo/DemoFamilyHealth'
import DemoFamilyTimeline from '../components/demo/DemoFamilyTimeline'
import DemoFamily from '../components/demo/DemoFamily'
import DemoSettings from '../components/demo/DemoSettings'
import QuickActionsGrid from '../components/dashboard/QuickActionsGrid'
import DemoMedicineHub from '../components/demo/DemoMedicineHub'
import DemoAutomationFeedback from '../components/demo/DemoAutomationFeedback'

// Import stickers (using paths directly as they work in Vite)
import goodmoodSticker from '../assets/images/stickers/goodmood.jpeg'
import fineSticker from '../assets/images/stickers/fine.jpeg'
import notwellSticker from '../assets/images/stickers/notwell.jpeg'
import doneSticker from '../assets/images/stickers/done.jpeg'
import oneSticker from '../assets/images/stickers/one.jpeg'

export default function DemoPage() {
  const navigate = useNavigate()

  // -- DEMO ROUTER STATE --
  // 'elder-dashboard' | 'elder-meds' | 'elder-health' | 'elder-history' | 'elder-emergency' | 
  // 'caregiver' | 'caregiver-meds' | 'caregiver-health' | 'caregiver-timeline' | 'caregiver-family' | 'caregiver-settings'
  const [currentView, setCurrentView] = useState(() => {
    const role = sessionStorage.getItem('intendedRole')
    return role === 'caregiver' ? 'caregiver-dashboard' : 'elder-dashboard'
  })
  const [showMenu, setShowMenu] = useState(false)

  // -- SHARED STATE --
  const [showNotifications, setShowNotifications] = useState(false)
  const [showOkModal, setShowOkModal] = useState(false)

  // -- DEMO DATA STATE (Lifted for persistence) --
  const [medications, setMedications] = useState([
    { id: 1, name: 'Lisinopril', dosage: '10mg', time: '8:00 AM', status: 'taken', next: false },
    { id: 2, name: 'Vitamin D', dosage: '1000 IU', time: '8:00 AM', status: 'taken', next: false },
    { id: 3, name: 'Metformin', dosage: '500mg', time: '2:00 PM', status: 'pending', next: true },
    { id: 4, name: 'Atorvastatin', dosage: '20mg', time: '8:00 PM', status: 'pending', next: false },
  ])

  // -- DASHBOARD SPECIFIC STATE --
  const [vitalsExpanded, setVitalsExpanded] = useState(true)
  const [selectedMood, setSelectedMood] = useState(null)

  // -- AUTOMATION STATE --
  const [automationMessage, setAutomationMessage] = useState(null)
  const [automationType, setAutomationType] = useState('comfort')

  // Listen for simulation events from the separate panel (using window event for simplicity across components)
  useEffect(() => {
    const handleSimulation = (e) => {
      const { type, message } = e.detail
      setAutomationMessage(message)
      setAutomationType(type === 'fall' ? 'emergency' : type === 'cold' ? 'comfort' : 'air')

      // Auto clear after 8 seconds
      setTimeout(() => setAutomationMessage(null), 8000)
    }
    window.addEventListener('agewell-simulation', handleSimulation)
    return () => window.removeEventListener('agewell-simulation', handleSimulation)
  }, [])

  const [settings, setSettings] = useState({
    medicationReminders: true,
    missedDoseAlerts: true,
    quietHours: true,
  })

  // -- MOCK DATA --
  const mockProfile = {
    full_name: 'Grandma Martha',
    avatar_url: oneSticker
  }

  const mockVitals = {
    heart_rate: 74,
    blood_pressure_systolic: 122,
    blood_pressure_diastolic: 78,
    steps: 3240,
    sleep: 8.2
  }

  const weeklyHealthData = [
    { value: 68, label: 'Mon' },
    { value: 72, label: 'Tue' },
    { value: 70, label: 'Wed' },
    { value: 74, label: 'Thu' },
    { value: 71, label: 'Fri' },
    { value: 69, label: 'Sat' },
    { value: 74, label: 'Sun' },
  ]

  const [activities, setActivities] = useState([
    { id: 1, type: 'medication', title: 'Morning Meds Taken', time: '8:00 AM', status: 'completed', icon: '💊', detail: 'Lisinopril, Vitamin D' },
    { id: 2, type: 'check_in', title: 'Mood Check-in', time: '9:30 AM', detail: 'Feeling Good', status: 'completed', icon: '😊' },
    { id: 3, type: 'vitals', title: 'Blood Pressure', time: '10:00 AM', detail: '120/80', status: 'completed', icon: '❤️' },
  ])

  // -- HANDLERS --
  const handleNavigate = (view) => {
    setCurrentView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleMedicationAction = (medId, action) => {
    // 1. Update Medication Status
    const medName = medications.find(m => m.id === medId)?.name || 'Medication'

    setMedications(prev => prev.map(med =>
      med.id === medId ? { ...med, status: action === 'taken' ? 'taken' : 'skipped' } : med
    ))

    // 2. Add Activity
    const newActivity = {
      id: Date.now(),
      type: 'medication',
      title: `${medName} ${action === 'taken' ? 'Taken' : 'Skipped'}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: action === 'taken' ? 'completed' : 'warning',
      icon: action === 'taken' ? '💊' : '⚠️',
      detail: action === 'taken' ? 'Recorded via App' : 'User skipped dosage'
    }
    setActivities(prev => [newActivity, ...prev])

    // 3. User Feedback
    if (action === 'taken') {
      alert(`Great! Recorded that you took ${medName}.`)
    }
  }

  const handleMoodCheckin = (mood, sticker) => {
    const newActivity = {
      id: Date.now(),
      type: 'check_in',
      title: 'Mood Check-in',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      detail: `Feeling ${mood}`,
      status: 'completed',
      icon: '😊'
    }
    setActivities(prev => [newActivity, ...prev])
    setShowOkModal(false)
  }

  const handleAddMedication = (newMed) => {
    const med = {
      id: medications.length + 1,
      ...newMed,
      status: 'pending',
      next: false
    }
    setMedications([...medications, med])
    alert(`Added ${newMed.name} to schedule!`)
  }

  const handleToggleSetting = (key) => {
    setSettings(prev => {
      const newState = { ...prev, [key]: !prev[key] }
      // Optional: Add side effect or alert if needed
      return newState
    })
  }

  // --- RENDER HELPERS ---

  const renderElderDashboard = () => (
    <>
      <PageHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMenu(!showMenu)}
              className="w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg"
            >
              <img src={mockProfile.avatar_url} alt="Profile" className="w-full h-full object-cover object-center" />
            </motion.button>

            {/* Profile Menu Dropdown */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute left-0 top-16 bg-white rounded-2xl shadow-elevated border-2 border-sage-100 py-2 min-w-[220px] z-50"
                >
                  <div className="px-4 py-2 text-xs font-bold text-sage-400 uppercase tracking-wider">Demo Controls</div>
                  <button
                    onClick={() => { setShowMenu(false); setCurrentView('elder-dashboard'); }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-sage-50 text-sage-900 font-bold`}
                  >
                    <User className="w-5 h-5" />
                    <span>Elder View</span>
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); handleNavigate('caregiver-dashboard'); }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-sage-50 text-sage-700`}
                  >
                    <Heart className="w-5 h-5" />
                    <span>Caregiver View</span>
                  </button>
                  <div className="border-t border-sage-100 my-1" />
                  <button
                    onClick={() => navigate('/')}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-rose-50 text-rose-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Exit Demo</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <div className="text-sage-500 text-base">Good day,</div>
              <h1 className="text-2xl font-serif font-bold text-sage-900">{mockProfile.full_name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-sage-100 text-sage-600 px-3 py-1 rounded-full text-xs font-bold hidden sm:block">
              Demo Mode · Smart Hub Simulation Active
            </div>
            <IconButton
              icon={Bell}
              variant="primary"
              badge={1}
              aria-label="View Demo Notifications"
              onClick={() => setShowNotifications(true)}
            />
          </div>
        </div>
      </PageHeader>

      <PageMain className="pb-24">
        {/* Top Stats */}
        <PageSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Card className="h-full flex flex-col items-center justify-center py-4">
                <ProgressRing progress={85} size={90} strokeWidth={8} label="Adherence" />
                <div className="text-sage-500 text-xs mt-2 text-center">This Week</div>
              </Card>
            </div>
            <div className="md:col-span-2">
              <WeeklyHealthSummary
                healthData={weeklyHealthData}
                averageHeartRate={mockVitals.heart_rate}
                averageSteps={mockVitals.steps}
                trend={'stable'}
              />
            </div>
          </div>
        </PageSection>

        {/* AUTOMATION FEEDBACK (Dynamic) */}
        <PageSection delay={0.1}>
          <DemoAutomationFeedback
            message={automationMessage}
            type={automationType}
            onClose={() => setAutomationMessage(null)}
          />
        </PageSection>

        {/* MEDICINE HUB STATUS */}
        <PageSection delay={0.15}>
          <DemoMedicineHub
            status="Active (Demo)"
            lastInteraction="Medicine taken 12 min ago"
            nextDose="3h"
          />
        </PageSection>

        {/* Quick Actions - Manually wired to onNavigate */}
        <PageSection delay={0.05}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Heart, label: 'Health', color: 'bg-sage-50 text-sage-600', border: 'border-sage-100', action: 'elder-health' },
              { icon: Calendar, label: 'History', color: 'bg-cream-50 text-cream-700', border: 'border-cream-200', action: 'elder-history' },
              { icon: AlertTriangle, label: 'SOS', color: 'bg-rose-50 text-rose-500', border: 'border-rose-100', action: 'elder-emergency' },
              { icon: Phone, label: 'Call', color: 'bg-amber-50 text-amber-600', border: 'border-amber-100', action: () => alert('Calling... (Demo)') },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => typeof action.action === 'function' ? action.action() : handleNavigate(action.action)}
                className={`${action.color} ${action.border} p-3 rounded-2xl border-2 flex flex-col items-center gap-2 min-h-[80px] justify-center transition-transform active:scale-95`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs font-bold">{action.label}</span>
              </button>
            ))}
          </div>
        </PageSection>

        {/* Next Med */}
        <PageSection delay={0.1}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-sage-500 rounded-full" />
              <span className="text-sage-600 font-bold uppercase tracking-wider text-sm">Next Medication</span>
            </div>
            <div className="bg-sage-50 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-sage-500 rounded-xl flex items-center justify-center">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1" style={{ minWidth: '120px' }}>
                  <div className="text-xl font-bold text-sage-900 break-words" style={{ wordBreak: 'normal', overflowWrap: 'break-word', hyphens: 'auto' }}>Lisinopril</div>
                  <div className="text-sage-600 text-lg break-words">10mg - 1 Tablet</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-sage-100">
                <Clock className="w-5 h-5 text-sage-600" />
                <span className="text-lg font-bold text-sage-700">Today at 2:00 PM</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="primary" icon={Check} onClick={() => handleMedicationAction(3, 'taken')} className="flex-col py-5">Taken</Button>
              <Button variant="soft-amber" icon={HelpCircle} onClick={() => alert("Caregiver notified!")} className="flex-col py-5">Not Sure</Button>
              <Button variant="soft-sage" icon={X} onClick={() => handleMedicationAction(3, 'skipped')} className="flex-col py-5">Skipped</Button>
            </div>
          </Card>
        </PageSection>

        {/* Vitals */}
        <PageSection delay={0.2}>
          <Card className="overflow-hidden p-0">
            <button onClick={() => setVitalsExpanded(!vitalsExpanded)} className="w-full px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-rose-400" />
                <span className="font-bold text-sage-800 text-lg">Your Vitals</span>
              </div>
              {vitalsExpanded ? <ChevronUp className="w-6 h-6 text-sage-400" /> : <ChevronDown className="w-6 h-6 text-sage-400" />}
            </button>
            <AnimatePresence>
              {vitalsExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-rose-50 rounded-2xl p-5 border-2 border-rose-100">
                      <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-rose-500" /><div className="text-sage-500 text-sm font-bold uppercase">Heart Rate</div></div>
                      <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-sage-800">{mockVitals.heart_rate}</span><span className="text-sage-500 text-lg">bpm</span></div>
                      <div className="flex items-center gap-2 mt-2"><div className="w-2 h-2 bg-sage-500 rounded-full" /><span className="text-sage-600 font-medium">Normal</span></div>
                    </div>
                    <div className="bg-sage-50 rounded-2xl p-5 border-2 border-sage-100">
                      <div className="flex items-center gap-2 mb-2"><Droplets className="w-4 h-4 text-sage-500" /><div className="text-sage-500 text-sm font-bold uppercase">BP</div></div>
                      <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-sage-800">{mockVitals.blood_pressure_systolic}/{mockVitals.blood_pressure_diastolic}</span></div>
                      <div className="flex items-center gap-2 mt-2"><div className="w-2 h-2 bg-sage-500 rounded-full" /><span className="text-sage-600 font-medium">Normal</span></div>
                    </div>
                  </div>

                  {/* View More Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigate('elder-health')}
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

      <DemoElderNav
        activeTab="elder-dashboard"
        onNavigate={handleNavigate}
        onImOk={() => setShowOkModal(true)}
      />

      {/* Modals for Elder View */}
      <AnimatePresence>
        {showOkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-sage-900/30 backdrop-blur-sm" onClick={() => setShowOkModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white w-full max-w-sm rounded-3xl p-8 text-center relative border-2 border-sage-100 shadow-elevated" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowOkModal(false)} className="absolute top-4 right-4"><X className="w-6 h-6 text-sage-400" /></button>
              <h3 className="text-2xl font-serif font-bold text-sage-900 mb-6">How are you feeling?</h3>
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
                {[{ img: goodmoodSticker, label: 'Good' }, { img: fineSticker, label: 'Okay' }, { img: notwellSticker, label: 'Not Well' }].map((item, i) => (
                  <button key={i} onClick={() => handleMoodCheckin(item.label, item.img)} className="p-3 sm:p-4 rounded-2xl border-2 bg-sage-50 border-sage-100 flex flex-col items-center gap-2 min-h-touch">
                    <img src={item.img} className="w-12 h-12 object-contain rounded-lg" />
                    <span className="font-bold text-sage-700 text-sm break-words text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 bg-sage-900/20 backdrop-blur-sm" onClick={() => setShowNotifications(false)}>
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-sage-100" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-serif font-bold text-sage-900">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="p-1 bg-sage-50 rounded-full"><X className="w-5 h-5 text-sage-400" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-sage-50 rounded-xl">
                  <div className="w-2 h-2 mt-2 rounded-full bg-sage-500" />
                  <div>
                    <p className="text-sm font-bold text-sage-800">Morning Meds Due</p>
                    <p className="text-xs text-sage-500">8:00 AM • Lisinopril, Vitamin D</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white border border-sage-100 rounded-xl">
                  <div className="w-2 h-2 mt-2 rounded-full bg-transparent" />
                  <div>
                    <p className="text-sm font-bold text-sage-800">Weekly Summary Ready</p>
                    <p className="text-xs text-sage-500">Yesterday • Check health trends</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  // --- MAIN RENDER SWITCHEER ---
  const renderCurrentView = () => {
    switch (currentView) {
      case 'caregiver':
      case 'caregiver-dashboard':
        return <DemoFamilyDashboard
          onSwitchToElder={() => setCurrentView('elder-dashboard')}
          onNavigate={handleNavigate}
          mockData={{ profile: mockProfile, vitals: mockVitals, healthData: weeklyHealthData, activities: activities }}
        />
      case 'caregiver-meds':
        return <DemoFamilyMeds
          onNavigate={handleNavigate}
          medications={medications}
          onAddMedication={handleAddMedication}
        />
      case 'caregiver-health':
        return <DemoFamilyHealth onNavigate={handleNavigate} />
      case 'caregiver-timeline':
        return <DemoFamilyTimeline
          onNavigate={handleNavigate}
          activities={activities}
        />
      case 'caregiver-family':
        // Lazy load or import at top (assuming component exists)
        return <DemoFamily onNavigate={handleNavigate} />
      case 'caregiver-settings':
        return <DemoSettings
          onNavigate={handleNavigate}
          settings={settings}
          onToggle={handleToggleSetting}
        />

      // ELDER VIEWS
      case 'elder-meds':
        return <DemoElderMeds
          medications={medications}
          onAction={handleMedicationAction}
          onNavigate={handleNavigate}
          onImOk={() => setShowOkModal(true)}
        />
      case 'elder-health':
        return <DemoElderHealth onNavigate={handleNavigate} onImOk={() => setShowOkModal(true)} />
      case 'elder-history':
        return <DemoElderHistory
          onNavigate={handleNavigate}
          onImOk={() => setShowOkModal(true)}
          activities={activities}
        />
      case 'elder-emergency':
        return <DemoElderEmergency onNavigate={handleNavigate} />
      case 'elder-dashboard':
      default:
        return renderElderDashboard()
    }
  }

  return (
    <PageLayout>
      {renderCurrentView()}
    </PageLayout>
  )
}
