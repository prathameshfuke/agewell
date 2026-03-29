import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, History, Stethoscope } from 'lucide-react'

import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import ElderNav from '../../components/ElderNav'
import FamilyNav from '../../components/FamilyNav'
import { Card, Button } from '../../components/ui'
import { PageLayout, PageHeader, PageMain, PageSection } from '../../components/layout'

const urgencyStyles = {
    ROUTINE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CONSULT_SOON: 'bg-amber-100 text-amber-800 border-amber-200',
    GO_NOW: 'bg-rose-100 text-rose-700 border-rose-200'
}

export default function DiagnosisHome() {
    const navigate = useNavigate()
    const { user, profile, activeRole } = useAuth()

    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    const patientId = useMemo(() => {
        if (activeRole === 'caregiver') return profile?.linked_elderly_id
        return user?.id
    }, [activeRole, profile, user])

    useEffect(() => {
        const loadHistory = async () => {
            if (!patientId) {
                setHistory([])
                setLoading(false)
                return
            }

            const result = await api.getDiagnosisHistory(patientId)
            if (result.success) {
                setHistory(result.history || [])
            }
            setLoading(false)
        }

        loadHistory()
    }, [patientId])

    const lastSession = history[0]

    return (
        <PageLayout
            header={
                <PageHeader>
                    <div className="text-sage-500 text-sm font-bold uppercase tracking-wider mb-1">Assistive Diagnosis</div>
                    <h1 className="text-3xl font-serif font-bold text-sage-900">Check My Symptoms</h1>
                    <p className="text-sage-500 text-lg mt-1">Answer a few simple questions for a doctor-ready summary.</p>
                </PageHeader>
            }
            nav={activeRole === 'caregiver' ? <FamilyNav /> : <ElderNav onImOk={() => { }} />}
            background="gradient"
        >
            <PageMain>
                <PageSection>
                    <Card className="border-2 border-sage-200">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-sage-100 flex items-center justify-center flex-shrink-0">
                                <Stethoscope className="w-7 h-7 text-sage-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold text-sage-800">Symptom Intake</h2>
                                <p className="text-sage-600 text-lg mt-1">Describe what you feel. We will ask simple yes/no questions and generate a printable summary.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                icon={ArrowRight}
                                iconPosition="right"
                                onClick={() => navigate('/diagnosis/input')}
                            >
                                Start Check
                            </Button>
                            <Button
                                variant="secondary"
                                size="lg"
                                fullWidth
                                icon={History}
                                onClick={() => navigate('/diagnosis/history')}
                            >
                                View History
                            </Button>
                        </div>
                    </Card>
                </PageSection>

                <PageSection delay={0.05}>
                    <Card>
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <h3 className="text-xl font-bold text-sage-800">Latest Session</h3>
                            {lastSession?.urgency_level && (
                                <span className={`px-3 py-1.5 rounded-xl border text-sm font-bold ${urgencyStyles[lastSession.urgency_level] || urgencyStyles.ROUTINE}`}>
                                    {lastSession.urgency_level}
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <p className="text-sage-500 text-lg">Loading sessions...</p>
                        ) : lastSession ? (
                            <>
                                <p className="text-sage-700 text-lg">{lastSession.raw_complaint}</p>
                                <p className="text-sage-500 mt-2">
                                    {new Date(lastSession.created_at).toLocaleString()}
                                </p>
                            </>
                        ) : (
                            <div className="flex items-start gap-2 text-sage-600">
                                <AlertTriangle className="w-5 h-5 mt-1 flex-shrink-0" />
                                <p className="text-lg">No diagnosis sessions yet. Start your first symptom check.</p>
                            </div>
                        )}
                    </Card>
                </PageSection>
            </PageMain>
        </PageLayout>
    )
}
