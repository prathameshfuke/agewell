import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mic, MicOff, Send, Stethoscope } from 'lucide-react'

import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import ElderNav from '../../components/ElderNav'
import FamilyNav from '../../components/FamilyNav'
import { Card, Button } from '../../components/ui'
import { PageLayout, PageHeader, PageMain, PageSection } from '../../components/layout'

export default function SymptomInput() {
    const navigate = useNavigate()
    const { user, profile, activeRole } = useAuth()

    const [complaint, setComplaint] = useState('')
    const [listening, setListening] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const recognitionRef = useRef(null)

    const patientId = useMemo(() => {
        if (activeRole === 'caregiver') return profile?.linked_elderly_id
        return user?.id
    }, [activeRole, profile, user])

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) return

        const recognition = new SpeechRecognition()
        recognition.lang = 'en-US'
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onresult = (event) => {
            const transcript = event?.results?.[0]?.[0]?.transcript || ''
            if (transcript) {
                setComplaint((prev) => [prev, transcript].filter(Boolean).join(' ').trim())
            }
        }

        recognition.onend = () => setListening(false)
        recognition.onerror = () => setListening(false)

        recognitionRef.current = recognition
    }, [])

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            setError('Voice input is not supported on this browser.')
            return
        }

        setError('')
        if (listening) {
            recognitionRef.current.stop()
            setListening(false)
            return
        }

        recognitionRef.current.start()
        setListening(true)
    }

    const handleSubmit = async () => {
        if (!patientId) {
            setError('No patient profile found for diagnosis session.')
            return
        }

        if (!complaint.trim()) {
            setError('Please describe your symptoms first.')
            return
        }

        setSubmitting(true)
        setError('')

        const result = await api.startDiagnosisSession(patientId, complaint.trim())
        setSubmitting(false)

        if (!result.success) {
            setError(result.error || 'Could not start diagnosis session.')
            return
        }

        navigate('/diagnosis/qa', {
            state: {
                session_id: result.session_id,
                next_question: result.next_question,
                extracted_symptoms: result.extracted_symptoms || [],
                raw_complaint: complaint.trim(),
                patient_id: patientId,
            }
        })
    }

    return (
        <PageLayout
            header={
                <PageHeader>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/diagnosis')}
                            className="p-3 rounded-xl text-sage-600 hover:bg-sage-100"
                            aria-label="Back"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </motion.button>
                        <div>
                            <div className="text-sage-500 text-sm font-bold uppercase tracking-wider">Assistive Diagnosis</div>
                            <h1 className="text-2xl font-serif font-bold text-sage-900">Describe Your Symptoms</h1>
                        </div>
                    </div>
                </PageHeader>
            }
            nav={activeRole === 'caregiver' ? <FamilyNav /> : <ElderNav onImOk={() => { }} />}
        >
            <PageMain>
                <PageSection>
                    <Card>
                        <div className="flex items-center gap-2 mb-3">
                            <Stethoscope className="w-5 h-5 text-sage-600" />
                            <h2 className="text-xl font-bold text-sage-800">What are you feeling today?</h2>
                        </div>

                        <textarea
                            value={complaint}
                            onChange={(e) => setComplaint(e.target.value)}
                            placeholder="Example: I feel dizzy since morning and my chest feels heavy."
                            className="w-full min-h-32 p-4 text-lg rounded-2xl border-2 border-sage-200 focus:outline-none focus:ring-2 focus:ring-sage-300 resize-y"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            <Button
                                variant={listening ? 'danger' : 'secondary'}
                                size="lg"
                                icon={listening ? MicOff : Mic}
                                onClick={toggleVoiceInput}
                                fullWidth
                            >
                                {listening ? 'Stop Listening' : 'Voice Input'}
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                icon={Send}
                                iconPosition="right"
                                onClick={handleSubmit}
                                loading={submitting}
                                fullWidth
                            >
                                Start Questions
                            </Button>
                        </div>

                        {error && (
                            <p className="text-rose-600 font-semibold mt-3 text-lg">{error}</p>
                        )}
                    </Card>
                </PageSection>
            </PageMain>
        </PageLayout>
    )
}
