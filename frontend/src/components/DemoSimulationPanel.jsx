import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, AlertTriangle, Snowflake, Sun, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

export default function DemoSimulationPanel() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [activeSim, setActiveSim] = useState(null)
    const [statusMessage, setStatusMessage] = useState('')

    const triggerSimulation = async (type) => {
        // Offline/Demo Mode Handling (If no user logged in)
        if (!user?.id) {
            setActiveSim('loading')

            // Mock delay
            setTimeout(() => {
                setActiveSim(type)
                let message = 'Event Triggered (Demo)'

                // Specific mock messages matching backend logic
                if (type === 'fall') message = 'Emergency Protocol Activated (Demo)'
                else if (type === 'cold') message = 'Adjusted AC to 26°C (Demo: Arthritis)'
                else if (type === 'morning') message = 'Lights set to Cool White (Demo)'

                setStatusMessage(message)

                // Dispatch event for UI feedback
                window.dispatchEvent(new CustomEvent('agewell-simulation', {
                    detail: { type, message }
                }))

                // Reset after delay
                setTimeout(() => {
                    setActiveSim(null)
                    setStatusMessage('')
                }, 3000)
            }, 1000)
            return
        }

        // Online Handling (If logged in)
        setActiveSim('loading')

        try {
            const result = await api.triggerAutomation(user.id, type)

            if (result.success) {
                setActiveSim(type)
                const actions = result.triggered_actions || []
                const message = actions.length > 0 ? actions[0] : 'Event Triggered'
                setStatusMessage(message)

                // Dispatch event for UI feedback in other components
                window.dispatchEvent(new CustomEvent('agewell-simulation', {
                    detail: { type, message }
                }))
            } else {
                setActiveSim('error')
                setStatusMessage('Failed: ' + (result.error || 'Unknown'))
            }
        } catch (e) {
            setActiveSim('error')
            setStatusMessage('Network Error')
        }

        setTimeout(() => {
            if (activeSim !== 'error') setActiveSim(null)
            setStatusMessage('')
        }, 3000)
    }

    return (
        <>
            {/* Floating Trigger Button */}
            <motion.button
                className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg border-2 border-indigo-400 hover:bg-indigo-700 hover:scale-105 transition-all"
                onClick={() => setIsOpen(true)}
                whileTap={{ scale: 0.9 }}
            >
                <FlaskConical className="w-6 h-6" />
            </motion.button>

            {/* Simulation Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden"
                        >
                            <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white">
                                <span className="font-bold flex items-center gap-2">
                                    <FlaskConical className="w-4 h-4" />
                                    Demo Simulator
                                </span>
                                <button onClick={() => setIsOpen(false)} className="opacity-80 hover:opacity-100">✕</button>
                            </div>

                            <div className="p-2 grid gap-2">
                                <button
                                    onClick={() => triggerSimulation('fall')}
                                    disabled={activeSim === 'loading'}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-left transition-colors border border-transparent hover:border-rose-200 disabled:opacity-50"
                                >
                                    <div className="bg-rose-100 text-rose-600 p-2 rounded-lg">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-rose-900 text-sm">Simulate FALL</div>
                                        <div className="text-xs text-rose-500">Triggers SOS Protocol</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => triggerSimulation('cold')}
                                    disabled={activeSim === 'loading'}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 text-left transition-colors border border-transparent hover:border-blue-200 disabled:opacity-50"
                                >
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                        <Snowflake className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-blue-900 text-sm">Drop Temp (18°C)</div>
                                        <div className="text-xs text-blue-500">Tests Arthritis Trigger</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => triggerSimulation('morning')}
                                    disabled={activeSim === 'loading'}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 text-left transition-colors border border-transparent hover:border-amber-200 disabled:opacity-50"
                                >
                                    <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
                                        <Sun className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-amber-900 text-sm">Morning Routine</div>
                                        <div className="text-xs text-amber-500">Wake logic (Lights/AC)</div>
                                    </div>
                                </button>
                            </div>

                            {/* Status Bar */}
                            {(activeSim || statusMessage) && (
                                <div className={`px-4 py-2 text-xs font-bold border-t flex items-center justify-center gap-2 ${activeSim === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                    activeSim === 'loading' ? 'bg-gray-50 text-gray-600 border-gray-100' :
                                        'bg-green-50 text-green-700 border-green-100'
                                    }`}>
                                    {activeSim === 'error' && <XCircle className="w-4 h-4" />}
                                    {activeSim === 'loading' && <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />}
                                    {activeSim && activeSim !== 'loading' && activeSim !== 'error' && <CheckCircle className="w-4 h-4" />}

                                    {statusMessage || (activeSim === 'loading' ? 'Processing...' : 'Ready')}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
