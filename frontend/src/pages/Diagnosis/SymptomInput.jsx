import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mic, MicOff, Send, Stethoscope } from 'lucide-react'

import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import ElderNav from '../../components/ElderNav'
import FamilyNav from '../../components/FamilyNav'
import { Card, Button } from '../../components/ui'
import { PageLayout, PageHeader, PageMain, PageSection } from '../../components/layout'

const DIAGNOSIS_COMPLAINT_DRAFT_KEY = 'agewell_diagnosis_complaint_draft'
const SPEECH_CONNECTORS = new Set(['and', 'or', 'but', 'then', 'because'])

function normalizeSpeechToken(token) {
    return (token || '').toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')
}

function compactSpeechPrefixes(tokens) {
    const output = []
    let index = 0

    while (index < tokens.length) {
        let overlap = 0
        const maxOverlap = Math.min(output.length, tokens.length - index)
        const previousToken = normalizeSpeechToken(output[output.length - 1])
        const canTreatAsRestart = !SPEECH_CONNECTORS.has(previousToken)

        if (canTreatAsRestart) {
            for (let size = maxOverlap; size >= 1; size -= 1) {
                if (output.length > 1 && size < 2) continue

                let matches = true
                for (let offset = 0; offset < size; offset += 1) {
                    if (normalizeSpeechToken(output[offset]) !== normalizeSpeechToken(tokens[index + offset])) {
                        matches = false
                        break
                    }
                }

                if (matches) {
                    overlap = size
                    break
                }
            }
        }

        if (overlap > 0) {
            index += overlap
            continue
        }

        output.push(tokens[index])
        index += 1
    }

    return output
}

