import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ExternalLink, KeyRound, Loader2, Save, ShieldCheck, Check, Edit2, AlertCircle } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { PageLayout, PageHeader, PageMain, PageSection } from '../components/layout'

const PROVIDER_LINKS = {
  GROQ_API_KEY: 'https://console.groq.com/keys',
  GEMINI_API_KEY: 'https://aistudio.google.com/app/apikey'
}

const SESSION_STORAGE_KEY = 'agewell_settings_unsaved'

export default function Settings() {
  const { user, role, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const mountedRef = useRef(true)

  const [loading, setLoading] = useState(true)
  const [savingGroq, setSavingGroq] = useState(false)
  const [savingGemini, setSavingGemini] = useState(false)
  const [error, setError] = useState('')

  // Separate state for saved values (read-only display) and input fields
  const [savedGroq, setSavedGroq] = useState({ value: '', hasSaved: false })
  const [savedGemini, setSavedGemini] = useState({ value: '', hasSaved: false })
  
  const [groqInput, setGroqInput] = useState('')
  const [geminiInput, setGeminiInput] = useState('')
  
  const [groqStatus, setGroqStatus] = useState('')
  const [geminiStatus, setGeminiStatus] = useState('')
  
  const [editingGroq, setEditingGroq] = useState(false)
  const [editingGemini, setEditingGemini] = useState(false)

  const roleLabel = useMemo(() => {
    if (role === 'caregiver') return 'Caregiver'
    return 'Elder'
  }, [role])

  const dashboardPath = role === 'caregiver' ? '/family/dashboard' : '/elder/dashboard'

  // Load unsaved input from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.groq) {
          setGroqInput(parsed.groq)
          setEditingGroq(true)
        }
        if (parsed.gemini) {
          setGeminiInput(parsed.gemini)
          setEditingGemini(true)
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [])

  // Save unsaved input to sessionStorage on every keystroke
  useEffect(() => {
    if (!mountedRef.current) return
    const data = {}
    if (groqInput) data.groq = groqInput
    if (geminiInput) data.gemini = geminiInput
    
    if (Object.keys(data).length > 0) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data))
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [groqInput, geminiInput])

  // Fetch saved keys from Supabase directly
  const loadSavedKeys = async () => {
    if (!user?.id || !supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: queryError } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .eq('user_id', user.id)
        .in('setting_key', ['GROQ_API_KEY', 'GEMINI_API_KEY'])

      if (queryError) throw queryError

      const groqRow = data?.find(row => row.setting_key === 'GROQ_API_KEY')
      const geminiRow = data?.find(row => row.setting_key === 'GEMINI_API_KEY')

      setSavedGroq({
        value: groqRow?.setting_value || '',
        hasSaved: Boolean(groqRow?.setting_value)
      })

      setSavedGemini({
        value: geminiRow?.setting_value || '',
        hasSaved: Boolean(geminiRow?.setting_value)
      })

      // If keys are saved, default to non-editing mode
      if (groqRow?.setting_value && !groqInput) {
        setEditingGroq(false)
      } else if (!groqRow?.setting_value) {
        setEditingGroq(true)
      }

      if (geminiRow?.setting_value && !geminiInput) {
        setEditingGemini(false)
      } else if (!geminiRow?.setting_value) {
        setEditingGemini(true)
      }

    } catch (err) {
      console.error('Failed to load keys:', err)
      setError('Unable to load key status. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user?.id) {
      void loadSavedKeys()
    }
    // Only run when user.id changes, NOT on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const maskKey = (key) => {
    if (!key || key.length <= 6) return '••••••'
    return `${'•'.repeat(key.length - 6)}${key.slice(-6)}`
  }

  const handleSaveGroq = async () => {
    if (!user?.id || !supabase) return

    const trimmed = groqInput.trim()
    if (!trimmed) {
      setGroqStatus('Please enter a key')
      return
    }

    setGroqStatus('')
    setSavingGroq(true)

    try {
      const { error: upsertError } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          setting_key: 'GROQ_API_KEY',
          setting_value: trimmed,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,setting_key'
        })

      if (upsertError) throw upsertError

      setSavedGroq({ value: trimmed, hasSaved: true })
      setGroqInput('')
      setEditingGroq(false)
      setGroqStatus('✓ Groq key saved')
      
      // Clear from sessionStorage
      const current = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) || '{}')
      delete current.groq
      if (Object.keys(current).length > 0) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(current))
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }

    } catch (err) {
      console.error('Failed to save Groq key:', err)
      setGroqStatus(`✗ Error: ${err.message || 'Failed to save'}`)
    } finally {
      setSavingGroq(false)
    }
  }

  const handleSaveGemini = async () => {
    if (!user?.id || !supabase) return

    const trimmed = geminiInput.trim()
    if (!trimmed) {
      setGeminiStatus('Please enter a key')
      return
    }

    setGeminiStatus('')
    setSavingGemini(true)

    try {
      const { error: upsertError } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          setting_key: 'GEMINI_API_KEY',
          setting_value: trimmed,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,setting_key'
        })

      if (upsertError) throw upsertError

      setSavedGemini({ value: trimmed, hasSaved: true })
      setGeminiInput('')
      setEditingGemini(false)
      setGeminiStatus('✓ Gemini key saved')
      
      // Clear from sessionStorage
      const current = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) || '{}')
      delete current.gemini
      if (Object.keys(current).length > 0) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(current))
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }

    } catch (err) {
      console.error('Failed to save Gemini key:', err)
      setGeminiStatus(`✗ Error: ${err.message || 'Failed to save'}`)
    } finally {
      setSavingGemini(false)
    }
  }

  // Don't render form until auth is loaded
  if (authLoading) {
    return (
      <PageLayout background="gradient" className="page-content">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-sage-600" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout background="gradient" className="page-content">
      <PageHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(dashboardPath)}
              className="p-2 rounded-xl text-sage-600 hover:bg-sage-100"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <p className="text-xs uppercase tracking-widest text-sage-500 font-semibold">AI Keys</p>
              <h1 className="text-2xl font-serif font-bold text-sage-900">Settings</h1>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-sage-100 text-sage-700 text-xs font-semibold">
            {roleLabel} Mode
          </span>
        </div>
      </PageHeader>

      <PageMain className="pb-24 md:pb-0 max-w-3xl mx-auto w-full">
        <PageSection>
          <div className="bg-white rounded-3xl border border-sage-200 shadow-soft p-5 sm:p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-sage-900">Per-user key storage</h2>
                <p className="text-sm text-sage-600 mt-1">
                  Save your API keys. The diagnosis feature will use your keys automatically.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Groq API Key */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-sage-800">Groq API Key</label>
                {savedGroq.hasSaved && !editingGroq && (
                  <button
                    onClick={() => setEditingGroq(true)}
                    className="text-xs text-sage-600 hover:text-sage-800 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>

              {editingGroq ? (
                <>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sage-500" />
                    <input
                      type="password"
                      value={groqInput}
                      onChange={(e) => setGroqInput(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-sage-300 focus:border-sage-500 focus:outline-none bg-white text-[16px]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <a
                      href={PROVIDER_LINKS.GROQ_API_KEY}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-sage-600 hover:text-sage-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Get key from console.groq.com
                    </a>
                    <button
                      type="button"
                      onClick={handleSaveGroq}
                      disabled={savingGroq || !groqInput.trim()}
                      className="h-9 px-4 rounded-lg bg-sage-700 hover:bg-sage-800 text-white text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingGroq ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                  </div>
                  {groqStatus && (
                    <p className={`text-xs ${groqStatus.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {groqStatus}
                    </p>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-sage-200 bg-sage-50/50 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-sage-500">Configured</p>
                    <p className="text-sm text-sage-700 font-mono">{maskKey(savedGroq.value)}</p>
                  </div>
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
              )}
            </div>

            {/* Gemini API Key */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-sage-800">Gemini API Key</label>
                {savedGemini.hasSaved && !editingGemini && (
                  <button
                    onClick={() => setEditingGemini(true)}
                    className="text-xs text-sage-600 hover:text-sage-800 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>

              {editingGemini ? (
                <>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sage-500" />
                    <input
                      type="password"
                      value={geminiInput}
                      onChange={(e) => setGeminiInput(e.target.value)}
                      placeholder="AIza..."
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-sage-300 focus:border-sage-500 focus:outline-none bg-white text-[16px]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <a
                      href={PROVIDER_LINKS.GEMINI_API_KEY}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-sage-600 hover:text-sage-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Get key from aistudio.google.com
                    </a>
                    <button
                      type="button"
                      onClick={handleSaveGemini}
                      disabled={savingGemini || !geminiInput.trim()}
                      className="h-9 px-4 rounded-lg bg-sage-700 hover:bg-sage-800 text-white text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingGemini ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                  </div>
                  {geminiStatus && (
                    <p className={`text-xs ${geminiStatus.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {geminiStatus}
                    </p>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-sage-200 bg-sage-50/50 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-sage-500">Configured</p>
                    <p className="text-sm text-sage-700 font-mono">{maskKey(savedGemini.value)}</p>
                  </div>
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
              )}
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sage-600 justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading saved keys...</span>
              </div>
            )}
          </div>
        </PageSection>
      </PageMain>
    </PageLayout>
  )
}
