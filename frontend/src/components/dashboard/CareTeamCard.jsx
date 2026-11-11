import { useNavigate } from 'react-router-dom'
import CareTeamAvatars from './CareTeamAvatars'
import { textBtn } from '../family/FamilyPage'

/**
 * CareTeamCard - real care team summary.
 * members: [{ id, name, role?, avatar? }] for everyone who has access.
 */
export default function CareTeamCard({ members = [], loading = false, error = '' }) {
  const navigate = useNavigate()
  const names = members.map((m) => m.name.split(' ')[0])
  const summary =
    names.length === 0 ? '' : names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`

  return (
    <section aria-labelledby="care-team-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="care-team-title" className="font-serif text-2xl">Care team</h2>
        <button type="button" onClick={() => navigate('/family/members')} className={textBtn}>Manage</button>
      </div>
      {loading ? (
        <p className="mt-2 text-ink-2">Loading care team...</p>
      ) : error ? (
        <p className="mt-2 text-rose-700">{error}</p>
      ) : members.length === 0 ? (
        <p className="mt-2 text-ink-2">
          No one else has access yet.{' '}
          <button type="button" onClick={() => navigate('/link')} className="font-bold text-primary underline underline-offset-4">Share a pairing code</button>
        </p>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <CareTeamAvatars members={members} maxDisplay={4} />
          <p className="min-w-0 break-words text-ink-2">{summary}</p>
        </div>
      )}
    </section>
  )
}
