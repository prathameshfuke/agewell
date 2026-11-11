import { Phone } from 'lucide-react'
import { lone } from '../family/FamilyPage'

/**
 * EmergencyContactCard - real contacts only.
 * contacts: [{ id, name, role, phone }]. onAddContact is shown in the empty state.
 */
export default function EmergencyContactCard({ contacts = [], onCall, onEmergency, onAddContact }) {
  return (
    <section aria-labelledby="contacts-title">
      <h2 id="contacts-title" className="font-serif text-2xl">Contacts</h2>

      {contacts.length === 0 ? (
        <>
          <p className="mt-2 text-ink-2">No contacts saved. Add an emergency contact so you can reach someone quickly.</p>
          {onAddContact && <button type="button" onClick={onAddContact} className={`btn-secondary btn-sm mt-4 ${lone}`}>Add a contact</button>}
        </>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {contacts.map((c, i) => (
            <li key={c.id || i} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate">{c.name}</div>
                <div className="truncate text-sm text-ink-2">{c.role}{c.phone ? ` · ${c.phone}` : ''}</div>
              </div>
              <button type="button" onClick={() => onCall?.(c)} className="btn-icon-ghost" aria-label={`Call ${c.name}`}>
                <Phone className="h-5 w-5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {onEmergency && (
        <button type="button" onClick={onEmergency} className={`mt-4 min-h-[48px] font-bold text-rose-700 underline underline-offset-4 ${lone}`}>
          Open emergency support
        </button>
      )}
    </section>
  )
}
