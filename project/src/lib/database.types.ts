export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          role: 'elderly' | 'caregiver' | 'doctor'
          display_name: string
          date_of_birth: string | null
          emergency_contact: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'elderly' | 'caregiver' | 'doctor'
          display_name: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'elderly' | 'caregiver' | 'doctor'
          display_name?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      health_profiles: {
        Row: {
          id: string
          user_id: string
          conditions: string[]
          baseline_vitals: Json
          temperature_preference: number
          automation_rules: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conditions?: string[]
          baseline_vitals?: Json
          temperature_preference?: number
          automation_rules?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conditions?: string[]
          baseline_vitals?: Json
          temperature_preference?: number
          automation_rules?: Json
          created_at?: string
          updated_at?: string
        }
      }
      caregiver_relationships: {
        Row: {
          id: string
          caregiver_id: string
          elderly_id: string
          relationship_type: 'family' | 'professional' | 'doctor'
          permissions: Json
          created_at: string
        }
        Insert: {
          id?: string
          caregiver_id: string
          elderly_id: string
          relationship_type: 'family' | 'professional' | 'doctor'
          permissions?: Json
          created_at?: string
        }
        Update: {
          id?: string
          caregiver_id?: string
          elderly_id?: string
          relationship_type?: 'family' | 'professional' | 'doctor'
          permissions?: Json
          created_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string
          frequency: string
          schedule_times: string[]
          pill_color: string | null
          pill_shape: string | null
          slot_number: number | null
          start_date: string
          end_date: string | null
          instructions: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          dosage: string
          frequency: string
          schedule_times?: string[]
          pill_color?: string | null
          pill_shape?: string | null
          slot_number?: number | null
          start_date?: string
          end_date?: string | null
          instructions?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          dosage?: string
          frequency?: string
          schedule_times?: string[]
          pill_color?: string | null
          pill_shape?: string | null
          slot_number?: number | null
          start_date?: string
          end_date?: string | null
          instructions?: string | null
          active?: boolean
          created_at?: string
        }
      }
      medication_logs: {
        Row: {
          id: string
          medication_id: string
          user_id: string
          scheduled_time: string
          actual_time: string | null
          status: 'taken' | 'missed' | 'late' | 'skipped'
          dispensed_by_device: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          medication_id: string
          user_id: string
          scheduled_time: string
          actual_time?: string | null
          status: 'taken' | 'missed' | 'late' | 'skipped'
          dispensed_by_device?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          medication_id?: string
          user_id?: string
          scheduled_time?: string
          actual_time?: string | null
          status?: 'taken' | 'missed' | 'late' | 'skipped'
          dispensed_by_device?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      iot_devices: {
        Row: {
          id: string
          user_id: string
          device_type: string
          device_name: string
          mqtt_topic: string
          device_model: string | null
          location: string | null
          configuration: Json
          status: 'online' | 'offline' | 'error'
          last_seen: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_type: string
          device_name: string
          mqtt_topic: string
          device_model?: string | null
          location?: string | null
          configuration?: Json
          status?: 'online' | 'offline' | 'error'
          last_seen?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_type?: string
          device_name?: string
          mqtt_topic?: string
          device_model?: string | null
          location?: string | null
          configuration?: Json
          status?: 'online' | 'offline' | 'error'
          last_seen?: string | null
          created_at?: string
        }
      }
      sensor_readings: {
        Row: {
          id: string
          device_id: string
          user_id: string
          sensor_type: string
          value: number
          unit: string
          timestamp: string
          metadata: Json
        }
        Insert: {
          id?: string
          device_id: string
          user_id: string
          sensor_type: string
          value: number
          unit: string
          timestamp?: string
          metadata?: Json
        }
        Update: {
          id?: string
          device_id?: string
          user_id?: string
          sensor_type?: string
          value?: number
          unit?: string
          timestamp?: string
          metadata?: Json
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          alert_type: string
          severity: 'info' | 'warning' | 'critical' | 'emergency'
          title: string
          message: string
          data: Json
          status: 'pending' | 'sent' | 'acknowledged' | 'resolved'
          created_at: string
          acknowledged_at: string | null
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          alert_type: string
          severity: 'info' | 'warning' | 'critical' | 'emergency'
          title: string
          message: string
          data?: Json
          status?: 'pending' | 'sent' | 'acknowledged' | 'resolved'
          created_at?: string
          acknowledged_at?: string | null
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          alert_type?: string
          severity?: 'info' | 'warning' | 'critical' | 'emergency'
          title?: string
          message?: string
          data?: Json
          status?: 'pending' | 'sent' | 'acknowledged' | 'resolved'
          created_at?: string
          acknowledged_at?: string | null
          resolved_at?: string | null
        }
      }
      automation_logs: {
        Row: {
          id: string
          user_id: string
          device_id: string | null
          action: string
          reason: string
          success: boolean
          details: Json
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id?: string | null
          action: string
          reason: string
          success?: boolean
          details?: Json
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string | null
          action?: string
          reason?: string
          success?: boolean
          details?: Json
          timestamp?: string
        }
      }
      user_feedback: {
        Row: {
          id: string
          user_id: string
          feedback_type: string
          sentiment: 'positive' | 'negative' | 'neutral' | null
          feedback_text: string
          context: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feedback_type: string
          sentiment?: 'positive' | 'negative' | 'neutral' | null
          feedback_text: string
          context?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feedback_type?: string
          sentiment?: 'positive' | 'negative' | 'neutral' | null
          feedback_text?: string
          context?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
