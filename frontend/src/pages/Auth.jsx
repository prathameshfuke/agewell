import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { logo, walkIllustration } from '../assets/images'
import { together } from '../assets/images/gen'
import { Art, Notice } from '../components/family/FamilyPage'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showEmailLogin, setShowEmailLogin] = useState(false)
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
        <img src={walkIllustration} alt="An adult walking beside an elderly woman along a path toward the sunrise" width="640" height="959" className="absolute inset-0 h-full w-full object-cover object-[50%_75%]" />
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
            One email works for both elder and caregiver modes. Caregiver mode is protected by a 4-digit PIN.
          </p>

          {error && <div className="mt-6"><Notice tone={error.startsWith('Account created') ? 'ok' : 'danger'}>{error}</Notice></div>}

          <button type="button" onClick={() => run(login)} disabled={loading} className="btn-primary mt-8 w-full">
            {loading ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-label="Signing in" /> : 'Continue with Google'}
          </button>

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
