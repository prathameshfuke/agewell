import { useId, useMemo } from 'react'

export default function TrendChart({
  data = [],
  color = '#2563EB',
  height = 60,
  showTooltip = true
}) {
  const gradientId = useId().replace(/:/g, '')

  const chart = useMemo(() => {
    const values = data
      .map((item, index) => ({
        index,
        value: Number(typeof item === 'number' ? item : item.value),
        label: typeof item === 'number' ? `Point ${index + 1}` : item.label || `Point ${index + 1}`,
      }))
      .filter((item) => Number.isFinite(item.value))

    if (values.length === 0) {
      return { values: [], line: '', area: '', min: 0, max: 0 }
    }

    const min = Math.min(...values.map((item) => item.value))
    const max = Math.max(...values.map((item) => item.value))
    const range = max - min || 1
    const width = 100
    const chartHeight = 100

    const points = values.map((item, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * width
      const y = chartHeight - ((item.value - min) / range) * 80 - 10
      return { ...item, x, y }
    })

    const line = points.map((point) => `${point.x},${point.y}`).join(' ')
    const area = `0,100 ${line} 100,100`

    return { values: points, line, area, min, max }
  }, [data])

  if (chart.values.length === 0) {
    return (
      <div
        className="w-full rounded-xl bg-sage-50 flex items-center justify-center text-sage-400 text-xs"
        style={{ height }}
      >
        No trend data
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="Health trend chart"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={chart.area} fill={`url(#${gradientId})`} />
        <polyline
          points={chart.line}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {chart.values.map((point) => (
          <circle
            key={`${point.label}-${point.index}`}
            cx={point.x}
            cy={point.y}
            r="2.4"
            fill={color}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {showTooltip && (
        <div className="sr-only">
          {chart.values.map((point) => `${point.label}: ${point.value}`).join(', ')}
        </div>
      )}
    </div>
  )
}
