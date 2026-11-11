import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { logo } from '../assets/images'
import { together, walk } from '../assets/images/gen'
import { Art, Notice } from '../components/family/FamilyPage'
import { COUNTRIES, toE164, maskPhone, phoneError } from '../lib/phone'

const RESEND_SECONDS = 30

// Phone sign-in: number -> 6-digit SMS code. The number and code live only in component state.
function PhoneSignIn() {
  const { signInWithPhone, verifyPhoneCode } = useAuth()
  const [code, setCode] = useState('91') // country code
  const [typed, setTyped] = useState('')
  const [phone, setPhone] = useState(null) // E.164, set once the SMS is sent (step 2)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [wait, setWait] = useState(0)
  const tokenRef = useRef(null)

  useEffect(() => { if (phone) tokenRef.current?.focus() }, [phone])
  useEffect(() => {
    if (wait <= 0) return undefined
    const timer = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  const sendTo = async (target) => {
    setBusy(true)
    setError(null)
    try {
      await signInWithPhone(target)
      setPhone(target)
      setToken('')
      setWait(RESEND_SECONDS)
      tokenRef.current?.focus()
    } catch (err) {
      setError(phoneError(err))
    } finally {
      setBusy(false)
    }
  }

  const sendCode = (e) => {
    e.preventDefault()
    const { e164, error: invalid } = toE164(code, typed)
    if (invalid) setError(invalid)
    else sendTo(e164)
  }

  const verify = async (value) => {
    if (busy || value.length !== 6) return
    setBusy(true)
    setError(null)
    try {
      await verifyPhoneCode(phone, value) // on success AuthContext sees SIGNED_IN and this page redirects
    } catch (err) {
      setError(phoneError(err))
      setToken('')
      tokenRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  const changeToken = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setToken(value)
    verify(value)
  }

  const changeNumber = () => { setPhone(null); setToken(''); setError(null); setWait(0) }

  return (
    <div id="phone-login" className="mt-4">
      {error && <div className="mb-4"><Notice>{error}</Notice></div>}

      {!phone ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="auth-phone" className="mb-1.5 block font-bold">Mobile number</label>
            <div className="flex gap-3">
              <select aria-label="Country code" value={code} onChange={(e) => setCode(e.target.value)} className="input w-32 shrink-0 px-3">
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <input id="auth-phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" value={typed} onChange={(e) => setTyped(e.target.value)} className="input min-w-0 flex-1" required />
            </div>
            <p className="mt-1.5 text-sm text-ink-2">We will text you a 6-digit code.</p>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-label="Sending code" /> : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); verify(token) }} className="flex flex-col gap-4">
          <div>
            <label htmlFor="auth-code" className="mb-1.5 block font-bold">Enter the 6-digit code</label>
            <p className="mb-3 text-ink-2">Sent to {maskPhone(phone)}.</p>
            <input ref={tokenRef} id="auth-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" placeholder="000000" value={token} onChange={changeToken} className="input min-h-[72px] pl-[0.5em] text-center font-serif text-4xl tracking-[0.5em] sm:text-4xl" />
          </div>
          <button type="submit" disabled={busy || token.length !== 6} className="btn-primary w-full">
            {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-label="Checking code" /> : 'Verify code'}
          </button>
          <div className="btn-row">
            <button type="button" disabled={busy || wait > 0} onClick={() => sendTo(phone)} className="btn-secondary">
              {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
            </button>
            <button type="button" disabled={busy} onClick={changeNumber} className="btn-ghost">Change number</button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showEmailLogin, setShowEmailLogin] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()
  const { login, loginWithEmail, signupWithEmail, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const run = async (fn) => {
    setLoading(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = (e) => {
    e.preventDefault()
    run(() => loginWithEmail(email, password))
  }

  const handleSignUp = () => {
    if (!email || !password) {
      setError('Enter an email and password first.')
      return
    }
    run(async () => {
      await signupWithEmail(email, password)
      setError('Account created. Check your email to confirm, then sign in.')
    })
  }

  return (
    <div className="min-h-screen bg-paper font-sans text-ink lg:grid lg:grid-cols-2">
      <aside className="relative hidden lg:block">
        <img src={walk} alt="An adult walking beside an elderly woman along a path toward the sunrise" width="400" height="600" className="absolute inset-0 h-full w-full object-cover object-bottom" />
      </aside>

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-4 sm:px-0 lg:max-w-lg lg:px-16">
        <header className="flex h-14 items-center">
          <Link to="/" className="inline-flex min-h-[44px] items-center gap-2" aria-label="Back to AgeWell home">
            <img src={logo} alt="" width="48" height="48" className="sticker h-10 w-10 object-contain" />
            <span className="font-serif text-2xl leading-none">AgeWell</span>
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center py-8">
          <Art src={together} wide className="mb-6 w-40 lg:hidden" />
          <h1 className="font-serif text-5xl">Welcome back</h1>
          <p className="mt-3 text-lg text-ink-2">
            One account works for both elder and caregiver modes. Caregiver mode is protected by a 4-digit PIN.
          </p>

          {error && <div className="mt-6"><Notice tone={error.startsWith('Account created') ? 'ok' : 'danger'}>{error}</Notice></div>}

          <button type="button" onClick={() => run(login)} disabled={loading} className="btn-primary mt-8 w-full">
            {loading ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-label="Signing in" /> : 'Continue with Google'}
          </button>

          <button type="button" onClick={() => setShowPhone((v) => !v)} aria-expanded={showPhone} aria-controls="phone-login" className="btn-secondary mt-3 w-full">
            Use your phone number
          </button>
          {showPhone && <PhoneSignIn />}

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowEmailLogin((v) => !v)}
              aria-expanded={showEmailLogin}
              aria-controls="email-login"
              className="min-h-[44px] font-normal text-ink-2 underline underline-offset-4 hover:text-ink"
            >
              {showEmailLogin ? 'Hide admin login' : 'Admin login'}
            </button>

            {showEmailLogin && (
              <form id="email-login" onSubmit={handleEmailSignIn} className="mt-3 flex flex-col gap-4">
                <div>
                  <label htmlFor="auth-email" className="mb-1.5 block font-bold">Email</label>
                  <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
                </div>
                <div>
                  <label htmlFor="auth-password" className="mb-1.5 block font-bold">Password</label>
                  <input id="auth-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
                </div>
                <div className="btn-row">
                  <button type="submit" disabled={loading} className="btn-secondary">Log in</button>
                  <button type="button" disabled={loading} onClick={handleSignUp} className="btn-ghost">Sign up</button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
