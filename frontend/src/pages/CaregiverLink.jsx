import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Loader2, Link as LinkIcon, UsersRound } from 'lucide-react'

import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { PageLayout, PageHeader, PageMain, PageSection } from '../components/layout'

const normalizeRole = (role) => {
  if (!role) return null
  const normalized = role.toLowerCase()
  if (normalized === 'elder') return 'elderly'
  if (normalized === 'elderly') return 'elderly'
  if (normalized === 'caregiver') return 'caregiver'
  return null
}

export default function CaregiverLink() {
  const { user, role, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const normalizedRole = normalizeRole(role)
  const isElder = normalizedRole === 'elderly'
  const dashboardPath = normalizedRole === 'caregiver' ? '/family/dashboard' : '/elder/dashboard'

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [joinCode, setJoinCode] = useState('')
  const [linkCode, setLinkCode] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [links, setLinks] = useState([])

  const expiryLabel = useMemo(() => {
    if (!expiresAt) return ''
    const timestamp = new Date(expiresAt)
    if (Number.isNaN(timestamp.getTime())) return ''
    return timestamp.toLocaleString()
  }, [expiresAt])

  const loadData = async () => {
    if (!user?.id || !normalizedRole) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      if (isElder) {
        const [codeResponse, caregiversResponse] = await Promise.all([
          api.generateLinkCode(user.id),
          api.getLinkedCaregivers(user.id)
        ])

        if (!codeResponse?.success) {
          throw new Error(codeResponse?.error || 'Could not generate link code')
        }

        setLinkCode(codeResponse.link_code || '')
        setExpiresAt(codeResponse.expires_at || '')
        setLinks(caregiversResponse?.success ? (caregiversResponse.caregivers || []) : [])
      } else {
        const eldersResponse = await api.getLinkedElders(user.id)
        setLinks(eldersResponse?.success ? (eldersResponse.elders || []) : [])
      }
    } catch (err) {
      setError(err.message || 'Unable to load linking data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, normalizedRole])

  const handleCopyCode = async () => {
    if (!linkCode) return

    try {
      await navigator.clipboard.writeText(linkCode)
      setNotice('Code copied to clipboard.')
    } catch {
      setNotice('Could not copy automatically. Please copy manually.')
    }
  }

  const handleJoin = async () => {
    if (!user?.id) return

    setNotice('')
    setError('')

    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) {
      setError('Enter a valid 6-character code.')
      return
    }

    setWorking(true)
    try {
      const response = await api.joinLinkCode(user.id, code)
      if (!response?.success) {
        throw new Error(response?.error || 'Unable to join with this code')
      }

      setJoinCode('')
      const elderName = response?.elder?.full_name || 'elder account'
      setNotice(`Linked successfully with ${elderName}.`)
      await refreshProfile()
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to join with this code')
    } finally {
      setWorking(false)
    }
  }

  const codeChars = (linkCode || '------').slice(0, 6).split('')

  return (
    <PageLayout background="gradient" className="page-content">
      <PageHeader>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(dashboardPath)}
            className="p-2 rounded-xl text-sage-600 hover:bg-sage-100"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <p className="text-xs uppercase tracking-widest text-sage-500 font-semibold">Dual-role Linking</p>
            <h1 className="text-2xl font-serif font-bold text-sage-900">Caregiver Link</h1>
          </div>
        </div>
      </PageHeader>

      <PageMain className="pb-24 md:pb-0 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center gap-2 text-sage-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading link details...</span>
          </div>
        ) : (
          <>
            <PageSection>
              <div className="bg-white rounded-3xl border border-sage-200 shadow-soft p-5 sm:p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-sage-900">
                      {isElder ? 'Share this code with your caregiver' : 'Enter your elder code'}
                    </h2>
                    <p className="text-sm text-sage-600 mt-1">
                      {isElder
                        ? 'The code stays valid for 24 hours while pending.'
                        : 'Use the 6-character code shown on your elder account.'}
                    </p>
                  </div>
                </div>

                {isElder ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {codeChars.map((char, index) => (
                        <div
                          key={`${char}-${index}`}
                          className="w-11 h-12 rounded-xl border border-sage-300 bg-sage-50 flex items-center justify-center text-lg font-bold tracking-wide text-sage-900"
                        >
                          {char}
                        </div>
                      ))}
                    </div>

                    {expiryLabel && (
                      <p className="text-xs text-sage-600">Expires: {expiryLabel}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="h-11 px-5 rounded-xl border border-sage-300 text-sage-800 hover:bg-sage-50 text-sm font-semibold inline-flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      maxLength={6}
                      value={joinCode}
                      onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                      placeholder="A1B2C3"
                      className="w-full h-12 rounded-xl border border-sage-300 px-4 tracking-[0.2em] text-center font-semibold text-[16px]"
                    />
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={working}
                      className="h-11 px-5 rounded-xl bg-sage-700 hover:bg-sage-800 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                    >
                      {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                      Join
                    </button>
                  </div>
                )}

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
              </div>
            </PageSection>

            <PageSection delay={0.08}>
              <div className="bg-white rounded-3xl border border-sage-200 shadow-soft p-5 sm:p-6">
                <h3 className="text-base font-semibold text-sage-900 flex items-center gap-2">
                  <UsersRound className="w-4 h-4" />
                  {isElder ? 'Linked Caregivers' : 'Linked Elders'}
                </h3>

                <div className="mt-4 space-y-3">
                  {links.length === 0 && (
                    <p className="text-sm text-sage-600">No active links yet.</p>
                  )}

                  {links.map((row) => {
                    const person = isElder ? row.caregiver : row.elder
                    return (
                      <div
                        key={row.id}
                        className="rounded-2xl border border-sage-200 bg-sage-50/40 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-sage-900">{person?.full_name || 'Unnamed account'}</p>
                        <p className="text-xs text-sage-600 mt-1">Status: {row.status}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </PageSection>
          </>
        )}
      </PageMain>
    </PageLayout>
  )
}
