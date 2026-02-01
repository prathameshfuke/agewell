import { motion } from 'framer-motion'
import { Pill, Heart, MessageCircle, AlertTriangle, Check, Clock } from 'lucide-react'
import Card, { CardHeader } from '../ui/Card'

/**
 * ActivityTimeline - Enhanced timeline with color-coded events
 * 
 * Shows recent activities with icons and status indicators
 */
export default function ActivityTimeline({ 
  activities = [],
  maxItems = 5,
  onViewAll,
  className = ''
}) {
  const getActivityIcon = (type) => {
    const icons = {
      medication: Pill,
      check_in: Heart,
      message: MessageCircle,
      alert: AlertTriangle,
      completed: Check,
      default: Clock,
    }
    return icons[type] || icons.default
  }

  const getActivityColor = (type, status) => {
    if (status === 'missed' || status === 'alert') {
      return {
        bg: 'bg-rose-50',
        icon: 'text-rose-500',
        border: 'border-rose-100',
        dot: 'bg-rose-500',
      }
    }
    if (status === 'taken' || status === 'completed' || type === 'check_in') {
      return {
        bg: 'bg-sage-50',
        icon: 'text-sage-600',
        border: 'border-sage-100',
        dot: 'bg-sage-500',
      }
    }
    if (type === 'message') {
      return {
        bg: 'bg-cream-50',
        icon: 'text-cream-700',
        border: 'border-cream-200',
        dot: 'bg-cream-500',
      }
    }
    return {
      bg: 'bg-sage-50',
      icon: 'text-sage-500',
      border: 'border-sage-100',
      dot: 'bg-sage-400',
    }
  }

  // Use mock data if none provided
  const timelineData = activities.length > 0 ? activities : [
    { id: 1, type: 'medication', title: 'Morning Vitamins', time: '8:00 AM', status: 'taken', detail: 'Taken on time' },
    { id: 2, type: 'check_in', title: 'Wellness Check', time: '9:30 AM', status: 'completed', detail: 'Feeling good' },
    { id: 3, type: 'medication', title: 'Blood Pressure Med', time: '12:00 PM', status: 'taken', detail: 'Taken on time' },
    { id: 4, type: 'message', title: 'Voice Memo', time: '2:15 PM', status: 'sent', detail: 'To family' },
    { id: 5, type: 'medication', title: 'Evening Medication', time: '6:00 PM', status: 'pending', detail: 'Upcoming' },
  ]

  const displayActivities = timelineData.slice(0, maxItems)

  return (
    <Card className={className}>
      <CardHeader 
        icon={<Clock className="w-5 h-5 text-sage-500" />} 
        label="Recent Activity"
        action={
          onViewAll && (
            <button 
              onClick={onViewAll}
              className="text-sage-500 text-sm font-bold hover:text-sage-700 transition-colors"
            >
              View All
            </button>
          )
        }
      />

      <div className="space-y-1">
        {displayActivities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type)
          const colors = getActivityColor(activity.type, activity.status)
          
          return (
            <motion.div
              key={activity.id || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center gap-3 p-3 rounded-xl
                ${colors.bg} ${colors.border} border
                transition-all hover:shadow-soft
              `}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sage-800 truncate">{activity.title}</div>
                <div className="text-sage-400 text-sm flex items-center gap-2">
                  <span>{activity.time}</span>
                  <span>•</span>
                  <span className="truncate">{activity.detail}</span>
                </div>
              </div>

              {/* Status Dot */}
              <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
            </motion.div>
          )
        })}
      </div>

      {timelineData.length === 0 && (
        <div className="text-center py-8 text-sage-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No recent activity</p>
        </div>
      )}
    </Card>
  )
}
