/**
 * PageLayout - Unified page layout for AgeWell+
 * 
 * Provides consistent:
 * - Background gradient
 * - Header styling
 * - Main content area with proper spacing
 * - Bottom navigation padding
 */
export default function PageLayout({
  children,
  header,
  nav,
  background = 'default',
  className = '',
}) {
  const backgrounds = {
    default: 'bg-cream-50',
    gradient: 'bg-cream-50',
  }

  return (
    <div className={`min-h-screen font-sans ${backgrounds[background]} ${className}`}>
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {header}
        {children}
        {nav}
      </div>
    </div>
  )
}

/**
 * PageHeader - Consistent page header styling
 * Mobile-first with safe area insets
 */
export function PageHeader({ children, className = '' }) {
  return (
    <header className={`px-4 py-3 sm:py-4 md:px-6 md:py-6 bg-cream-50 sticky top-0 z-20 ${className}`}>
      {children}
    </header>
  )
}

/**
 * PageMain - Main content area with consistent padding
 * Mobile-first with bottom navigation clearance
 */
export function PageMain({ children, className = '' }) {
  return (
    <main className={`flex-1 px-3 sm:px-4 py-3 sm:py-4 md:px-6 pb-24 md:pb-0 space-y-4 sm:space-y-5 md:space-y-6 ${className}`}>
      {children}
    </main>
  )
}

/**
 * PageSection - plain wrapper (no per-section entrance animation; the route transition handles it)
 */
export function PageSection({ children, className = '' }) {
  return <div className={className}>{children}</div>
}

/**
 * CenteredLayout - For auth/onboarding pages
 * Mobile-first with proper spacing
 */
export function CenteredLayout({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-cream-50 flex flex-col p-3 sm:p-4 md:p-6 ${className}`}>
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {children}
      </div>
    </div>
  )
}
