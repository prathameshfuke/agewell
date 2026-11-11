import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Loader2 } from 'lucide-react'
import { call } from '../assets/images/gen'

import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import FamilyPage, { Notice, lone } from '../components/family/FamilyPage'

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

  return (
    <FamilyPage title="Pairing code" back={dashboardPath} art={call}>
      {loading ? (
        <div className="flex items-center gap-2 text-ink-2" role="status">
          <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <span>Loading...</span>
        </div>
      ) : (
        <>
          <section className="space-y-5">
            <div>
              <h2 className="font-serif text-3xl">
                {isElder ? 'Share this code with your caregiver' : 'Enter the elder\'s code'}
              </h2>
              <p className="mt-1 text-ink-2">
                {isElder
                  ? 'The code stays valid for 24 hours until it is used.'
                  : 'Ask them for the 6-character code shown on their account.'}
              </p>
            </div>

            {isElder ? (
              <>
                <div className="flex flex-wrap gap-2" aria-label={`Pairing code ${linkCode}`}>
                  {codeChars.map((char, index) => (
                    <div key={index} className="flex h-16 w-12 items-center justify-center rounded-xl border border-line bg-paper-2 font-serif text-3xl sm:w-14">
                      {char}
                    </div>
                  ))}
                </div>
                {expiryLabel && <p className="text-ink-2">Expires {expiryLabel}</p>}
                <button type="button" onClick={handleCopyCode} disabled={!linkCode} className={`btn-primary btn-sm ${lone}`}>
                  <Copy aria-hidden="true" />
                  Copy code
                </button>
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleJoin() }} className="max-w-sm space-y-4">
                <label htmlFor="join-code" className="sr-only">Pairing code</label>
                <input
                  id="join-code"
                  type="text"
                  maxLength={6}
                  autoComplete="off"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="A1B2C3"
                  className="input text-center font-bold tracking-[0.3em]"
                />
                <button type="submit" disabled={working || joinCode.length !== 6} className="btn-primary btn-sm w-full">
                  {working && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                  Link account
                </button>
              </form>
            )}

            {error && (
              <Notice onRetry={isElder && !linkCode ? loadData : undefined}>
                {error}{!isElder && ' Check the code with the elder and try again.'}
              </Notice>
            )}
            {notice && <Notice tone="ok">{notice}</Notice>}
          </section>

          <section>
            <h2 className="font-serif text-2xl">{isElder ? 'Linked caregivers' : 'Linked elders'}</h2>
            {links.length === 0 ? (
              <p className="mt-2 text-ink-2">
                {isElder ? 'No one is linked yet. Share the code above to add a caregiver.' : 'No one is linked yet. Enter a code above to get started.'}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {links.map((row) => {
                  const person = isElder ? row.caregiver : row.elder
                  return (
                    <li key={row.id} className="py-3">
                      <p className="text-lg">{person?.full_name || 'Unnamed account'}</p>
                      <p className="text-ink-2">{row.status}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </FamilyPage>
  )
}
