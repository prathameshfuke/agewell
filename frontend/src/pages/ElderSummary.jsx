import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, ChevronRight, Settings, ArrowLeft } from 'lucide-react'
import ElderNav from '../components/ElderNav'
import { api } from '../api/client'

// Import stickers
import sleepSticker from '../assets/images/stickers/sleep.jpeg'
import doneSticker from '../assets/images/stickers/done.jpeg'
import goodmoodSticker from '../assets/images/stickers/goodmood.jpeg'
import twoSticker from '../assets/images/stickers/two.jpeg'

const USER_ID = 1

export default function ElderSummary() {
    const navigate = useNavigate()

    const handleImOk = async () => {
        await api.submitCheckIn(USER_ID, 'good')
        alert("Saved. Your family has been informed.")
    }

    return (
        <div className="min-h-screen bg-cream-50 font-sans pb-28">
            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between sticky top-0 bg-cream-50 z-10">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-sage-500 hover:bg-sage-50 rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5" />
                </motion.button>
                <h1 className="text-lg font-bold text-sage-800">Daily Summary</h1>
                <button className="p-2 text-sage-400">
                    <Settings className="w-5 h-5" />
                </button>
            </header>

            <main className="px-5 space-y-5">
                {/* Hero Section with Evening Gradient and sticker */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-3xl overflow-hidden"
                >
                    <div className="h-52 bg-gradient-to-b from-sage-600 via-sage-500 to-sage-400 relative">
                        {/* Sleep sticker decoration */}
                        <div className="absolute top-4 right-4 w-20 h-20 rounded-2xl overflow-hidden opacity-90">
                            <img src={sleepSticker} alt="" className="w-full h-full object-cover" />
                        </div>
                        {/* Text overlay */}
                        <div className="absolute bottom-6 left-6">
                            <h2 className="text-3xl font-serif font-bold text-white">Good Evening,</h2>
                            <h2 className="text-3xl font-serif font-bold text-white">Sarah</h2>
                        </div>
                    </div>
                </motion.div>

                {/* Summary Message */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-sage-600 text-center text-lg"
                >
                    You've had a wonderful day. Everything is looked after, and you can rest easy now.
                </motion.p>

                {/* Summary Cards with stickers */}
                <div className="space-y-3">
                    {/* Medications Complete */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white rounded-2xl p-4 border border-sage-100 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl overflow-hidden">
                            <img src={doneSticker} alt="Done" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-sage-800 text-lg">Medications Complete</div>
                            <div className="text-sage-500">100% adherence today</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-sage-300" />
                    </motion.div>

                    {/* Check-ins */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-4 border border-sage-100 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl overflow-hidden">
                            <img src={twoSticker} alt="Check-ins" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-sage-800 text-lg">Checked in 3 times</div>
                            <div className="text-sage-500">Your family knows you're safe</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-sage-300" />
                    </motion.div>

                    {/* Mood */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-white rounded-2xl p-4 border border-sage-100 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl overflow-hidden">
                            <img src={goodmoodSticker} alt="Mood" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-sage-800 text-lg">Feeling Peaceful</div>
                            <div className="text-sage-500">Based on your mood log</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-sage-300" />
                    </motion.div>
                </div>

                {/* Rest Well Button */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/elder/dashboard')}
                    className="w-full bg-sage-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                >
                    <Moon className="w-5 h-5" />
                    Rest Well
                </motion.button>

                {/* Footer Note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="text-center text-sage-400 text-sm"
                >
                    Closing the app will silence non-essential notifications until 7:00 AM.
                </motion.p>
            </main>

            <ElderNav onImOk={handleImOk} />
        </div>
    )
}
