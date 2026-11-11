
/**
 * SensorStatusBadge – small pill showing sensor connection state.
 */
export function SensorStatusBadge({ connected, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        connected ? 'bg-emerald-50 text-emerald-800' : 'bg-sage-100 text-sage-600'
      } ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-sage-400'}`} aria-hidden="true" />
      {connected ? 'Device online' : 'Device offline'}
    </span>
  )
}

/**
 * LiveVitalsPanel – latest real vitals; missing values read "No data".
 *
 * Props:
 *   readings    – object from useVitals
 *   connected   – boolean
 *   lastUpdated – string
 *   compact     – boolean (show smaller version for elder dashboard)
 */
export default function LiveVitalsPanel({
  readings,
  connected,
  lastUpdated,
  compact = false,
  className = '',
}) {
  const getHeartRateStatus = (hr) => {
    if (!hr) return { label: '', color: '' }
    if (hr < 60) return { label: 'Low', color: 'text-blue-500' }
    if (hr > 100) return { label: 'High', color: 'text-rose-500' }
    return { label: 'Normal', color: 'text-emerald-600' }
  }

  const getBPStatus = (sys, dia) => {
    if (!sys || !dia) return { label: '', color: '' }
    if (sys >= 140 || dia >= 90) return { label: 'High', color: 'text-rose-500' }
    if (sys < 90 || dia < 60) return { label: 'Low', color: 'text-blue-500' }
    return { label: 'Normal', color: 'text-emerald-600' }
  }

  const getSpO2Status = (spo2) => {
    if (!spo2) return { label: '', color: '' }
    if (spo2 < 95) return { label: 'Low', color: 'text-rose-500' }
    return { label: 'Normal', color: 'text-emerald-600' }
  }

  const hrStatus = getHeartRateStatus(readings?.heartRate)
  const bpStatus = getBPStatus(readings?.systolic, readings?.diastolic)
  const spo2Status = getSpO2Status(readings?.spo2)

  const vitals = [
    {
      id: 'heart-rate',
      label: 'Heart Rate',
      value: readings?.heartRate ?? '--',
      unit: 'bpm',
      status: hrStatus,
    },
    {
      id: 'blood-pressure',
      label: 'Blood Pressure',
      value: readings?.systolic && readings?.diastolic
        ? `${readings.systolic}/${readings.diastolic}`
        : '--',
      unit: 'mmHg',
      status: bpStatus,
    },
    {
      id: 'spo2',
      label: 'SpO₂',
      value: readings?.spo2 ?? '--',
      unit: '%',
      status: spo2Status,
    },
    {
      id: 'temperature',
      label: 'Temperature',
      value: readings?.temperature ?? '--',
      unit: '°F',
      status: { label: '', color: '' },
    },
  ]

  if (!compact) {
    vitals.push(
      { id: 'steps', label: 'Steps today', value: readings?.steps?.toLocaleString() ?? '--', unit: 'steps', status: { label: '', color: '' } },
      { id: 'sleep', label: 'Last sleep', value: readings?.sleep ?? '--', unit: 'hrs', status: { label: '', color: '' } }
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <SensorStatusBadge connected={connected} />
        {lastUpdated && (
          <span className="text-sage-500 text-sm">{connected ? 'Updated' : 'Last reading'} {lastUpdated}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {vitals.map((v) => {
          const empty = v.value === '--' || v.value == null
          return (
            <div key={v.id} className="rounded-2xl border border-sage-200 bg-white p-4">
              <div className="text-sage-500 text-sm mb-1">{v.label}</div>
              {empty ? (
                <div className="text-base text-sage-400">No data</div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl text-sage-900 leading-none">{v.value}</span>
                  <span className="text-sage-500 text-xs">{v.unit}</span>
                </div>
              )}
              {!empty && v.status.label && (
                <div className={`text-xs font-semibold mt-1.5 ${v.status.color}`}>{v.status.label}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
