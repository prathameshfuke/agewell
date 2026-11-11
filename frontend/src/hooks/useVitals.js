import { useEffect, useState } from 'react'
import { db, subscriptions } from '../lib/supabase'

// A reading older than this means the device is offline.
const FRESH_MS = 15 * 60 * 1000

/**
 * Latest real vitals for one person, kept live through Supabase realtime.
 * Returns { readings, connected, lastUpdated }. Values the device did not send are null.
 */
export function useVitals(userId) {
  const [row, setRow] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setRow(null)
    if (!userId) return undefined
    let active = true
    db.health.getLatest(userId).then((latest) => active && setRow(latest)).catch(() => {})
    const unsubscribe = subscriptions.onHealthReading(userId, (reading) => active && setRow(reading))
    return () => {
      active = false
      unsubscribe()
    }
  }, [userId])

  // Re-check freshness once a minute so "connected" turns off by itself.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const recordedAt = row?.recorded_at ? new Date(row.recorded_at) : null

  return {
    readings: {
      heartRate: row?.heart_rate ?? null,
      spo2: row?.spo2 ?? null,
      temperature: row?.body_temperature ?? null,
      systolic: null,
      diastolic: null,
      steps: null,
      sleep: null,
    },
    connected: Boolean(recordedAt) && now - recordedAt.getTime() < FRESH_MS,
    lastUpdated: recordedAt
      ? recordedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
  }
}
