import { useNavigate } from 'react-router-dom'
import { shield } from '../assets/images/gen'
import FamilyPage, { lone } from '../components/family/FamilyPage'

// What caregivers linked to an elder can see today. This is a description, not a setting.
const SEES = [
    ['Vitals', 'Heart rate, oxygen and temperature from the wearable.'],
    ['Medications', "Today's doses, what was taken and what was missed."],
    ['Activity', 'Check-ins, medication events and alerts.'],
    ['Symptom reports', 'Reports from the symptom checker.'],
    ['Contacts', 'The emergency contact saved on the elder profile.'],
]

export default function FamilyPermissions() {
    const navigate = useNavigate()

    return (
        <FamilyPage title="What caregivers can see" sub="Everyone on the care team sees the same information" back art={shield}>
            <section>
                <ul className="divide-y divide-line border-y border-line">
                    {SEES.map(([title, desc]) => (
                        <li key={title} className="py-4">
                            <div className="text-lg">{title}</div>
                            <div className="text-ink-2">{desc}</div>
                        </li>
                    ))}
                </ul>
                <p className="mt-6 max-w-xl text-ink-2">
                    Location is not collected. Per-person sharing controls are not available yet. To remove someone, ask the elder to unlink them.
                </p>
                <button type="button" onClick={() => navigate('/family/members')} className={`btn-secondary btn-sm mt-6 ${lone}`}>View care team</button>
            </section>
        </FamilyPage>
    )
}
