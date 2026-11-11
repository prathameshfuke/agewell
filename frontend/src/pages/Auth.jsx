import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import logo from '/logo.png'

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
    <div className="min-h-screen bg-cream-50 flex flex-col px-5 py-4">
      <header>
        <Link to="/" className="inline-flex items-center gap-2 min-h-0 py-2" aria-label="Back to AgeWell home">
          <img src={logo} alt="" className="w-9 h-9 object-contain" />
          <span className="font-serif text-2xl text-sage-900">AgeWell</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-white border border-sage-200 rounded-3xl p-6 sm:p-10 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-sage-900">Sign in to AgeWell</h1>
          <p className="mt-3 text-sage-600 font-normal">
            One email works for both elder and caregiver modes. Caregiver mode is protected by a 4-digit PIN.
          </p>

          {error && (
            <p role="alert" className="mt-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm font-normal text-left">
              {error}
            </p>
          )}

          <button type="button" onClick={() => run(login)} disabled={loading} className="btn-primary w-full mt-6 disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-label="Signing in" /> : 'Continue with Google'}
          </button>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowEmailLogin((v) => !v)}
              aria-expanded={showEmailLogin}
              aria-controls="email-login"
              className="text-sm text-sage-500 hover:text-sage-900 underline underline-offset-4 min-h-[44px] font-normal"
            >
              {showEmailLogin ? 'Hide admin login' : 'Admin login'}
            </button>

            {showEmailLogin && (
              <form id="email-login" onSubmit={handleEmailSignIn} className="mt-3 flex flex-col gap-3 text-left">
                <div>
                  <label htmlFor="auth-email" className="block text-sm mb-1 text-sage-700">Email</label>
                  <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
                </div>
                <div>
                  <label htmlFor="auth-password" className="block text-sm mb-1 text-sage-700">Password</label>
                  <input id="auth-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="btn-secondary flex-1 disabled:opacity-60">Log in</button>
                  <button type="button" disabled={loading} onClick={handleSignUp} className="btn-ghost flex-1 disabled:opacity-60">Sign up</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
