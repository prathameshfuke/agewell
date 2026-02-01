import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone } from 'lucide-react'
import { useState, useRef } from 'react'

export default function ElderEmergency() {
    const navigate = useNavigate()
    const [holding, setHolding] = useState(false)
    const [progress, setProgress] = useState(0)
    const intervalRef = useRef(null)

    const startHold = () => {
        setHolding(true)
        let p = 0
        intervalRef.current = setInterval(() => {
            p += 2
            if (p >= 100) {
                clearInterval(intervalRef.current)
                triggerEmergency()
            }
            setProgress(p)
        }, 30)
    }

    const endHold = () => {
        setHolding(false)
        setProgress(0)
        clearInterval(intervalRef.current)
    }

    const triggerEmergency = () => {
        if (window.confirm("Calling Emergency Services...")) {
            window.location.href = "tel:911"
        }
        setProgress(0)
        setHolding(false)
    }

    return (
        <div className="min-h-screen bg-cream-50 font-sans flex flex-col">
            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-center relative">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(-1)}
                    className="absolute left-5 p-2 text-sage-500 hover:bg-sage-50 rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5" />
                </motion.button>
                <h1 className="text-lg font-bold text-sage-800">Emergency Support</h1>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-3xl font-serif font-bold text-rose-500 mb-2">Need Help?</h2>
                    <p className="text-sage-600">
                        Press and hold the button for 3 seconds to call for help.
                    </p>
                </motion.div>

                {/* SOS Button */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-6"
                >
                    {/* Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                        <circle
                            cx="100"
                            cy="100"
                            r="90"
                            fill="none"
                            stroke="#FEE2E2"
                            strokeWidth="8"
                        />
                        <circle
                            cx="100"
                            cy="100"
                            r="90"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 90}`}
                            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                            className="transition-all duration-100"
                        />
                    </svg>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onMouseDown={startHold}
                        onMouseUp={endHold}
                        onMouseLeave={endHold}
                        onTouchStart={startHold}
                        onTouchEnd={endHold}
                        className="w-48 h-48 bg-gradient-to-br from-rose-400 to-rose-500 rounded-full flex flex-col items-center justify-center text-white shadow-xl relative z-10"
                    >
                        <span className="text-4xl font-bold">SOS</span>
                        <span className="text-sm font-medium mt-1 uppercase tracking-wider">
                            {holding ? 'Keep Holding...' : 'Hold to Call'}
                        </span>
                    </motion.button>
                </motion.div>

                {/* Release Text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-rose-400 font-bold uppercase tracking-wider text-sm mb-10"
                >
                    Release to Cancel
                </motion.p>

                {/* Emergency Contact Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="w-full max-w-sm bg-white rounded-2xl p-4 border border-sage-100 flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center overflow-hidden">
                        <span className="text-2xl">👩</span>
                    </div>
                    <div className="flex-1">
                        <div className="text-sage-400 text-xs uppercase tracking-wide">Emergency Contact</div>
                        <div className="font-bold text-sage-800">Sarah</div>
                        <div className="text-sage-500 text-sm">(Daughter)</div>
                    </div>
                    <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-sage-600" />
                    </div>
                </motion.div>

                {/* Info Text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sage-400 text-sm text-center mt-4 max-w-sm"
                >
                    Your location will be shared with Sarah and emergency services immediately.
                </motion.p>

                {/* Cancel Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(-1)}
                    className="mt-8 text-sage-500 font-medium flex items-center gap-2"
                >
                    ✕ Cancel, I'm okay
                </motion.button>
            </main>
        </div>
    )
}
