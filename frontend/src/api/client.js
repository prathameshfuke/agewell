// AgeWell API client. Supabase for data; the Flask backend (VITE_API_URL) for AI/link/etc.

import { supabase, db, isSupabaseConfigured } from '../lib/supabase'

// Production must set VITE_API_URL; only dev falls back to localhost.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5001/api')
if (!API_URL) {
    console.error('VITE_API_URL is not set for this production build. Backend API calls will fail.')
}

const useSupabase = isSupabaseConfigured()
const NO_SUPABASE = { success: false, error: 'Supabase is not configured' }
const REQUEST_TIMEOUT_MS = 45000 // Render free tier cold starts can take ~25s
const TIMEOUT_MESSAGE = 'The server is taking too long to respond. Try again in a moment.'

// Helper for fetch requests to the backend. Always resolves to an object; failures are { success:false, error }.
const fetchApi = async (endpoint, options = {}) => {
    if (!API_URL) {
        return { success: false, error: 'The app is not connected to a server (VITE_API_URL is missing).' }
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
        const headers = { ...(options.headers || {}) }
        try {
            const { data: sessionData } = (await supabase?.auth.getSession()) || {}
            const token = sessionData?.session?.access_token
            if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`
        } catch {
            // no session: send unauthenticated and let the server answer 401
        }
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json'
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        })

        const contentType = response.headers.get('content-type') || ''
        const data = contentType.includes('application/json')
            ? await response.json().catch(() => null)
            : await response.text().catch(() => '')

        if (!response.ok) {
            if (response.status === 401) {
                return { ...(data && typeof data === 'object' ? data : {}), success: false, error: 'Your session has expired. Sign in again.' }
            }
            if (data && typeof data === 'object') {
                return { ...data, success: false, error: data.error || data.message || `Request failed (${response.status}).` }
            }
            return { success: false, error: (typeof data === 'string' && data.length < 200 && data) || `Request failed (${response.status}).` }
        }

        return data ?? { success: true }
    } catch (error) {
        console.error('API Error:', error)
        if (error?.name === 'AbortError') {
            return { success: false, error: TIMEOUT_MESSAGE }
        }
        return { success: false, error: 'Could not reach the server. Check your connection and try again.' }
    } finally {
        clearTimeout(timer)
    }
}

const dateFromInput = (date = null) => {
    if (date instanceof Date) return new Date(date)
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number)
        return new Date(year, month - 1, day)
    }
    if (date) return new Date(date)
    return new Date()
}

const dateKey = (date) => {
    const value = dateFromInput(date)
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const dayBounds = (date = null) => {
    const start = dateFromInput(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)
    return { start, end }
}

const scheduledAt = (date = null, time = '08:00') => {
    const [hour = 8, minute = 0] = String(time).split(':').map(Number)
    const value = dateFromInput(date)
    value.setHours(hour, minute, 0, 0)
    return value
}

const sameScheduledMinute = (left, right) => {
    if (!left || !right) return false
    return Math.abs(new Date(left).getTime() - new Date(right).getTime()) < 60 * 1000
}

const normalizeHealthReading = (reading = {}) => ({
    ...reading,
    body_temperature: reading.body_temperature ?? reading.temperature ?? null,
    temperature: reading.temperature ?? reading.body_temperature ?? null,
})

const summarizeHealthStats = (history = []) => {
    const readings = [...history]
        .map(normalizeHealthReading)
        .sort((a, b) => new Date(b.recorded_at || b.timestamp || 0) - new Date(a.recorded_at || a.timestamp || 0))

    const latest = readings[0] || {}
    const heartRates = readings.map((row) => Number(row.heart_rate)).filter(Number.isFinite)
    const avgHeartRate = heartRates.length
        ? Math.round(heartRates.reduce((sum, value) => sum + value, 0) / heartRates.length)
        : null

    const daily = new Map()
    for (const row of readings) {
        const value = Number(row.heart_rate)
        if (!Number.isFinite(value)) continue

        const key = dateKey(row.recorded_at || row.timestamp)
        const existing = daily.get(key) || { total: 0, count: 0 }
        daily.set(key, { total: existing.total + value, count: existing.count + 1 })
    }

    const weekly = [...daily.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([label, item]) => ({
            label: label.slice(5),
            value: Math.round(item.total / item.count),
        }))

    const first = weekly[0]?.value
    const last = weekly[weekly.length - 1]?.value
    const trend = first && last
        ? (last > first + 3 ? 'up' : last < first - 3 ? 'down' : 'stable')
        : 'stable'

    return {
        latest,
        history: readings,
        weekly,
        avgHeartRate,
        avgSteps: null,
        trend,
        trends: {
            heartRate: trend,
            steps: 'stable',
            sleep: 'stable',
        },
    }
}

const groupActivities = (activities = []) => {
    const grouped = { morning: [], afternoon: [], evening: [] }

    for (const activity of activities) {
        if (!activity.timestamp) continue
        const hour = new Date(activity.timestamp).getHours()
        if (hour < 12) grouped.morning.push(activity)
        else if (hour < 17) grouped.afternoon.push(activity)
        else grouped.evening.push(activity)
    }

    return grouped
}

// Unified API interface
export const api = {
    // AI keys are server-side now. Inert stubs kept so older settings screens do not crash.

    getProfile: async (userId) => {
        if (!userId) return null

        if (useSupabase) {
            try {
                return await db.profiles.get(userId)
            } catch (error) {
                console.error('Profile load failed:', error)
                return null
            }
        }

        const result = await fetchApi(`/users/${userId}`, { method: 'GET' })
        return result?.user || null
    },

    // ====== CAREGIVER LINKING ======
    generateLinkCode: async (elderId) => {
        if (!elderId) {
            return { success: false, error: 'elderId is required' }
        }

        return fetchApi('/link/generate-code', {
            method: 'POST',
            body: JSON.stringify({ elder_id: elderId })
        })
    },

    joinLinkCode: async (caregiverId, linkCode) => {
        if (!caregiverId || !linkCode) {
            return { success: false, error: 'caregiverId and linkCode are required' }
        }

        return fetchApi('/link/join', {
            method: 'POST',
            body: JSON.stringify({
                caregiver_id: caregiverId,
                link_code: String(linkCode).trim().toUpperCase()
            })
        })
    },

    getLinkedElders: async (caregiverId) => {
        if (!caregiverId) {
            return { success: false, error: 'caregiverId is required' }
        }

        return fetchApi(`/link/my-elders/${caregiverId}`, {
            method: 'GET'
        })
    },

    getLinkedCaregivers: async (elderId) => {
        if (!elderId) {
            return { success: false, error: 'elderId is required' }
        }

        return fetchApi(`/link/my-caregivers/${elderId}`, {
            method: 'GET'
        })
    },

    // ====== MEDICATIONS ======
    getMedications: async (userId) => {
        if (useSupabase) {
            try {
                const meds = await db.medications.list(userId)
                return { success: true, medications: meds }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    addMedication: async (medication) => {
        if (useSupabase) {
            try {
                const med = await db.medications.create(medication)
                return { success: true, medication: med }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    updateMedication: async (id, updates) => {
        if (useSupabase) {
            try {
                const med = await db.medications.update(id, updates)
                return { success: true, medication: med }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    // ====== SCHEDULE / ADHERENCE ======
    getSchedule: async (userId, date = null) => {
        const params = new URLSearchParams()
        if (date) {
            const normalizedDate = date instanceof Date
                ? date.toISOString().split('T')[0]
                : date
            params.set('date', normalizedDate)
        }

        const query = params.toString()

        if (useSupabase) {
            try {
                const { start, end } = dayBounds(date)
                const medications = (await db.medications.list(userId))
                    .filter((med) => med.active !== false && med.is_active !== false)
                const logs = await db.adherenceLogs.list(userId, start.toISOString(), end.toISOString())

                const schedule = []
                for (const medication of medications) {
                    for (const time of medication.schedule_times || []) {
                        const scheduled = scheduledAt(date, time)
                        let log = logs.find((item) =>
                            item.medication_id === medication.id &&
                            sameScheduledMinute(item.scheduled_time, scheduled)
                        )

                        if (!log) {
                            try {
                                log = await db.adherenceLogs.create({
                                    medication_id: medication.id,
                                    scheduled_time: scheduled.toISOString(),
                                    status: 'pending',
                                })
                            } catch (error) {
                                console.warn('Could not create adherence log:', error)
                            }
                        }

                        schedule.push({
                            id: log?.id || `${medication.id}-${time}`,
                            medication,
                            scheduled_time: scheduled.toISOString(),
                            log: log || null,
                            status: log?.status || 'pending',
                        })
                    }
                }

                schedule.sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))

                return {
                    success: true,
                    date: dateKey(date),
                    count: schedule.length,
                    schedule,
                }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }

        return NO_SUPABASE
    },

    getTodaySchedule: async (userId) => {
        return api.getSchedule(userId)
    },

    markTaken: async (logId, status = 'taken') => {
        if (useSupabase) {
            try {
                const log = await db.adherenceLogs.updateStatus(logId, status)
                return { success: true, log }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    getAdherenceLogs: async (userId, days = 7) => {
        if (!userId) return { success: false, error: 'userId is required' }

        if (useSupabase) {
            try {
                const end = new Date()
                const start = new Date()
                start.setDate(start.getDate() - days)

                const logs = await db.adherenceLogs.list(userId, start.toISOString(), end.toISOString())
                return { success: true, logs }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }

        return fetchApi(`/medications/adherence/${userId}?days=${encodeURIComponent(days)}`, {
            method: 'GET'
        })
    },

    // ====== HEALTH READINGS ======
    getHealthStats: async (userId) => {
        if (useSupabase) {
            try {
                const history = await db.health.getHistory(userId, 7)
                return { success: true, stats: summarizeHealthStats(history) }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    recordHealth: async (reading) => {
        if (useSupabase) {
            try {
                const record = await db.health.record(reading)
                return { success: true, reading: record }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    // ====== DEVICES ======
    getDevices: async (userId) => {
        if (useSupabase) {
            try {
                const devices = await db.devices.list(userId)
                return { success: true, devices }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    registerDevice: async (userId, deviceId, name) => {
        if (useSupabase) {
            try {
                const device = await db.devices.register(userId, deviceId, name)
                return { success: true, device }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    getSlots: async (deviceId) => {
        if (useSupabase) {
            try {
                const slots = await db.slots.list(deviceId)
                return { success: true, slots }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    assignSlot: async (slotId, medicationId) => {
        if (useSupabase) {
            try {
                const slot = await db.slots.assignMedication(slotId, medicationId)
                return { success: true, slot }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    // ====== ALERTS ======
    getAlerts: async (userId) => {
        if (useSupabase) {
            try {
                const alerts = await db.alerts.list(userId)
                return { success: true, alerts }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return { success: true, alerts: [] }
    },

    createAlert: async (alert) => {
        if (useSupabase) {
            try {
                const created = await db.alerts.create(alert)
                return { success: true, alert: created }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return { success: true, alert }
    },

    acknowledgeAlert: async (alertId) => {
        if (useSupabase) {
            try {
                const alert = await db.alerts.markRead(alertId)
                return { success: true, alert }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    getNotifications: async (userId) => {
        if (!userId) return { success: false, error: 'userId is required' }

        if (useSupabase) {
            try {
                const notifications = await db.alerts.list(userId)
                const unreadCount = notifications.filter((item) => item.status === 'active' && !item.acknowledged).length
                return { success: true, notifications, unread_count: unreadCount }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }

        return fetchApi(`/notifications/${userId}`, { method: 'GET' })
    },

    acknowledgeNotification: async (alertId) => {
        if (useSupabase) {
            return api.acknowledgeAlert(alertId)
        }

        return fetchApi(`/notifications/${alertId}/acknowledge`, {
            method: 'POST'
        })
    },

    markAllNotificationsRead: async (userId) => {
        if (!userId) return { success: false, error: 'userId is required' }

        if (useSupabase) {
            try {
                await db.alerts.markAllRead(userId)
                return { success: true }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }

        return fetchApi(`/notifications/mark-all-read/${userId}`, {
            method: 'POST'
        })
    },

    // ====== VOICE MEMOS ======
    getVoiceMemos: async (userId) => {
        if (useSupabase) {
            try {
                const memos = await db.voiceMemos.list(userId)
                return { success: true, memos }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return { success: true, memos: [] }
    },

    createVoiceMemo: async (memo) => {
        if (useSupabase) {
            try {
                const created = await db.voiceMemos.create(memo)
                return { success: true, memo: created }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return { success: true, memo }
    },

    // ====== WELLNESS CHECK-INS ======
    submitCheckIn: async (userId, mood) => {
        if (useSupabase) {
            try {
                const checkin = await db.checkins.create(userId, mood)
                return { success: true, checkin }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return NO_SUPABASE
    },

    getTodayCheckins: async (userId) => {
        if (useSupabase) {
            try {
                const checkins = await db.checkins.today(userId)
                return { success: true, checkins }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return { success: true, checkins: [] }
    },

    // ====== OCR (uses local backend) ======
    uploadPrescription: async (imageData, userId) => {
        if (typeof FormData !== 'undefined' && (imageData instanceof File || imageData instanceof Blob)) {
            const formData = new FormData()
            formData.append('file', imageData)
            if (userId) {
                formData.append('user_id', userId)
            }

            return fetchApi('/prescriptions/upload', {
                method: 'POST',
                body: formData
            })
        }

        return fetchApi('/prescriptions/upload', {
            method: 'POST',
            body: JSON.stringify({ image: imageData, user_id: userId })
        })
    },

    processPrescription: async (imageUrl) => {
        return fetchApi('/prescriptions/process', {
            method: 'POST',
            body: JSON.stringify({ image_url: imageUrl })
        })
    },

    // ====== ASSISTIVE DIAGNOSIS (Flask backend) ======
    startDiagnosisSession: async (patientId, rawComplaint) => {
        return fetchApi('/diagnosis/start', {
            method: 'POST',
            body: JSON.stringify({
                patient_id: patientId,
                raw_complaint: rawComplaint
            })
        })
    },

    submitDiagnosisAnswer: async (sessionId, currentQuestion, answer) => {
        return fetchApi('/diagnosis/answer', {
            method: 'POST',
            body: JSON.stringify({
                session_id: sessionId,
                current_question: currentQuestion,
                answer
            })
        })
    },

    uploadDiagnosisImage: async (sessionId, imageFile) => {
        const formData = new FormData()
        formData.append('session_id', sessionId)
        formData.append('image', imageFile)

        return fetchApi('/diagnosis/upload-image', {
            method: 'POST',
            body: formData
        })
    },

    generateDiagnosisReport: async (sessionId, medications = [], patientName = 'Patient') => {
        return fetchApi('/diagnosis/generate-report', {
            method: 'POST',
            body: JSON.stringify({
                session_id: sessionId,
                medications,
                patient_name: patientName
            })
        })
    },

    getDiagnosisHistory: async (patientId) => {
        return fetchApi(`/diagnosis/history/${patientId}`, {
            method: 'GET'
        })
    },

    getDiagnosisAuditLog: async (sessionId) => {
        return fetchApi(`/diagnosis/audit/${sessionId}`, {
            method: 'GET'
        })
    },

    getDiagnosisPdfUrl: (sessionId, patientName = 'Patient') => {
        const params = new URLSearchParams({ patient_name: patientName })
        return `${API_URL}/diagnosis/export-pdf/${sessionId}?${params.toString()}`
    },

    shareDiagnosisReport: async (sessionId, patientName = 'Patient') => {
        return fetchApi('/diagnosis/share', {
            method: 'POST',
            body: JSON.stringify({
                session_id: sessionId,
                patient_name: patientName
            })
        })
    },

    getActivityTimeline: async (userId, date = null) => {
        if (!userId) return { success: false, error: 'userId is required' }

        if (useSupabase) {
            try {
                const { start, end } = dayBounds(date)
                const [logsResult, checkinsResult, alertsResult] = await Promise.all([
                    db.adherenceLogs.list(userId, start.toISOString(), end.toISOString()),
                    supabase
                        .from('wellness_checkins')
                        .select('*')
                        .eq('user_id', userId)
                        .gte('created_at', start.toISOString())
                        .lte('created_at', end.toISOString())
                        .order('created_at', { ascending: true }),
                    db.alerts.list(userId),
                ])

                const activities = []

                for (const log of logsResult || []) {
                    const medication = log.medication || {}
                    if (log.status === 'taken') {
                        activities.push({
                            id: log.id,
                            type: 'medication',
                            title: `${medication.name || 'Medication'} taken`,
                            detail: medication.dosage || 'Dose completed',
                            time: new Date(log.taken_time || log.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            timestamp: log.taken_time || log.scheduled_time,
                            status: 'success',
                            icon: 'med',
                        })
                    } else if (log.status === 'missed' || log.status === 'skipped') {
                        activities.push({
                            id: log.id,
                            type: 'medication',
                            title: `${medication.name || 'Medication'} ${log.status}`,
                            detail: `Scheduled at ${new Date(log.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                            time: new Date(log.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            timestamp: log.scheduled_time,
                            status: 'warning',
                            icon: 'alert',
                        })
                    }
                }

                if (checkinsResult.error) throw checkinsResult.error
                for (const checkin of checkinsResult.data || []) {
                    activities.push({
                        id: checkin.id,
                        type: 'check_in',
                        title: 'Wellness Check',
                        detail: `Mood: ${checkin.mood || 'checked in'}`,
                        time: new Date(checkin.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        timestamp: checkin.created_at,
                        status: 'success',
                        icon: 'check',
                    })
                }

                for (const alert of alertsResult || []) {
                    const createdAt = new Date(alert.created_at)
                    if (createdAt < start || createdAt > end) continue
                    activities.push({
                        id: alert.id,
                        type: 'alert',
                        title: alert.title,
                        detail: alert.message_caregiver || alert.message_elderly || alert.message || '',
                        time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        timestamp: alert.created_at,
                        status: ['high', 'critical'].includes(alert.severity) ? 'warning' : 'info',
                        icon: 'alert',
                    })
                }

                activities.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))

                return {
                    success: true,
                    date: dateKey(date),
                    activities,
                    grouped: groupActivities(activities),
                    total_count: activities.length,
                }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }

        const params = new URLSearchParams()
        if (date) params.set('date', dateKey(date))
        const query = params.toString()

        return fetchApi(`/activity/${userId}${query ? `?${query}` : ''}`, {
            method: 'GET'
        })
    },

    // ====== AUTOMATION / SIMULATION ======
    triggerAutomation: async (userId, eventType = null) => {
        if (eventType) {
            return fetchApi(`/automation/simulate/${userId}`, {
                method: 'POST',
                body: JSON.stringify({ event: eventType })
            })
        }
        return fetchApi(`/automation/evaluate/${userId}`, {
            method: 'POST'
        })
    }
}

export default api
