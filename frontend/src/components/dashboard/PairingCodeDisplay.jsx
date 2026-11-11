import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function PairingCodeDisplay({ code }) {
    const [copied, setCopied] = useState(false)
    const [failed, setFailed] = useState(false)

    const handleCopy = async () => {
        if (!code) return
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setFailed(false)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setFailed(true)
        }
    }

    if (!code) return null

    return (
        <section className="rounded-2xl border border-sage-200 bg-white p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 className="font-serif text-lg text-sage-900">Connect a caregiver</h3>
                    <p className="text-sage-600 text-sm">
                        {failed ? 'Could not copy. Select the code and copy it by hand.' : 'Share this code so they can link to your account.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-xl border border-sage-200 bg-sage-50 font-mono text-2xl text-sage-900 tracking-widest select-all">
                        {code}
                    </div>
                    <button
                        type="button"
                        onClick={handleCopy}
                        aria-label={copied ? 'Code copied' : 'Copy pairing code'}
                        className="w-11 h-11 rounded-full border border-sage-300 text-sage-700 hover:bg-sage-50 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </section>
    )
}
