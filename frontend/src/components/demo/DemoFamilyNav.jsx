import { motion } from 'framer-motion'
import { Home, Clock, User, Settings } from 'lucide-react'

export default function DemoFamilyNav({ activeTab, onNavigate }) {

    const isActive = (tabName) => activeTab === tabName

    const NavItem = ({ name, icon: Icon, label }) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(name)}
            className={`nav-item flex flex-col items-center justify-center py-2 ${isActive(name) ? 'nav-item-active' : 'nav-item-inactive'}`}
        >
            <Icon className="w-7 h-7" strokeWidth={2} />
            <span className="text-xs font-bold mt-1">{label}</span>
        </motion.button>
    )

    return (
        <nav className="bottom-nav px-0 grid grid-cols-4 gap-1">
            <NavItem name="caregiver-dashboard" icon={Home} label="Home" />
            <NavItem name="caregiver-timeline" icon={Clock} label="Timeline" />
            <NavItem name="caregiver-family" icon={User} label="Family" />
            <NavItem name="caregiver-settings" icon={Settings} label="Settings" />
        </nav>
    )
}
