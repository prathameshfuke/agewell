import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Users } from 'lucide-react'
import { Card, Button } from '../components/ui'

export default function PairingCodeDisplay({ code }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        if (!code) return
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!code) return null

    return (
        <Card className="bg-sage-50 border-sage-200 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-sage-600" />
                    </div>
                    <div>
                        <h3 className="text-sage-900 font-bold text-lg">Connect Caregiver</h3>
                        <p className="text-sage-600 text-sm">Share this code to link accounts</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl border border-sage-200 font-mono text-2xl font-bold text-sage-800 tracking-widest">
                        {code}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        className="text-sage-500 hover:text-sage-700 hover:bg-sage-100"
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
