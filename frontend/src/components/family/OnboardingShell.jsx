import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { Art, Notice } from './FamilyPage'

export const Field = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block font-bold">{label}</label>
    <input id={id} className="input" {...props} />
  </div>
)

export const Consent = ({ checked, onChange, children }) => (
  <label className="flex min-h-[48px] cursor-pointer items-start gap-3 border-t border-line pt-4">
    <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 h-6 w-6 shrink-0 accent-primary" />
    <span>{children}</span>
  </label>
)

/**
 * Onboarding frame. Phone: one column with a small illustration. lg: illustration pane left, form right.
 * `last` swaps the Continue button for the completing one.
 */
export default function OnboardingShell({ step, total = 3, onBack, art, wide, title, lead, error, onNext, last, loading, children }) {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink lg:grid lg:grid-cols-2">
      <aside className="hidden items-center justify-center bg-paper-2 p-12 lg:flex">
        <Art src={art} wide={wide} className="max-w-md" />
      </aside>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-4 sm:px-0 lg:max-w-lg lg:px-16">
        <header>
          <div className="flex items-center justify-between">
            <button type="button" onClick={onBack} className="inline-flex min-h-[48px] items-center gap-2 pr-3 font-bold text-ink-2 hover:text-ink">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back
            </button>
            <span className="text-ink-2">Step {step} of {total}</span>
          </div>
          <div className="mt-1 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-primary' : 'bg-line'}`} />
            ))}
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-8">
          <Art src={art} wide={wide} className="mb-6 w-28 lg:hidden" />
          <h1 className="font-serif text-4xl">{title}</h1>
          {lead && <p className="mt-2 text-lg text-ink-2">{lead}</p>}
          <div className="mt-8 space-y-5">{children}</div>
          {error && <div className="mt-6"><Notice>{error}</Notice></div>}
          <button type="button" onClick={onNext} disabled={loading} className="btn-primary mt-8 w-full">
            {last
              ? <>{loading ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Check aria-hidden="true" />} Complete setup</>
              : <>Continue <ArrowRight aria-hidden="true" /></>}
          </button>
        </main>
      </div>
    </div>
  )
}
