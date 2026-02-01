// AgeWell+ API Client
// Uses Supabase when configured, falls back to mock data for development

import { supabase, db, isSupabaseConfigured } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Check if we should use Supabase or mock/local API
const useSupabase = isSupabaseConfigured()

// Helper for fetch requests to local backend
const fetchApi = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        })
        const data = await response.json()
        return data
    } catch (error) {
        console.error('API Error:', error)
        return { success: false, error: error.message }
    }
}

// Mock data for development
const mockData = {
    medications: [
        { id: '1', name: 'Metformin', dosage: '500mg', form: 'tablet', schedule_times: ['08:00', '20:00'], frequency: 'twice daily' },
        { id: '2', name: 'Lisinopril', dosage: '10mg', form: 'pill', schedule_times: ['09:00'], frequency: 'once daily' },
        { id: '3', name: 'Vitamin D', dosage: '1000 IU', form: 'capsule', schedule_times: ['08:00'], frequency: 'once daily' }
    ],
    healthStats: {
        latest: { spo2: 98, heart_rate: 72, body_temperature: 36.5 },
        history: []
    },
    device: {
        id: 'demo-device',
        device_id: 'ESP32-DEMO',
        name: 'Living Room Dispenser',
        wifi_status: 'online',
        slots: [
            { slot_number: 1, medication_id: '1', current_quantity: 28, led_color: '#4CAF50' },
            { slot_number: 2, medication_id: '2', current_quantity: 15, led_color: '#2196F3' },
            { slot_number: 3, medication_id: null, current_quantity: 0, led_color: '#FF9800' }
        ]
    }
}

// Unified API interface
export const api = {
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
    getTodaySchedule: async (userId) => {
        if (useSupabase) {
            try {
                const logs = await db.adherence.getToday(userId)
                return { success: true, schedule: logs }
            } catch (error) {
                return { success: false, error: error.message }
            }
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
    uploadPrescription: async (imageData) => {
        return fetchApi('/prescriptions/upload', {
            method: 'POST',
            body: JSON.stringify({ image: imageData })
        })
    },

    processPrescription: async (imageUrl) => {
        return fetchApi('/prescriptions/process', {
            method: 'POST',
            body: JSON.stringify({ image_url: imageUrl })
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
