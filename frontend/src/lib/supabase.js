import { createClient } from '@supabase/supabase-js'

// Check if environment variables are properly set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

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
    console.warn('Supabase not configured. Running in demo mode.')
}

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
                .select('*, schedules(*)')
                .eq('user_id', userId)
                .order('name')
            if (error) throw error
            return data || []
        },
        create: async (medication) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('medications')
                .insert(medication)
                .select()
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('medications')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
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
                .select('*, medications(name)')
                .eq('user_id', userId)

            if (startDate) query = query.gte('taken_at', startDate)
            if (endDate) query = query.lte('taken_at', endDate)

            const { data, error } = await query.order('taken_at', { ascending: false })
            if (error) throw error
            return data || []
        },
        create: async (log) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('adherence_logs')
                .insert(log)
                .select()
                .single()
            if (error) throw error
            return data
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
                .insert(reading)
                .select()
                .single()
            if (error) throw error
            return data
        }
    },
    alerts: {
        list: async (userId, unreadOnly = false) => {
            if (!supabase) return []
            let query = supabase
                .from('alerts')
                .select('*')
                .eq('user_id', userId)

            if (unreadOnly) query = query.eq('read', false)

            const { data, error } = await query.order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        },
        create: async (alert) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { data, error } = await supabase
                .from('alerts')
                .insert(alert)
                .select()
                .single()
            if (error) throw error
            return data
        },
        markRead: async (id) => {
            if (!supabase) throw new Error('Supabase not configured')
            const { error } = await supabase
                .from('alerts')
                .update({ read: true })
                .eq('id', id)
            if (error) throw error
        }
    },
    voiceMemos: {
        list: async (userId) => {
            if (!supabase) return []
            const { data, error } = await supabase
                .from('voice_memos')
                .select('*')
                .eq('user_id', userId)
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
    }
}

export default supabase
