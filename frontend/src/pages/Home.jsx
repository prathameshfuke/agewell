import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Menu, X, Plus } from 'lucide-react'
import { logo } from '../assets/images'
import { pills, voice, shield, hero, couple, hands } from '../assets/images/gen'

const NAV = [['How it works', '#how'], ['Two views', '#views'], ['Hindi and English', '#voice'], ['Privacy', '#privacy'], ['Questions', '#faq']]

const VIEWS = [
  {
    label: 'For elders',
    title: 'Big, simple screens made for daily use',
    art: couple,
    alt: 'An older couple sitting together on a sofa',
    points: [
      "Today's medicines in one list, with a single large button to mark each one taken.",
      'Symptom check by voice. Speak, and AgeWell asks follow-up questions and reads the answer back.',
      'An emergency button that is always within reach.',
      'Heart rate and SpO2 readings from a connected device, shown in plain language.',
    ],
  },
  {
    label: 'For caregivers',
    title: 'Know when something needs attention',
    art: hands,
    alt: 'A younger hand resting on an older hand',
    points: [
      'Alerts when a dose is missed or a reading looks unusual.',
      'Medication adherence and health trends over the past week.',
      'Prescription upload: scan a prescription and review the medicines before they are saved.',
      'A 4-digit PIN keeps caregiver mode private, even on a shared phone.',
    ],
  },
]

const STEPS = [
  ['Sign in and choose your role', 'Sign in with Google and choose elder, caregiver, or both. One email can do both.'],
  ['Add medicines, share a code', 'The elder adds medicines by hand or from a prescription, then shares a short link code so family can follow along.'],
  ['Stay in the loop', 'Reminders, readings and alerts show up where each person needs them.'],
]

const PRIVACY = [
  ['Caregiver mode needs a PIN', 'A 4-digit PIN keeps it private, even on a shared phone. After too many wrong tries it locks for 15 minutes.'],
  ['Family joins with a code', 'Caregivers see an elder\'s data only after the elder shares a short link code. Codes expire after 24 hours.'],
  ['No location tracking', 'Caregivers see vitals, medicines, activity, symptom reports and the emergency contact. Location is not collected.'],
]

const FAQ = [
  ['Who is AgeWell for?', 'Elderly people in India who take regular medicines, and the family members who look after them from home or from far away.'],
  ['Can I use one account as both elder and caregiver?', 'Yes. Sign in once with your email, choose "I\'m both", and set a 4-digit PIN. Elder mode opens first. Caregiver mode asks for the PIN. You can also keep two separate accounts.'],
  ['Does it work in Hindi?', 'Yes. The symptom check accepts voice in Hindi and English, and replies can be read aloud in either.'],
  ['Does AgeWell replace a doctor?', 'No. The symptom check gives general guidance only. For anything serious, call your doctor or emergency services.'],
  ['How do I link a family member?', 'The elder generates a short link code in their settings. The caregiver enters it during setup, or from the link page.'],
  ['What does it cost?', 'This is an early version and there is no pricing yet.'],
]

