export default function TimelineEvent({ 
  icon: Icon, 
  title, 
  description, 
  time, 
  color = 'blue',
  isLast = false 
}) {
  const colorClasses = {
    blue: {
      dot: 'bg-blue-500',
      line: 'bg-blue-200',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    green: {
      dot: 'bg-emerald-500',
      line: 'bg-emerald-200',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    rose: {
      dot: 'bg-rose-500',
      line: 'bg-rose-200',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
    },
    amber: {
      dot: 'bg-amber-500',
      line: 'bg-amber-200',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
  }

  const classes = colorClasses[color] || colorClasses.blue

  return (
    <div className="flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${classes.iconBg}`}>
          {Icon && <Icon className={`w-5 h-5 ${classes.iconColor}`} />}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-full min-h-[40px] ${classes.line} mt-2`}></div>
        )}
      </div>

      {/* Event content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-slate-900">{title}</h4>
          {time && (
            <span className="text-xs text-slate-400 font-medium">{time}</span>
          )}
        </div>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>
    </div>
  )
}
