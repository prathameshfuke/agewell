import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { sleepSticker } from '../assets/images'

// Global bottom navigation lives in BottomNav; this default export is kept for old imports.
export default function ElderNav() {
  return null
}

/** Shared calm page shell for elder screens: title, optional back button, one column. */
export function ElderPage({ title, subtitle, back = true, backTo, children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-cream-50 font-sans text-sage-900 text-xl pb-32 md:pb-12">
      <div className="mx-auto w-full max-w-2xl px-5 pt-6">
        {back && (
          <button
            type="button"
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            className="-ml-3 mb-2 inline-flex min-h-[48px] items-center gap-2 rounded-full pl-3 pr-5 text-lg font-bold text-sage-700 hover:bg-sage-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6 shrink-0" aria-hidden="true" /> Back
          </button>
        )}
        <h1 className="font-serif text-4xl font-bold text-sage-900">{title}</h1>
        {subtitle && <p className="mt-2 text-xl text-sage-600">{subtitle}</p>}
        <main className="mt-8 space-y-6">{children}</main>
      </div>
    </div>
  )
}

/** Plain loading / error / empty blocks used across elder screens. */
export function Loading({ label = 'Loading...' }) {
  return (
    <div className="py-12 text-center" role="status">
      <div className="loading-spinner mx-auto" />
      <p className="mt-4 text-xl text-sage-600">{label}</p>
    </div>
  )
}

export function ErrorNote({ children, onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5" role="alert">
      <p className="text-xl text-rose-800">{children}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyNote({ title, children, action, sticker = sleepSticker }) {
  return (
    <div className="card text-center">
      <img src={sticker} alt="" width="337" height="340" className="sticker mx-auto mb-3 h-24 w-auto" />
      <h2 className="font-serif text-2xl font-bold">{title}</h2>
      {children && <p className="mt-2 text-xl text-sage-600">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
