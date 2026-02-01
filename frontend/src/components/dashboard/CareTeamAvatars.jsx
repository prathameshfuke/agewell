import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar'
import { AvatarGroup, AvatarGroupTooltip } from '../ui/AvatarGroup'

/**
 * CareTeamAvatars - Displays care team members with animated avatar group
 * Mobile-optimized for elderly-friendly display
 * 
 * Uses animate-ui inspired avatar group with smooth hover animations
 */

// Mock data - in production, this would come from API/context
const CARE_TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Shura',
    role: 'Primary Caregiver',
    initials: 'SH',
    avatar: null, // Could be avatar URL
    color: 'from-sage-500 to-sage-600',
  },
  {
    id: 2,
    name: 'Aarav',
    role: 'Family Member',
    initials: 'AA',
    avatar: null,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 3,
    name: 'Dr. Smith',
    role: 'Healthcare Provider',
    initials: 'DS',
    avatar: null,
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 4,
    name: 'Maya',
    role: 'Family Member',
    initials: 'MY',
    avatar: null,
    color: 'from-purple-500 to-purple-600',
  },
]

export default function CareTeamAvatars({ 
  members = CARE_TEAM_MEMBERS,
  size = 'default',
  maxDisplay = 5,
  className = '' 
}) {
  // Limit displayed members
  const displayedMembers = members.slice(0, maxDisplay)
  const remainingCount = members.length - maxDisplay

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <AvatarGroup
        invertOverlap={true}
        translate="-35%"
        transition={{ type: 'spring', stiffness: 300, damping: 17 }}
        tooltipTransition={{ type: 'spring', stiffness: 300, damping: 35 }}
        side="top"
        sideOffset={30}
      >
        {displayedMembers.map((member, index) => (
          <div key={member.id} className="relative">
            <Avatar 
              size={size}
              className="border-3 border-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              {member.avatar ? (
                <AvatarImage src={member.avatar} alt={member.name} />
              ) : (
                <AvatarFallback className={`bg-gradient-to-br ${member.color}`}>
                  {member.initials}
                </AvatarFallback>
              )}
            </Avatar>
            <AvatarGroupTooltip data-index={index}>
              <div className="text-center">
                <div className="font-bold">{member.name}</div>
                <div className="text-xs opacity-90">{member.role}</div>
              </div>
            </AvatarGroupTooltip>
          </div>
        ))}
      </AvatarGroup>

      {/* Show remaining count if there are more members */}
      {remainingCount > 0 && (
        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-sage-100 text-sage-700 font-bold text-xs sm:text-sm border-2 border-white shadow-md">
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
