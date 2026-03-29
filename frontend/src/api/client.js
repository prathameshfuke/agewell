// AgeWell+ API Client
// Uses Supabase when configured, falls back to mock data for development

import { supabase, db, isSupabaseConfigured } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
const USER_GROQ_KEY_STORAGE = 'agewell_user_groq_api_key'
const USER_GEMINI_KEY_STORAGE = 'agewell_user_gemini_api_key'

// Check if we should use Supabase or mock/local API
const useSupabase = isSupabaseConfigured()

const getStoredUserApiKeys = () => {
    if (typeof window === 'undefined') {
        return { groqApiKey: '', geminiApiKey: '' }
    }

    return {
        groqApiKey: (localStorage.getItem(USER_GROQ_KEY_STORAGE) || '').trim(),
        geminiApiKey: (localStorage.getItem(USER_GEMINI_KEY_STORAGE) || '').trim(),
    }
}

// Helper for fetch requests to local backend
const fetchApi = async (endpoint, options = {}) => {
    try {
        const providedHeaders = options.headers || {}
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
        const { groqApiKey, geminiApiKey } = getStoredUserApiKeys()

        const headers = {
            ...providedHeaders
        }

        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json'
        }

        if (groqApiKey) {
            headers['X-User-Groq-Key'] = groqApiKey
        }

        if (geminiApiKey) {
            headers['X-User-Gemini-Key'] = geminiApiKey
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            headers,
            ...options
        })

        const contentType = response.headers.get('content-type') || ''
        const data = contentType.includes('application/json')
            ? await response.json()
            : await response.text()

        if (!response.ok) {
            if (typeof data === 'object' && data !== null) {
                return { success: false, ...data }
            }
            return { success: false, error: data || `Request failed with status ${response.status}` }
        }

        return data
    } catch (error) {
        console.error('API Error:', error)
        return { success: false, error: error.message }
    }
}

// Mock data for development
// Mock data removed - we only use real data or empty states
const mockData = {
    medications: [],
    healthStats: { latest: {}, history: [] },
    device: { slots: [] }
}

// Unified API interface
export const api = {
    // ====== USER AI KEYS (LOCAL) ======
    getUserApiKeys: () => getStoredUserApiKeys(),

    saveUserApiKeys: ({ groqApiKey = '', geminiApiKey = '' } = {}) => {
        try {
            if (typeof window === 'undefined') {
                return { success: false, error: 'Not available outside browser context.' }
            }

            const normalizedGroq = (groqApiKey || '').trim()
            const normalizedGemini = (geminiApiKey || '').trim()

            if (normalizedGroq) {
                localStorage.setItem(USER_GROQ_KEY_STORAGE, normalizedGroq)
            } else {
                localStorage.removeItem(USER_GROQ_KEY_STORAGE)
            }

            if (normalizedGemini) {
                localStorage.setItem(USER_GEMINI_KEY_STORAGE, normalizedGemini)
            } else {
                localStorage.removeItem(USER_GEMINI_KEY_STORAGE)
            }

            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    },

    clearUserApiKeys: () => {
        try {
            if (typeof window === 'undefined') {
                return { success: false, error: 'Not available outside browser context.' }
            }

            localStorage.removeItem(USER_GROQ_KEY_STORAGE)
            localStorage.removeItem(USER_GEMINI_KEY_STORAGE)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
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
        return { success: true, medications: mockData.medications }
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
        const newMed = { ...medication, id: Date.now().toString() }
        mockData.medications.push(newMed)
        return { success: true, medication: newMed }
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
        const idx = mockData.medications.findIndex(m => m.id === id)
        if (idx >= 0) {
            mockData.medications[idx] = { ...mockData.medications[idx], ...updates }
            return { success: true, medication: mockData.medications[idx] }
        }
        return { success: false, error: 'Not found' }
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
        const endpoint = `/medications/schedule/${userId}${query ? `?${query}` : ''}`

        if (useSupabase) {
            // Schedule generation and adherence-log linkage is handled by Flask.
            return fetchApi(endpoint, { method: 'GET' })
        }

        // Prefer real backend in local mode as well.
        const backendResult = await fetchApi(endpoint, { method: 'GET' })
        if (backendResult?.success) {
            return backendResult
        }

        // Mock schedule based on current time
        const now = new Date()
        const schedule = mockData.medications.flatMap(med =>
            (med.schedule_times || []).map(time => ({
                id: `${med.id}-${time}`,
                medication: med,
                scheduled_time: `${now.toISOString().split('T')[0]}T${time}:00`,
                status: 'pending'
            }))
        )
        return { success: true, schedule }
    },

    getTodaySchedule: async (userId) => {
        return api.getSchedule(userId)
    },

    markTaken: async (logId, status = 'taken') => {
        if (useSupabase) {
            try {
                const log = await db.adherence.updateStatus(logId, status)
                return { success: true, log }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return { success: true }
    },

    // ====== HEALTH READINGS ======
    getHealthStats: async (userId) => {
        if (useSupabase) {
            try {
                const latest = await db.health.getLatest(userId)
                const history = await db.health.getHistory(userId, 7)
                return { success: true, stats: { latest, history } }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return { success: true, stats: mockData.healthStats }
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
        return { success: true, reading }
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
        return { success: true, devices: [mockData.device] }
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
        return { success: true, device: { ...mockData.device, device_id: deviceId, name } }
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
        return { success: true, slots: mockData.device.slots }
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
        return { success: true }
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
                await db.alerts.acknowledge(alertId)
                return { success: true }
            } catch (error) {
                return { success: false, error: error.message }
            }
        }
        return { success: true }
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
        return { success: true }
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
