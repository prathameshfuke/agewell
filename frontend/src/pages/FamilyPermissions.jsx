import { useNavigate } from 'react-router-dom'
import { Activity, MapPin, Bell, Eye } from 'lucide-react'
import { useState } from 'react'
import FamilyNav from '../components/FamilyNav'

export default function FamilyPermissions() {
    const navigate = useNavigate()
    const [settings, setSettings] = useState({
        shareVitals: true,
        shareLocation: false,
        shareMood: true,
        emergencyAlerts: true
    })

    const toggle = (key) => {
        setSettings(p => ({ ...p, [key]: !p[key] }))
    }

    return (
        <div className="min-h-screen bg-[#F0F4FF] font-sans pb-24">
            <header className="px-6 py-6 sticky top-0 bg-[#F0F4FF]/90 backdrop-blur-sm z-10">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Privacy</div>
                <h1 className="font-romelio text-2xl text-slate-900">Permissions</h1>
            </header>

            <main className="px-6 space-y-6">
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="p-5 border-b border-slate-50">
                        <h2 className="font-bold text-slate-900">What Caregivers Can See</h2>
                        <p className="text-xs text-slate-500 mt-1">These settings apply to all non-primary members.</p>
                    </div>

                    <div className="divide-y divide-slate-50">
                        <SettingItem
                            icon={<Activity className="w-5 h-5 text-rose-500" />}
                            title="Vitals"
                            desc="Heart rate, BP, sugar levels"
                            active={settings.shareVitals}
                            onToggle={() => toggle('shareVitals')}
                        />
                        <SettingItem
                            icon={<Eye className="w-5 h-5 text-indigo-500" />}
                            title="Mood & Wellness"
                            desc="Daily check-in responses"
                            active={settings.shareMood}
                            onToggle={() => toggle('shareMood')}
                        />
                        <SettingItem
                            icon={<MapPin className="w-5 h-5 text-emerald-500" />}
                            title="Location"
                            desc="Real-time GPS (disabled)"
                            active={settings.shareLocation}
                            onToggle={() => toggle('shareLocation')}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="p-5 border-b border-slate-50">
                        <h2 className="font-bold text-slate-900">Notifications</h2>
                    </div>
                    <div className="divide-y divide-slate-50">
                        <SettingItem
                            icon={<Bell className="w-5 h-5 text-amber-500" />}
                            title="Emergency Alerts"
                            desc="Immediate notifications for emergencies"
                            active={settings.emergencyAlerts}
                            onToggle={() => toggle('emergencyAlerts')}
                        />
                    </div>
                </div>

                <p className="text-center text-slate-400 text-xs">
                    Privacy builds trust. Share only what's needed.
                </p>
            </main>

            <FamilyNav />
        </div>
    )
}

function SettingItem({ icon, title, desc, active, onToggle }) {
    return (
        <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <div className="font-bold text-slate-800">{title}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`w-12 h-7 rounded-full transition-colors relative flex items-center ${active ? 'bg-care-primary' : 'bg-slate-200'}`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform absolute ${active ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}></div>
            </button>
        </div>
    )
}
