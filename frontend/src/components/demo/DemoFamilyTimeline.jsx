import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, Heart, Pill, AlertTriangle } from 'lucide-react'
import DemoFamilyNav from './DemoFamilyNav'

export default function DemoFamilyTimeline({ onNavigate, activities = [] }) {



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
                        <div className="text-sage-500 text-xs font-medium uppercase tracking-wide">Activity</div>
                        <h1 className="text-xl font-serif font-bold text-sage-900">Timeline</h1>
                    </div>
                </div>
            </header>

            <div className="p-5">
                <div className="space-y-6 relative border-l-2 border-sage-200 ml-4 my-4">
                    {activities.map((event, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative pl-8"
                        >
                            <div className={`absolute -left-[11px] top-0 w-6 h-6 rounded-full border-4 border-white ${event.type === 'medication' ? 'bg-sage-100' : 'bg-emerald-100'} flex items-center justify-center`}>
                                <div className="w-2 h-2 rounded-full bg-sage-500 opacity-50" />
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-sage-100 shadow-sm">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="font-bold text-sage-800">{event.title}</div>
                                    <span className="text-xs font-bold text-sage-400">{event.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sage-500 text-sm">
                                    <span className="text-lg">{event.icon}</span>
                                    <span>{event.detail || 'Recorded via App'}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <DemoFamilyNav activeTab="caregiver-timeline" onNavigate={onNavigate} />
        </div>
    )
}
