import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { logo, familyPhoto, couplePhoto, handsPhoto, walkIllustration, chatSticker } from '../assets/images'

const TABS = {
  elder: {
    label: 'For elders',
    title: 'Big, simple screens made for daily use',
    photo: couplePhoto,
    size: [1024, 1210],
    alt: 'An older couple taking their medicines with a glass of water',
    points: [
      'Today\'s medicines in one list, with a single large button to mark each one taken.',
      'Symptom check by voice, in Hindi or English. Speak, and AgeWell asks follow-up questions and reads the answer back.',
      'An emergency button that is always within reach.',
      'Heart rate and SpO2 readings from a connected device, shown in plain language.',
    ],
  },
  caregiver: {
    label: 'For caregivers',
    title: 'Know when something needs attention',
    photo: handsPhoto,
    size: [736, 1104],
    alt: 'A younger hand resting on an older hand that holds a walking stick',
    points: [
      'Alerts when a dose is missed or a reading looks unusual.',
      'Medication adherence and health trends over the past week.',
      'Prescription upload: scan a prescription and review the medicines before they are saved.',
      'A 4-digit PIN keeps caregiver mode private, even on a shared phone.',
    ],
  },
}

const STEPS = [
  'Sign in with Google and choose elder, caregiver, or both.',
  'The elder adds medicines by hand or by uploading a prescription.',
  'The elder shares a link code so family can follow along.',
  'Reminders, readings and alerts show up where each person needs them.',
]

const FAQ = [
  ['Who is AgeWell for?', 'Elderly people in India who take regular medicines, and the family members who look after them from home or from far away.'],
  ['Can I use one account as both elder and caregiver?', 'Yes. Sign in once with your email, choose "I\'m both", and set a 4-digit PIN. Elder mode opens first. Caregiver mode asks for the PIN. You can also keep two separate accounts.'],
  ['Does it work in Hindi?', 'Yes. The symptom check accepts voice in Hindi and English, and replies can be read aloud in either.'],
  ['Does AgeWell replace a doctor?', 'No. The symptom check gives general guidance only. For anything serious, call your doctor or emergency services.'],
  ['How do I link a family member?', 'The elder generates a short link code in their settings. The caregiver enters it during setup, or from the link page.'],
  ['What does it cost?', 'This is an early version and there is no pricing yet.'],
]

const spring = { type: 'spring', stiffness: 380, damping: 32 }

