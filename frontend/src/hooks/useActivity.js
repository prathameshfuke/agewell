import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

export function useActivity(userId, date = null) {
    const [activities, setActivities] = useState([]);
    const [grouped, setGrouped] = useState({ morning: [], afternoon: [], evening: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(date);
    const latest = useRef(0); // ignore a slow response for a date/user the screen has already left

    const fetchActivity = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const request = ++latest.current;
        try {
            setLoading(true);
            const result = await api.getActivityTimeline(userId, selectedDate);
            if (request !== latest.current) return;
            if (result.success) {
                setActivities(result.activities || []);
                setGrouped(result.grouped || { morning: [], afternoon: [], evening: [] });
                setError(null);
            } else {
                setError(result.error);
            }
        } catch (err) {
            if (request === latest.current) setError(err.message);
        } finally {
            if (request === latest.current) setLoading(false);
        }
    }, [userId, selectedDate]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    const changeDate = (newDate) => {
        setSelectedDate(newDate);
    };

    // Computed stats
    const stats = {
        totalActivities: activities.length,
        medicationsTaken: activities.filter(a => a.type === 'medication' && a.status === 'success').length,
        checkIns: activities.filter(a => a.type === 'check_in').length,
        alerts: activities.filter(a => a.type === 'alert').length,
    };

    // Get mood from latest check-in
    const latestMood = activities
        .filter(a => a.type === 'check_in')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.detail || null;

    return {
        activities,
        grouped,
        loading,
        error,
        stats,
        latestMood,
        selectedDate,
        changeDate,
        refresh: fetchActivity
    };
}
