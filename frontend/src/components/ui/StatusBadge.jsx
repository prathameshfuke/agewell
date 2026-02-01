import { CheckCircle, Clock, XCircle, HelpCircle } from 'lucide-react'

/**
 * StatusBadge - Unified status indicator
 * 
 * Uses sage palette for success/neutral states
 * Amber for pending/warning
 * Rose for skipped/danger
 */
export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const config = {
    taken: {
      icon: CheckCircle,
      text: 'Taken',
      classes: 'bg-sage-100 text-sage-700 border-sage-200',
    },
    success: {
      icon: CheckCircle,
      text: 'Success',
      classes: 'bg-sage-100 text-sage-700 border-sage-200',
    },
    pending: {
      icon: Clock,
      text: 'Pending',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    warning: {
      icon: Clock,
      text: 'Warning',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    skipped: {
      icon: XCircle,
      text: 'Skipped',
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    missed: {
      icon: XCircle,
      text: 'Missed',
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    unsure: {
      icon: HelpCircle,
      text: 'Unsure',
      classes: 'bg-cream-100 text-sage-600 border-cream-200',
    },
    active: {
      icon: null,
      text: 'Active',
      classes: 'bg-sage-500 text-white border-sage-600',
    },
    inactive: {
      icon: null,
      text: 'Inactive',
      classes: 'bg-cream-100 text-sage-500 border-cream-200',
    },
  }

  const statusConfig = config[status] || config.pending
  const Icon = statusConfig.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div className={`
      inline-flex items-center rounded-full font-bold border
      ${statusConfig.classes}
      ${sizeClasses[size]}
    `}>
      {showIcon && Icon && <Icon className={iconSizes[size]} />}
      <span>{statusConfig.text}</span>
    </div>
  )
}
