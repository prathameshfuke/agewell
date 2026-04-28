import { createClient } from '@supabase/supabase-js'

// Check if environment variables are properly set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

// Validate configuration
export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseAnonKey &&
        supabaseUrl !== '' &&
        supabaseAnonKey !== '' &&
        supabaseUrl.includes('supabase.co')
}

// Create Supabase client only if configured
export const supabase = isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true, // Let Supabase automatically parse OAuth tokens from URL
            flowType: 'implicit'
        }
    })
    : null

if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY). Running in demo mode.')
}

const normalizeMedication = (medication = {}) => ({
    ...medication,
    active: medication.active ?? medication.is_active ?? true,
    type: medication.type || medication.form || 'pill',
    schedule_times: Array.isArray(medication.schedule_times) ? medication.schedule_times : ['08:00'],
})

const stripUndefined = (payload) => Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
)

const nullable = (value) => (value === undefined ? undefined : value || null)

const toMedicationPayload = (medication = {}) => {
    const payload = {
        user_id: medication.user_id,
        name: medication.name,
        dosage: nullable(medication.dosage),
        dosage_unit: medication.dosage_unit,
        frequency: nullable(medication.frequency),
        special_instructions: nullable(medication.special_instructions),
    }

    if (medication.form !== undefined || medication.type !== undefined || medication.user_id) {
        payload.form = medication.form || medication.type || 'pill'
    }

    if (medication.schedule_times !== undefined || medication.user_id) {
        payload.schedule_times = Array.isArray(medication.schedule_times) && medication.schedule_times.length > 0
            ? medication.schedule_times
            : ['08:00']
    }

    if (medication.is_active !== undefined || medication.active !== undefined || medication.user_id) {
        payload.is_active = medication.is_active ?? medication.active ?? true
    }

    return stripUndefined(payload)
}

const normalizeAdherenceLog = (log = {}) => ({
    ...log,
    medication: log.medication || log.medications || null,
    medication_id: log.medication_id || log.medication?.id || log.medications?.id,
    taken_time: log.taken_time || log.actual_time || null,
    taken_at: log.taken_at || log.actual_time || null,
})

const normalizeAlert = (alert = {}) => {
    const acknowledged = Boolean(alert.acknowledged || alert.status === 'acknowledged' || alert.read)
    const message = alert.message_elderly || alert.message_caregiver || alert.message || ''

    return {
        ...alert,
        acknowledged,
        status: acknowledged ? 'acknowledged' : (alert.status || 'active'),
        message,
        message_elderly: alert.message_elderly || message,
        message_caregiver: alert.message_caregiver || message,
    }
}

const toAlertPayload = (alert = {}) => ({
    user_id: alert.user_id,
    alert_type: alert.alert_type || 'health',
    severity: alert.severity || 'medium',
    title: alert.title || 'Alert',
    message: alert.message || alert.message_elderly || alert.message_caregiver || '',
    acknowledged: Boolean(alert.acknowledged),
})

// Auth helpers
export const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase not configured')

    // IMPORTANT: When using HashRouter, OAuth tokens come back in the URL hash.
    // We redirect to origin, and the Home page will detect and handle the tokens.
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            skipBrowserRedirect: false
        }
    })

    if (error) throw error
    return data
}

export const signOut = async () => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

export const getSession = async () => {
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session
}

