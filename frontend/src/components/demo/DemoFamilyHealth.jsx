import { motion } from 'framer-motion'
import { ArrowLeft, Activity, Heart, Droplets, Moon, Footprints } from 'lucide-react'
import DemoFamilyNav from './DemoFamilyNav'
import { Card } from '../../components/ui'
import CalendarHeatmap from '../../components/ui/CalendarHeatmap'

export default function DemoFamilyHealth({ onNavigate }) {

    // Mock Adherence Data
    const calendarData = Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        status: Math.random() > 0.8 ? 'missed' : 'taken',
        value: Math.random() > 0.8 ? 0 : 100
    }))

    return (
        <div className="min-h-screen bg-sage-50 font-sans pb-28">
            <header className="px-5 py-5 bg-white border-b border-sage-100 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate('caregiver-dashboard')}
                        className="p-2 -ml-2 text-sage-500 hover:bg-sage-50 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                    <div>
                        <div className="text-sage-500 text-xs font-medium uppercase tracking-wide">Monitor</div>
                        <h1 className="text-xl font-serif font-bold text-sage-900">Health Stats</h1>
                    </div>
                </div>
            </header>

            <div className="p-5 space-y-6">

                {/* Adherence */}
                <Card>
                    <h3 className="font-bold text-sage-800 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-sage-500" />
                        Medication Adherence
                    </h3>
                    <CalendarHeatmap data={calendarData} month="January" year={2026} />
                </Card>

                {/* Vitals Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <div className="flex items-center gap-2 mb-2 text-rose-500 font-bold text-sm">
                            <Heart className="w-4 h-4" /> Avg HR
                        </div>
                        <div className="text-2xl font-bold text-sage-900">72 <span className="text-sm font-normal text-sage-400">bpm</span></div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-2 mb-2 text-blue-500 font-bold text-sm">
                            <Droplets className="w-4 h-4" /> Avg BP
                        </div>
                        <div className="text-2xl font-bold text-sage-900">120/80</div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-2 mb-2 text-indigo-500 font-bold text-sm">
                            <Moon className="w-4 h-4" /> Sleep
                        </div>
                        <div className="text-2xl font-bold text-sage-900">7h 15m</div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-2 mb-2 text-amber-600 font-bold text-sm">
                            <Footprints className="w-4 h-4" /> Steps
                        </div>
                        <div className="text-2xl font-bold text-sage-900">3,420</div>
                    </Card>
                </div>

            </div>

            <DemoFamilyNav activeTab="caregiver-health" onNavigate={onNavigate} />
        </div>
    )
}
