import api from './api';

export const getMyNotifications = () =>
  api.get('/api/notifications').then((res) => res.data);

export const getUnreadCount = () =>
  api.get('/api/notifications/unread-count').then((res) => res.data);

export const markNotificationRead = (notificationId) =>
  api.patch(`/api/notifications/${notificationId}/read`).then((res) => res.data);

export const markAllNotificationsRead = () =>
  api.post('/api/notifications/read-all');
