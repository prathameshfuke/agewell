import { motion } from 'framer-motion'
import { Heart, History, AlertTriangle, Mic } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * QuickActionsGrid - 4-card navigation grid for elderly dashboard
 * 
 * Provides quick access to Health, History, Emergency, and Voice Memos
 */
export default function QuickActionsGrid({ className = '' }) {
  const navigate = useNavigate()

  const actions = [
    {
      icon: Heart,
      label: 'Health',
      description: 'View vitals',
      path: '/elder/health',
      color: 'sage',
      bgColor: 'bg-sage-50',
      iconColor: 'text-sage-600',
      borderColor: 'border-sage-100',
      hoverBg: 'hover:bg-sage-100',
    },
    {
      icon: History,
      label: 'History',
      description: 'Med logs',
      path: '/elder/meds/history',
      color: 'cream',
      bgColor: 'bg-cream-50',
      iconColor: 'text-cream-700',
      borderColor: 'border-cream-200',
      hoverBg: 'hover:bg-cream-100',
    },
    {
      icon: AlertTriangle,
      label: 'Emergency',
      description: 'Get help',
      path: '/elder/emergency',
      color: 'rose',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-500',
      borderColor: 'border-rose-100',
      hoverBg: 'hover:bg-rose-100',
    },
    {
      icon: Mic,
      label: 'Voice',
      description: 'Record memo',
      path: '/elder/voice-memos',
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-100',
      hoverBg: 'hover:bg-amber-100',
    },
  ]

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(action.path)}
          className={`
            ${action.bgColor} ${action.borderColor} ${action.hoverBg}
            p-4 rounded-2xl border-2 transition-all duration-200
            flex flex-col items-center gap-2 min-h-[90px]
          `}
        >
          <div className={`w-10 h-10 rounded-xl ${action.bgColor} flex items-center justify-center`}>
            <action.icon className={`w-5 h-5 ${action.iconColor}`} />
          </div>
          <span className="text-sm font-bold text-sage-800">{action.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
