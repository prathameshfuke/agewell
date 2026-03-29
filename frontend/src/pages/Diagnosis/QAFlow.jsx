import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import ElderNav from '../../components/ElderNav'
import FamilyNav from '../../components/FamilyNav'
import { Card, Button } from '../../components/ui'
import { PageLayout, PageHeader, PageMain, PageSection } from '../../components/layout'
import ImageUpload from './ImageUpload'

const TOTAL_QUESTIONS = 8

function progressPercent(progressLabel) {
    const current = Number((progressLabel || '1/8').split('/')[0] || 1)
    return Math.max(0, Math.min(100, Math.round((current / TOTAL_QUESTIONS) * 100)))
}

export default function QAFlow() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, profile, activeRole } = useAuth()

    const sessionId = location.state?.session_id
    const initialQuestion = location.state?.next_question
    const extractedSymptoms = location.state?.extracted_symptoms || []

    const [currentQuestion, setCurrentQuestion] = useState(initialQuestion || '')
    const [qaPairs, setQaPairs] = useState([])
    const [progress, setProgress] = useState('1/8')
    const [done, setDone] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState('')

    const patientId = useMemo(() => {
        if (activeRole === 'caregiver') return profile?.linked_elderly_id
        return user?.id
    }, [activeRole, profile, user])

    useEffect(() => {
        if (!sessionId || !initialQuestion) {
            navigate('/diagnosis/input', { replace: true })
        }
    }, [initialQuestion, navigate, sessionId])

    const submitAnswer = async (answer) => {
        if (!currentQuestion || !sessionId) return

        setSubmitting(true)
        setError('')

        const response = await api.submitDiagnosisAnswer(sessionId, currentQuestion, answer)
        setSubmitting(false)

        if (!response.success) {
            setError(response.error || 'Could not save your answer.')
            return
        }

        setQaPairs((prev) => [...prev, { question: currentQuestion, answer }])
        setProgress(response.progress || progress)

        if (response.done) {
            setDone(true)
            setCurrentQuestion('')
            return
        }

        setCurrentQuestion(response.next_question || '')
    }

    const generateReport = async () => {
        if (!sessionId) return

        setGenerating(true)
        setError('')

        let medicationNames = []
        if (patientId) {
            const medRes = await api.getMedications(patientId)
            if (medRes.success && Array.isArray(medRes.medications)) {
                medicationNames = medRes.medications
                    .map((m) => m?.name)
                    .filter(Boolean)
            }
        }

        const reportRes = await api.generateDiagnosisReport(
            sessionId,
            medicationNames,
            profile?.full_name || user?.user_metadata?.full_name || 'Patient'
        )

        setGenerating(false)

        if (!reportRes.success) {
            setError(reportRes.error || 'Report generation failed.')
            return
        }

        navigate('/diagnosis/report', {
            state: {
                report: reportRes.report,
                session_id: sessionId,
                urgency_level: reportRes.urgency_level,
                alert_sent: reportRes.alert_sent,
                alert_channels: reportRes.alert_channels || [],
                patient_name: profile?.full_name || user?.user_metadata?.full_name || 'Patient'
            }
        })
    }

    useEffect(() => {
        if (!done || generating) return
        generateReport()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done])

    return (
        <PageLayout
            header={
                <PageHeader>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/diagnosis/input')}
                            className="p-3 rounded-xl text-sage-600 hover:bg-sage-100"
                            aria-label="Back"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </motion.button>
                        <div>
                            <div className="text-sage-500 text-sm font-bold uppercase tracking-wider">Assistive Diagnosis</div>
                            <h1 className="text-2xl font-serif font-bold text-sage-900">Simple Yes/No Questions</h1>
                        </div>
                    </div>
                </PageHeader>
            }
            nav={activeRole === 'caregiver' ? <FamilyNav /> : <ElderNav onImOk={() => { }} />}
        >
            <PageMain>
                <PageSection>
                    <Card>
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="text-lg font-bold text-sage-800">Progress {progress}</div>
                            <div className="text-sage-500 text-sm">Max {TOTAL_QUESTIONS} questions</div>
                        </div>
                        <div className="w-full h-3 rounded-full bg-sage-100 overflow-hidden">
                            <motion.div
                                className="h-full bg-sage-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent(progress)}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </Card>
                </PageSection>

                {extractedSymptoms.length > 0 && (
                    <PageSection delay={0.03}>
                        <Card>
                            <h3 className="text-xl font-bold text-sage-800 mb-2">Detected Symptoms</h3>
                            <div className="flex flex-wrap gap-2">
                                {extractedSymptoms.map((symptom, idx) => (
                                    <span
                                        key={`${symptom}-${idx}`}
                                        className="px-3 py-1.5 rounded-xl bg-sage-100 text-sage-700 font-semibold"
                                    >
                                        {symptom}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    </PageSection>
                )}

                {!done ? (
                    <PageSection delay={0.05}>
                        <Card>
                            <h2 className="text-2xl font-bold text-sage-900 leading-relaxed mb-4">{currentQuestion}</h2>

                            <div className="grid grid-cols-1 gap-3">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    className="text-xl"
                                    onClick={() => submitAnswer('yes')}
                                    loading={submitting}
                                    disabled={submitting}
                                >
                                    YES
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    fullWidth
                                    className="text-xl"
                                    onClick={() => submitAnswer('no')}
                                    disabled={submitting}
                                >
                                    NO
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="default"
                                    fullWidth
                                    className="text-lg"
                                    onClick={() => submitAnswer('skip')}
                                    disabled={submitting}
                                >
                                    Skip (I am not sure)
                                </Button>
                            </div>
                        </Card>
                    </PageSection>
                ) : (
                    <PageSection delay={0.05}>
                        <Card>
                            <div className="flex items-center gap-2 text-sage-700">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-xl font-bold">Preparing your report...</span>
                            </div>
                            <p className="text-sage-500 mt-2">We are creating a doctor-ready symptom summary.</p>
                        </Card>
                    </PageSection>
                )}

                <PageSection delay={0.08}>
                    <ImageUpload sessionId={sessionId} onUploadComplete={() => { }} />
                </PageSection>

                {error && (
                    <PageSection delay={0.1}>
                        <Card className="bg-rose-50 border border-rose-200">
                            <p className="text-rose-700 text-lg font-semibold">{error}</p>
                        </Card>
                    </PageSection>
                )}
            </PageMain>
        </PageLayout>
    )
}
