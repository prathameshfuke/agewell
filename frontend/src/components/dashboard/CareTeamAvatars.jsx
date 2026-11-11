/**
 * CareTeamAvatars - overlapping initials for the real care team.
 * members: [{ id, name, role?, avatar? }]. Renders nothing when empty.
 */
const SIZES = { default: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?'

export default function CareTeamAvatars({ members = [], size = 'default', maxDisplay = 5, className = '' }) {
  if (!members.length) return null
  const shown = members.slice(0, maxDisplay)
  const extra = members.length - shown.length
  const dim = SIZES[size] || SIZES.default
  const ring = `${dim} rounded-full border-2 border-white flex items-center justify-center font-semibold`

  return (
    <div className={`flex items-center ${className}`} role="list" aria-label="Care team">
      {shown.map((m, i) => (
        <div
          key={m.id || i}
          role="listitem"
          title={m.role ? `${m.name} (${m.role})` : m.name}
          className={`${ring} bg-sage-100 text-sage-700 overflow-hidden ${i > 0 ? '-ml-3' : ''}`}
        >
          {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : initials(m.name)}
        </div>
      ))}
      {extra > 0 && <div className={`${ring} -ml-3 bg-sage-50 text-sage-600`}>+{extra}</div>}
    </div>
  )
}