export default function Home() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [tab, setTab] = useState('elder')
  const current = TABS[tab]

  const start = (role) => {
    try { sessionStorage.setItem('intendedRole', role) } catch { /* private mode */ }
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-sage-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-full focus:border focus:border-sage-300">Skip to content</a>

      <header className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="AgeWell home">
          <img src={logo} alt="" width="48" height="48" className="sticker w-10 h-10 sm:w-12 sm:h-12 object-contain" />
          <span className="font-serif text-xl sm:text-2xl leading-none">AgeWell</span>
        </Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:inline-flex items-center min-h-[44px] px-4 rounded-full text-sage-700 hover:bg-sage-100 font-normal">Sign in</Link>
          <Link to="/auth" className="btn-primary btn-sm whitespace-nowrap">Get started</Link>
        </nav>
      </header>

      <main id="main">
        {/* Hero: copy left, one real photo right */}
        <section className="max-w-6xl mx-auto px-5 pt-6 pb-16 sm:pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <h1 className="font-serif text-4xl sm:text-6xl leading-[1.08]">
              Medicines taken, health watched, <span className="text-clay">family in the loop.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-sage-600 max-w-xl font-normal">
              AgeWell gives elderly people simple medication reminders and voice symptom checks in Hindi or English, and lets family follow along without constant phone calls.
            </p>
            <div className="btn-row mt-9 max-w-lg">
              <button type="button" onClick={() => start('elderly')} className="btn-primary">Get started</button>
              <button type="button" onClick={() => start('caregiver')} className="btn-secondary">I am a caregiver</button>
            </div>
          </div>
          <div className="relative">
            <div aria-hidden="true" className="absolute -inset-3 sm:-inset-4 rounded-[2.25rem] bg-clay-light rotate-2" />
            <img
              src={familyPhoto}
              alt="A smiling family of four at home: two grandparents with their grown son and daughter"
              width="1536" height="1024" fetchpriority="high"
              className="relative w-full aspect-[4/3] object-cover rounded-[2rem] shadow-elevated"
            />
          </div>
        </section>

        {/* Two views: tabs with a shared sliding pill */}
        <section aria-labelledby="two-modes" className="bg-cream-100 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-5">
            <h2 id="two-modes" className="font-serif text-3xl sm:text-5xl text-center">Two views, one app</h2>
            <div role="tablist" aria-label="Interface" className="mt-8 mx-auto flex w-full max-w-md gap-1 rounded-full bg-white p-1 border border-sage-200 shadow-soft">
              {Object.entries(TABS).map(([key, t]) => (
                <button
                  key={key}
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={tab === key}
                  aria-controls="tabpanel"
                  onClick={() => setTab(key)}
                  className={`relative flex-1 min-h-[48px] rounded-full px-3 text-base whitespace-nowrap sm:text-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${tab === key ? 'text-white' : 'text-sage-700 hover:text-sage-900'}`}
                >
                  {tab === key && <motion.span layoutId="home-tab" transition={reduce ? { duration: 0 } : spring} className="absolute inset-0 rounded-full bg-sage-900" />}
                  <span className="relative">{t.label}</span>
                </button>
              ))}
            </div>

            <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-10 grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-8 md:gap-12 items-center max-w-4xl mx-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={tab + 'img'}
                  src={current.photo}
                  alt={current.alt}
                  width={current.size[0]} height={current.size[1]} loading="lazy"
                  initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-sm md:max-w-none mx-auto aspect-[4/5] object-cover rounded-[2rem] shadow-elevated"
                />
              </AnimatePresence>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-serif text-2xl sm:text-4xl">{current.title}</h3>
                  <ul className="mt-6 space-y-4 text-sage-700 text-lg font-normal">
                    {current.points.map((p) => (
                      <li key={p} className="flex gap-3">
                        <Check className="w-6 h-6 mt-0.5 shrink-0 text-clay" aria-hidden="true" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* How it works: illustration beside numbered steps */}
        <section aria-labelledby="how" className="max-w-5xl mx-auto px-5 py-16 sm:py-24 grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-10 md:gap-16 items-center">
          <img
            src={walkIllustration}
            alt="An adult walking slowly beside an elderly woman with a cane along a path toward the sunrise"
            width="640" height="959" loading="lazy"
            className="w-full max-w-xs md:max-w-none mx-auto aspect-[4/5] object-cover object-top rounded-[2rem] shadow-soft"
          />
          <div>
            <h2 id="how" className="font-serif text-3xl sm:text-5xl">How it works</h2>
            <ol className="mt-8 divide-y divide-sage-200 border-y border-sage-200">
              {STEPS.map((text, i) => (
                <li key={text} className="flex items-center gap-5 py-5">
                  <span aria-hidden="true" className="font-serif text-4xl text-clay w-10 shrink-0 text-center leading-none">{i + 1}</span>
                  <span className="text-lg text-sage-700 font-normal">{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="faq" className="max-w-3xl mx-auto px-5 pb-20 sm:pb-28">
          <div className="flex items-center justify-center gap-4">
            <img src={chatSticker} alt="" width="472" height="340" loading="lazy" className="sticker h-20 w-auto" />
            <h2 id="faq" className="font-serif text-3xl sm:text-5xl">Questions</h2>
          </div>
          <div className="mt-8 border-t border-sage-200">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group border-b border-sage-200">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 min-h-[64px] py-3 text-lg font-bold rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                  <span>{q}</span>
                  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-600 group-open:rotate-45 transition-transform motion-reduce:transition-none">+</span>
                </summary>
                <p className="pb-5 text-sage-600 font-normal text-lg">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-sage-200">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row sm:items-center gap-3 justify-between text-sm text-sage-600 font-normal">
          <span className="flex items-center gap-2">
            <img src={logo} alt="" width="28" height="28" className="sticker w-7 h-7 object-contain" />
            AgeWell. Not a substitute for medical advice.
          </span>
          <Link to="/auth" className="inline-flex items-center min-h-[44px] hover:text-sage-900 underline-offset-4 hover:underline">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}
