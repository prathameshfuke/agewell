import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { CenteredLayout } from '../components/layout'
import { Button } from '../components/ui'

import logo from '/logo.png'

/**
 * Auth Page - Simple login/signup
 * Consistent styling with design system
 */
export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const navigate = useNavigate()
  const { login, loginWithEmail, signupWithEmail, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const [showEmailLogin, setShowEmailLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await loginWithEmail(email, password)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await login()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-cream-50 to-sage-100/40 flex flex-col p-6">
      <button
        onClick={() => navigate('/')}
        className="text-sage-500 hover:text-sage-700 flex items-center gap-2 text-sm font-bold mb-8 min-h-[44px]"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.img
          src={logo}
          alt="AgeWell"
          className="w-24 h-24 rounded-3xl shadow-lg border-4 border-white mb-6 object-contain"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-serif font-bold text-sage-900 mb-2">
            Welcome to AgeWell
          </h1>
          <p className="text-sage-600 text-lg">
            Sign in to continue
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-rose-50 border-2 border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm mb-6 font-medium"
          >
            {error}
          </motion.div>
        )}

        {/* Google Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border-2 border-sage-200 hover:border-sage-300 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all min-h-[56px] text-sage-700 disabled:opacity-50 shadow-soft mb-6"
        >
          {loading && !error ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </>
          )}
        </motion.button>

        {/* Demo Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/demo')}
          className="w-full bg-sage-50 border-2 border-sage-100 hover:bg-sage-100 hover:border-sage-200 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all min-h-[56px] text-sage-600 mb-6"
        >
          Try Demo Version
        </motion.button>

        {/* Admin Login Toggle */}
        <div className="w-full">
          <button
            onClick={() => setShowEmailLogin(!showEmailLogin)}
            className="w-full text-center text-sage-500 text-sm font-medium hover:text-sage-700 transition-colors mb-4"
          >
            {showEmailLogin ? 'Hide Admin Login' : 'Admin Login'}
          </button>

          {showEmailLogin && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-4 overflow-hidden"
              onSubmit={handleEmailSignIn}
            >
              <div>
                <input
                  type="email"
                  placeholder="Admin Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-sage-200 focus:border-sage-400 focus:ring-2 focus:ring-sage-100 outline-none bg-white/50"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-sage-200 focus:border-sage-400 focus:ring-2 focus:ring-sage-100 outline-none bg-white/50"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  className="flex-1 border-sage-200 text-sage-700"
                  onClick={async () => {
                    if (!email || !password) {
                      setError('Please enter email and password')
                      return
                    }
                    setLoading(true)
                    setError(null)
                    try {
                      await signupWithEmail(email, password)
                      alert('Signup successful! Check your email or try logging in.')
                      setLoading(false)
                    } catch (err) {
                      setError(err.message)
                      setLoading(false)
                    }
                  }}
                >
                  Sign Up
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  )
}