export const getUser = async () => {
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

// Database helpers
export const db = {
    profiles: {
        get: async (userId) => {
            if (!supabase) return null
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            if (error) throw error
            return data
        },
        update: async (userId, updates) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single()
            if (error) throw error
            return data
        },
        upsert: async (profile) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('profiles')
                .upsert(profile)
                .select()
                .single()
            if (error) throw error
            return data
        }
    },
    medications: {
        list: async (userId) => {
            if (!supabase) return []
            const { data, error } = await supabase
                .from('medications')
                .select('*')
                .eq('user_id', userId)
                .order('name')
            if (error) throw error
            return (data || []).map(normalizeMedication)
        },
        create: async (medication) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('medications')
                .insert(toMedicationPayload(medication))
                .select()
                .single()
            if (error) throw error
            return normalizeMedication(data)
        },
        update: async (id, updates) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('medications')
                .update(toMedicationPayload(updates))
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return normalizeMedication(data)
        },
        delete: async (id) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { error } = await supabase
                .from('medications')
                .delete()
                .eq('id', id)
            if (error) throw error
        }
    },
    schedules: {
        list: async (medicationId) => {
            if (!supabase) return []
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('medication_id', medicationId)
                .order('time')
            if (error) throw error
            return data || []
        },
        create: async (schedule) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('schedules')
                .insert(schedule)
                .select()
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('schedules')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        }
    },
    adherenceLogs: {
        list: async (userId, startDate, endDate) => {
            if (!supabase) return []
            let query = supabase
                .from('adherence_logs')
                .select('*, medications!inner(id, user_id, name, dosage, schedule_times)')
                .eq('medications.user_id', userId)

            if (startDate) query = query.gte('scheduled_time', startDate)
            if (endDate) query = query.lte('scheduled_time', endDate)

            const { data, error } = await query.order('scheduled_time', { ascending: false })
            if (error) throw error
            return (data || []).map(normalizeAdherenceLog)
        },
        create: async (log) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('adherence_logs')
                .insert(log)
                .select()
                .single()
            if (error) throw error
            return normalizeAdherenceLog(data)
        },
        updateStatus: async (id, status) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('adherence_logs')
                .update({
                    status,
                    actual_time: status === 'taken' ? new Date().toISOString() : null,
                })
                .eq('id', id)
                .select('*, medications(id, user_id, name, dosage, schedule_times)')
                .single()
            if (error) throw error
            return normalizeAdherenceLog(data)
        }
    },
    healthReadings: {
        list: async (userId, limit = 50) => {
            if (!supabase) return []
            const { data, error } = await supabase
                .from('health_readings')
                .select('*')
                .eq('user_id', userId)
                .order('recorded_at', { ascending: false })
                .limit(limit)
            if (error) throw error
            return data || []
        },
        create: async (reading) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('health_readings')
                .insert(stripUndefined({
                    user_id: reading.user_id,
                    device_id: reading.device_id,
                    spo2: reading.spo2,
                    heart_rate: reading.heart_rate,
                    body_temperature: reading.body_temperature ?? reading.temperature,
                }))
                .select()
                .single()
            if (error) throw error
            return data
        }
    },
    health: {
        getLatest: async (userId) => {
            if (!supabase) return null
            const { data, error } = await supabase
                .from('health_readings')
                .select('*')
                .eq('user_id', userId)
                .order('recorded_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            if (error) throw error
            return data || null
        },
        getHistory: async (userId, days = 7) => {
            if (!supabase) return []
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - days)

            const { data, error } = await supabase
                .from('health_readings')
                .select('*')
                .eq('user_id', userId)
                .gte('recorded_at', cutoff.toISOString())
                .order('recorded_at', { ascending: false })
            if (error) throw error
            return data || []
        },
        record: async (reading) => {
            if (!supabase) throw new Error('Supabase not configured')
            return db.healthReadings.create(reading)
        }
    },
    alerts: {
        list: async (userId, unreadOnly = false) => {
            if (!supabase) return []
            let query = supabase
                .from('alerts')
                .select('*')
                .eq('user_id', userId)

            if (unreadOnly) query = query.eq('acknowledged', false)

            const { data, error } = await query.order('created_at', { ascending: false })
            if (error) throw error
            return (data || []).map(normalizeAlert)
        },
        create: async (alert) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('alerts')
                .insert(toAlertPayload(alert))
                .select()
                .single()
            if (error) throw error
            return normalizeAlert(data)
        },
        markRead: async (id) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('alerts')
                .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return normalizeAlert(data)
        },
        markAllRead: async (userId) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('alerts')
                .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
                .eq('user_id', userId)
                .eq('acknowledged', false)
                .select()
            if (error) throw error
            return (data || []).map(normalizeAlert)
        },
        acknowledge: async (id) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('alerts')
                .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return normalizeAlert(data)
        }
    },
    voiceMemos: {
        list: async (userId) => {
            if (!supabase) return []
            const { data, error } = await supabase
                .from('voice_memos')
                .select('*')
                .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
                .order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        },
        create: async (memo) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('voice_memos')
                .insert(memo)
                .select()
                .single()
            if (error) throw error
            return data
        }
    },
    checkins: {
        create: async (userId, mood) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('wellness_checkins')
                .insert({ user_id: userId, mood, source: 'app' })
                .select()
                .single()
            if (error) throw error
            return data
        },
        today: async (userId) => {
            if (!supabase) return []
            const start = new Date()
            start.setHours(0, 0, 0, 0)

            const { data, error } = await supabase
                .from('wellness_checkins')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', start.toISOString())
                .order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        }
    },
    devices: {
        list: async (userId) => {
            if (!supabase) return []
            const { data, error } = await supabase
                .from('dispenser_devices')
                .select('*, dispenser_slots(*)')
                .eq('user_id', userId)
            if (error) throw error
            return data || []
        },
        register: async (userId, deviceId, name) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('dispenser_devices')
                .insert({ user_id: userId, device_id: deviceId, name })
                .select()
                .single()
            if (error) throw error
            return data
        }
    },
    slots: {
        list: async (deviceId) => {
            if (!supabase) return []
            const { data, error } = await supabase
                .from('dispenser_slots')
                .select('*')
                .eq('device_id', deviceId)
                .order('slot_number')
            if (error) throw error
            return data || []
        },
        assignMedication: async (slotId, medicationId) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('dispenser_slots')
                .update({ medication_id: medicationId })
                .eq('id', slotId)
                .select()
                .single()
            if (error) throw error
            return data
        }
    },
    dispenserDevices: {
        list: async (userId) => {
            if (!supabase) return []
            const { data, error } = await supabase
                .from('dispenser_devices')
                .select('*, dispenser_slots(*)')
                .eq('user_id', userId)
            if (error) throw error
            return data || []
        },
        register: async (device) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('dispenser_devices')
                .insert(device)
                .select()
                .single()
            if (error) throw error
            return data
        }
    },
    dispenserSlots: {
        update: async (slotId, updates) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('dispenser_slots')
                .update(updates)
                .eq('id', slotId)
                .select()
                .single()
            if (error) throw error
            return data
        }
    }
}

// Real-time subscriptions helper
export const subscriptions = {
    subscribe: (table, callback, filter = null) => {
        if (!supabase) return { unsubscribe: () => { } }

        let channel = supabase.channel(`public:${table}`)

        const eventConfig = {
            event: '*',
            schema: 'public',
            table: table
        }

        if (filter) {
            eventConfig.filter = filter
        }

        channel = channel.on('postgres_changes', eventConfig, (payload) => {
            callback(payload)
        }).subscribe()

        return {
            unsubscribe: () => {
                supabase.removeChannel(channel)
            }
        }
    },
    onHealthReading: (userId, callback) => {
        if (!userId) return () => { }

        const subscription = subscriptions.subscribe(
            'health_readings',
            (payload) => callback(payload.new),
            `user_id=eq.${userId}`
        )

        return () => subscription.unsubscribe()
    }
}

export default supabase
