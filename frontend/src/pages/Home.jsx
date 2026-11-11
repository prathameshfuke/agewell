import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '/logo.png'

const TABS = {
  elder: {
    label: 'For the elder',
    title: 'Big, simple screens made for daily use',
    points: [
      'Today\'s medicines in one list, with a single large button to mark each one taken.',
      'Symptom check by voice, in Hindi or English. Speak, and AgeWell asks follow-up questions and reads the answer back.',
      'An emergency button that is always within reach.',
      'Heart rate and SpO2 readings from a connected device, shown in plain language.',
    ],
  },
  caregiver: {
    label: 'For the caregiver',
    title: 'Know when something needs attention',
    points: [
      'Alerts when a dose is missed or a reading looks unusual.',
      'Medication adherence and health trends over the past week.',
      'Prescription upload: scan a prescription and review the medicines before they are saved.',
      'A 4-digit PIN keeps caregiver mode private, even on a shared phone.',
    ],
  },
}

const FAQ = [
  ['Who is AgeWell for?', 'Elderly people in India who take regular medicines, and the family members who look after them from home or from far away.'],
  ['Can I use one account as both elder and caregiver?', 'Yes. Sign in once with your email, choose "I\'m both", and set a 4-digit PIN. Elder mode opens first. Caregiver mode asks for the PIN. You can also keep two separate accounts.'],
  ['Does it work in Hindi?', 'Yes. The symptom check accepts voice in Hindi and English, and replies can be read aloud in either.'],
  ['Does AgeWell replace a doctor?', 'No. The symptom check gives general guidance only. For anything serious, call your doctor or emergency services.'],
  ['How do I link a family member?', 'The elder generates a short link code in their settings. The caregiver enters it during setup, or from the link page.'],
  ['What does it cost?', 'This is an early version and there is no pricing yet.'],
]

export default function Home() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('elder')
  const current = TABS[tab]

  const start = (role) => {
    try { sessionStorage.setItem('intendedRole', role) } catch { /* private mode */ }
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-sage-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-full focus:border focus:border-sage-300">Skip to content</a>

      <header className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 min-h-0" aria-label="AgeWell home">
          <img src={logo} alt="" className="w-9 h-9 object-contain" />
          <span className="font-serif text-2xl">AgeWell</span>
        </Link>
        <nav aria-label="Account" className="flex items-center gap-4">
          <Link to="/auth" className="text-sage-700 hover:text-sage-900 underline-offset-4 hover:underline font-normal">Sign in</Link>
          <Link to="/auth" className="rounded-full bg-primary text-white hover:bg-primary-dark px-5 py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Get started</Link>
        </nav>
      </header>

      <main id="main">
        <section className="max-w-5xl mx-auto px-5 pt-6 pb-16">
          <div className="bg-white border border-sage-200 rounded-[2rem] px-6 py-14 sm:py-20 text-center">
            <h1 className="font-serif text-4xl sm:text-6xl leading-tight max-w-3xl mx-auto">
              Medicines taken, health watched, family in the loop.
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-sage-600 max-w-2xl mx-auto font-normal">
              AgeWell gives elderly people simple medication reminders and voice symptom checks in Hindi or English, and lets family follow along without constant phone calls.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <button type="button" onClick={() => start('elderly')} className="btn-primary">Get started</button>
              <button type="button" onClick={() => start('caregiver')} className="text-primary hover:text-primary-dark underline underline-offset-4 min-h-[44px] font-normal">
                I am looking after someone
              </button>
            </div>
          </div>
        </section>

        <section aria-labelledby="two-modes" className="max-w-5xl mx-auto px-5 pb-16">
          <h2 id="two-modes" className="font-serif text-3xl sm:text-4xl text-center">Two views, one app</h2>
          <div role="tablist" aria-label="Interface" className="mt-8 flex justify-center gap-2">
            {Object.entries(TABS).map(([key, t]) => (
              <button
                key={key}
                role="tab"
                id={`tab-${key}`}
                aria-selected={tab === key}
                aria-controls="tabpanel"
                onClick={() => setTab(key)}
                className={`rounded-full px-5 py-2 border min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${tab === key ? 'bg-sage-900 text-white border-sage-900' : 'bg-white text-sage-700 border-sage-300 hover:border-sage-900'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-6 bg-white border border-sage-200 rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto">
            <h3 className="font-serif text-2xl sm:text-3xl">{current.title}</h3>
            <ul className="mt-5 space-y-3 text-sage-700 text-lg font-normal list-disc pl-5">
              {current.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        </section>

        <section aria-labelledby="how" className="max-w-3xl mx-auto px-5 pb-16">
          <h2 id="how" className="font-serif text-3xl sm:text-4xl text-center">How it works</h2>
          <ol className="mt-8 space-y-4 text-lg font-normal text-sage-700 list-decimal pl-6">
            <li>Sign in with Google and choose elder, caregiver, or both.</li>
            <li>The elder adds medicines by hand or by uploading a prescription.</li>
            <li>The elder shares a link code so family can follow along.</li>
            <li>Reminders, readings and alerts show up where each person needs them.</li>
          </ol>
        </section>

        <section aria-labelledby="faq" className="max-w-3xl mx-auto px-5 pb-20">
          <h2 id="faq" className="font-serif text-3xl sm:text-4xl text-center">Questions</h2>
          <div className="mt-8 border-t border-sage-200">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group border-b border-sage-200 py-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-lg font-bold rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                  {q}
                  <span aria-hidden="true" className="text-sage-500 group-open:rotate-45 transition-transform motion-reduce:transition-none">+</span>
                </summary>
                <p className="mt-3 text-sage-600 font-normal text-lg">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-sage-200">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row gap-2 justify-between text-sm text-sage-600 font-normal">
          <span>AgeWell. Not a substitute for medical advice.</span>
          <Link to="/auth" className="hover:text-sage-900 underline-offset-4 hover:underline">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}