function compactIncrementalSpeech(rawText) {
    const normalized = (rawText || '')
        .replace(/[|]+/g, ' ')
        .replace(/\s+([,.!?;:])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()

    if (!normalized) return ''

    const tokens = normalized.split(/\s+/)
    let compactedTokens = compactSpeechPrefixes(tokens)

    const prefixLength = Math.min(3, compactedTokens.length)
    if (prefixLength >= 2) {
        const prefix = compactedTokens.slice(0, prefixLength).map(normalizeSpeechToken)
        const restartIndexes = []

        for (let index = 0; index <= tokens.length - prefixLength; index += 1) {
            const matches = prefix.every((token, offset) => normalizeSpeechToken(tokens[index + offset]) === token)
            if (matches) restartIndexes.push(index)
        }

        if (restartIndexes.length >= 3) {
            const latestRestart = restartIndexes[restartIndexes.length - 1]
            compactedTokens = compactSpeechPrefixes(tokens.slice(latestRestart))
        }
    }

    return compactedTokens
        .join(' ')
        .replace(/\s+([,.!?;:])/g, '$1')
        .replace(/[.:;,\s]+$/g, '')
        .trim()
}

function cleanComplaintText(rawText) {
    return compactIncrementalSpeech(rawText)
}

function saveComplaintDraft(value) {
    try {
        sessionStorage.setItem(DIAGNOSIS_COMPLAINT_DRAFT_KEY, value)
    } catch {
        // Ignore storage errors and continue typing.
    }
}

function mergeComplaintParts(existing, spoken) {
    const base = cleanComplaintText(existing)
    const next = cleanComplaintText(spoken)

    if (!base) return next
    if (!next) return base

    const normalizedBase = base.toLowerCase()
    const normalizedNext = next.toLowerCase()

    if (normalizedBase.endsWith(normalizedNext)) return base
    if (normalizedNext.startsWith(normalizedBase)) return next

    return `${base} ${next}`.trim()
}

export default function SymptomInput() {
    const navigate = useNavigate()
    const { user, profile, activeRole } = useAuth()

    const [complaint, setComplaint] = useState(() => {
        try {
            return sessionStorage.getItem(DIAGNOSIS_COMPLAINT_DRAFT_KEY) || ''
        } catch {
            return ''
        }
    })
    const [listening, setListening] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const recognitionRef = useRef(null)
    const voiceBaseRef = useRef('')
    const voiceTranscriptRef = useRef('')

    const patientId = useMemo(() => {
        if (activeRole === 'caregiver') return profile?.linked_elderly_id
        return user?.id
    }, [activeRole, profile, user])

    const updateComplaintFromVoice = useCallback((spokenText) => {
        const mergedComplaint = mergeComplaintParts(voiceBaseRef.current, spokenText)
        setComplaint(mergedComplaint)
        saveComplaintDraft(mergedComplaint)
    }, [])

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) return

        const recognition = new SpeechRecognition()
        recognition.lang = 'en-US'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onresult = (event) => {
            const finalParts = []
            const interimParts = []

            for (let index = 0; index < event.results.length; index += 1) {
                const result = event.results[index]
                const transcript = result?.[0]?.transcript || ''
                if (!transcript) continue

                if (result.isFinal) {
                    finalParts.push(transcript)
                } else {
                    interimParts.push(transcript)
                }
            }

            const transcript = cleanComplaintText([...finalParts, ...interimParts].join(' '))
            if (!transcript) return

            voiceTranscriptRef.current = transcript
            updateComplaintFromVoice(transcript)
        }

        recognition.onend = () => setListening(false)
        recognition.onerror = () => setListening(false)

        recognitionRef.current = recognition

        return () => {
            try {
                recognition.abort()
            } catch {
                // The browser may already have stopped recognition.
            }
        }
    }, [updateComplaintFromVoice])

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

        voiceBaseRef.current = cleanComplaintText(complaint)
        voiceTranscriptRef.current = ''

        try {
            recognitionRef.current.start()
            setListening(true)
        } catch {
            setListening(false)
            setError('Voice input is already active. Please stop it and try again.')
        }
    }

    const handleSubmit = async () => {
        if (!patientId) {
            setError('No patient profile found for diagnosis session.')
            return
        }

        const cleanedComplaint = cleanComplaintText(complaint)

        if (!cleanedComplaint) {
            setError('Please describe your symptoms first.')
            return
        }

        if (cleanedComplaint !== complaint) {
            setComplaint(cleanedComplaint)
            saveComplaintDraft(cleanedComplaint)
        }

        setSubmitting(true)
        setError('')

        const result = await api.startDiagnosisSession(patientId, cleanedComplaint)
        setSubmitting(false)

        if (!result.success) {
            setError(result.error || 'Could not start diagnosis session.')
            return
        }

        const firstQuestion =
            result.next_question ||
            result.initial_question ||
            result.initialQuestion ||
            result.question ||
            ''
        const normalizedFirstQuestion = (firstQuestion || '').trim()
        const safeFirstQuestion = /^error[:\s]/i.test(normalizedFirstQuestion)
            ? 'Are your symptoms getting worse compared to earlier today?'
            : normalizedFirstQuestion

        if (!safeFirstQuestion) {
            setError('Diagnosis service did not return the first question. Please retry.')
            return
        }

        try {
            sessionStorage.removeItem(DIAGNOSIS_COMPLAINT_DRAFT_KEY)
            sessionStorage.setItem(
                `agewell_diag_qa_${result.session_id}`,
                JSON.stringify({
                    session_id: result.session_id,
                    currentQuestion: safeFirstQuestion,
                    extractedSymptoms: result.extracted_symptoms || [],
                    qaPairs: [],
                    progress: '1/8',
                    done: false,
                    audioBase64: result.audio_base64 || null,
                })
            )
        } catch {
            // Ignore storage errors and continue with flow.
        }

        navigate(`/diagnosis/qa?session_id=${encodeURIComponent(result.session_id)}`, {
            replace: true,
            state: {
                session_id: result.session_id,
                next_question: safeFirstQuestion,
                initial_question: safeFirstQuestion,
                extracted_symptoms: result.extracted_symptoms || [],
                raw_complaint: cleanedComplaint,
                patient_id: patientId,
                audio_base64: result.audio_base64 || null,
                has_audio: Boolean(result.has_audio),
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
                            onChange={(e) => {
                                const nextValue = e.target.value
                                setComplaint(nextValue)
                                saveComplaintDraft(nextValue)
                            }}
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
