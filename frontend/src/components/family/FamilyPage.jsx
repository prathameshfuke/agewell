import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { together } from '../../assets/images/gen'

// together and family are 480x400, the rest 400x400.
export const Art = ({ src, wide = false, className = '' }) => (
  <img src={src} alt="" width={wide ? 480 : 400} height="400" loading="lazy" className={`h-auto w-full ${className}`} />
)

// Phones: full width. From 640px: content-sized.
export const lone = 'w-full sm:w-auto'

// Inline text action (View all, Manage). 44px tap height.
export const textBtn = 'inline-flex min-h-[44px] items-center font-bold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

// Left rule + text: errors, confirmations, warnings. Flat, never a filled box.
const TONES = { danger: 'border-status-danger text-rose-700', ok: 'border-status-success text-emerald-800', warn: 'border-saffron text-ink' }
export function Notice({ tone = 'danger', children, onRetry }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex flex-wrap items-center justify-between gap-3 border-l-4 py-1 pl-4 ${TONES[tone]}`}>
      <p className="min-w-0 break-words">{children}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn-secondary btn-sm">Try again</button>}
    </div>
  )
}

export function NotLinked({ text = 'Enter a pairing code to start caring for someone.' }) {
  const navigate = useNavigate()
  return (
    <section className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
      <Art src={together} wide className="w-40 shrink-0 sm:w-56" />
      <div>
        <h2 className="font-serif text-3xl">You are not linked to anyone yet</h2>
        <p className="mt-2 max-w-md text-ink-2">{text}</p>
        <button type="button" onClick={() => navigate('/link')} className={`btn-primary btn-sm mt-5 ${lone}`}>Enter a pairing code</button>
      </div>
    </section>
  )
}

/**
 * Caregiver page frame. Phone: one column. Desktop (lg): 12-col grid, main 8 + optional aside 4.
 * Sections inside main/aside are separated by hairlines, not boxes.
 * back: true (history) or a path. art: illustration shown in the aside on desktop.
 */
const stack = 'min-w-0 divide-y divide-line [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0'
export default function FamilyPage({ title, sub, back, action, aside, art, wide, children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-paper pb-28 font-sans text-ink lg:pb-16">
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-10">
        <header className="flex items-center gap-3 py-5 lg:pb-8 lg:pt-10">
          {back && (
            <button type="button" onClick={() => navigate(back === true ? -1 : back)} aria-label="Go back" className="btn-icon-ghost -ml-2">
              <ArrowLeft className="h-6 w-6" aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-4xl leading-tight">{title}</h1>
            {sub && <p className="mt-1 break-words text-ink-2">{sub}</p>}
          </div>
          {action}
        </header>
        <div className="grid gap-x-14 gap-y-10 lg:grid-cols-12">
          <main className={`${stack} lg:col-span-8`}>{children}</main>
          {(aside || art) && (
            <aside className={`${stack} lg:col-span-4 lg:border-l lg:border-line lg:pl-10 ${aside ? '' : 'hidden lg:block'}`}>
              {aside}
              {art && <div className="hidden lg:block"><Art src={art} wide={wide} className="mx-auto max-w-[16rem]" /></div>}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
