import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

export default function TrendChart({ 
  data = [], 
  color = '#2563EB',
  height = 60,
  showTooltip = true 
}) {
  // Transform data to recharts format if needed
  const chartData = data.map((item, index) => ({
    index,
    value: typeof item === 'number' ? item : item.value,
    label: item.label || `Point ${index + 1}`,
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-100">
          <p className="text-sm font-bold text-slate-900">{payload[0].value}</p>
          {payload[0].payload.label && (
            <p className="text-xs text-slate-500">{payload[0].payload.label}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
