import { motion } from 'framer-motion'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import DemoElderNav from './DemoElderNav'



export default function DemoElderHistory({ onNavigate, onImOk, activities = [] }) {

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-28">
            <header className="px-5 py-5 bg-white border-b border-sage-100 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate('elder-dashboard')}
                        className="p-2 -ml-2 text-sage-500 hover:bg-sage-50 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                    <div>
                        <div className="text-sage-500 text-xs font-medium uppercase tracking-wide">Past</div>
                        <h1 className="text-xl font-serif font-bold text-sage-900">Medication History</h1>
                    </div>
                </div>
            </header>

            <div className="px-5 py-6 space-y-6">
                {activities.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative pl-5"
                    >
                        <div className="absolute -left-[5px] top-6 w-4 h-4 rounded-full bg-sage-500 ring-4 ring-cream-50 z-10"></div>

                        <div className="bg-white p-5 rounded-3xl border border-sage-100 shadow-sm ml-4 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-sage-500 bg-sage-50 px-3 py-1 rounded-full">{item.time}</span>
                                {item.status === 'completed' && (
                                    <div className="bg-sage-100 text-sage-800 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> Done
                                    </div>
                                )}
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                    <div className="text-xl font-bold text-sage-900">{item.title}</div>
                                    <div className="text-sage-600 text-base font-medium mt-1">{item.detail}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <DemoElderNav activeTab="elder-history" onNavigate={onNavigate} onImOk={onImOk} />
        </div>
    )
}