const wrap = 'mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10'
const h2 = 'font-serif text-5xl'
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export default function Home() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [menu, setMenu] = useState(false)

  const start = (role) => {
    try { sessionStorage.setItem('intendedRole', role) } catch { /* private mode */ }
    navigate('/auth')
  }

  // Full-screen menu: lock page scroll, close on Escape.
  useEffect(() => {
    if (!menu) return undefined
    const onKey = (e) => e.key === 'Escape' && setMenu(false)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

  const brand = (
    <Link to="/" className={`inline-flex min-h-[44px] items-center gap-2 ${focus}`} aria-label="AgeWell home">
      <img src={logo} alt="" width="40" height="40" className="sticker h-10 w-10 object-contain" />
      <span className="font-serif text-2xl leading-none">AgeWell</span>
    </Link>
  )

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:border focus:border-line focus:bg-paper focus:px-4 focus:py-2">Skip to content</a>

      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className={`${wrap} flex h-16 items-center justify-between`}>
          {brand}
          <nav aria-label="Sections" className="hidden items-center gap-7 md:flex">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className={`font-normal text-ink-2 hover:text-ink ${focus}`}>{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className={`hidden min-h-[44px] items-center px-3 font-normal text-ink-2 hover:text-ink md:inline-flex ${focus}`}>Sign in</Link>
            <Link to="/auth" className="btn-primary btn-sm whitespace-nowrap">Get started</Link>
            <button type="button" onClick={() => setMenu(true)} aria-label="Open menu" aria-expanded={menu} aria-controls="mobile-menu" className="btn-icon-ghost md:hidden">
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-paper px-4 pb-6">
          <div className="flex h-16 shrink-0 items-center justify-between">
            {brand}
            <button type="button" onClick={() => setMenu(false)} aria-label="Close menu" className="btn-icon-ghost" autoFocus>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Sections" className="mt-4 flex flex-col divide-y divide-line border-y border-line">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenu(false)} className={`flex min-h-[64px] items-center font-serif text-3xl font-medium ${focus}`}>{label}</a>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <button type="button" onClick={() => start('elderly')} className="btn-primary">Get started</button>
            <Link to="/auth" className="btn-secondary">Sign in</Link>
          </div>
        </div>
      )}

      <main id="main">
        {/* Hero: one entrance on load */}
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className={`${wrap} grid items-center gap-10 pb-16 pt-8 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-12 lg:gap-14 lg:py-12`}
        >
          <div className="lg:col-span-6">
            <h1 className="font-serif text-[clamp(2.75rem,7vw,5.25rem)] leading-[1.02] tracking-tight">
              Medicines taken, health watched, <span className="text-primary">family in the loop.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-2 sm:text-xl">
              AgeWell gives elderly people simple medication reminders and voice symptom checks in Hindi or English, and lets family follow along without constant phone calls.
            </p>
            <div className="btn-row mt-9 max-w-lg">
              <button type="button" onClick={() => start('elderly')} className="btn-primary">Get started</button>
              <button type="button" onClick={() => start('caregiver')} className="btn-secondary">I am a caregiver</button>
            </div>
          </div>
          <div className="lg:col-span-6">
            <img
              src={hero}
              alt="A smiling family of three generations at home: grandparents, parents and a child"
              width="640" height="480" fetchpriority="high"
              className="h-auto w-full"
            />
          </div>
        </motion.section>

        {/* How it works */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-16 border-t border-line">
          <div className={`${wrap} grid gap-10 py-16 lg:grid-cols-12 lg:gap-14 lg:py-24`}>
            <div className="lg:col-span-5">
              <h2 id="how-title" className={h2}>How it works</h2>
              <p className="mt-4 max-w-md text-lg text-ink-2">Three steps from sign-in to a calmer routine.</p>
              <img src={pills} alt="" width="400" height="400" loading="lazy" className="mt-8 hidden h-auto w-56 lg:block" />
            </div>
            <ol className="divide-y divide-line border-y border-line lg:col-span-7">
              {STEPS.map(([title, text], i) => (
                <li key={title} className="flex gap-5 py-6 sm:gap-8 sm:py-8">
                  <span aria-hidden="true" className="w-10 shrink-0 font-serif text-5xl leading-none text-primary">{i + 1}</span>
                  <div>
                    <h3 className="font-serif text-3xl">{title}</h3>
                    <p className="mt-2 text-lg text-ink-2">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Two views, side by side on desktop, stacked on phones */}
        <section id="views" aria-labelledby="views-title" className="scroll-mt-16 bg-paper-2">
          <div className={`${wrap} py-16 lg:py-20`}>
            <h2 id="views-title" className={h2}>Two views, one app</h2>
            <div className="mt-10 grid gap-14 md:grid-cols-2 md:gap-10 lg:gap-16">
              {VIEWS.map((v) => (
                <article key={v.label}>
                  <img
                    src={v.art} alt={v.alt} width="400" height="500" loading="lazy"
                    className="mx-auto h-72 w-auto sm:h-80"
                  />
                  <p className="mt-6 font-bold text-primary">{v.label}</p>
                  <h3 className="mt-1 font-serif text-3xl">{v.title}</h3>
                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {v.points.map((p) => <li key={p} className="py-3 text-ink-2">{p}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Voice */}
        <section id="voice" aria-labelledby="voice-title" className="scroll-mt-16">
          <div className={`${wrap} grid items-center gap-10 py-16 lg:grid-cols-12 lg:gap-14 lg:py-24`}>
            <img src={voice} alt="" width="400" height="400" loading="lazy" className="hidden h-auto w-full max-w-xs lg:col-span-4 lg:block" />
            <div className="lg:col-span-8">
              <h2 id="voice-title" className={h2}>Speak in Hindi or English</h2>
              <p className="mt-4 max-w-2xl text-lg text-ink-2">
                No typing needed. Describe how you feel out loud, and AgeWell asks follow-up questions, then reads the answer back in the same language. It gives general guidance only, not a diagnosis.
              </p>
              <dl className="mt-8 divide-y divide-line border-y border-line sm:max-w-xl">
                <div className="flex gap-6 py-4">
                  <dt className="w-24 shrink-0 text-ink-2">Hindi</dt>
                  <dd lang="hi" className="font-serif text-2xl">सिर में दर्द है और चक्कर आ रहे हैं</dd>
                </div>
                <div className="flex gap-6 py-4">
                  <dt className="w-24 shrink-0 text-ink-2">English</dt>
                  <dd className="font-serif text-2xl">I have a headache and feel dizzy</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" aria-labelledby="privacy-title" className="scroll-mt-16 bg-paper-2">
          <div className={`${wrap} grid gap-10 py-16 lg:grid-cols-12 lg:gap-14 lg:py-24`}>
            <div className="lg:col-span-5">
              <h2 id="privacy-title" className={h2}>Private by design</h2>
              <p className="mt-4 max-w-md text-lg text-ink-2">Health information stays between the people who look after each other.</p>
              <img src={shield} alt="" width="400" height="400" loading="lazy" className="mt-8 hidden h-auto w-56 lg:block" />
            </div>
            <ul className="divide-y divide-line border-y border-line lg:col-span-7">
              {PRIVACY.map(([title, text]) => (
                <li key={title} className="py-6">
                  <h3 className="font-serif text-3xl">{title}</h3>
                  <p className="mt-2 text-lg text-ink-2">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16">
          <div className={`${wrap} grid gap-10 py-16 lg:grid-cols-12 lg:gap-14 lg:py-24`}>
            <h2 id="faq-title" className={`${h2} lg:col-span-4`}>Questions</h2>
            <div className="border-t border-line lg:col-span-8">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group border-b border-line">
                  <summary className={`flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-bold [&::-webkit-details-marker]:hidden ${focus}`}>
                    <span>{q}</span>
                    <Plus aria-hidden="true" className="h-6 w-6 shrink-0 text-primary transition-transform group-open:rotate-45 motion-reduce:transition-none" />
                  </summary>
                  <p className="max-w-2xl pb-6 text-lg text-ink-2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section aria-labelledby="cta-title" className="bg-primary text-paper">
          <div className={`${wrap} py-16 lg:py-24`}>
            <h2 id="cta-title" className="max-w-3xl font-serif text-5xl text-paper">Bring the whole family into the routine.</h2>
            <div className="btn-row mt-8 max-w-lg">
              <button type="button" onClick={() => start('elderly')} className="btn-primary !bg-paper !text-primary hover:!bg-paper-2">Get started</button>
              <button type="button" onClick={() => start('caregiver')} className="inline-flex min-h-[56px] items-center justify-center font-bold text-paper underline underline-offset-4">I am a caregiver</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className={`${wrap} flex flex-col justify-between gap-3 py-8 text-ink-2 sm:flex-row sm:items-center`}>
          <span className="flex items-center gap-2">
            <img src={logo} alt="" width="28" height="28" loading="lazy" className="sticker h-7 w-7 object-contain" />
            AgeWell. Not a substitute for medical advice.
          </span>
          <Link to="/auth" className={`inline-flex min-h-[44px] items-center underline underline-offset-4 hover:text-ink ${focus}`}>Sign in</Link>
        </div>
      </footer>
    </div>
  )
}
