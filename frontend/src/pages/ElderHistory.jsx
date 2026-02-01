import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import ElderNav from '../components/ElderNav'
import { api } from '../api/client'

const USER_ID = 1

const historyData = [
    {
        date: 'Today', items: [
            { name: 'Metformin', time: '2:05 PM', status: 'Taken' },
            { name: 'Atorvastatin', time: '8:00 AM', status: 'Taken' }
        ]
    },
    {
        date: 'Yesterday', items: [
            { name: 'Metformin', time: '2:00 PM', status: 'Taken' },
            { name: 'Atorvastatin', time: '8:15 AM', status: 'Taken' }
        ]
    },
    {
        date: 'Jan 14', items: [
            { name: 'Metformin', time: '2:00 PM', status: 'Taken' },
            { name: 'Atorvastatin', time: '8:00 AM', status: 'Taken' }
        ]
    }
]

export default function ElderHistory() {
    const navigate = useNavigate()

    const handleImOk = async () => {
        await api.submitCheckIn(USER_ID, 'good')
        alert("Saved. Your family has been informed.")
    }

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-28">
            <header className="px-5 py-5 bg-white border-b border-sage-100 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(-1)}
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
                {historyData.map((day, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div className="mb-3">
                            <span className="text-xs font-bold text-sage-500 uppercase tracking-wide bg-cream-100 px-3 py-1.5 rounded-full border border-cream-200">
                                {day.date}
                            </span>
                        </div>
                        <div className="space-y-2 pl-4 border-l-2 border-sage-200 ml-3">
                            {day.items.map((item, j) => (
                                <div key={j} className="relative pl-5">
                                    <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-sage-500 ring-4 ring-cream-50"></div>
                                    <div className="bg-white p-4 rounded-2xl border border-sage-100">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-lg font-bold text-sage-800">{item.name}</div>
                                                <div className="text-sage-500 text-sm">{item.time}</div>
                                            </div>
                                            <div className="bg-sage-100 text-sage-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Taken
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <ElderNav onImOk={handleImOk} />
        </div>
    )
}
