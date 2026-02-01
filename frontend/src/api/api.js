import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Health API
export const healthAPI = {
  addReading: (data) => api.post('/health/readings', data),
  getReadings: (userId, params) => api.get(`/health/readings/${userId}`, { params }),
  getStats: (userId, days = 7) => api.get(`/health/stats/${userId}`, { params: { days } })
}

// Medication API
export const medicationAPI = {
  getMedications: (userId) => api.get(`/medications/${userId}`),
  addMedication: (data) => api.post('/medications/', data),
  updateMedication: (id, data) => api.put(`/medications/${id}`, data),
  deleteMedication: (id) => api.delete(`/medications/${id}`),
  getSchedule: (userId, date) => api.get(`/medications/schedule/${userId}`, { params: { date } }),
  logAdherence: (data) => api.post('/medications/adherence', data),
  getAdherenceLogs: (userId, days = 7) => api.get(`/medications/adherence/${userId}`, { params: { days } }),
  recordDispensing: (logId) => api.post('/medications/dispense', { log_id: logId })
}

// User API
export const userAPI = {
  getUser: (userId) => api.get(`/users/${userId}`),
  createUser: (data) => api.post('/users/', data),
  updateUser: (userId, data) => api.put(`/users/${userId}`, data),
  checkIn: (userId, data) => api.post('/users/check-in', { user_id: userId, ...data }),
  getCheckIns: (userId, days = 30) => api.get(`/users/check-in/${userId}`, { params: { days } }),
  getCheckInStatus: (userId) => api.get(`/users/check-in/status/${userId}`),
  linkCaregiver: (elderlyId, caregiverId) => api.post('/users/link-caregiver', {
    elderly_user_id: elderlyId,
    caregiver_user_id: caregiverId
  })
}

// AI API
export const aiAPI = {
  analyze: (userId) => api.get(`/ai/analyze/${userId}`),
  healthAnalysis: (userId, hours = 24) => api.get(`/ai/health-analysis/${userId}`, { params: { hours } }),
  medicationAnalysis: (userId, days = 7) => api.get(`/ai/medication-analysis/${userId}`, { params: { days } }),
  getAlerts: (userId, status = 'active') => api.get(`/ai/alerts/${userId}`, { params: { status } }),
  acknowledgeAlert: (alertId) => api.post(`/ai/alerts/${alertId}/acknowledge`),
  resolveAlert: (alertId) => api.post(`/ai/alerts/${alertId}/resolve`),
  getRecommendations: (userId) => api.get(`/ai/recommendations/${userId}`)
}

// Prescription API
export const prescriptionAPI = {
  upload: (userId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)
    
    return api.post('/prescriptions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  getPrescriptions: (userId) => api.get(`/prescriptions/${userId}`),
  getPrescription: (prescriptionId) => api.get(`/prescriptions/detail/${prescriptionId}`),
  reprocess: (prescriptionId) => api.post(`/prescriptions/reprocess/${prescriptionId}`)
}

export default api
