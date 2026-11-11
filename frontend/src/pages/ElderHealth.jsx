import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { db } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useVitals } from '../hooks/useVitals'
import { ElderPage, Split, Loading, ErrorNote, EmptyNote } from '../components/ElderNav'

const rate = (v) => (v == null ? null : v < 60 ? 'Low' : v > 100 ? 'High' : 'Normal')
const oxygen = (v) => (v == null ? null : v < 94 ? 'Low' : 'Normal')
const tempUnit = (v) => (v > 50 ? '°F' : '°C')

function Stat({ label, value, unit, status }) {
  return (
    <div className="py-5 sm:px-6 sm:first:pl-0">
      <p className="text-base text-sage-600">{label}</p>
      <p className="mt-1 font-serif text-5xl">
        {value == null ? '--' : value}
        {value != null && <span className="ml-1 font-sans text-lg text-sage-600">{unit}</span>}
      </p>
      {status && (
        <p className={`mt-1 text-base font-bold ${status === 'Normal' ? 'text-emerald-700' : 'text-saffron-dark'}`}>{status}</p>
      )}
    </div>
  )
}

// Heart rate over the last readings, oldest to newest. Real rows only.
function Trend({ rows }) {
  const pts = rows.filter((r) => r.heart_rate != null).slice(0, 40).reverse()
  if (pts.length < 2) return null
  const vals = pts.map((r) => r.heart_rate)
  const lo = Math.min(...vals) - 5
  const hi = Math.max(...vals) + 5
  const path = pts
    .map((r, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * 300},${100 - ((r.heart_rate - lo) / (hi - lo)) * 100}`)
    .join(' ')
  return (
    <section aria-label="Heart rate this week">
      <h2 className="text-2xl">Heart rate this week</h2>
      <svg viewBox="0 0 300 100" className="mt-4 h-40 w-full sm:h-48" role="img" aria-label={`Heart rate between ${Math.min(...vals)} and ${Math.max(...vals)} beats per minute`}>
        <path d={path} fill="none" stroke="#1F5F4A" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="mt-2 text-base text-sage-600">Lowest {Math.min(...vals)}, highest {Math.max(...vals)} bpm</p>
    </section>
  )
}

export default function ElderHealth() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { readings, connected, lastUpdated } = useVitals(user?.id)
  const [rows, setRows] = useState(null)
  const [adherence, setAdherence] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user?.id) return
    setError('')
    setRows(null)
    try {
      setRows(await db.health.getHistory(user.id, 7))
    } catch {
      setError('We could not load your readings. Check your connection and try again.')
    }
    const logs = await api.getAdherenceLogs(user.id, 7)
    if (logs.success) {
      const all = logs.logs || []
      const due = all.filter((l) => l.status !== 'pending' || new Date(l.scheduled_time) < new Date())
      setAdherence({ taken: due.filter((l) => l.status === 'taken').length, total: due.length })
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  const medsBlock = adherence && (
    <section className="band" aria-label="Medicines this week">
      <h2 className="text-2xl">Medicines this week</h2>
      {adherence.total === 0 ? (
        <p className="mt-2 text-lg text-sage-600">No doses were due yet.</p>
      ) : (
        <p className="mt-2 text-xl">You took {adherence.taken} of {adherence.total} doses.</p>
      )}
      <button type="button" onClick={() => navigate('/elder/meds/history')} className="btn-secondary mt-5 w-full">See past days</button>
    </section>
  )

  const hasReadings = readings.heartRate != null || readings.spo2 != null || readings.temperature != null

  const showData = !error && rows !== null && (rows.length > 0 || hasReadings)

  return (
    <ElderPage title="My health" art="heart" backTo="/elder/dashboard">
      {error ? (
        <ErrorNote onRetry={load}>{error}</ErrorNote>
      ) : rows === null ? (
        <Loading label="Loading your readings..." />
      ) : rows.length === 0 && !hasReadings ? (
        <EmptyNote title="No readings yet" art="heart">
          Readings appear here when your device syncs. Your device is not connected right now.
        </EmptyNote>
      ) : (
        <Split
          aside={medsBlock}
        >
          <p className="text-lg text-sage-700" role="status">
            {connected ? `Device connected. Last reading at ${lastUpdated}.` : `Device not connected.${lastUpdated ? ` Last reading at ${lastUpdated}.` : ''}`}
          </p>
          <div className="grid grid-cols-1 divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Stat label="Heart rate" value={readings.heartRate} unit="bpm" status={rate(readings.heartRate)} />
            <Stat label="Blood oxygen" value={readings.spo2} unit="%" status={oxygen(readings.spo2)} />
            <Stat label="Temperature" value={readings.temperature} unit={readings.temperature != null ? tempUnit(readings.temperature) : ''} />
          </div>
          <Trend rows={rows} />
        </Split>
      )}
      {!showData && medsBlock}
    </ElderPage>
  )
}
