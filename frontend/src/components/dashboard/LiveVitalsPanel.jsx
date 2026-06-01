import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Droplets, Thermometer, Footprints, Moon, Wifi, WifiOff } from 'lucide-react'

/**
 * SensorStatusBadge – small pill showing sensor connection state.
 */
export function SensorStatusBadge({ connected, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
        connected
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'
      } ${className}`}
    >
      <motion.div
        animate={connected ? { scale: [1, 1.4, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-400'}`}
      />
      {connected ? 'Sensor Connected' : 'Connecting…'}
    </motion.div>
  )
}

/**
 * LiveVitalsPanel – full panel with all vitals that animate on each update.
 *
 * Props:
 *   readings    – object from useFakeSensorData
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
    if (!hr) return { label: '--', color: 'text-sage-400' }
    if (hr < 60) return { label: 'Low', color: 'text-blue-500' }
    if (hr > 100) return { label: 'High', color: 'text-rose-500' }
    return { label: 'Normal', color: 'text-emerald-600' }
  }

  const getBPStatus = (sys, dia) => {
    if (!sys || !dia) return { label: '--', color: 'text-sage-400' }
    if (sys >= 140 || dia >= 90) return { label: 'High', color: 'text-rose-500' }
    if (sys < 90 || dia < 60) return { label: 'Low', color: 'text-blue-500' }
    return { label: 'Normal', color: 'text-emerald-600' }
  }

  const getSpO2Status = (spo2) => {
    if (!spo2) return { label: '--', color: 'text-sage-400' }
    if (spo2 < 95) return { label: 'Low', color: 'text-rose-500' }
    return { label: 'Normal', color: 'text-emerald-600' }
  }

  const hrStatus = getHeartRateStatus(readings?.heartRate)
  const bpStatus = getBPStatus(readings?.systolic, readings?.diastolic)
  const spo2Status = getSpO2Status(readings?.spo2)

  const vitals = [
    {
      id: 'heart-rate',
      icon: Activity,
      label: 'Heart Rate',
      value: readings?.heartRate ?? '--',
      unit: 'bpm',
      status: hrStatus,
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      iconColor: 'text-rose-500',
      pulse: true,
    },
    {
      id: 'blood-pressure',
      icon: Droplets,
      label: 'Blood Pressure',
      value: readings?.systolic && readings?.diastolic
        ? `${readings.systolic}/${readings.diastolic}`
        : '--',
      unit: 'mmHg',
      status: bpStatus,
      bg: 'bg-sage-50',
      border: 'border-sage-100',
      iconColor: 'text-sage-600',
    },
    {
      id: 'spo2',
      icon: Activity,
      label: 'SpO₂',
      value: readings?.spo2 ?? '--',
      unit: '%',
      status: spo2Status,
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      iconColor: 'text-indigo-500',
    },
    {
      id: 'temperature',
      icon: Thermometer,
      label: 'Temperature',
      value: readings?.temperature ?? '--',
      unit: '°F',
      status: { label: 'Normal', color: 'text-emerald-600' },
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      iconColor: 'text-amber-600',
    },
  ]

  if (!compact) {
    vitals.push(
      {
        id: 'steps',
        icon: Footprints,
        label: 'Steps Today',
        value: readings?.steps?.toLocaleString() ?? '--',
        unit: 'steps',
        status: { label: '', color: '' },
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        id: 'sleep',
        icon: Moon,
        label: 'Last Sleep',
        value: readings?.sleep ?? '--',
        unit: 'hrs',
        status: { label: '', color: '' },
        bg: 'bg-violet-50',
        border: 'border-violet-100',
        iconColor: 'text-violet-500',
      }
    )
  }

  return (
    <div className={className}>
      {/* Status header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-4 h-4 text-emerald-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-400" />
          )}
          <SensorStatusBadge connected={connected} />
        </div>
        {lastUpdated && connected && (
          <span className="text-sage-400 text-xs">Updated {lastUpdated}</span>
        )}
      </div>

      {/* Vitals grid */}
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-2'} gap-3`}>
        <AnimatePresence mode="sync">
          {vitals.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${v.bg} border-2 ${v.border} rounded-2xl p-4 relative overflow-hidden`}
            >
              {/* Animated reading flash on update */}
              <AnimatePresence>
                {connected && (
                  <motion.div
                    key={`${v.id}-${v.value}`}
                    initial={{ opacity: 0.35 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="absolute inset-0 bg-white rounded-2xl pointer-events-none"
                  />
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 mb-2">
                {v.pulse ? (
                  <motion.div
                    animate={connected ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  >
                    <v.icon className={`w-4 h-4 ${v.iconColor}`} />
                  </motion.div>
                ) : (
                  <v.icon className={`w-4 h-4 ${v.iconColor}`} />
                )}
                <span className="text-sage-500 text-xs font-bold uppercase tracking-wide">
                  {v.label}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <motion.span
                  key={`${v.id}-val-${v.value}`}
                  initial={{ y: -4, opacity: 0.6 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="text-2xl font-bold text-sage-900 leading-none"
                >
                  {connected ? v.value : '--'}
                </motion.span>
                <span className="text-sage-500 text-xs">{v.unit}</span>
              </div>

              {v.status.label && (
                <div className={`text-xs font-semibold mt-1.5 ${v.status.color}`}>
                  {v.status.label}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
