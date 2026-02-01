import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Medication = Database['public']['Tables']['medications']['Row'];
type MedicationLog = Database['public']['Tables']['medication_logs']['Row'];

export function useMedications(userId: string | undefined) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchMedications();

    const subscription = supabase
      .channel('medications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchMedications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const fetchMedications = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async (medication: Omit<Medication, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('medications')
      // @ts-expect-error Supabase type inference issue
      .insert(medication)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateMedication = async (id: string, updates: Partial<Medication>) => {
    const { data, error } = await supabase
      .from('medications')
      // @ts-expect-error Supabase type inference issue
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteMedication = async (id: string) => {
    const { error } = await supabase
      .from('medications')
      // @ts-expect-error Supabase type inference issue
      .update({ active: false })
      .eq('id', id);

    if (error) throw error;
  };

  const logMedication = async (
    medicationId: string,
    scheduledTime: string,
    status: 'taken' | 'missed' | 'late' | 'skipped',
    notes?: string
  ) => {
    if (!userId) throw new Error('User ID is required');

    const log: Database['public']['Tables']['medication_logs']['Insert'] = {
      medication_id: medicationId,
      user_id: userId,
      scheduled_time: scheduledTime,
      actual_time: status === 'taken' || status === 'late' ? new Date().toISOString() : null,
      status,
      notes,
    };

    const { data, error} = await supabase
      .from('medication_logs')
      // @ts-expect-error Supabase type inference issue
      .insert(log)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return {
    medications,
    loading,
    error,
    addMedication,
    updateMedication,
    deleteMedication,
    logMedication,
    refresh: fetchMedications,
  };
}

export function useMedicationLogs(userId: string | undefined, medicationId?: string) {
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchLogs();
  }, [userId, medicationId]);

  const fetchLogs = async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: false })
        .limit(100);

      if (medicationId) {
        query = query.eq('medication_id', medicationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const getAdherenceRate = (days: number = 7): number => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentLogs = logs.filter(
      (log) => new Date(log.scheduled_time) >= cutoffDate
    );

    if (recentLogs.length === 0) return 100;

    const takenCount = recentLogs.filter(
      (log) => log.status === 'taken' || log.status === 'late'
    ).length;

    return Math.round((takenCount / recentLogs.length) * 100);
  };

  return {
    logs,
    loading,
    error,
    getAdherenceRate,
    refresh: fetchLogs,
  };
}

export function useTodaysMedications(userId: string | undefined) {
  const { medications } = useMedications(userId);
  const [todaysSchedule, setTodaysSchedule] = useState<Array<{
    medication: Medication;
    time: string;
    taken: boolean;
    logId?: string;
  }>>([]);

  useEffect(() => {
    if (!userId || medications.length === 0) return;

    const loadTodaysSchedule = async () => {
      const today = new Date().toISOString().split('T')[0];
      const schedule: Array<{
        medication: Medication;
        time: string;
        taken: boolean;
        logId?: string;
      }> = [];

      for (const med of medications) {
        for (const time of med.schedule_times) {
          const scheduledDateTime = `${today}T${time}:00`;

          const { data: log } = await supabase
            .from('medication_logs')
            .select('*')
            .eq('medication_id', med.id)
            .eq('scheduled_time', scheduledDateTime)
            .maybeSingle();

          schedule.push({
            medication: med,
            time,
            taken: log?.status === 'taken' || log?.status === 'late',
            logId: log?.id,
          });
        }
      }

      schedule.sort((a, b) => a.time.localeCompare(b.time));
      setTodaysSchedule(schedule);
    };

    loadTodaysSchedule();

    const interval = setInterval(loadTodaysSchedule, 60000);

    return () => clearInterval(interval);
  }, [userId, medications]);

  return todaysSchedule;
}
