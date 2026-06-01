import { useState, useEffect, useRef } from 'react'

/**
 * useFakeSensorData – Simulates a connected health sensor that updates every 5 s.
 *
 * Returns:
 *   readings  – current vital readings object
 *   connected – boolean (always true after initial mount)
 *   lastUpdated – human-readable timestamp string
 */

// Utility: random int in [min, max]
const rnd = (min, max) => Math.round(min + Math.random() * (max - min))

// Utility: clamp a value between lo and hi
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Generate a realistic next reading based on previous
function nextReading(prev) {
  const heartRate = clamp(
    (prev?.heartRate ?? 72) + rnd(-3, 3),
    55, 105
  )
  const systolic = clamp(
    (prev?.systolic ?? 118) + rnd(-4, 4),
    100, 145
  )
  const diastolic = clamp(
    (prev?.diastolic ?? 76) + rnd(-3, 3),
    60, 95
  )
  const spo2 = clamp(
    (prev?.spo2 ?? 98) + rnd(-1, 1),
    93, 100
  )
  const temperature = parseFloat(
    clamp(
      (prev?.temperature ?? 98.6) + (Math.random() - 0.5) * 0.2,
      97.0, 99.5
    ).toFixed(1)
  )
  const steps = clamp(
    (prev?.steps ?? 3200) + rnd(0, 80),
    0, 15000
  )
  const sleep = prev?.sleep ?? parseFloat((rnd(55, 85) / 10).toFixed(1)) // hours, stable per session

  return { heartRate, systolic, diastolic, spo2, temperature, steps, sleep }
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function useFakeSensorData({ enabled = true, intervalMs = 5000 } = {}) {
  const [readings, setReadings] = useState(() => nextReading(null))
  const [connected, setConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const prevRef = useRef(null)

  // Simulate short "connecting" delay on mount
  useEffect(() => {
    if (!enabled) return
    const connectTimer = setTimeout(() => {
      setConnected(true)
      const initial = nextReading(null)
      setReadings(initial)
      prevRef.current = initial
      setLastUpdated(formatTime(new Date()))
    }, 1200)
    return () => clearTimeout(connectTimer)
  }, [enabled])

  // Poll every `intervalMs`
  useEffect(() => {
    if (!enabled || !connected) return
    const interval = setInterval(() => {
      setReadings(prev => {
        const next = nextReading(prev)
        prevRef.current = next
        return next
      })
      setLastUpdated(formatTime(new Date()))
    }, intervalMs)
    return () => clearInterval(interval)
  }, [enabled, connected, intervalMs])

  return { readings, connected, lastUpdated }
}
