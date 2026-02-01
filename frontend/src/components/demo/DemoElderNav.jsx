import { motion } from 'framer-motion'
import { Home, Pill, Activity, AlertTriangle } from 'lucide-react'

// Mock Nav for Demo - uses callbacks instead of router
export default function DemoElderNav({ activeTab, onNavigate, onImOk }) {

    // Helper to check active state
    const isActive = (tabName) => activeTab === tabName

    const NavItem = ({ name, icon: Icon, label, className = '' }) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(name)}
            className={`nav-item flex flex-col items-center justify-center py-2 ${isActive(name) ? 'nav-item-active' : 'nav-item-inactive'} ${className}`}
        >
            <Icon className="w-8 h-8" strokeWidth={2.5} />
            <span className="text-sm font-bold mt-1">{label}</span>
        </motion.button>
    )

    return (
        <nav className="bottom-nav grid grid-cols-5 gap-1">

            <NavItem name="elder-dashboard" icon={Home} label="Home" />
            <NavItem name="elder-meds" icon={Pill} label="Meds" />

            {/* Center I'M OK Button - Elevated */}
            <div className="relative flex justify-center">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    className="absolute -top-10 z-10"
                    onClick={onImOk}
                >
                    <div className="w-20 h-20 bg-sage-600 rounded-full border-4 border-[#FFFCF5] shadow-xl flex items-center justify-center">
                        <div className="text-center leading-none">
                            <span className="block text-white font-black text-xl">I'M</span>
                            <span className="block text-white font-black text-xl">OK</span>
                        </div>
                    </div>
                </motion.button>
            </div>

            <NavItem name="elder-health" icon={Activity} label="Health" />

            {/* SOS - Visually distinct */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                className={`nav-item flex flex-col items-center justify-center py-2 ${isActive('elder-emergency') ? 'text-rose-600' : 'text-rose-500'}`}
                onClick={() => onNavigate('elder-emergency')}
            >
                <AlertTriangle className="w-8 h-8" strokeWidth={2.5} />
                <span className="text-sm font-bold mt-1">SOS</span>
            </motion.button>
        </nav>
    )
}
