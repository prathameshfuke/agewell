import { useNavigate } from 'react-router-dom'
import CareTeamAvatars from './CareTeamAvatars'

/**
 * CareTeamCard - real care team summary.
 * members: [{ id, name, role?, avatar? }] for everyone who has access.
 */
export default function CareTeamCard({ members = [], loading = false, error = '', className = '' }) {
  const navigate = useNavigate()
  const names = members.map((m) => m.name.split(' ')[0])
  const summary =
    names.length === 0 ? '' : names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`

  return (
    <section className={`rounded-2xl border border-sage-200 bg-white p-5 ${className}`} aria-labelledby="care-team-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="care-team-title" className="font-serif text-lg text-sage-900">Care team</h2>
        <button
          type="button"
          onClick={() => navigate('/family/members')}
          className="min-h-[44px] px-3 text-sm font-semibold text-primary hover:text-primary-dark rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Manage
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-sage-500 mt-2">Loading care team...</p>
      ) : error ? (
        <p className="text-sm text-rose-700 mt-2">{error}</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-sage-600 mt-2">
          No one else has access yet.{' '}
          <button type="button" onClick={() => navigate('/link')} className="font-semibold text-primary underline underline-offset-2">
            Share a pairing code
          </button>
        </p>
      ) : (
        <div className="flex items-center gap-3 mt-3">
          <CareTeamAvatars members={members} maxDisplay={4} />
          <p className="text-sm text-sage-600 min-w-0 break-words">{summary}</p>
        </div>
      )}
    </section>
  )
}
