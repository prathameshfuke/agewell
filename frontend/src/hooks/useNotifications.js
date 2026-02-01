import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const POLL_INTERVAL = 30000; // 30 seconds

export function useNotifications(userId) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotifications = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const result = await api.getNotifications(userId);
            if (result.success) {
                setNotifications(result.notifications || []);
                setUnreadCount(result.unread_count || 0);
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

    // Initial fetch and polling
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const acknowledgeNotification = async (alertId) => {
        const result = await api.acknowledgeNotification(alertId);
        if (result.success) {
            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === alertId ? { ...n, status: 'acknowledged' } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return result;
    };

    const markAllRead = async () => {
        const result = await api.markAllNotificationsRead(userId);
        if (result.success) {
            setNotifications(prev =>
                prev.map(n => ({ ...n, status: 'acknowledged' }))
            );
            setUnreadCount(0);
        }
        return result;
    };

    const refresh = () => {
        setLoading(true);
        fetchNotifications();
    };

    return {
        notifications,
        unreadCount,
        loading,
        error,
        acknowledgeNotification,
        markAllRead,
        refresh
    };
}
