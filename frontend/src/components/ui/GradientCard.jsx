/**
 * GradientCard - Gradient card component
 * Mobile-First Design for Elderly Users
 * 
 * - Auto-expanding height (no fixed heights)
 * - Text wrapping enabled
 * - Responsive padding and border radius
 * - Touch-friendly with active states
 */
export default function GradientCard({ children, gradient = 'sage', className = '', onClick }) {
  // Name kept for old imports; the surface is flat (no gradient, shadow or glow).
  const tones = {
    sage: 'bg-primary text-white',
    cream: 'bg-paper-2 text-sage-900',
    rose: 'bg-rose-600 text-white',
  }
  return (
    <div
      onClick={onClick}
      className={`w-full break-words rounded-[20px] p-5 sm:p-6 ${tones[gradient] || tones.sage} ${onClick ? 'cursor-pointer transition-transform duration-200 hover:-translate-y-0.5' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
