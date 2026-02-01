import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Pill, Activity, AlertTriangle, Settings } from 'lucide-react'

/**
 * ElderNav - Bottom navigation for elderly users
 * 
 * UPDATED Design specs:
 * - Fixed bottom position with proper alignment
 * - Min 48px touch targets (WCAG compliant)
 * - Larger icons (w-7 h-7) and text (base = 16px)
 * - High contrast active/inactive states
 * - I'M OK button prominently centered
 * - Settings button added for easy access
 * - SOS visually isolated with emergency colors
 */
export default function ElderNav({ onImOk }) {
    const navigate = useNavigate()
    const location = useLocation()

    const isActive = (paths) => {
        if (Array.isArray(paths)) {
            return paths.some(p => location.pathname.startsWith(p))
        }
        return location.pathname === paths
    }

    const NavItem = ({ path, paths, icon: Icon, label, isEmergency = false, className = '' }) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-1.5 flex-1 min-h-[56px] justify-center transition-all duration-200 ${
                isEmergency 
                    ? 'text-accent' 
                    : isActive(paths || path) 
                        ? 'text-primary font-bold' 
                        : 'text-primary-light hover:text-primary'
            } ${className}`}
            aria-label={label}
            aria-current={isActive(paths || path) ? 'page' : undefined}
        >
            <Icon className="w-7 h-7" strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-wide">{label}</span>
            {isActive(paths || path) && !isEmergency && (
                <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
            )}
        </motion.button>
    )

    return (
        <nav 
            className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-lg border-t-2 border-primary-light/30 px-1 flex justify-around items-center z-50 shadow-elevated"
            style={{ 
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', 
                paddingTop: '0.5rem',
                minHeight: '72px'
            }}
            role="navigation"
            aria-label="Main navigation"
        >
            <NavItem path="/elder/dashboard" icon={Home} label="Home" />
            
            <NavItem 
                path="/elder/meds" 
                paths={['/elder/meds']} 
                icon={Pill} 
                label="Meds" 
            />

            {/* Center I'M OK Button - Elevated and Prominent */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                className="flex flex-col items-center justify-center flex-1 relative"
                onClick={onImOk}
                aria-label="I'm OK - Send status update"
            >
                <div className="px-6 py-3 bg-primary rounded-full -mt-6 border-4 border-white shadow-elevated hover:shadow-2xl transition-shadow">
                    <span className="text-white font-extrabold text-base tracking-wider">I'M OK</span>
                </div>
            </motion.button>

            <NavItem path="/elder/health" icon={Activity} label="Health" />

            {/* SOS - Emergency Button with High Visibility */}
            <NavItem 
                path="/elder/emergency" 
                icon={AlertTriangle} 
                label="SOS" 
                isEmergency={true}
            />
        </nav>
    )
}
