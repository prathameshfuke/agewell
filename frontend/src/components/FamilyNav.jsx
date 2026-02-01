import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Play, Pill, Settings, Users } from 'lucide-react'

/**
 * FamilyNav - Bottom navigation for caregivers
 * 
 * UPDATED Design specs:
 * - Fixed bottom position with proper alignment
 * - Min 48px touch targets (WCAG compliant)
 * - Larger icons (w-7 h-7) and text (base = 16px)
 * - High contrast active/inactive states
 * - Settings and Family buttons added
 * - Consistent styling with ElderNav
 */
export default function FamilyNav() {
    const navigate = useNavigate()
    const location = useLocation()

    const isActive = (paths) => {
        if (Array.isArray(paths)) {
            return paths.some(p => location.pathname.startsWith(p))
        }
        return location.pathname === paths
    }

    const NavItem = ({ path, paths, icon: Icon, label, className = '' }) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-1.5 flex-1 min-h-[56px] justify-center transition-all duration-200 relative ${
                isActive(paths || path) 
                    ? 'text-primary font-bold' 
                    : 'text-primary-light hover:text-primary'
            } ${className}`}
            aria-label={label}
            aria-current={isActive(paths || path) ? 'page' : undefined}
        >
            <Icon className="w-7 h-7" strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-wide">{label}</span>
            {isActive(paths || path) && (
                <motion.div 
                    layoutId="activeFamilyTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
            )}
        </motion.button>
    )

    const navItems = [
        { path: '/family/dashboard', icon: Home, label: 'Home' },
        { path: '/family/day-replay', icon: Play, label: 'Replay' },
        { path: '/family/meds', icon: Pill, label: 'Meds' },
        { path: '/family/settings', icon: Settings, label: 'Settings' },
        { path: '/family/members', icon: Users, label: 'Family' },
    ]

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
            {navItems.map((item) => (
                <NavItem
                    key={item.path}
                    path={item.path}
                    paths={item.paths}
                    icon={item.icon}
                    label={item.label}
                />
            ))}
        </nav>
    )
}
