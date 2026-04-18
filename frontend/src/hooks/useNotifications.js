import { useCallback, useEffect, useState } from 'react';
import {
  getMyNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';

/**
 * Loads notifications for the authenticated customer and exposes helpers to
 * mark individual or all notifications as read.
 */
export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, count] = await Promise.all([getMyNotifications(), getUnreadCount()]);
      setNotifications(Array.isArray(items) ? items : []);
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      setError(err?.response?.status === 403 ? 'forbidden' : 'failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = useCallback(async (notificationId) => {
    try {
      const updated = await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently ignore — badge will re-sync on next full refresh
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently ignore
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: loadNotifications,
    markRead,
    markAllRead,
  };
}
