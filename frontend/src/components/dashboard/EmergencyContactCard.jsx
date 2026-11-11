import { Phone, MessageCircle, AlertTriangle } from 'lucide-react'

const iconBtn =
  'w-11 h-11 rounded-full flex items-center justify-center border border-sage-300 text-sage-700 hover:bg-sage-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'

/**
 * EmergencyContactCard - real contacts only.
 * contacts: [{ id, name, role, phone }]. onAddContact is shown in the empty state.
 */
export default function EmergencyContactCard({ contacts = [], onCall, onMessage, onEmergency, onAddContact, className = '' }) {
  return (
    <section className={`rounded-2xl border border-sage-200 bg-white p-5 ${className}`} aria-labelledby="contacts-title">
      <h2 id="contacts-title" className="font-serif text-lg text-sage-900">Contacts</h2>

      {contacts.length === 0 ? (
        <div className="py-4">
          <p className="text-sage-800 font-semibold">No contacts saved</p>
          <p className="text-sm text-sage-500 mt-1">Add an emergency contact so you can reach someone quickly.</p>
          {onAddContact && (
            <button type="button" onClick={onAddContact} className="btn-secondary mt-3 !min-h-[44px] !text-sm !px-5 !py-2">
              Add a contact
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-sage-100">
          {contacts.map((c, i) => (
            <li key={c.id || i} className="flex items-center gap-3 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-sage-900 truncate">{c.name}</div>
                <div className="text-sm text-sage-500 truncate">{c.role}{c.phone ? ` · ${c.phone}` : ''}</div>
              </div>
              <button type="button" onClick={() => onCall?.(c)} className={iconBtn} aria-label={`Call ${c.name}`}>
                <Phone className="w-4 h-4" />
              </button>
              {onMessage && (
                <button type="button" onClick={() => onMessage(c)} className={iconBtn} aria-label={`Message ${c.name}`}>
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {onEmergency && (
        <button
          type="button"
          onClick={onEmergency}
          className="mt-3 w-full min-h-[44px] rounded-full border border-rose-200 text-rose-700 font-semibold flex items-center justify-center gap-2 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600"
        >
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          Emergency support
        </button>
      )}
    </section>
  )
}
