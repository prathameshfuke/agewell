import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useMedications(userId) {
    const [schedule, setSchedule] = useState([]);
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSchedule = useCallback(async (date = null) => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const result = await api.getSchedule(userId, date);
            if (result.success) {
                setSchedule(result.schedule || []);
                setError(null);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchMedications = useCallback(async () => {
        if (!userId) return;

        try {
            const result = await api.getMedications(userId);
            if (result.success) {
                setMedications(result.medications || []);
            }
        } catch (err) {
            console.error('Failed to fetch medications:', err);
        }
    }, [userId]);

    useEffect(() => {
        fetchSchedule();
        fetchMedications();
    }, [fetchSchedule, fetchMedications]);

    const markAsTaken = async (logId) => {
        // Optimistic update
        setSchedule(prev =>
            prev.map(item => {
                if (item.log?.id === logId || item.id === logId) {
                    return {
                        ...item,
                        status: 'taken',
                        log: { ...item.log, status: 'taken', taken_time: new Date().toISOString() }
                    };
                }
                return item;
            })
        );

        const result = await api.markTaken(logId, 'taken');

        if (!result.success) {
            // Revert on failure
            fetchSchedule();
        }

        return result;
    };

    const markAsMissed = async (logId) => {
        const result = await api.markTaken(logId, 'missed');
        if (result.success) {
            fetchSchedule();
        }
        return result;
    };

    const addMedication = async (data) => {
        const result = await api.addMedication({ ...data, user_id: userId });
        if (result.success) {
            fetchMedications();
            fetchSchedule();
        }
        return result;
    };

    const updateMedication = async (medicationId, data) => {
        const result = await api.updateMedication(medicationId, data);
        if (result.success) {
            fetchMedications();
            fetchSchedule();
        }
        return result;
    };

    // Computed values
    const pendingMeds = schedule.filter(s => s.status === 'pending');
    const completedMeds = schedule.filter(s => s.status === 'taken');
    const missedMeds = schedule.filter(s => s.status === 'missed');

    const adherenceRate = schedule.length > 0
        ? Math.round((completedMeds.length / schedule.length) * 100)
        : 100;

    const nextMedication = pendingMeds.length > 0 ? pendingMeds[0] : null;

    // Group by time of day
    const groupedSchedule = {
        morning: schedule.filter(s => {
            const hour = new Date(s.scheduled_time).getHours();
            return hour < 12;
        }),
        afternoon: schedule.filter(s => {
            const hour = new Date(s.scheduled_time).getHours();
            return hour >= 12 && hour < 17;
        }),
        evening: schedule.filter(s => {
            const hour = new Date(s.scheduled_time).getHours();
            return hour >= 17;
        })
    };

    return {
        schedule,
        medications,
        loading,
        error,
        pendingMeds,
        completedMeds,
        missedMeds,
        adherenceRate,
        nextMedication,
        groupedSchedule,
        markAsTaken,
        markAsMissed,
        addMedication,
        updateMedication,
        refresh: fetchSchedule
    };
}
