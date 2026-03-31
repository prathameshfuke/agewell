import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, FileText } from 'lucide-react'

import { api } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import ElderNav from '../../components/ElderNav'
import FamilyNav from '../../components/FamilyNav'
import { Card, Button } from '../../components/ui'
import { PageLayout, PageHeader, PageMain, PageSection } from '../../components/layout'

const urgencyOrder = {
    GO_NOW: 0,
    CONSULT_SOON: 1,
    ROUTINE: 2,
}

const urgencyStyles = {
    ROUTINE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CONSULT_SOON: 'bg-amber-100 text-amber-800 border-amber-200',
    GO_NOW: 'bg-rose-100 text-rose-700 border-rose-200',
}

export default function DiagnosisHistory() {
    const navigate = useNavigate()
    const { user, profile, activeRole } = useAuth()

    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedSessionId, setExpandedSessionId] = useState(null)
    const [auditLogs, setAuditLogs] = useState({})
    const [auditLoadingId, setAuditLoadingId] = useState(null)

    const patientId = useMemo(() => {
        if (activeRole === 'caregiver') return profile?.linked_elderly_id
        return user?.id
    }, [activeRole, profile, user])

    useEffect(() => {
        const fetchHistory = async () => {
            if (!patientId) {
                setHistory([])
                setLoading(false)
                return
            }

            setLoading(true)
            const response = await api.getDiagnosisHistory(patientId)
            setLoading(false)

            if (response.success) {
                const rows = response.history || []
                rows.sort((a, b) => {
                    const urgencyDiff = (urgencyOrder[a.urgency_level] ?? 9) - (urgencyOrder[b.urgency_level] ?? 9)
                    if (urgencyDiff !== 0) return urgencyDiff
                    return new Date(b.created_at) - new Date(a.created_at)
                })
                setHistory(rows)
            }
        }

        fetchHistory()
    }, [patientId])

    const openRow = (row) => {
        if (!row.report_json) {
            alert('This session does not have a generated report yet.')
            return
        }

        navigate(`/diagnosis/report?session_id=${encodeURIComponent(row.session_id)}`, {
            state: {
                report: row.report_json,
                session_id: row.session_id,
                urgency_level: row.urgency_level,
                patient_name: profile?.full_name || 'Patient',
            }
        })
    }

    const eventLabel = (eventType) => {
        const labels = {
            session_started: 'Session Started',
            qa_answered: 'Question Answered',
            image_uploaded: 'Image Uploaded',
            report_generated: 'Report Generated',
            alert_sent: 'Alert Sent',
            pdf_exported: 'PDF Exported',
        }
        return labels[eventType] || eventType
    }

    const toggleFullLog = async (sessionId) => {
        if (expandedSessionId === sessionId) {
            setExpandedSessionId(null)
            return
        }

        setExpandedSessionId(sessionId)

        if (auditLogs[sessionId]) {
            return
        }

        setAuditLoadingId(sessionId)
        const response = await api.getDiagnosisAuditLog(sessionId)
        setAuditLoadingId(null)

        if (response.success) {
            setAuditLogs((prev) => ({ ...prev, [sessionId]: response.log || [] }))
        } else {
            setAuditLogs((prev) => ({ ...prev, [sessionId]: [] }))
        }
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
                            <h1 className="text-2xl font-serif font-bold text-sage-900">Session History</h1>
                        </div>
                    </div>
                </PageHeader>
            }
            nav={activeRole === 'caregiver' ? <FamilyNav /> : <ElderNav onImOk={() => { }} />}
            background="gradient"
        >
            <PageMain>
                {loading ? (
                    <PageSection>
                        <Card>
                            <p className="text-sage-500 text-lg">Loading diagnosis history...</p>
                        </Card>
                    </PageSection>
                ) : history.length === 0 ? (
                    <PageSection>
                        <Card>
                            <p className="text-sage-700 text-lg">No symptom reports found yet.</p>
                            <Button className="mt-4" onClick={() => navigate('/diagnosis/input')}>Start New Check</Button>
                        </Card>
                    </PageSection>
                ) : (
                    <PageSection>
                        <div className="space-y-3">
                            {history.map((row) => (
                                <Card key={row.session_id} className="border-2 border-sage-100">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sage-800 text-lg font-semibold break-words">{row.raw_complaint}</p>
                                            <div className="flex flex-wrap gap-3 mt-2 text-sage-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(row.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{new Date(row.created_at).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl border text-sm font-bold flex-shrink-0 ${urgencyStyles[row.urgency_level] || urgencyStyles.ROUTINE}`}>
                                            {row.urgency_level || 'ROUTINE'}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => openRow(row)}
                                            className="px-3 py-2 rounded-lg bg-sage-500 text-white font-semibold text-sm"
                                        >
                                            Open Report
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleFullLog(row.session_id)}
                                            className="px-3 py-2 rounded-lg bg-sage-100 text-sage-700 font-semibold text-sm inline-flex items-center gap-1.5"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Full Log
                                        </motion.button>
                                    </div>

                                    {expandedSessionId === row.session_id && (
                                        <div className="mt-4 border-l-2 border-sage-200 pl-4 space-y-3">
                                            {auditLoadingId === row.session_id ? (
                                                <p className="text-sage-500 text-sm">Loading audit timeline...</p>
                                            ) : (auditLogs[row.session_id] || []).length === 0 ? (
                                                <p className="text-sage-500 text-sm">No audit events available for this session yet.</p>
                                            ) : (
                                                (auditLogs[row.session_id] || []).map((event) => (
                                                    <div key={event.id} className="relative">
                                                        <span className="absolute -left-[22px] top-2 w-3 h-3 rounded-full bg-sage-400" />
                                                        <div className="bg-sage-50 border border-sage-100 rounded-lg p-3">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="font-semibold text-sage-800 text-sm">{eventLabel(event.event_type)}</p>
                                                                <p className="text-xs text-sage-500">
                                                                    {new Date(event.created_at).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            {event.event_data && Object.keys(event.event_data).length > 0 && (
                                                                <pre className="mt-2 text-xs text-sage-600 whitespace-pre-wrap break-words">
                                                                    {JSON.stringify(event.event_data, null, 2)}
                                                                </pre>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </PageSection>
                )}
            </PageMain>
        </PageLayout>
    )
}
