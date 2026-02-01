import { motion } from 'framer-motion'
import { Bell, Moon, Volume2, Shield, LogOut } from 'lucide-react'
import { Card } from '../ui'
import DemoFamilyNav from './DemoFamilyNav'
import { useNavigate } from 'react-router-dom'

export default function DemoSettings({ onNavigate, settings, onToggle }) {
    const navigate = useNavigate()

    const SettingRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-center justify-between py-4 border-b border-sage-100 last:border-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center text-sage-600">
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-sage-800">{label}</span>
            </div>
            {value}
        </div>
    )

    const Toggle = ({ active, onClick }) => (
        <button
            onClick={onClick}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${active ? 'bg-sage-600' : 'bg-gray-200'}`}
        >
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    )

    return (
        <div className="space-y-6">
            <div className="page-header pb-0">
                <h1 className="text-3xl font-serif font-bold text-sage-900 mb-2">Settings</h1>
                <p className="text-sage-500">App preferences for Grandma Martha</p>
            </div>

            <div className="page-main">
                <Card>
                    <h3 className="text-sm font-bold text-sage-500 uppercase tracking-wider mb-4">Notifications</h3>
                    <SettingRow
                        icon={Bell}
                        label="Medication Reminders"
                        value={<Toggle active={settings?.medicationReminders} onClick={() => onToggle('medicationReminders')} />}
                    />
                    <SettingRow
                        icon={Bell}
                        label="Missed Dose Alerts"
                        value={<Toggle active={settings?.missedDoseAlerts} onClick={() => onToggle('missedDoseAlerts')} />}
                    />
                    <SettingRow
                        icon={Moon}
                        label="Quiet Hours"
                        value={<Toggle active={settings?.quietHours} onClick={() => onToggle('quietHours')} />}
                    />
                </Card>

                <Card>
                    <h3 className="text-sm font-bold text-sage-500 uppercase tracking-wider mb-4">Device</h3>
                    <SettingRow icon={Volume2} label="Sound Volume" value={<span className="text-sage-800 font-bold">100%</span>} />
                    <SettingRow icon={Shield} label="Emergency Contact" value={<span className="text-sage-800 font-bold">Martha Jr.</span>} />
                </Card>

                <button
                    onClick={() => navigate('/')}
                    className="w-full py-4 rounded-2xl border-2 border-rose-100 bg-rose-50 text-rose-600 font-bold flex items-center justify-center gap-2"
                >
                    <LogOut className="w-5 h-5" />
                    Exit Demo Mode
                </button>
            </div>

            <DemoFamilyNav activeTab="caregiver-settings" onNavigate={onNavigate} />
        </div>
    )
}
