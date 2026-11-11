import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Art from './shared/Art'

// Global navigation lives in components/shell; this default export is kept for old imports.
export default function ElderNav() {
  return null
}

/**
 * Shared calm page shell for elder screens: back, serif title, optional art, content.
 * Full width on phones, content capped at 1120px. Pages lay out their own grids (see Split).
 */
export function ElderPage({ title, subtitle, back = true, backTo, art, children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-dvh bg-paper pb-28 font-sans text-sage-900 lg:pb-12">
      <div className="mx-auto w-full max-w-[1120px] px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-10">
        {back && (
          <button
            type="button"
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            className="-ml-3 mb-2 inline-flex min-h-12 items-center gap-2 rounded-full pl-3 pr-5 text-lg text-sage-700 hover:bg-paper-2"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6 shrink-0" strokeWidth={1.75} aria-hidden="true" /> Back
          </button>
        )}
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1>{title}</h1>
            {subtitle && <p className="measure mt-2 text-lg text-sage-600">{subtitle}</p>}
          </div>
          {art && <Art name={art} eager className="h-20 shrink-0 sm:h-28 lg:h-36" />}
        </header>
        <main className="mt-8 space-y-8 sm:mt-10">{children}</main>
      </div>
    </div>
  )
}

/** Main column + aside from 1024px; stacks below (aside first only when asideFirst). */
export function Split({ children, aside, asideFirst = false }) {
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className={`min-w-0 space-y-8 ${aside ? 'lg:col-span-8' : 'lg:col-span-12'}`}>{children}</div>
      {aside && <aside className={`min-w-0 space-y-8 lg:col-span-4 ${asideFirst ? 'order-first lg:order-none' : ''}`}>{aside}</aside>}
    </div>
  )
}

/** Plain loading / error / empty blocks used across elder screens. */
export function Loading({ label = 'Loading...' }) {
  return (
    <div className="py-12 text-center" role="status">
      <div className="loading-spinner mx-auto" />
      <p className="mt-4 text-lg text-sage-600">{label}</p>
    </div>
  )
}

export function ErrorNote({ children, onRetry }) {
  return (
    <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-5" role="alert">
      <p className="measure text-lg text-rose-800">{children}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4 w-full sm:w-auto">
          Try again
        </button>
      )}
    </div>
  )
}

/** Unboxed empty state: art, a short title, one line of help, optional single action. */
export function EmptyNote({ title, children, action, art = 'rest' }) {
  return (
    <div className="flex flex-col items-center py-8 text-center sm:py-12">
      <Art name={art} className="mb-4 h-28 sm:h-36" />
      <h2>{title}</h2>
      {children && <p className="measure mt-2 text-lg text-sage-600">{children}</p>}
      {action && <div className="mt-6 flex w-full justify-center sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{action}</div>}
    </div>
  )
}
