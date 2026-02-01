import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'

export default function DemoAutomationFeedback({ message, type = 'comfort', onClose }) {
    if (!message) return null

    const colors = {
        comfort: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: 'text-amber-500' },
        air: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: 'text-blue-500' },
        safety: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', icon: 'text-green-500' },
        emergency: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', icon: 'text-rose-500' }
    }

    const style = colors[type] || colors.comfort

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="mb-6"
            >
                <div className={`${style.bg} border-2 ${style.border} rounded-2xl p-4 flex items-start gap-4 shadow-sm relative overflow-hidden`}>
                    <div className={`p-2 bg-white rounded-xl shadow-sm ${style.icon}`}>
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pr-6">
                        <div className={`font-bold text-sm uppercase tracking-wider mb-1 opacity-70 ${style.text}`}>Smart Adjustment</div>
                        <div className={`font-medium ${style.text} text-lg leading-tight`}>
                            {message}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors ${style.text} opacity-50 hover:opacity-100`}
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Background decoration */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-5 rounded-full" />
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
