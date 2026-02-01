export default function CalendarHeatmap({ data = [], month = 'January', year = 2024 }) {
  // Generate calendar grid for the month
  const daysInMonth = new Date(year, new Date(`${month} 1, ${year}`).getMonth() + 1, 0).getDate()
  const firstDay = new Date(year, new Date(`${month} 1, ${year}`).getMonth(), 1).getDay()
  
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  
  // Create array of days with empty slots for alignment
  const calendarDays = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = data.find(d => d.day === day)
    calendarDays.push({
      day,
      status: dayData?.status || 'empty',
      value: dayData?.value || 0,
    })
  }

  const getColorClass = (status, value) => {
    if (status === 'empty') return 'bg-sage-50'
    if (status === 'taken' || value === 100) return 'bg-sage-500'
    if (status === 'partial' || (value > 50 && value < 100)) return 'bg-amber-400'
    if (status === 'missed' || value < 50) return 'bg-rose-400'
    return 'bg-sage-100'
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-soft border border-sage-100">
      <div className="text-sm font-bold text-sage-900 mb-4">{month} {year}</div>
      
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-sage-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              aspect-square rounded-lg flex items-center justify-center text-xs font-medium
              transition-all hover:scale-110
              ${day ? getColorClass(day.status, day.value) : 'bg-transparent'}
              ${day && day.status !== 'empty' ? 'text-white cursor-pointer' : 'text-sage-400'}
            `}
            title={day ? `Day ${day.day}: ${day.status}` : ''}
          >
            {day?.day}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-sage-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-sage-500"></div>
          <span className="text-xs text-sage-600">Complete</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400"></div>
          <span className="text-xs text-sage-600">Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-rose-400"></div>
          <span className="text-xs text-sage-600">Missed</span>
        </div>
      </div>
    </div>
  )
}
