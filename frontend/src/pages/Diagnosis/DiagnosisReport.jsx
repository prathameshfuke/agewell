import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, CheckCircle, Download, Share2 } from 'lucide-react'

import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import ElderNav from '../../components/ElderNav'
import FamilyNav from '../../components/FamilyNav'
import { Card, Button } from '../../components/ui'
import { PageLayout, PageHeader, PageMain, PageSection } from '../../components/layout'

const urgencyClasses = {
    ROUTINE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CONSULT_SOON: 'bg-amber-100 text-amber-800 border-amber-200',
    GO_NOW: 'bg-rose-100 text-rose-700 border-rose-200'
}

const DISCLAIMER = 'This summary is for informational purposes only and is not a medical diagnosis. Consult a qualified doctor.'

export default function DiagnosisReport() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, profile, activeRole } = useAuth()

    const [sharing, setSharing] = useState(false)
    const [shareMessage, setShareMessage] = useState('')
    const [dismissed, setDismissed] = useState(false)

    const sessionId = location.state?.session_id
    const report = location.state?.report
    const urgencyLevel = location.state?.urgency_level || report?.urgency_level || 'ROUTINE'
    const urgencyReason = report?.urgency_reason || 'Please seek medical attention.'
    const alertSent = Boolean(location.state?.alert_sent)
    const alertChannels = Array.isArray(location.state?.alert_channels)
        ? location.state.alert_channels
        : []

    const patientName = useMemo(() => {
        return location.state?.patient_name || profile?.full_name || user?.user_metadata?.full_name || 'Patient'
    }, [location.state, profile, user])

    const goBack = () => {
        navigate('/diagnosis/history')
    }

    const handleDownloadPdf = () => {
        if (!sessionId) return
        const url = api.getDiagnosisPdfUrl(sessionId, patientName)
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    const handleShare = async () => {
        if (!sessionId) return
        setSharing(true)
        setShareMessage('')

        const res = await api.shareDiagnosisReport(sessionId, patientName)
        setSharing(false)

        if (res.success) {
            setShareMessage('Shared with caregiver successfully.')
        } else {
            setShareMessage(res.error || 'Could not share report.')
        }
    }

    if (!report) {
        return (
            <PageLayout
                header={
                    <PageHeader>
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={goBack}
                                className="p-3 rounded-xl text-sage-600 hover:bg-sage-100"
                                aria-label="Back to history"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </motion.button>
                            <h1 className="text-2xl font-serif font-bold text-sage-900">Diagnosis Report</h1>
                        </div>
                    </PageHeader>
                }
                nav={activeRole === 'caregiver' ? <FamilyNav /> : <ElderNav onImOk={() => { }} />}
            >
                <PageMain>
                    <Card>
                        <p className="text-sage-700 text-lg">No report found. Open a session from history or complete a new symptom check.</p>
                        <Button className="mt-4" onClick={() => navigate('/diagnosis/history')}>Go to History</Button>
                    </Card>
                </PageMain>
            </PageLayout>
        )
    }

    return (
        <PageLayout
            header={
                <PageHeader>
                    <div className="flex items-start gap-3">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={goBack}
                            className="p-3 rounded-xl text-sage-600 hover:bg-sage-100"
                            aria-label="Back to history"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </motion.button>
                        <div>
                            <div className="text-sage-500 text-sm font-bold uppercase tracking-wider mb-1">Assistive Diagnosis</div>
                            <h1 className="text-3xl font-serif font-bold text-sage-900">Symptom Summary Report</h1>
                            <p className="text-sage-500 text-lg mt-1">Prepared for doctor discussion.</p>
                        </div>
                    </div>
                </PageHeader>
            }
            nav={activeRole === 'caregiver' ? <FamilyNav /> : <ElderNav onImOk={() => { }} />}
            background="gradient"
        >
            <PageMain>
                {urgencyLevel === 'GO_NOW' && !dismissed && (
                    <div className="fixed inset-0 bg-rose-600 z-50 flex flex-col items-center justify-center p-8 text-white">
                        <AlertTriangle size={64} className="mb-4 animate-pulse" />
                        <h1 className="text-3xl font-bold text-center mb-3">Seek Immediate Help</h1>
                        <p className="text-xl text-center text-rose-100 mb-8">{urgencyReason}</p>
                        <p className="text-sm text-rose-200 mb-8 text-center">
                            {alertSent
                                ? 'Your family has been notified automatically.'
                                : 'Please contact a caregiver and emergency services now.'}
                        </p>
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <a
                                href="tel:112"
                                className="bg-white text-rose-600 font-bold text-lg py-4 px-8 rounded-xl text-center"
                            >
                                Call Emergency (112)
                            </a>
                            <button
                                onClick={() => setDismissed(true)}
                                className="bg-rose-700 text-white font-medium py-3 px-8 rounded-xl"
                            >
                                View Full Report
                            </button>
                        </div>
                    </div>
                )}

                <PageSection>
                    <Card>
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="text-xl font-bold text-sage-800">Urgency</div>
                            <span className={`px-3 py-1.5 rounded-xl border font-bold ${urgencyClasses[urgencyLevel] || urgencyClasses.ROUTINE}`}>
                                {urgencyLevel}
                            </span>
                        </div>
                        <p className="text-sage-700 text-lg">{urgencyReason}</p>

                        {alertSent && (
                            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                                <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={20} />
                                <div>
                                    <p className="font-semibold text-emerald-800 text-sm">Family notified</p>
                                    <p className="text-emerald-700 text-xs mt-0.5">
                                        Alert sent via {(alertChannels.length > 0 ? alertChannels.join(', ') : 'in_app')} to your registered contacts.
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>
                </PageSection>

                <PageSection delay={0.05}>
                    <Card>
                        <h2 className="text-2xl font-bold text-sage-900 mb-2">Symptom Summary</h2>
                        <p className="text-sage-700 text-lg leading-relaxed">{report.symptom_summary}</p>
                    </Card>
                </PageSection>

                <PageSection delay={0.1}>
                    <Card>
                        <h2 className="text-2xl font-bold text-sage-900 mb-2">Possible Conditions</h2>
                        <ul className="space-y-2 text-lg text-sage-700">
                            {(report.possible_conditions || []).map((condition, idx) => (
                                <li key={`${condition}-${idx}`}>- {condition}</li>
                            ))}
                        </ul>
                    </Card>
                </PageSection>

                <PageSection delay={0.15}>
                    <Card>
                        <h2 className="text-2xl font-bold text-sage-900 mb-2">Medication Flags</h2>
                        {(report.medication_flags || []).length > 0 ? (
                            <ul className="space-y-2 text-lg text-sage-700">
                                {report.medication_flags.map((flag, idx) => (
                                    <li key={`${flag}-${idx}`}>- {flag}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sage-500 text-lg">No medication side-effect flags found from this intake.</p>
                        )}
                    </Card>
                </PageSection>

                <PageSection delay={0.2}>
                    <Card>
                        <h2 className="text-2xl font-bold text-sage-900 mb-2">Questions to Ask Your Doctor</h2>
                        <ul className="space-y-2 text-lg text-sage-700">
                            {(report.doctor_questions || []).map((question, idx) => (
                                <li key={`${question}-${idx}`}>- {question}</li>
                            ))}
                        </ul>
                    </Card>
                </PageSection>

                <PageSection delay={0.25}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            variant="primary"
                            size="lg"
                            icon={Download}
                            fullWidth
                            onClick={handleDownloadPdf}
                        >
                            Download PDF
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            icon={Share2}
                            fullWidth
                            onClick={handleShare}
                            loading={sharing}
                        >
                            Share with Caregiver
                        </Button>
                    </div>
                    {shareMessage && (
                        <p className="mt-3 text-center text-sage-600 font-semibold">{shareMessage}</p>
                    )}
                </PageSection>

                <div className="text-xs text-gray-400 text-center pb-2">
                    {report.disclaimer || DISCLAIMER}
                </div>
            </PageMain>
        </PageLayout>
    )
}
