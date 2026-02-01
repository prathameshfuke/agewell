import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Clock, Heart, User, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { IconButton } from '../../components/ui'
import { PageLayout, PageHeader, PageMain, PageSection } from '../../components/layout'
import {
    HealthOverviewCard,
    VitalsStatsRow,
    ActivityTimeline,
    EmergencyContactCard,
} from '../../components/dashboard'
import DemoFamilyNav from './DemoFamilyNav'
import DemoSmartHubCard from './DemoSmartHubCard'
import DemoAutomationTimeline from './DemoAutomationTimeline'
import DemoInterventionAlerts from './DemoInterventionAlerts'

export default function DemoFamilyDashboard({ onSwitchToElder, onNavigate, mockData }) {
    const navigate = useNavigate()
    const [showMenu, setShowMenu] = useState(false)
    const { profile, vitals, healthData, activities } = mockData

    return (
        <PageLayout
            header={
                <PageHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-sage-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-md"><span className="text-2xl">👵</span></div>
                            <div><div className="text-sage-500 text-sm">Caring for</div><h1 className="text-xl font-serif font-bold text-sage-900">{profile.full_name}</h1></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-sage-100 text-sage-600 px-3 py-1 rounded-full text-xs font-bold hidden sm:block">DEMO MODE</div>
                            <IconButton icon={Settings} variant="primary" aria-label="Demo Settings" onClick={() => setShowMenu(!showMenu)} />

                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute right-4 top-16 bg-white rounded-2xl shadow-elevated border-2 border-sage-100 py-2 min-w-[200px] z-50">
                                        <div className="px-4 py-2 text-xs font-bold text-sage-400 uppercase tracking-wider">Demo Controls</div>
                                        <button onClick={() => { setShowMenu(false); onSwitchToElder(); }} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-sage-50 text-sage-700">
                                            <User className="w-5 h-5" /><span className="font-medium">Switch to Elder View</span>
                                        </button>
                                        <div className="border-t border-sage-100 my-1" />
                                        <button onClick={() => navigate('/')} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-rose-50 text-rose-600">
                                            <LogOut className="w-5 h-5" /><span className="font-medium">Exit Demo</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </PageHeader>
            }
        >
            <PageMain className="pb-24">
                {/* Health Overview */}
                <PageSection>
                    <HealthOverviewCard
                        elderlyName={profile.full_name}
                        status="Active"
                        heartRate={vitals.heart_rate}
                        bloodPressure={{ systolic: vitals.blood_pressure_systolic, diastolic: vitals.blood_pressure_diastolic }}
                        lastUpdated="5 min ago"
                        trendData={healthData}
                        trend="stable"
                    />
                </PageSection>

                {/* SMART HUB & ALERTS GRID */}
                <PageSection delay={0.1}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <DemoSmartHubCard lastTrigger="Arthritis comfort rule (26°C)" />
                        <DemoInterventionAlerts />
                    </div>
                </PageSection>

                {/* Automation Timeline */}
                <PageSection delay={0.15}>
                    <div className="mb-6">
                        <DemoAutomationTimeline />
                    </div>
                </PageSection>

                {/* Vitals Stats Row */}
                <PageSection delay={0.05}>
                    <VitalsStatsRow
                        heartRate={vitals.heart_rate}
                        bloodPressure={{ systolic: vitals.blood_pressure_systolic, diastolic: vitals.blood_pressure_diastolic }}
                        steps={vitals.steps}
                        sleep={vitals.sleep}
                        trends={{ heartRate: 'stable', steps: 'up', sleep: 'stable' }}
                    />
                </PageSection>

                {/* Recent Activity */}
                <PageSection delay={0.2}>
                    <ActivityTimeline
                        activities={activities}
                        maxItems={5}
                        onViewAll={() => onNavigate('caregiver-timeline')}
                    />
                </PageSection>

                {/* Quick Action Buttons */}
                <PageSection delay={0.3}>
                    <div className="grid grid-cols-2 gap-4">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onNavigate('caregiver-meds')}
                            className="bg-sage-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 min-h-[56px] shadow-soft hover:bg-sage-600 transition-colors"
                        >
                            <Clock className="w-5 h-5" />
                            Manage Meds
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onNavigate('caregiver-health')}
                            className="bg-white text-sage-700 py-4 rounded-2xl font-bold border-2 border-sage-200 flex items-center justify-center gap-2 min-h-[56px] hover:bg-sage-50 transition-colors"
                        >
                            <Heart className="w-5 h-5" />
                            Health Monitor
                        </motion.button>
                    </div>
                </PageSection>

                {/* Contacts */}
                <PageSection delay={0.25}>
                    <EmergencyContactCard
                        contacts={[
                            { id: 1, name: 'Dr. Smith', role: 'Primary Doctor', phone: '555-0123', avatar: '👨‍⚕️' },
                            { id: 2, name: 'Martha', role: 'Direct Line', phone: '555-0456', avatar: '👵' },
                        ]}
                        onCall={() => alert("Simulation: Calling...")}
                        onMessage={() => alert("Simulation: Message...")}
                        onEmergency={() => alert("Simulation: Emergency Alert!")}
                    />
                </PageSection>
                <div className="h-8" />
            </PageMain>

            <DemoFamilyNav activeTab="caregiver-dashboard" onNavigate={onNavigate} />
        </PageLayout >
    )
}
