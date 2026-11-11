/**
 * VitalsStatsRow - latest vitals. Only vitals that have a value are shown,
 * plus heart rate which always shows ("No data" when missing).
 */
export default function VitalsStatsRow({
  heartRate = null,
  bloodPressure = { systolic: null, diastolic: null },
  spo2 = null,
  temperature = null,
  steps = null,
  sleep = null,
  className = '',
}) {
  const hasBp = bloodPressure?.systolic != null && bloodPressure?.diastolic != null
  const stats = [
    { label: 'Heart rate', value: heartRate, unit: 'bpm', always: true },
    { label: 'Blood pressure', value: hasBp ? `${bloodPressure.systolic}/${bloodPressure.diastolic}` : null, unit: 'mmHg' },
    { label: 'Oxygen (SpO2)', value: spo2, unit: '%' },
    { label: 'Temperature', value: temperature, unit: '°F' },
    { label: 'Steps', value: steps, unit: 'today' },
    { label: 'Sleep', value: sleep, unit: 'hours' },
  ].filter((s) => s.always || s.value != null)

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${className}`}>
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-sage-200 bg-white p-4">
          <div className="text-sm text-sage-500">{s.label}</div>
          {s.value != null ? (
            <div className="text-2xl text-sage-900 mt-1">
              {s.value} <span className="text-sm text-sage-500">{s.unit}</span>
            </div>
          ) : (
            <div className="text-base text-sage-400 mt-1">No data</div>
          )}
        </div>
      ))}
    </div>
  )
}
