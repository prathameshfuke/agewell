import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Loader2 } from 'lucide-react'

import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

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

  const loadData = useCallback(async () => {
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
  }, [user?.id, normalizedRole, isElder])

  useEffect(() => {
    void loadData()
  }, [loadData])

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
  const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

  return (
    <div className="min-h-screen bg-cream-50 font-sans page-content">
      <header className="px-4 md:px-6 py-4 flex items-center gap-3 border-b border-sage-200 sticky top-0 bg-cream-50 z-20">
        <button type="button" onClick={() => navigate(dashboardPath)} aria-label="Back to dashboard" className={`w-11 h-11 rounded-full flex items-center justify-center text-sage-700 hover:bg-sage-100 ${focusRing}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-2xl text-sage-900">Pairing code</h1>
      </header>

      <main className="px-4 md:px-6 py-5 space-y-5 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-sage-600" role="status">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-sage-200 bg-white p-6 space-y-4">
              <div>
                <h2 className="font-serif text-xl text-sage-900">
                  {isElder ? 'Share this code with your caregiver' : 'Enter the elder\'s code'}
                </h2>
                <p className="text-sm text-sage-600 mt-1">
                  {isElder
                    ? 'The code stays valid for 24 hours until it is used.'
                    : 'Ask them for the 6-character code shown on their account.'}
                </p>
              </div>

              {isElder ? (
                <>
                  <div className="flex flex-wrap gap-2" aria-label={`Pairing code ${linkCode}`}>
                    {codeChars.map((char, index) => (
                      <div key={index} className="w-11 h-12 rounded-xl border border-sage-300 bg-sage-50 flex items-center justify-center text-lg font-semibold text-sage-900">
                        {char}
                      </div>
                    ))}
                  </div>
                  {expiryLabel && <p className="text-sm text-sage-500">Expires {expiryLabel}</p>}
                  <button type="button" onClick={handleCopyCode} disabled={!linkCode} className="btn-secondary btn-sm disabled:opacity-50">
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    Copy code
                  </button>
                </>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleJoin() }} className="space-y-3">
                  <label htmlFor="join-code" className="sr-only">Pairing code</label>
                  <input
                    id="join-code"
                    type="text"
                    maxLength={6}
                    autoComplete="off"
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    placeholder="A1B2C3"
                    className="w-full min-h-[48px] rounded-xl border border-sage-300 px-4 tracking-[0.2em] text-center font-semibold text-[16px] focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                  <button type="submit" disabled={working || joinCode.length !== 6} className="btn-primary btn-sm disabled:opacity-60">
                    {working && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                    Link account
                  </button>
                </form>
              )}

              {error && (
                <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 text-sm">
                  {error}
                  {!isElder && ' Check the code with the elder and try again.'}
                  {isElder && !linkCode && (
                    <button type="button" onClick={loadData} className="ml-2 font-semibold underline underline-offset-2">Try again</button>
                  )}
                </div>
              )}
              {notice && (
                <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm">{notice}</div>
              )}
            </section>

            <section className="rounded-2xl border border-sage-200 bg-white p-6">
              <h2 className="font-serif text-lg text-sage-900">{isElder ? 'Linked caregivers' : 'Linked elders'}</h2>
              {links.length === 0 ? (
                <p className="text-sm text-sage-600 mt-2">
                  {isElder ? 'No one is linked yet. Share the code above to add a caregiver.' : 'No one is linked yet. Enter a code above to get started.'}
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-sage-100">
                  {links.map((row) => {
                    const person = isElder ? row.caregiver : row.elder
                    return (
                      <li key={row.id} className="py-3">
                        <p className="text-sage-900">{person?.full_name || 'Unnamed account'}</p>
                        <p className="text-sm text-sage-500">{row.status}</p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
