// Phone sign-in helpers. Pure functions: nothing here logs or stores a number.

export const COUNTRIES = [
  { code: '91', label: '+91 India' },
  { code: '1', label: '+1 US/CA' },
  { code: '44', label: '+44 UK' },
  { code: '971', label: '+971 UAE' },
  { code: '65', label: '+65 SG' },
]

/** Country code + typed number -> { e164 } or { error }. */
export function toE164(code, typed) {
  const digits = String(typed).replace(/[\s\-().]/g, '').replace(/^0+/, '')
  if (!/^\d+$/.test(digits)) return { error: 'Enter digits only, for example 98765 43210.' }
  if (code === '91' && !/^[6-9]\d{9}$/.test(digits)) return { error: 'Indian numbers have 10 digits and start with 6, 7, 8 or 9.' }
  if (code === '1' && digits.length !== 10) return { error: 'Enter a 10-digit number.' }
  if (digits.length < 6 || digits.length + code.length > 15) return { error: 'That number does not look right. Check it and try again.' }
  return { e164: `+${code}${digits}` }
}

/** "+919876543210" or "919876543210" -> "+91 ******3210". Empty input -> ''. */
export function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  const cc = COUNTRIES.map((c) => c.code).filter((c) => digits.startsWith(c) && digits.length > c.length + 4).sort((a, b) => b.length - a.length)[0] || ''
  return `+${cc}${cc ? ' ' : ''}${'*'.repeat(Math.max(digits.length - cc.length - 4, 0))}${digits.slice(-4)}`
}

/** Best contact line for a Supabase user: email, else masked phone. */
export const contactLabel = (user) => user?.email || maskPhone(user?.phone)

/** Supabase auth error -> plain sentence. */
export function phoneError(err) {
  const text = `${err?.code || ''} ${err?.message || ''}`.toLowerCase()
  if (/unsupported phone provider|phone_provider_disabled|otp_disabled/.test(text)) return "Phone sign-in isn't turned on yet. Use Google for now."
  if (err?.status === 429 || /rate.?limit|too many/.test(text)) return 'Too many tries. Wait a minute and try again.'
  if (/otp_expired|expired or is invalid|invalid.*(token|otp|code)/.test(text)) return 'That code is wrong or has expired.'
  if (err?.status === 0 || /failed to fetch|network|retryable/.test(text)) return 'Could not reach the server.'
  return 'Something went wrong. Please try again.'
}

if (import.meta.env?.DEV && typeof globalThis.__phoneCheck === 'undefined') {
  // ponytail: dev-only self-check, runs once on import; replace with a test file if a runner is added.
  const ok = (c) => { if (!c) throw new Error('phone.js self-check failed') }
  ok(toE164('91', '098765 43210').e164 === '+919876543210')
  ok(toE164('91', '12345 67890').error)
  ok(toE164('1', '555-123-4567').e164 === '+15551234567')
  ok(maskPhone('919876543210') === '+91 ******3210')
  ok(phoneError({ message: 'Unsupported phone provider' }).includes('turned on'))
  ok(phoneError({ status: 429 }).includes('Too many'))
  ok(phoneError({ code: 'otp_expired', message: 'Token has expired or is invalid' }).includes('wrong'))
  globalThis.__phoneCheck = true
}
