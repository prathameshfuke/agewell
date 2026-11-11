import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

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
        <div className="min-h-screen bg-cream-50 font-sans pb-24 md:pb-8">
            <header className="px-4 md:px-6 py-4 flex items-center gap-3 border-b border-sage-200 sticky top-0 bg-cream-50 z-20">
                <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className={`w-11 h-11 rounded-full flex items-center justify-center text-sage-700 hover:bg-sage-100 ${focusRing}`}>
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="font-serif text-2xl text-sage-900">What caregivers can see</h1>
                    <p className="text-sm text-sage-500">Everyone on the care team sees the same information</p>
                </div>
            </header>

            <main className="px-4 md:px-6 py-5 space-y-4 max-w-2xl mx-auto">
                <ul className="rounded-2xl border border-sage-200 bg-white divide-y divide-sage-100">
                    {SEES.map(([title, desc]) => (
                        <li key={title} className="p-4">
                            <div className="text-sage-900">{title}</div>
                            <div className="text-sm text-sage-500">{desc}</div>
                        </li>
                    ))}
                </ul>
                <p className="text-sm text-sage-600">
                    Location is not collected. Per-person sharing controls are not available yet. To remove someone, ask the elder to unlink them.
                </p>
                <button type="button" onClick={() => navigate('/family/members')} className="btn-secondary btn-sm">View care team</button>
            </main>
        </div>
    )
}
