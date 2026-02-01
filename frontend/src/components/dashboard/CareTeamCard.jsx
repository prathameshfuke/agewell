import { motion } from 'framer-motion'
import { Users, UserPlus, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import CareTeamAvatars from './CareTeamAvatars'

/**
 * CareTeamCard - Card displaying care team with animated avatars
 * Shows on Family Dashboard
 * Mobile-first design for elderly users
 */
export default function CareTeamCard({ className = '' }) {
  const navigate = useNavigate()

  return (
    <Card className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-sage-600" />
          <span className="text-sage-600 font-bold uppercase tracking-wider text-xs sm:text-sm">
            Care Team
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/family/members')}
          className="p-2 hover:bg-sage-50 rounded-xl transition-colors"
          aria-label="Manage team"
        >
          <UserPlus className="w-5 h-5 text-sage-500" />
        </motion.button>
      </div>

      {/* Care Team Avatars */}
      <div className="flex flex-col items-center sm:items-start gap-4">
        <CareTeamAvatars size="lg" maxDisplay={4} />
        
        {/* Info Text */}
        <div className="text-center sm:text-left w-full">
          <p className="text-sage-700 text-sm sm:text-base font-medium break-words">
            4 members watching over your loved one
          </p>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/family/members')}
            className="text-sage-500 text-xs sm:text-sm hover:text-sage-700 mt-2 inline-flex items-center gap-1 font-medium"
          >
            View all members
            <span className="text-lg">→</span>
          </motion.button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 mt-4 pt-4 border-t border-sage-100">
        <div className="bg-sage-50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-sage-600 mb-1">
            <Crown className="w-3 h-3" />
            <span className="font-medium">Primary</span>
          </div>
          <div className="text-lg font-bold text-sage-900">1</div>
        </div>
        <div className="bg-sage-50 rounded-xl p-3 text-center">
          <div className="text-xs text-sage-600 font-medium mb-1">Family</div>
          <div className="text-lg font-bold text-sage-900">2</div>
        </div>
        <div className="bg-sage-50 rounded-xl p-3 text-center">
          <div className="text-xs text-sage-600 font-medium mb-1">Healthcare</div>
          <div className="text-lg font-bold text-sage-900">1</div>
        </div>
      </div>
    </Card>
  )
}
