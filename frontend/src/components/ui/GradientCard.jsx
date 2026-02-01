/**
 * GradientCard - Gradient card component
 * Mobile-First Design for Elderly Users
 * 
 * - Auto-expanding height (no fixed heights)
 * - Text wrapping enabled
 * - Responsive padding and border radius
 * - Touch-friendly with active states
 */
export default function GradientCard({ 
  children, 
  gradient = 'sage',
  className = '',
  onClick 
}) {
  const gradients = {
    sage: 'bg-gradient-to-br from-sage-500 to-sage-600',
    'sage-light': 'bg-gradient-to-br from-sage-400 to-sage-500',
    cream: 'bg-gradient-to-br from-cream-200 to-cream-300',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    green: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    pink: 'bg-gradient-to-br from-pink-500 to-pink-600',
    peach: 'bg-gradient-to-br from-orange-400 to-pink-400',
    wellness: 'bg-gradient-to-br from-pastel-peach to-pastel-pink',
    health: 'bg-gradient-to-br from-pastel-blue to-pastel-lavender',
    success: 'bg-gradient-to-br from-emerald-400 to-teal-400',
    rose: 'bg-gradient-to-br from-rose-400 to-rose-500',
  }

  const shadowColors = {
    sage: 'shadow-sage-200',
    'sage-light': 'shadow-sage-100',
    cream: 'shadow-cream-200',
    blue: 'shadow-blue-200',
    green: 'shadow-emerald-200',
    purple: 'shadow-purple-200',
    pink: 'shadow-pink-200',
    peach: 'shadow-orange-200',
    wellness: 'shadow-glow-peach',
    health: 'shadow-glow-blue',
    success: 'shadow-emerald-200',
    rose: 'shadow-rose-200',
  }

  const gradientClass = gradients[gradient] || gradients.blue
  const shadowClass = shadowColors[gradient] || shadowColors.blue

  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-4xl 
        p-4 sm:p-5 md:p-6 text-white shadow-xl ${shadowClass}
        transition-all duration-300 w-full break-words
        ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}
        ${gradientClass}
        ${className}
      `}
    >
      {/* Decorative background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl -mr-8 sm:-mr-12 md:-mr-16 -mt-8 sm:-mt-12 md:-mt-16"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
