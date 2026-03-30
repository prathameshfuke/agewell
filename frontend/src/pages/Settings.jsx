import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ExternalLink, KeyRound, Loader2, Save, ShieldCheck } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'

import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { PageLayout, PageHeader, PageMain, PageSection } from '../components/layout'

const PROVIDER_LINKS = {
  GROQ_API_KEY: 'https://console.groq.com/keys',
  GEMINI_API_KEY: 'https://aistudio.google.com/app/apikey'
}

const EMPTY_KEYS = {
  GROQ_API_KEY: { masked_value: '', has_value: false },
  GEMINI_API_KEY: { masked_value: '', has_value: false }
}

export default function Settings() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [savedKeys, setSavedKeys] = useState(EMPTY_KEYS)
  const [groqApiKey, setGroqApiKey] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')

  const roleLabel = useMemo(() => {
    if (role === 'caregiver') return 'Caregiver'
    return 'Elder'
  }, [role])

  const dashboardPath = role === 'caregiver' ? '/family/dashboard' : '/elder/dashboard'

  const loadSavedKeys = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.getRuntimeApiKeys(user.id)
      if (!response?.success) {
        throw new Error(response?.error || 'Unable to load key status')
      }

      const next = { ...EMPTY_KEYS }
      for (const row of response.keys || []) {
        if (!row?.setting_key) continue
        next[row.setting_key] = {
          masked_value: row.masked_value || '',
          has_value: Boolean(row.has_value)
        }
      }
      setSavedKeys(next)
    } catch (err) {
      setError(err.message || 'Unable to load key status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSavedKeys()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleSave = async () => {
    if (!user?.id) return

    setNotice('')
    setError('')

    const payload = {}
    if (groqApiKey.trim()) payload.GROQ_API_KEY = groqApiKey.trim()
    if (geminiApiKey.trim()) payload.GEMINI_API_KEY = geminiApiKey.trim()

    if (Object.keys(payload).length === 0) {
      setError('Enter at least one API key to save.')
      return
    }

    setSaving(true)
    try {
      const response = await api.saveRuntimeApiKeys(user.id, payload)
      if (!response?.success) {
        throw new Error(response?.error || 'Unable to save keys')
      }

      setGroqApiKey('')
      setGeminiApiKey('')
      setNotice('Keys saved securely. Diagnosis requests will use them without redeploying.')
      await loadSavedKeys()
    } catch (err) {
      setError(err.message || 'Unable to save keys')
    } finally {
      setSaving(false)
    }
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
              <p className="text-xs uppercase tracking-widest text-sage-500 font-semibold">Runtime AI Keys</p>
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
                  Save your provider keys once. The backend loads them per user at request time.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sage-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading key status...</span>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl border border-sage-200 bg-sage-50/50 p-4">
                  <p className="font-semibold text-sage-900">Groq Key</p>
                  <p className="text-sage-600 mt-1">
                    {savedKeys.GROQ_API_KEY.has_value
                      ? `Saved (${savedKeys.GROQ_API_KEY.masked_value})`
                      : 'Not saved yet'}
                  </p>
                </div>
                <div className="rounded-2xl border border-sage-200 bg-sage-50/50 p-4">
                  <p className="font-semibold text-sage-900">Gemini Key</p>
                  <p className="text-sage-600 mt-1">
                    {savedKeys.GEMINI_API_KEY.has_value
                      ? `Saved (${savedKeys.GEMINI_API_KEY.masked_value})`
                      : 'Not saved yet'}
                  </p>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-sage-800">Groq API Key</span>
                <div className="mt-2 relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sage-500" />
                  <input
                    type="password"
                    value={groqApiKey}
                    onChange={(event) => setGroqApiKey(event.target.value)}
                    placeholder="gsk_..."
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-sage-300 focus:border-sage-500 focus:outline-none bg-white text-[16px]"
                  />
                </div>
                <a
                  href={PROVIDER_LINKS.GROQ_API_KEY}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-sage-600 hover:text-sage-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Get key from console.groq.com
                </a>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-sage-800">Gemini API Key</span>
                <div className="mt-2 relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sage-500" />
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(event) => setGeminiApiKey(event.target.value)}
                    placeholder="AIza..."
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-sage-300 focus:border-sage-500 focus:outline-none bg-white text-[16px]"
                  />
                </div>
                <a
                  href={PROVIDER_LINKS.GEMINI_API_KEY}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-sage-600 hover:text-sage-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Get key from aistudio.google.com
                </a>
              </label>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {notice && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
                {notice}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 px-5 rounded-xl bg-sage-700 hover:bg-sage-800 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Keys
            </button>
          </div>
        </PageSection>
      </PageMain>
    </PageLayout>
  )
}
