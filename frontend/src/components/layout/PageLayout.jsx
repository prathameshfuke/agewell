/**
 * Page layout primitives for AgeWell+.
 * Fluid: full width on phones (16px gutters), 24px at 640, 40px at 1024; content capped at 1120px.
 * The app shell (components/shell) supplies the bottom bar or sidebar; these only reserve clearance.
 */
const WIDTH = 'mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-10'

export default function PageLayout({ children, header, nav, className = '' }) {
  return (
    <div className={`flex min-h-dvh flex-col bg-paper font-sans text-sage-900 ${className}`}>
      {header}
      {children}
      {nav}
    </div>
  )
}

/** Sticky page header; children sit inside the same width as PageMain. */
export function PageHeader({ children, className = '' }) {
  return (
    <header className="sticky top-0 z-20 bg-paper/95 pt-[env(safe-area-inset-top)]">
      <div className={`${WIDTH} py-3 sm:py-4 ${className}`}>{children}</div>
    </header>
  )
}

/** Main content area with room for the bottom tab bar on <1024px. */
export function PageMain({ children, className = '' }) {
  return (
    <main className={`${WIDTH} flex-1 space-y-5 pb-28 pt-2 sm:space-y-6 lg:pb-12 ${className}`}>
      {children}
    </main>
  )
}

/** Plain wrapper (no per-section entrance animation; the route transition handles it). */
export function PageSection({ children, className = '' }) {
  return <div className={className}>{children}</div>
}

/** For auth/onboarding pages: centered, comfortable on phones, still a narrow form on desktop. */
export function CenteredLayout({ children, className = '' }) {
  return (
    <div className={`flex min-h-dvh flex-col bg-paper p-4 sm:p-6 ${className}`}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
