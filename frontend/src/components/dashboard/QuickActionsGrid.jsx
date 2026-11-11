import { Heart, History, AlertTriangle, Stethoscope } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * QuickActionsGrid - four plain shortcuts (used on the elder home).
 */
const ACTIONS = [
  { icon: Stethoscope, label: 'Symptoms', path: '/diagnosis/input' },
  { icon: Heart, label: 'Health', path: '/elder/health' },
  { icon: AlertTriangle, label: 'Emergency', path: '/elder/emergency', danger: true },
  { icon: History, label: 'History', path: '/elder/meds/history' },
]

export default function QuickActionsGrid({ className = '' }) {
  const navigate = useNavigate()

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {ACTIONS.map(({ icon: Icon, label, path, danger }) => (
        <button
          key={label}
          type="button"
          onClick={() => navigate(path)}
          className={`min-h-[90px] p-4 rounded-2xl border bg-white flex flex-col items-center justify-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            danger ? 'border-rose-200 text-rose-700 hover:bg-rose-50' : 'border-sage-200 text-sage-800 hover:bg-sage-50'
          }`}
        >
          <Icon className="w-6 h-6" aria-hidden="true" />
          <span className="text-sm font-semibold">{label}</span>
        </button>
      ))}
    </div>
  )
}
